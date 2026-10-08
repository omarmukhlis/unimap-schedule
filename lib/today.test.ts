import { describe, expect, it } from "vitest";
import type { Session } from "./types";
import {
  activeDays,
  dateOfDay,
  formatCountdown,
  kualaLumpurNow,
  planDay,
  sessionsOn,
  sortSessions,
  toMinutes,
  type Clock,
} from "./today";

function session(partial: Partial<Session>): Session {
  return {
    day: "MONDAY",
    start: "08:00",
    end: "09:50",
    courseCode: "IMJ11203",
    courseName: "CIRCUIT THEORY 1",
    type: "LECTURE",
    lecturers: ["ROSEMIZI BIN ABD RAHIM"],
    venue: "PAUH PUTRA - DK 3 (400)",
    online: false,
    ...partial,
  };
}

const mondayAt11: Clock = {
  day: "MONDAY",
  minutes: 11 * 60,
  date: "2026-10-05",
  isTeachingDay: true,
};

describe("toMinutes", () => {
  it("converts HH:MM", () => {
    expect(toMinutes("08:30")).toBe(510);
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("23:59")).toBe(1439);
  });

  it("rejects malformed or out of range values", () => {
    expect(toMinutes("")).toBeNull();
    expect(toMinutes("abc")).toBeNull();
    expect(toMinutes("8")).toBeNull();
    expect(toMinutes("08:99")).toBeNull();
    expect(toMinutes("25:00")).toBeNull();
  });
});

describe("kualaLumpurNow", () => {
  it("converts to Malaysia time regardless of the host time zone", () => {
    const clock = kualaLumpurNow(new Date("2026-10-09T02:30:00Z"));
    expect(clock.minutes).toBe(630);
    expect(clock.day).toBe("FRIDAY");
    expect(clock.date).toBe("2026-10-09");
    expect(clock.isTeachingDay).toBe(true);
  });

  it("rolls over past midnight in Malaysia", () => {
    const clock = kualaLumpurNow(new Date("2026-10-09T18:00:00Z"));
    expect(clock.minutes).toBe(120);
    expect(clock.day).toBe("SATURDAY");
    expect(clock.date).toBe("2026-10-10");
    expect(clock.isTeachingDay).toBe(false);
  });
});

describe("sortSessions", () => {
  it("orders by start time", () => {
    const list = [
      session({ start: "14:00", end: "15:50" }),
      session({ start: "08:00", end: "09:50" }),
      session({ start: "10:00", end: "11:50" }),
    ];
    expect(sortSessions(list).map((item) => item.start)).toEqual(["08:00", "10:00", "14:00"]);
  });

  it("breaks ties on end time then course name", () => {
    const list = [
      session({ start: "08:00", end: "10:50", courseName: "BETA" }),
      session({ start: "08:00", end: "09:50", courseName: "ZETA" }),
      session({ start: "08:00", end: "09:50", courseName: "ALFA" }),
    ];
    expect(sortSessions(list).map((item) => item.courseName)).toEqual(["ALFA", "ZETA", "BETA"]);
  });

  it("does not mutate the input", () => {
    const list = [session({ start: "14:00" }), session({ start: "08:00" })];
    const before = list.map((item) => item.start);
    sortSessions(list);
    expect(list.map((item) => item.start)).toEqual(before);
  });
});

describe("sessionsOn", () => {
  it("filters by day and sorts", () => {
    const list = [
      session({ day: "MONDAY", start: "10:00" }),
      session({ day: "TUESDAY", start: "09:00" }),
      session({ day: "MONDAY", start: "08:00" }),
    ];
    expect(sessionsOn(list, "MONDAY").map((item) => item.start)).toEqual(["08:00", "10:00"]);
  });

  it("returns nothing for an unknown day", () => {
    expect(sessionsOn([session({})], "SUNDAY")).toEqual([]);
    expect(sessionsOn([session({})], null)).toEqual([]);
  });
});

describe("planDay", () => {
  const day = [
    session({ start: "08:00", end: "09:50" }),
    session({ start: "10:00", end: "11:50" }),
    session({ start: "14:00", end: "15:50" }),
  ];

  it("marks past, current and upcoming classes", () => {
    const plan = planDay(day, mondayAt11);
    expect(plan.statuses).toEqual(["past", "current", "later"]);
    expect(plan.currentIndex).toBe(1);
    expect(plan.nextIndex).toBe(2);
    expect(plan.minutesUntilChange).toBe(50);
  });

  it("uses the next class when there is a gap", () => {
    const plan = planDay(
      [session({ start: "08:00", end: "09:50" }), session({ start: "12:00", end: "13:50" })],
      mondayAt11,
    );
    expect(plan.statuses).toEqual(["past", "later"]);
    expect(plan.currentIndex).toBe(-1);
    expect(plan.nextIndex).toBe(1);
    expect(plan.minutesUntilChange).toBe(60);
  });

  it("reports nothing pending once the day is over", () => {
    const plan = planDay(day, { ...mondayAt11, minutes: 18 * 60 });
    expect(plan.statuses).toEqual(["past", "past", "past"]);
    expect(plan.currentIndex).toBe(-1);
    expect(plan.nextIndex).toBe(-1);
    expect(plan.minutesUntilChange).toBeNull();
  });

  it("treats the start instant as in progress", () => {
    const plan = planDay(day, { ...mondayAt11, minutes: 10 * 60 });
    expect(plan.currentIndex).toBe(1);
    expect(plan.minutesUntilChange).toBe(110);
  });

  it("is empty on a non-teaching day", () => {
    const plan = planDay(day, { ...mondayAt11, day: "SATURDAY", isTeachingDay: false });
    expect(plan.sessions).toEqual([]);
    expect(plan.currentIndex).toBe(-1);
  });

  it("keeps statuses aligned with the sorted session list", () => {
    const shuffled = [day[2], day[0], day[1]];
    const plan = planDay(shuffled, mondayAt11);
    expect(plan.sessions.map((item) => item.start)).toEqual(["08:00", "10:00", "14:00"]);
    expect(plan.sessions[plan.currentIndex].start).toBe("10:00");
  });

  it("handles a group with no sessions at all", () => {
    const plan = planDay([], mondayAt11);
    expect(plan.sessions).toEqual([]);
    expect(plan.statuses).toEqual([]);
    expect(plan.minutesUntilChange).toBeNull();
  });
});

describe("formatCountdown", () => {
  it("formats hours and minutes", () => {
    expect(formatCountdown(5)).toBe("5 minit");
    expect(formatCountdown(60)).toBe("1 jam");
    expect(formatCountdown(85)).toBe("1 jam 25 minit");
  });

  it("handles the boundary and the empty case", () => {
    expect(formatCountdown(0)).toBe("kurang semasa");
    expect(formatCountdown(null)).toBeNull();
  });
});

describe("activeDays", () => {
  it("returns only days with classes, in timetable order", () => {
    const list = [session({ day: "FRIDAY" }), session({ day: "MONDAY" }), session({ day: "MONDAY" })];
    expect(activeDays(list)).toEqual(["MONDAY", "FRIDAY"]);
    expect(activeDays([])).toEqual([]);
  });
});

describe("dateOfDay", () => {
  it("resolves a day within the current Malaysia week", () => {
    // 2026-10-09 is a Friday, so Monday is two days earlier.
    expect(dateOfDay("MONDAY", new Date("2026-10-09T02:30:00Z"))).toBe("Isnin, 5 Oktober 2026");
    expect(dateOfDay("FRIDAY", new Date("2026-10-09T02:30:00Z"))).toBe("Jumaat, 9 Oktober 2026");
  });

  it("crosses month boundaries", () => {
    // 2026-10-01 is a Thursday; Monday is four days earlier, in September.
    expect(dateOfDay("MONDAY", new Date("2026-10-01T02:00:00Z"))).toBe("Isnin, 28 September 2026");
  });

  it("returns null for an unknown day", () => {
    expect(dateOfDay("NOTADAY", new Date("2026-10-09T02:30:00Z"))).toBeNull();
  });
});