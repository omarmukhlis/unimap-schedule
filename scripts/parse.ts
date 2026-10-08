import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import type {
  Faculty,
  Group,
  ParseResult,
  Program,
  Session,
  SessionType,
  Timetable,
  UnparsedCell,
} from "../lib/types";

export const SOURCE_URL =
  "https://timetables2.unimap.edu.my/IjazahSarjanaMuda/SarjanaMudaSem120262027/Official/MASTERFILES_SARJANA%20MUDA%20SEM1_2026_2027_OFFICIAL_groups_days_horizontal.html";

/* ------------------------------------------------------------------ *
 * Time helpers
 * ------------------------------------------------------------------ */

/** FET writes "08:00-08:50" but sometimes "11.00-11:50" (dot separator). */
export function normalizeSlot(label: string): { start: string; end: string } {
  const [rawStart = "", rawEnd = ""] = label.split("-");
  return { start: normalizeClock(rawStart), end: normalizeClock(rawEnd) };
}

/** "08:00" | "11.00" | "8:00" -> "08:00" | "11:00" | "08:00" */
export function normalizeClock(value: string): string {
  const digits = value.trim().replace(/[.:]/g, "");
  if (!/^\d{3,4}$/.test(digits)) return value.trim();
  const hours = Number(digits.slice(0, digits.length - 2));
  const minutes = digits.slice(-2);
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

/* ------------------------------------------------------------------ *
 * Subject / tag / teacher parsing
 * ------------------------------------------------------------------ */

/**
 * Course code, allowing "MMT 21704" (space), "MMT21704" and combined codes
 * like "IMJ41002/IMJ42004" or "SMP20603 / SMP31403".
 */
const CODE = String.raw`[A-Z]{2,6}\s*\d{3,6}(?:\s*\/\s*[A-Z]{2,6}\s*\d{3,6})*`;
/** "LECTURE ", "LAB - ", and typos such as "TOTORIAL - " all end in a bare word + dash. */
const LEADING_TYPE =
  /^\s*(?:[A-Z]{4,15})\s*(?=[-–|])[\s\-–|]*/;
const CODE_ONLY = new RegExp(`^(${CODE})$`);
const DASH_FORM = new RegExp(`^(${CODE})\\s*[-\u2013]\\s*(\\S.*)$`);
const NO_DASH_FORM = new RegExp(`^(${CODE})\\s+(\\S.*)$`);

function squash(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function parseSubject(raw: string): { code: string | null; name: string } {
  const text = raw.replace(/\s+/g, " ").trim();
  // "TUTORIAL - EMJ26103 / EMJ26403 / EMJ26503": the leading word is not a code.
  // Course codes always contain digits, so a digitless leading token is safe to drop.
  const stripped = text.replace(LEADING_TYPE, "");
  for (const candidate of [stripped, text]) {
    const only = CODE_ONLY.exec(candidate);
    if (only) return { code: squash(only[1]), name: "" };
    const dash = DASH_FORM.exec(candidate);
    if (dash) return { code: squash(dash[1]), name: dash[2].trim() };
    const nodash = NO_DASH_FORM.exec(candidate);
    if (nodash) return { code: squash(nodash[1]), name: nodash[2].trim() };
  }
  return { code: null, name: text };
}

/** Word-boundary search so "MAKMAL" never reads as LAB and "LABS" never reads as LAB. */
export function parseType(tag: string): SessionType {
  const upper = tag.toUpperCase();
  if (/\bLECTURES?\b/.test(upper)) return "LECTURE";
  if (/\bLAB\b/.test(upper)) return "LAB";
  if (/\bTUTORIALS?\b/.test(upper)) return "LECTURE";
  return "OTHER";
}

/**
 * Cells without a `div.room` keep the venue in the activity tag, e.g.
 * "PAUH PUTRA  - DK 10 (200)" or "LECTURE FKC - ONLINE". Strip a leading type
 * word, then a leading faculty code / campus label.
 */
const LEADING_TAG_TYPE = /^\s*(?:LECTURES?|LABS?|TUTORIALS?|SEMINARS?|WORKSHOPS?)\b[\s\-–|]*/i;
const VENUE_PREFIX =
  /^(?:([A-Z]{2,6}(?:\s+\d)?)|(?:PAUH\s+PUTRA|CYBERJAYA))\s*[-\u2013]\s*(\S.*)$/;

/**
 * When a cell has no `div.room`, the activity tag is the only venue source, so
 * "FKC - ONLINE" -> "ONLINE" and "PAUH PUTRA  - DK 10 (200)" -> "DK 10 (200)".
 */
export function parseVenueFromTag(tag: string, facultyCodes: Set<string>): string | null {
  const rest = tag.trim().replace(LEADING_TAG_TYPE, "").trim();
  const match = VENUE_PREFIX.exec(rest);
  if (match && (!match[1] || facultyCodes.has(match[1].trim().split(/\s+/)[0]))) {
    return match[2].trim();
  }
  return rest || null;
}

export function parseLecturers(raw: string): string[] {
  return raw
    .split(",")
    .map((part) =>
      part
        .trim()
        .replace(/^[A-Z]{2,6}(?:\s+\d)?\s*[-–]\s*/, "")
        .trim(),
    )
    .filter(Boolean);
}

/** "FET 7.10.5 on 10/8/26 7:47 PM" -> "2026-08-10T19:47:00+08:00" (Malaysia time). */
export function parseGeneratedAt(footer: string | null | undefined): string | null {
  if (!footer) return null;
  const match =
    /on\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(
      footer.replace(/[\u202f\u00a0]/g, " "),
    );
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = rawYear >= 100 ? rawYear : 2000 + rawYear;
  let hour = Number(match[4]);
  const minute = match[5];
  const meridiem = match[6]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (!day || !month || Number.isNaN(year) || hour > 23) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${minute}:00+08:00`;
}

/* ------------------------------------------------------------------ *
 * Table of contents
 * ------------------------------------------------------------------ */

interface TocEntry {
  tableId: string;
  facultyCode: string;
  programName: string;
  groupLabel: string;
}

/**
 * The source has no faculty node: every top-level `<li>` is a program whose
 * name embeds its faculty code, e.g. "Year (FKC) Bachelor of Computer
 * Engineering with Honours". Faculties are synthesised from that code.
 */
export function parseToc(html: string): TocEntry[] {
  const $ = cheerio.load(html);
  const tocHeading = $("p").filter((_, el) => $(el).text().includes("Table of contents")).first();
  const tocList = tocHeading.nextAll("ul").first();
  const entries: TocEntry[] = [];

  tocList.children("li").each((_, li: AnyNode) => {
    const $li = $(li);
    const ownText = $li.clone().children("ul").remove().end().text().replace(/\s+/g, " ").trim();
    const facultyCode = /Year\s*\(([^)]+)\)/.exec(ownText)?.[1]?.trim() ?? "UNKNOWN";
    const programName = ownText.replace(/^Year\s*\([^)]+\)\s*/, "").trim() || ownText;

    $li.children("ul").children("li").each((__, groupLi: AnyNode) => {
      const $a = $(groupLi).find("a[href^='#table_']").first();
      const tableId = $a.attr("href")?.replace("#table_", "");
      if (!tableId) return;
      entries.push({
        tableId,
        facultyCode,
        programName,
        groupLabel: $a.text().replace(/\s+/g, " ").trim(),
      });
    });
  });

  return entries;
}

/* ------------------------------------------------------------------ *
 * Timetable cells
 * ------------------------------------------------------------------ */

const EMPTY_MARK = /^-{3,}$/;
const BREAK_MARK = /^-\s*X\s*-$/i;

function isSkippableCell($: cheerio.CheerioAPI, cell: Element): boolean {
  const $cell = $(cell);
  if ($cell.hasClass("empty") || $cell.hasClass("break")) return true;
  const text = $cell.text().replace(/\s+/g, "");
  return EMPTY_MARK.test(text) || BREAK_MARK.test(text);
}

/**
 * A slot can hold several courses. Real cells only ever carry one, but the
 * parser handles N and never collapses them.
 */
interface CellEntry {
  line?: Element;
  teacher?: string;
  room?: string;
}

/**
 * A slot can hold several courses. Real cells only ever carry one, but the
 * parser handles N and never collapses them: each `div.line1` is paired with the
 * `div.teacher` / `div.room` that follow it, so stacked courses keep their own
 * lecturer and room.
 */
function parseCell(
  $: cheerio.CheerioAPI,
  cell: Element,
  day: string,
  start: string,
  end: string,
  facultyCodes: Set<string>,
): Session[] {
  const $cell = $(cell);

  const entries: CellEntry[] = [];
  $cell.children().each((_, node) => {
    const $node = $(node);
    if ($node.hasClass("line1")) {
      entries.push({ line: node as Element });
    } else if ($node.hasClass("teacher") || $node.hasClass("room")) {
      const text = $node.text().replace(/\s+/g, " ").trim();
      const current = entries[entries.length - 1];
      if (current) {
        if ($node.hasClass("teacher")) current.teacher = text;
        else current.room = text;
      }
    }
  });

  // Text but no `div.line1` means the layout changed: keep the raw text.
  if (entries.length === 0) {
    const raw = $cell.text().replace(/\s+/g, " ").trim();
    if (!raw) return [];
    return [
      {
        day,
        start,
        end,
        courseCode: null,
        courseName: "",
        type: "OTHER",
        lecturers: [],
        venue: null,
        online: false,
        raw,
      },
    ];
  }

  const cellText = $cell.text().replace(/\s+/g, " ").trim();

  return entries.map((entry) => {
    const subject = $(entry.line!).find("span.subject").first().text().replace(/\s+/g, " ").trim();
    const tag = $(entry.line!).find("span.activitytag").first().text().replace(/\s+/g, " ").trim();
    const { code, name } = parseSubject(subject);
    return {
      day,
      start,
      end,
      courseCode: code,
      courseName: name,
      type: parseType(tag),
      lecturers: entry.teacher ? parseLecturers(entry.teacher) : [],
      venue: entry.room || parseVenueFromTag(tag, facultyCodes),
      online: /ONLINE/i.test(`${tag} ${entry.room ?? ""}`),
      ...(code ? {} : { raw: cellText }),
    } satisfies Session;
  });
}

export function parseGroupTable(
  $: cheerio.CheerioAPI,
  table: Element,
  facultyCodes: Set<string>,
): Session[] {
  const rows = table.children.length
    ? $(table).find("tbody > tr").toArray().filter((tr) => !$(tr).hasClass("foot"))
    : [];

  const slots = rows
    .map((tr) => $(tr).children("th.yAxis").first().text().trim())
    .filter(Boolean)
    .map(normalizeSlot);

  const days = $(table)
    .find("thead th.xAxis")
    .toArray()
    .map((th) => $(th).text().trim().toUpperCase());

  const sessions: Session[] = [];
  const pending: number[] = [];

  rows.forEach((tr, rowIndex) => {
    const slot = slots[rowIndex];
    if (!slot) return;

    $(tr)
      .children("td")
      .each((_, cell) => {
        const $cell = $(cell);
        // Columns still covered by a rowspan from an earlier row are absent
        // from this row's markup, so skip over them.
        let column = 0;
        while ((pending[column] ?? 0) > 0) column += 1;

        const rowspan = Math.max(1, Number.parseInt($cell.attr("rowspan") ?? "1", 10) || 1);
        const colspan = Math.max(1, Number.parseInt($cell.attr("colspan") ?? "1", 10) || 1);
        for (let k = 0; k < colspan; k += 1) {
          pending[column + k] = Math.max(pending[column + k] ?? 0, rowspan);
        }

        if (!isSkippableCell($, cell)) {
          const lastRow = slots[Math.min(rowIndex + rowspan - 1, slots.length - 1)];
          const end = lastRow ? lastRow.end : slot.end;
          sessions.push(
            ...parseCell($, cell, days[column] ?? `COLUMN${column + 1}`, slot.start, end, facultyCodes),
          );
        }

        column += colspan - 1;
      });

    for (let i = 0; i < pending.length; i += 1) {
      if (pending[i] > 0) pending[i] -= 1;
    }
  });

  return sessions;
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

export function parseTimetable(
  html: string,
  sourceUrl = SOURCE_URL,
  scrapedAt = new Date().toISOString(),
): ParseResult {
  const $ = cheerio.load(html);
  const toc = parseToc(html);
  const tocByTable = new Map(toc.map((entry) => [entry.tableId, entry]));
  const facultyCodes = new Set(toc.map((entry) => entry.facultyCode));

  const faculties = new Map<string, Faculty>();
  const programs = new Map<string, Program>();
  const unparsed: UnparsedCell[] = [];
  let generatedAt: string | null = null;

  // Groups are keyed by table order, never by name: names repeat and contain typos.
  $("table[id^=table_]")
    .toArray()
    .forEach((table, index) => {
      const tableId = table.attribs.id.replace("table_", "");
      const entry = tocByTable.get(tableId);
      const group: Group = {
        id: tableId || String(index),
        label: entry?.groupLabel ?? $(table).find("caption .name").first().text().trim(),
        code: entry?.groupLabel.match(/^([A-Z]+\d+)/)?.[1] ?? null,
        sessions: parseGroupTable($, table, facultyCodes),
      };

      for (const session of group.sessions) {
        if (session.raw !== undefined) {
          unparsed.push({
            groupId: group.id,
            label: group.label,
            day: session.day,
            time: `${session.start}-${session.end}`,
            raw: session.raw,
          });
        }
      }

      if (!generatedAt) {
        generatedAt = parseGeneratedAt($(table).find("tr.foot td").last().text());
      }

      if (!entry) return;

      let faculty = faculties.get(entry.facultyCode);
      if (!faculty) {
        faculty = { code: entry.facultyCode, programs: [] };
        faculties.set(entry.facultyCode, faculty);
      }

      const programKey = `${entry.facultyCode}::${entry.programName}`;
      let program = programs.get(programKey);
      if (!program) {
        program = { code: "", name: entry.programName, groups: [] };
        programs.set(programKey, program);
        faculty.programs.push(program);
      }
      program.groups.push(group);
    });

  // Program code = most common code prefix among its groups. Blocks 39/40 mix
  // codes (UR2613001 / UR613001 / UR6213001), so the majority wins.
  for (const program of programs.values()) {
    const tally = new Map<string, number>();
    for (const group of program.groups) {
      if (!group.code) continue;
      tally.set(group.code, (tally.get(group.code) ?? 0) + 1);
    }
    program.code =
      [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "";
  }

  const timetable: Timetable = {
    generatedAt,
    scrapedAt,
    sourceUrl,
    faculties: [...faculties.values()],
  };

  return { timetable, unparsed };
}