import type { Session } from "./types";

export const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;

export const DAY_LABEL: Record<string, string> = {
  MONDAY: "Isnin",
  TUESDAY: "Selasa",
  WEDNESDAY: "Rabu",
  THURSDAY: "Khamis",
  FRIDAY: "Jumaat",
};

export const DAY_SHORT: Record<string, string> = {
  MONDAY: "Isn",
  TUESDAY: "Sel",
  WEDNESDAY: "Rab",
  THURSDAY: "Kha",
  FRIDAY: "Jum",
};

export const TYPE_LABEL: Record<Session["type"], string> = {
  LECTURE: "Kuliah",
  LAB: "Makmal",
  OTHER: "Lain",
};

export const GRID_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

/** Palette tuned for readable text on a light background. */
const PALETTE = [
  { bg: "#dbeafe", fg: "#1e3a8a" },
  { bg: "#dcfce7", fg: "#14532d" },
  { bg: "#fef3c7", fg: "#78350f" },
  { bg: "#fce7f3", fg: "#831843" },
  { bg: "#ede9fe", fg: "#4c1d95" },
  { bg: "#cffafe", fg: "#164e63" },
  { bg: "#ffedd5", fg: "#7c2d12" },
  { bg: "#f1f5f9", fg: "#334155" },
];

export function courseColor(code: string | null) {
  const key = code ?? "";
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

const FIRST_SLOT = 8 * 60;

/** 08:00 -> 0, 18:00 -> 10. Null when the time falls outside the grid. */
export function slotIndex(time: string): number | null {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const total = hours * 60 + minutes - FIRST_SLOT;
  if (total < 0 || total % 60 !== 0) return null;
  return total / 60;
}

export function durationRows(session: Session): number {
  const [sh, sm] = session.start.split(":").map(Number);
  const [eh, em] = session.end.split(":").map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return Math.max(1, Math.round(minutes / 60));
}

export function formatGeneratedAt(value: string | null): string {
  if (!value) return "tidak diketahui";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ms-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  });
}