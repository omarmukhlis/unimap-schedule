import { describe, expect, it } from "vitest";
import type { Session } from "./types";
import {
  DEFAULT_WALLPAPER_OPTIONS,
  PALETTE_IDS,
  SAFE_TOP_RATIO,
  WALLPAPER_PALETTES,
  WALLPAPER_PRESETS,
  clampDimension,
  getTones,
  layoutWallpaper,
  MAX_DIMENSION,
  MIN_DIMENSION,
  type Measure,
  type WallpaperOptions,
} from "./wallpaper";

/** Deterministic stand-in for canvas measureText: every glyph is half the font size wide. */
const measure: Measure = (text, size) => text.length * size * 0.5;

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

function build(sessions: Session[], overrides: Partial<WallpaperOptions> = {}) {
  return layoutWallpaper({
    sessions,
    options: { ...DEFAULT_WALLPAPER_OPTIONS, ...overrides },
    title: "UR6523002 - Y1G1 (25)",
    subtitle: "Bachelor of Computer Engineering with Honours",
    dayLabel: "Isnin",
    dateLabel: "5 Oktober 2026",
    measure,
  });
}

const day: Session[] = [
  session({ start: "08:00", end: "09:50" }),
  session({ start: "10:00", end: "11:50", courseName: "DIGITAL LOGIC", courseCode: "IMJ11204" }),
  session({ start: "14:00", end: "15:50", courseName: "PROBABILITY", courseCode: "IMJ21003" }),
];

describe("presets", () => {
  it("covers the requested phone sizes", () => {
    const sizes = WALLPAPER_PRESETS.map((preset) => `${preset.width}x${preset.height}`);
    expect(sizes).toContain("1170x2532");
    expect(sizes).toContain("1290x2796");
    expect(sizes).toContain("1080x2400");
  });

  it("all fall inside the allowed dimension range", () => {
    for (const preset of WALLPAPER_PRESETS) {
      expect(preset.width).toBeGreaterThanOrEqual(MIN_DIMENSION);
      expect(preset.height).toBeLessThanOrEqual(MAX_DIMENSION);
    }
  });
});

describe("palettes", () => {
  it("offers three or four colour schemes with both themes", () => {
    expect(PALETTE_IDS.length).toBeGreaterThanOrEqual(3);
    expect(PALETTE_IDS.length).toBeLessThanOrEqual(4);
    for (const id of PALETTE_IDS) {
      const palette = WALLPAPER_PALETTES.find((item) => item.id === id);
      expect(palette).toBeDefined();
      expect(palette?.label).toBeTruthy();
    }
  });

  it("returns different tones for light and dark", () => {
    const light = getTones({ ...DEFAULT_WALLPAPER_OPTIONS, theme: "light", palette: "ocean" });
    const dark = getTones({ ...DEFAULT_WALLPAPER_OPTIONS, theme: "dark", palette: "ocean" });
    expect(light.bgTop).not.toBe(dark.bgTop);
    expect(light.text).not.toBe(dark.text);
  });

  it("falls back to the first palette for an unknown id", () => {
    const tones = getTones({
      ...DEFAULT_WALLPAPER_OPTIONS,
      palette: "nope" as WallpaperOptions["palette"],
    });
    expect(tones).toEqual(WALLPAPER_PALETTES[0].light);
  });
});

describe("clampDimension", () => {
  it("keeps custom sizes within bounds", () => {
    expect(clampDimension(100)).toBe(MIN_DIMENSION);
    expect(clampDimension(99999)).toBe(MAX_DIMENSION);
    expect(clampDimension(1170)).toBe(1170);
  });

  it("recovers from non-numeric input", () => {
    expect(clampDimension(Number.NaN)).toBe(MIN_DIMENSION);
    expect(clampDimension(Number.POSITIVE_INFINITY)).toBe(MAX_DIMENSION);
  });
});

describe("layoutWallpaper", () => {
  it("keeps the header below the lock screen safe area", () => {
    for (const preset of WALLPAPER_PRESETS) {
      const layout = build(day, { width: preset.width, height: preset.height });
      const safeTop = Math.round(preset.height * SAFE_TOP_RATIO);
      const firstBaseline = layout.header[0].y;
      expect(safeTop).toBeLessThan(firstBaseline);
    }
  });

  it("renders one row per session, in order", () => {
    const layout = build(day);
    expect(layout.rows).toHaveLength(3);
    expect(layout.rows.map((row) => row.time?.text)).toEqual([
      "08:00 – 09:50",
      "10:00 – 11:50",
      "14:00 – 15:50",
    ]);
    const tops = layout.rows.map((row) => row.top);
    expect([...tops].sort((a, b) => a - b)).toEqual(tops);
  });

  it("stacks rows without overlapping and inside the canvas", () => {
    for (const preset of WALLPAPER_PRESETS) {
      const layout = build(day, { width: preset.width, height: preset.height });
      for (const [index, row] of layout.rows.entries()) {
        expect(row.top).toBeGreaterThanOrEqual(layout.rule.y);
        expect(row.top + row.height).toBeLessThanOrEqual(layout.height);
        if (index > 0) {
          expect(row.top).toBeGreaterThanOrEqual(layout.rows[index - 1].top + layout.rows[index - 1].height);
        }
      }
    }
  });

  it("shrinks to fit a crowded day", () => {
    const crowded = Array.from({ length: 12 }, (_, index) =>
      session({ start: "08:00", end: "08:45", courseName: `SUBJECT ${index}` }),
    );
    const layout = build(crowded);
    expect(layout.rows).toHaveLength(12);
    const last = layout.rows[layout.rows.length - 1];
    expect(last.top + last.height).toBeLessThanOrEqual(layout.height);
    expect(layout.rows[0].height).toBeLessThan(build(day).rows[0].height);
  });

  it("caps the course name at two lines with an ellipsis", () => {
    const long = session({ courseName: "ADVANCED ".repeat(24).trim() });
    const layout = build([long]);
    const nameRuns = layout.rows[0].lines.filter((run) => run.size > layout.rows[0].time!.size);
    expect(nameRuns.length).toBeLessThanOrEqual(2);
    expect(nameRuns[nameRuns.length - 1].text.endsWith("…")).toBe(true);
  });

  it("includes lecturer names and venue by default", () => {
    const text = build(day).rows[0].lines.map((run) => run.text).join(" | ");
    expect(text).toContain("ROSEMIZI BIN ABD RAHIM");
    expect(text).toContain("PAUH PUTRA - DK 3 (400)");
  });

  it("omits lecturer names when the option is off", () => {
    const text = build(day, { showLecturers: false }).rows[0].lines.map((run) => run.text).join(" | ");
    expect(text).not.toContain("ROSEMIZI BIN ABD RAHIM");
    expect(text).toContain("PAUH PUTRA - DK 3 (400)");
  });

  it("omits the venue when the option is off", () => {
    const text = build(day, { showVenue: false }).rows[0].lines.map((run) => run.text).join(" | ");
    expect(text).not.toContain("PAUH PUTRA - DK 3 (400)");
    expect(text).toContain("ROSEMIZI BIN ABD RAHIM");
  });

  it("drops detail lines for sessions that have none", () => {
    const sparse = session({ lecturers: [], venue: null, courseCode: null, type: "LAB" });
    const layout = build([sparse], { showLecturers: true, showVenue: true });
    const text = layout.rows[0].lines.map((run) => run.text).join(" | ");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
    expect(text).toContain("Makmal");
  });

  it("shows an empty message when the day has no classes", () => {
    const layout = build([]);
    expect(layout.rows).toEqual([]);
    expect(layout.empty).toHaveLength(1);
    expect(layout.empty[0].text).toBe("Tiada kelas");
    expect(layout.empty[0].y).toBeGreaterThan(layout.rule.y);
  });

  it("puts the header, rows and footer inside the canvas bounds", () => {
    const layout = build(day);
    for (const run of [...layout.header, ...layout.empty, ...layout.footer]) {
      expect(run.y).toBeGreaterThanOrEqual(0);
      expect(run.y).toBeLessThanOrEqual(layout.height);
      expect(run.x).toBeGreaterThanOrEqual(0);
      expect(run.x).toBeLessThanOrEqual(layout.width);
    }
    for (const row of layout.rows) {
      for (const run of [...(row.time ? [row.time] : []), ...row.lines]) {
        expect(run.x).toBeGreaterThanOrEqual(row.surface.x);
        expect(run.x).toBeLessThanOrEqual(layout.width);
      }
    }
  });

  it("respects the requested canvas size", () => {
    const layout = build(day, { width: 1080, height: 2400 });
    expect(layout.width).toBe(1080);
    expect(layout.height).toBe(2400);
  });

  it("clamps a custom size that is out of range", () => {
    const layout = build(day, { width: 10, height: 99_999 });
    expect(layout.width).toBe(MIN_DIMENSION);
    expect(layout.height).toBe(MAX_DIMENSION);
  });

  it("always includes the group label and footer", () => {
    const layout = build(day);
    expect(layout.header.map((run) => run.text).join(" ")).toContain("UR6523002 - Y1G1 (25)");
    expect(layout.header[0].text).toBe("ISNIN · 5 OKTOBER 2026");
    expect(layout.footer[0].text).toBe("UniMAP Snap");
  });

  it("works for a session with a one-character start time range", () => {
    const layout = build([session({ start: "08:00", end: "08:00" })]);
    expect(layout.rows).toHaveLength(1);
    expect(layout.rows[0].time?.text).toBeTruthy();
  });
});