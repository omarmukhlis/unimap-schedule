import { describe, expect, it } from "vitest";
import type { Session } from "./types";
import {
  DEFAULT_WALLPAPER_OPTIONS,
  MAX_CANVAS_AREA,
  PALETTE_IDS,
  SAFE_BOTTOM_RATIO,
  SAFE_SIDE_RATIO,
  SAFE_TOP_RATIO,
  WALLPAPER_PALETTES,
  WALLPAPER_PRESETS,
  clampCanvasSize,
  clampDimension,
  getTones,
  layoutWallpaper,
  resolveCanvasSize,
  safeArea,
  screenCanvasSize,
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
    // Layout tests must not depend on the test machine's screen, so pin the size.
    options: {
      ...DEFAULT_WALLPAPER_OPTIONS,
      sizeMode: "manual",
      width: 1170,
      height: 2532,
      ...overrides,
    },
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
  it("covers every requested test size", () => {
    const sizes = WALLPAPER_PRESETS.map((preset) => `${preset.width}x${preset.height}`);
    for (const expected of [
      "1170x2532",
      "1290x2796",
      "1320x2868",
      "1080x2400",
      "1440x3120",
      "750x1334",
    ]) {
      expect(sizes).toContain(expected);
    }
  });

  it("is labelled by size rather than by device model", () => {
    for (const preset of WALLPAPER_PRESETS) {
      expect(preset.label).toBe(`${preset.width} × ${preset.height}`);
      expect(preset.label).not.toMatch(/iphone|android|galaxy|pixel/i);
    }
  });

  it("all fall inside the allowed dimension range and area cap", () => {
    for (const preset of WALLPAPER_PRESETS) {
      expect(preset.width).toBeGreaterThanOrEqual(MIN_DIMENSION);
      expect(preset.height).toBeLessThanOrEqual(MAX_DIMENSION);
      expect(preset.width * preset.height).toBeLessThanOrEqual(MAX_CANVAS_AREA);
    }
  });
});

describe("safeArea", () => {
  it("reserves the documented proportions", () => {
    const safe = safeArea(1000, 2000);
    expect(safe.x).toBe(70);
    expect(safe.y).toBe(600);
    expect(safe.width).toBe(860);
    // 2000 - 30% top - 10% bottom
    expect(safe.height).toBe(1200);
  });

  it("always leaves the two reserved bands empty", () => {
    for (const preset of WALLPAPER_PRESETS) {
      const safe = safeArea(preset.width, preset.height);
      expect(safe.y).toBeGreaterThanOrEqual(preset.height * SAFE_TOP_RATIO - 1);
      expect(preset.height - safe.y - safe.height).toBeGreaterThanOrEqual(
        preset.height * SAFE_BOTTOM_RATIO - 1,
      );
      expect(safe.x).toBeGreaterThanOrEqual(preset.width * SAFE_SIDE_RATIO - 1);
    }
  });
});

describe("clampCanvasSize", () => {
  it("leaves a size that already fits untouched", () => {
    expect(clampCanvasSize(1170, 2532)).toEqual({ width: 1170, height: 2532 });
  });

  it("keeps total area under the canvas limit", () => {
    const clamped = clampCanvasSize(4000, 4000);
    expect(clamped.width * clamped.height).toBeLessThanOrEqual(MAX_CANVAS_AREA);
  });

  it("preserves the aspect ratio when scaling down", () => {
    const source = { width: 3000, height: 6000 };
    const clamped = clampCanvasSize(source.width, source.height);
    const before = source.width / source.height;
    const after = clamped.width / clamped.height;
    expect(Math.abs(before - after)).toBeLessThan(0.05);
  });

  it("recovers from non-numeric input", () => {
    expect(clampCanvasSize(Number.NaN, 2000).width).toBe(MIN_DIMENSION);
  });
});

describe("screenCanvasSize", () => {
  it("multiplies the screen by the pixel ratio", () => {
    expect(screenCanvasSize(390, 844, 3)).toEqual({ width: 1170, height: 2532 });
    expect(screenCanvasSize(360, 800, 3)).toEqual({ width: 1080, height: 2400 });
  });

  it("always returns portrait dimensions", () => {
    const landscape = screenCanvasSize(844, 390, 3);
    expect(landscape.width).toBeLessThan(landscape.height);
  });

  it("caps a huge screen area", () => {
    const clamped = screenCanvasSize(2560, 1440, 4);
    expect(clamped.width * clamped.height).toBeLessThanOrEqual(MAX_CANVAS_AREA);
  });

  it("treats a missing or invalid pixel ratio as 1", () => {
    expect(screenCanvasSize(1170, 2532, 0)).toEqual({ width: 1170, height: 2532 });
    expect(screenCanvasSize(1170, 2532, Number.NaN)).toEqual({ width: 1170, height: 2532 });
  });
});

describe("resolveCanvasSize", () => {
  it("uses the stored size in manual mode", () => {
    expect(resolveCanvasSize({ ...DEFAULT_WALLPAPER_OPTIONS, sizeMode: "manual", width: 1080, height: 2400 })).toEqual({
      width: 1080,
      height: 2400,
    });
  });

  it("clamps a manual size that is out of range", () => {
    expect(resolveCanvasSize({ ...DEFAULT_WALLPAPER_OPTIONS, sizeMode: "manual", width: 10, height: 99_999 })).toEqual({
      width: MIN_DIMENSION,
      height: MAX_DIMENSION,
    });
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
  it("keeps the header below the reserved top band", () => {
    for (const preset of WALLPAPER_PRESETS) {
      const layout = build(day, { width: preset.width, height: preset.height });
      expect(layout.header[0].y).toBeGreaterThan(layout.safe.y);
    }
  });

  it("keeps every row inside the safe area at every size", () => {
    for (const preset of WALLPAPER_PRESETS) {
      const layout = build(day, { width: preset.width, height: preset.height });
      for (const row of layout.rows) {
        expect(row.top).toBeGreaterThanOrEqual(layout.safe.y);
        expect(row.top + row.height).toBeLessThanOrEqual(layout.safe.y + layout.safe.height);
        expect(row.surface.x).toBeGreaterThanOrEqual(layout.safe.x);
        expect(row.surface.x + row.surface.width).toBeLessThanOrEqual(
          layout.safe.x + layout.safe.width,
        );
      }
    }
  });

  it("keeps the footer out of the reserved bottom band", () => {
    for (const preset of WALLPAPER_PRESETS) {
      const layout = build(day, { width: preset.width, height: preset.height });
      const safeBottom = layout.safe.y + layout.safe.height;
      for (const run of layout.footer) {
        expect(run.y).toBeLessThanOrEqual(safeBottom);
        expect(safeBottom).toBeLessThan(preset.height);
      }
    }
  });

  it("stays inside the canvas even with a crowded day", () => {
    const crowded = Array.from({ length: 14 }, (_, index) =>
      session({ start: "08:00", end: "08:45", courseName: `SUBJECT ${index}` }),
    );
    for (const preset of WALLPAPER_PRESETS) {
      const layout = build(crowded, { width: preset.width, height: preset.height });
      const last = layout.rows[layout.rows.length - 1];
      expect(last.top + last.height).toBeLessThanOrEqual(layout.safe.y + layout.safe.height);
    }
  });

  it("ellipsizes a long venue instead of overflowing", () => {
    const longVenue = session({ venue: "PAUH PUTRA - KOMPLEKS DEWAN KULIAH TAHANAN A (2000)" });
    for (const preset of WALLPAPER_PRESETS) {
      const layout = build([longVenue], { width: preset.width, height: preset.height });
      const detail = layout.rows[0].lines.filter((run) =>
        run.text.includes("KOMPLEKS") || run.text.includes("…"),
      );
      expect(detail.length).toBeGreaterThan(0);
      for (const run of detail) {
        expect(run.text.endsWith("…")).toBe(true);
        expect(measure(run.text, run.size, run.weight)).toBeLessThanOrEqual(
          layout.rows[0].surface.x + layout.rows[0].surface.width - run.x,
        );
      }
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