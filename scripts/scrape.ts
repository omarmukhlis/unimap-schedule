/**
 * Fetches the official UniMAP timetable once, writes the raw HTML to
 * data/raw.html, and turns it into public/data/timetable.json.
 *
 * The app never fetches at request time - it only reads the JSON this writes.
 *
 *   npx tsx scripts/scrape.ts            # reuse data/raw.html if present
 *   npx tsx scripts/scrape.ts --force    # re-download
 *   npx tsx scripts/scrape.ts --offline  # never touch the network
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Timetable, UnparsedCell } from "../lib/types";
import { SOURCE_URL, parseTimetable } from "./parse";

const ROOT = join(__dirname, "..");
const RAW_PATH = join(ROOT, "data", "raw.html");
const OUT_PATH = join(ROOT, "public", "data", "timetable.json");

const force = process.argv.includes("--force");
const offline = process.argv.includes("--offline");

async function loadHtml(): Promise<string> {
  if (!force && !offline) {
    try {
      const cached = await readFile(RAW_PATH, "utf8");
      console.log(`Using cached ${RAW_PATH} (${cached.length.toLocaleString()} bytes). Pass --force to re-download.`);
      return cached;
    } catch {
      // no cache yet
    }
  }

  if (offline) {
    return readFile(RAW_PATH, "utf8");
  }

  console.log(`Fetching ${SOURCE_URL}`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();

  await mkdir(dirname(RAW_PATH), { recursive: true });
  await writeFile(RAW_PATH, html, "utf8");
  console.log(`Saved ${RAW_PATH} (${html.length.toLocaleString()} bytes)`);
  return html;
}

function count(timetable: Timetable) {
  const programs = timetable.faculties.flatMap((faculty) => faculty.programs);
  const groups = programs.flatMap((program) => program.groups);
  const sessions = groups.flatMap((group) => group.sessions);
  return {
    faculties: timetable.faculties.length,
    programs: programs.length,
    groups: groups.length,
    sessions: sessions.length,
    online: sessions.filter((session) => session.online).length,
    withLecturer: sessions.filter((session) => session.lecturers.length > 0).length,
    withVenue: sessions.filter((session) => session.venue).length,
  };
}

function report(timetable: Timetable, unparsed: UnparsedCell[]) {
  const stats = count(timetable);

  console.log("\n--- Ringkasan ---");
  console.log(`Fakulti        : ${stats.faculties}`);
  console.log(`Program        : ${stats.programs}`);
  console.log(`Kumpulan       : ${stats.groups}`);
  console.log(`Sesi           : ${stats.sessions}`);
  console.log(`  online       : ${stats.online}`);
  console.log(`  ada lecturer : ${stats.withLecturer}`);
  console.log(`  ada venue    : ${stats.withVenue}`);
  console.log(`Dijana (FET)   : ${timetable.generatedAt ?? "tidak dijumpai"}`);
  console.log(`Dijana (skrap) : ${timetable.scrapedAt}`);
  console.log(`Tidak parses   : ${unparsed.length}`);

  if (unparsed.length > 0) {
    console.log("\n--- Sel yang tidak berjaya dibaca ---");
    for (const entry of unparsed) {
      console.log(`[${entry.groupId}] ${entry.label} | ${entry.day} ${entry.time}`);
      console.log(`    ${entry.raw}`);
    }
  }

  return stats;
}

async function main() {
  const html = await loadHtml();
  const { timetable, unparsed } = parseTimetable(html);
  const stats = report(timetable, unparsed);

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(timetable)}\n`, "utf8");
  console.log(`\nWrote ${OUT_PATH} (${stats.sessions} sessions, ${unparsed.length} unparsed)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});