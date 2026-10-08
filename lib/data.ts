import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Faculty, Group, Program, Timetable } from "./types";

const DATA_PATH = join(process.cwd(), "public", "data", "timetable.json");

let cache: Timetable | null = null;

export function getTimetable(): Timetable {
  if (!cache) {
    cache = JSON.parse(readFileSync(DATA_PATH, "utf8")) as Timetable;
  }
  return cache;
}

export interface FlatGroup {
  id: string;
  label: string;
  code: string | null;
  facultyCode: string;
  programCode: string;
  programName: string;
}

export function getFlatGroups(): FlatGroup[] {
  return getTimetable().faculties.flatMap((faculty) =>
    faculty.programs.flatMap((program) =>
      program.groups.map((group) => ({
        id: group.id,
        label: group.label,
        code: group.code,
        facultyCode: faculty.code,
        programCode: program.code,
        programName: program.name,
      })),
    ),
  );
}

export interface FoundGroup extends FlatGroup {
  group: Group;
  program: Program;
  faculty: Faculty;
}

export function findGroup(id: string): FoundGroup | null {
  for (const faculty of getTimetable().faculties) {
    for (const program of faculty.programs) {
      for (const group of program.groups) {
        if (group.id !== id) continue;
        return {
          id: group.id,
          label: group.label,
          code: group.code,
          facultyCode: faculty.code,
          programCode: program.code,
          programName: program.name,
          group,
          program,
          faculty,
        };
      }
    }
  }
  return null;
}