import type { Session } from "./types";
import { DAY_LABEL, DAY_ORDER } from "./schedule";

export const TIME_ZONE = "Asia/Kuala_Lumpur";

const DAY_KEYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

const weekdayFormat = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short" });
const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const longDateFormat = new Intl.DateTimeFormat("ms-MY", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Includes the weekend, which `DAY_LABEL` in lib/schedule does not cover. */
export const WEEKDAY_LABEL: Record<string, string> = {
  ...DAY_LABEL,
  SATURDAY: "Sabtu",
  SUNDAY: "Ahad",
};

/** "Sabtu, 11 Oktober 2026" in Malaysia local time. */
export function formatMalaysiaDate(now: Date = new Date()): string {
  return longDateFormat.format(now);
}

const utcLongDateFormat = new Intl.DateTimeFormat("ms-MY", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Date of a timetable day within the current Malaysia week, e.g. "Senin, 12 Oktober 2026". */
export function dateOfDay(day: string, now: Date = new Date()): string | null {
  const clock = kualaLumpurNow(now);
  if (!clock.day) return null;

  const parts = dateFormat.format(now).split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

  const targetIndex = DAY_KEYS.findIndex((key) => key === clock.day);
  const wantedIndex = DAY_KEYS.findIndex((key) => key === day);
  if (targetIndex < 0 || wantedIndex < 0) return null;

  const base = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const shifted = new Date(base + (wantedIndex - targetIndex) * 86_400_000);
  return utcLongDateFormat.format(shifted);
}

/** "08:30" -> 510. Returns null for anything unparseable. */
export function toMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export interface Clock {
  /** Day key, e.g. "MONDAY". Null when the Intl weekday is unrecognised. */
  day: string | null;
  /** Minutes since midnight in Asia/Kuala_Lumpur. */
  minutes: number;
  /** "YYYY-MM-DD" in Asia/Kuala_Lumpur. */
  date: string;
  /** True when the day is one the timetable actually covers. */
  isTeachingDay: boolean;
}

/** Current wall-clock time in Malaysia, regardless of the device time zone. */
export function kualaLumpurNow(now: Date = new Date()): Clock {
  const shortDay = weekdayFormat.format(now);
  const day = DAY_KEYS.find((key) => key.slice(0, 3).toLowerCase() === shortDay.toLowerCase()) ?? null;
  const parts = clockFormat.formatToParts(now);
  const hours = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minutes = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return {
    day,
    minutes: hours * 60 + minutes,
    date: dateFormat.format(now),
    isTeachingDay: day !== null && (DAY_ORDER as readonly string[]).includes(day),
  };
}

/** Stable ordering: earliest first, ties broken by end time then course name. */
export function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => {
    const startA = toMinutes(a.start) ?? Number.MAX_SAFE_INTEGER;
    const startB = toMinutes(b.start) ?? Number.MAX_SAFE_INTEGER;
    if (startA !== startB) return startA - startB;
    const endA = toMinutes(a.end) ?? Number.MAX_SAFE_INTEGER;
    const endB = toMinutes(b.end) ?? Number.MAX_SAFE_INTEGER;
    if (endA !== endB) return endA - endB;
    return (a.courseName ?? "").localeCompare(b.courseName ?? "");
  });
}

/** Sessions for one day key, already sorted. Days with nothing return an empty array. */
export function sessionsOn(sessions: Session[], day: string | null): Session[] {
  if (!day) return [];
  return sortSessions(sessions.filter((session) => session.day === day));
}

export type SessionStatus = "past" | "current" | "next" | "later";

export interface DayPlan {
  sessions: Session[];
  /** Status for each entry in `sessions`, index-aligned. */
  statuses: SessionStatus[];
  /** Index of the class in progress, or -1. */
  currentIndex: number;
  /** Index of the first class that has not started, or -1. */
  nextIndex: number;
  /** Minutes until the current class ends, or until the next one starts. */
  minutesUntilChange: number | null;
}

const EMPTY_PLAN: DayPlan = {
  sessions: [],
  statuses: [],
  currentIndex: -1,
  nextIndex: -1,
  minutesUntilChange: null,
};

/** Marks each class as finished, in progress, next up, or still ahead. */
export function planDay(sessions: Session[], clock: Clock): DayPlan {
  const list = sessionsOn(sessions, clock.day);
  if (list.length === 0) return { ...EMPTY_PLAN, sessions: list };

  const statuses: SessionStatus[] = list.map((session) => {
    const start = toMinutes(session.start) ?? Number.MAX_SAFE_INTEGER;
    const end = toMinutes(session.end) ?? start;
    if (clock.minutes >= end) return "past";
    if (clock.minutes >= start) return "current";
    return "later";
  });

  const currentIndex = statuses.indexOf("current");
  const pending = statuses.map((status, index) => (status === "later" ? index : -1)).filter((i) => i >= 0);
  const nextIndex = pending.length > 0 ? pending[0] : -1;

  let minutesUntilChange: number | null = null;
  if (currentIndex >= 0) {
    const end = toMinutes(list[currentIndex].end);
    if (end !== null) minutesUntilChange = Math.max(0, end - clock.minutes);
  } else if (nextIndex >= 0) {
    const start = toMinutes(list[nextIndex].start);
    if (start !== null) minutesUntilChange = Math.max(0, start - clock.minutes);
  }

  return { sessions: list, statuses, currentIndex, nextIndex, minutesUntilChange };
}

/** "1 jam 25 minit", "25 minit", or "kurang semasa". */
export function formatCountdown(minutes: number | null): string | null {
  if (minutes === null) return null;
  if (minutes <= 0) return "kurang semasa";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} minit`;
  if (rest === 0) return `${hours} jam`;
  return `${hours} jam ${rest} minit`;
}

/** Days that have at least one class, in timetable order. */
export function activeDays(sessions: Session[]): string[] {
  const present = new Set(sessions.map((session) => session.day));
  return DAY_ORDER.filter((day) => present.has(day));
}