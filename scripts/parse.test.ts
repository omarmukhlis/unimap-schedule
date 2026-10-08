import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Session, Timetable } from "../lib/types";
import { EDGE_CASES_HTML } from "./fixtures/edge-cases";
import { parseTimetable } from "./parse";

const Y1G3_FIXTURE = readFileSync(join(__dirname, "fixtures", "y1g3.html"), "utf8");

function groupsOf(timetable: Timetable) {
  return timetable.faculties.flatMap((faculty) =>
    faculty.programs.flatMap((program) => program.groups),
  );
}

function findGroup(timetable: Timetable, label: string) {
  const group = groupsOf(timetable).find((candidate) => candidate.label === label);
  if (!group) throw new Error(`group not found: ${label}`);
  return group;
}

function at(sessions: Session[], day: string, start: string) {
  return sessions.find((session) => session.day === day && session.start === start);
}

/* ------------------------------------------------------------------ *
 * UR6523002 / Y1G3 - the checks requested for the real file
 * ------------------------------------------------------------------ */

describe("UR6523002 - Y1G3", () => {
  const { timetable, unparsed } = parseTimetable(Y1G3_FIXTURE, undefined, "2026-08-10T00:00:00.000Z");

  it("places the group under program UR6523002 in faculty FKC", () => {
    const fkc = timetable.faculties.find((faculty) => faculty.code === "FKC");
    expect(fkc).toBeDefined();
    const program = fkc!.programs.find((candidate) => candidate.code === "UR6523002");
    expect(program).toBeDefined();
    expect(program!.name).toBe("Bachelor of Computer Engineering with Honours");
    expect(program!.groups.map((group) => group.label)).toEqual(["UR6523002 - Y1G3 (25)"]);
  });

  it("keys groups by table id, not by name", () => {
    const y1g3 = findGroup(timetable, "UR6523002 - Y1G3 (25)");
    expect(y1g3.id).toBe("6");
  });

  it("Monday 08:00 is IMJ11203 Circuit Theory 1 lecture in DK 3", () => {
    const session = at(findGroup(timetable, "UR6523002 - Y1G3 (25)").sessions, "MONDAY", "08:00");
    expect(session).toBeDefined();
    expect(session!.courseCode).toBe("IMJ11203");
    expect(session!.courseName).toBe("CIRCUIT THEORY 1");
    expect(session!.type).toBe("LECTURE");
    expect(session!.venue).toBe("PAUH PUTRA - DK 3 (400)");
    expect(session!.online).toBe(false);
    expect(session!.end).toBe("09:50");
    expect(session!.lecturers).toEqual([
      "ROSEMIZI BIN ABD RAHIM",
      "RUZELITA BINTI NGADIRAN",
    ]);
  });

  it("Friday 10:00 is the IMJ11203 online lecture", () => {
    const session = at(findGroup(timetable, "UR6523002 - Y1G3 (25)").sessions, "FRIDAY", "10:00");
    expect(session).toBeDefined();
    expect(session!.courseCode).toBe("IMJ11203");
    expect(session!.courseName).toBe("CIRCUIT THEORY 1");
    expect(session!.online).toBe(true);
    expect(session!.venue).toBe("FKC - ONLINE");
    expect(session!.end).toBe("10:50");
  });

  it("Thursday 10:00-11:50 is the IMJ11304 lab", () => {
    const session = at(findGroup(timetable, "UR6523002 - Y1G3 (25)").sessions, "THURSDAY", "10:00");
    expect(session).toBeDefined();
    expect(session!.courseCode).toBe("IMJ11304");
    expect(session!.courseName).toBe("COMPUTER PROGRAMMING");
    expect(session!.type).toBe("LAB");
    expect(session!.start).toBe("10:00");
    expect(session!.end).toBe("11:50");
    expect(session!.venue).toBe("FKC - MAKMAL KOMPUTER 2 (MKM2)");
  });

  it("normalises the dotted 11.00 label", () => {
    const starts = findGroup(timetable, "UR6523002 - Y1G3 (25)").sessions.map((s) => s.start);
    expect(starts).toContain("11:00");
    expect(starts.some((start) => start.includes("."))).toBe(false);
  });

  it("ignores '---' empty and '-X-' blocked cells", () => {
    const sessions = findGroup(timetable, "UR6523002 - Y1G3 (25)").sessions;
    expect(sessions.every((session) => session.courseCode !== null)).toBe(true);
    // The Tuesday 10:00-11:50 slot is the only thing on that day; Friday 12:00 is a break.
    expect(at(sessions, "FRIDAY", "12:00")).toBeUndefined();
  });

  it("takes generatedAt from the FET footer", () => {
    expect(timetable.generatedAt).toBe("2026-08-10T19:47:00+08:00");
    expect(timetable.scrapedAt).toBe("2026-08-10T00:00:00.000Z");
    expect(timetable.sourceUrl).toContain("timetables2.unimap.edu.my");
  });

  it("parses every cell in the fixture", () => {
    expect(unparsed).toEqual([]);
  });

  it("keeps both Monday and Wednesday 08:00 sessions distinct", () => {
    const sessions = findGroup(timetable, "UR6523002 - Y1G3 (25)").sessions;
    expect(at(sessions, "MONDAY", "08:00")!.courseCode).toBe("IMJ11203");
    expect(at(sessions, "WEDNESDAY", "08:00")!.courseCode).toBe("IMJ11103");
    expect(at(sessions, "MONDAY", "10:00")!.courseCode).toBe("IMJ11304");
  });
});

/* ------------------------------------------------------------------ *
 * Edge cases
 * ------------------------------------------------------------------ */

describe("edge cases", () => {
  const { timetable, unparsed } = parseTimetable(EDGE_CASES_HTML, undefined, "2026-01-01T00:00:00.000Z");
  const first = findGroup(timetable, "UR6523002 - Y1G1 (25)");

  it("synthesises faculties from the parenthesised code", () => {
    expect(timetable.faculties.map((faculty) => faculty.code)).toEqual([
      "FKC",
      "FKTA",
      "FKTE",
      "FKTM",
      "FKTK",
      "FKTEN",
      "FPK",
    ]);
  });

  it("keeps duplicate labels apart via table ids", () => {
    const duplicates = timetable.faculties
      .find((faculty) => faculty.code === "FKC")!
      .programs[0].groups.filter((group) => group.label === "UR6523002 - Y1G1 (25)");
    expect(duplicates).toHaveLength(2);
    expect(duplicates.map((group) => group.id)).toEqual(["2", "4"]);
    expect(at(duplicates[0].sessions, "MONDAY", "08:00")!.courseCode).toBe("IMJ11203");
    expect(at(duplicates[1].sessions, "MONDAY", "08:00")!.courseCode).toBe("IMJ99999");
  });

  it("merges a rowspan=4 lecture into 08:00-11:50", () => {
    const session = at(first.sessions, "MONDAY", "08:00")!;
    expect(session.end).toBe("11:50");
    expect(first.sessions.filter((s) => s.day === "MONDAY" && s.start === "08:00")).toHaveLength(1);
  });

  it("parses a subject with no dash at all", () => {
    const session = at(first.sessions, "WEDNESDAY", "11:00")!;
    expect(session.courseCode).toBe("SMB12102");
    expect(session.courseName).toBe("BAHASA ARAB 1");
  });

  it("flags ONLINE from the activity tag when there is no room div", () => {
    const session = at(first.sessions, "WEDNESDAY", "11:00")!;
    expect(session.online).toBe(true);
    expect(session.venue).toBe("ONLINE");
  });

  it("does not read MAKMAL as LAB", () => {
    const session = at(first.sessions, "WEDNESDAY", "12:00")!;
    expect(session.courseCode).toBe("MMJ32703");
    expect(session.courseName).toBe("FLUID MACHINERY");
    expect(session.type).toBe("LAB"); // the tag also says "LAB MN3E0", genuinely a lab

    // Tag is "TUTORIAL FKTK -  MAKMAL PERANTI PERUBATAN (MN4E1)": no standalone LAB.
    const tutorial = first.sessions.find((s) => s.courseCode === "EMJ26103/EMJ26403/EMJ26503")!;
    expect(tutorial.type).toBe("LECTURE"); // TUTORIAL maps to LECTURE
    expect(tutorial.courseName).toBe("");
    expect(tutorial.venue).toBe("MAKMAL PERANTI PERUBATAN (MN4E1)");
  });

  it("keeps every course stacked in one slot", () => {
    const stacked = first.sessions.filter(
      (session) => session.day === "WEDNESDAY" && session.start === "12:00",
    );
    expect(stacked).toHaveLength(3);
    expect(stacked.map((s) => s.courseCode)).toEqual([
      "MMJ32703",
      "IMJ41002/IMJ42004",
      "EMJ16103/EMJ16203/EMJ16302",
    ]);
    // Each stacked course keeps its own lecturer and room.
    expect(stacked[1].lecturers).toEqual(["AHMAD BIN ABDULLAH"]);
    expect(stacked[1].venue).toBe("FKTA - BILIK TUTORIAL");
    expect(stacked[2].lecturers).toEqual([]);
    expect(stacked[2].venue).toBe("FKTE 1 - LAB MN3C0 - MAKMAL ROBOTIK");
    for (const session of stacked) expect(session.end).toBe("13:50"); // rowspan=2
  });

  it("parses a combined course code", () => {
    const session = first.sessions.find((s) => s.courseCode === "IMJ41002/IMJ42004")!;
    expect(session.courseName).toBe("FINAL YEAR PROJECT 1 / 2");
  });

  it("handles the TOTORIAL typo in the subject line", () => {
    const session = first.sessions.find(
      (s) => s.courseCode === "EMJ16103/EMJ16203/EMJ16302",
    )!;
    expect(session.courseName).toBe("");
    // The tag says LAB, and MAKMAL ROBOTIK must not change that.
    expect(session.type).toBe("LAB");
    expect(session.online).toBe(false);
  });

  it("treats a colspan=2 cell as one session and skips the shadowed column", () => {
    const monday = first.sessions.filter((session) => session.day === "MONDAY" && session.start === "15:00");
    expect(monday).toHaveLength(1);
    expect(monday[0].courseCode).toBe("EMJ26103/EMJ26403/EMJ26503");
    expect(at(first.sessions, "TUESDAY", "15:00")).toBeUndefined();
  });

  it("parses a spaced code", () => {
    const session = at(first.sessions, "TUESDAY", "16:00")!;
    expect(session.courseCode).toBe("MMT21704");
    expect(session.courseName).toBe("Automotive Modelling");
  });

  it("falls back to the activity tag for the venue when there is no room div", () => {
    const session = at(first.sessions, "TUESDAY", "16:00")!;
    expect(session.venue).toBe("DK 10 (200)");
    expect(session.online).toBe(false);
  });

  it("marks ONLINE from the tag when there is no room div", () => {
    const session = at(first.sessions, "THURSDAY", "17:00")!;
    expect(session.online).toBe(true);
    expect(session.venue).toBe("ONLINE");
    expect(session.lecturers).toEqual([]);
  });

  it("keeps unparsable cells as raw text instead of crashing", () => {
    const raw = first.sessions.find((session) => session.raw !== undefined)!;
    expect(raw.courseCode).toBeNull();
    expect(raw.raw).toContain("UNKNOWN SUBJECT WITHOUT CODE");
    expect(raw.type).toBe("LECTURE");

    const noLine1 = first.sessions.find(
      (session) => session.raw !== undefined && session.raw.includes("UNEXPECTED LAYOUT"),
    )!;
    expect(noLine1.courseCode).toBeNull();
    expect(noLine1.courseName).toBe("");

    expect(unparsed).toHaveLength(2);
    expect(unparsed.every((entry) => entry.groupId === "2")).toBe(true);
  });

  it("keeps typo'd and duplicate group labels verbatim", () => {
    expect(findGroup(timetable, "UR6526001 - YIG3 (20)").code).toBe("UR6526001");
  });

  it("treats LABS as OTHER, not LAB", () => {
    const session = at(findGroup(timetable, "UR6527001 - Y4G1 (25)").sessions, "MONDAY", "08:00")!;
    expect(session.type).toBe("OTHER");
  });

  it("parses LECTURE-PPKB as a lecture", () => {
    const session = at(findGroup(timetable, "UR6524001 - Y3G1 (40)").sessions, "MONDAY", "08:00")!;
    expect(session.type).toBe("LECTURE");
  });

  it("parses FKTEN-ONLINE7 venues", () => {
    const session = at(findGroup(timetable, "UR6525001 - Y2G1 (30)").sessions, "MONDAY", "08:00")!;
    expect(session.online).toBe(true);
    expect(session.venue).toBe("FKTEN-ONLINE7");
  });

  it("gives every faculty a code-derived name", () => {
    const fkte = timetable.faculties.find((faculty) => faculty.code === "FKTE")!;
    expect(fkte.programs[0].name).toBe("Bachelor of Mechatronic Engineering with Honours");
  });
});

/* ------------------------------------------------------------------ *
 * Optional integration test against the real 5.7 MB download
 * ------------------------------------------------------------------ */

const RAW_PATH = join(__dirname, "..", "data", "raw.html");

describe.skipIf(!existsSync(RAW_PATH))("data/raw.html integration", () => {
  const html = readFileSync(RAW_PATH, "utf8");
  const { timetable, unparsed } = parseTimetable(html, undefined, "2026-01-01T00:00:00.000Z");
  const groups = groupsOf(timetable);
  const y1g3 = groups.find((group) => group.label === "UR6523002 - Y1G3 (25)")!;

  it("parses the whole file", () => {
    expect(timetable.faculties).toHaveLength(7);
    expect(timetable.faculties.reduce((n, f) => n + f.programs.length, 0)).toBe(41);
    expect(groups).toHaveLength(633);
    console.log(
      `  programs=${timetable.faculties.reduce((n, f) => n + f.programs.length, 0)}` +
        ` groups=${groups.length}` +
        ` sessions=${groups.reduce((n, g) => n + g.sessions.length, 0)}` +
        ` unparsed=${unparsed.length}`,
    );
  });

  it("matches the spot checks from the real file", () => {
    const monday = at(y1g3.sessions, "MONDAY", "08:00")!;
    expect(monday.courseCode).toBe("IMJ11203");
    expect(monday.venue).toBe("PAUH PUTRA - DK 3 (400)");

    const friday = at(y1g3.sessions, "FRIDAY", "10:00")!;
    expect(friday.courseCode).toBe("IMJ11203");
    expect(friday.online).toBe(true);

    const thursday = at(y1g3.sessions, "THURSDAY", "10:00")!;
    expect(thursday.courseCode).toBe("IMJ11304");
    expect(thursday.type).toBe("LAB");
    expect(thursday.end).toBe("11:50");
  });

  it("leaves no unparsed cells", () => {
    if (unparsed.length) {
      console.log(unparsed.slice(0, 20));
    }
    expect(unparsed).toEqual([]);
  });
});