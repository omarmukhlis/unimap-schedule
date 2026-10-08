export type SessionType = "LECTURE" | "LAB" | "OTHER";

export interface Session {
  day: string;
  start: string;
  end: string;
  courseCode: string | null;
  courseName: string;
  type: SessionType;
  lecturers: string[];
  venue: string | null;
  online: boolean;
  /** Set when the cell could not be parsed; raw cell text is kept here instead. */
  raw?: string;
}

export interface Group {
  id: string;
  label: string;
  code: string | null;
  sessions: Session[];
}

export interface Program {
  code: string;
  name: string;
  groups: Group[];
}

export interface Faculty {
  code: string;
  programs: Program[];
}

export interface Timetable {
  generatedAt: string | null;
  scrapedAt: string;
  sourceUrl: string;
  faculties: Faculty[];
}

export interface UnparsedCell {
  groupId: string;
  label: string;
  day: string;
  time: string;
  raw: string;
}

export interface ParseResult {
  timetable: Timetable;
  unparsed: UnparsedCell[];
}