import type { Session } from "./types";
import { TYPE_LABEL } from "./schedule";

export const WALLPAPER_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Fraction of the height kept clear at the top for the lock screen clock. */
export const SAFE_TOP_RATIO = 0.18;

export const MIN_DIMENSION = 480;
export const MAX_DIMENSION = 4000;

export const WALLPAPER_PRESETS = [
  { id: "iphone-1170", label: "iPhone 12/13/14", width: 1170, height: 2532 },
  { id: "iphone-1290", label: "iPhone Pro Max", width: 1290, height: 2796 },
  { id: "android-1080", label: "Android biasa", width: 1080, height: 2400 },
] as const;

export type PresetId = (typeof WALLPAPER_PRESETS)[number]["id"];

export const PALETTE_IDS = ["ocean", "forest", "ember", "graphite"] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];

export type WallpaperTheme = "light" | "dark";

export interface WallpaperOptions {
  width: number;
  height: number;
  theme: WallpaperTheme;
  palette: PaletteId;
  showLecturers: boolean;
  showVenue: boolean;
}

export interface PaletteTones {
  bgTop: string;
  bgBottom: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
}

export interface Palette {
  id: PaletteId;
  label: string;
  light: PaletteTones;
  dark: PaletteTones;
}

export const WALLPAPER_PALETTES: Palette[] = [
  {
    id: "ocean",
    label: "Osean",
    light: {
      bgTop: "#f0f9ff",
      bgBottom: "#dbeafe",
      surface: "#ffffff",
      text: "#0c4a6e",
      muted: "#5b7f96",
      accent: "#0284c7",
    },
    dark: {
      bgTop: "#082f49",
      bgBottom: "#0c2233",
      surface: "#0b3a55",
      text: "#e0f2fe",
      muted: "#7fb3cc",
      accent: "#38bdf8",
    },
  },
  {
    id: "forest",
    label: "Hutan",
    light: {
      bgTop: "#f7fee7",
      bgBottom: "#dcfce7",
      surface: "#ffffff",
      text: "#14532d",
      muted: "#5b7f68",
      accent: "#16a34a",
    },
    dark: {
      bgTop: "#0d2818",
      bgBottom: "#10231a",
      surface: "#16351f",
      text: "#dcfce7",
      muted: "#85b394",
      accent: "#4ade80",
    },
  },
  {
    id: "ember",
    label: "Karang",
    light: {
      bgTop: "#fff7ed",
      bgBottom: "#ffedd5",
      surface: "#ffffff",
      text: "#7c2d12",
      muted: "#9c7360",
      accent: "#ea580c",
    },
    dark: {
      bgTop: "#3b1508",
      bgBottom: "#2a1409",
      surface: "#4d2110",
      text: "#ffedd5",
      muted: "#c99b83",
      accent: "#fb923c",
    },
  },
  {
    id: "graphite",
    label: "Kelabu",
    light: {
      bgTop: "#f8fafc",
      bgBottom: "#e2e8f0",
      surface: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      accent: "#475569",
    },
    dark: {
      bgTop: "#1e293b",
      bgBottom: "#0b1220",
      surface: "#273449",
      text: "#f1f5f9",
      muted: "#94a3b8",
      accent: "#cbd5e1",
    },
  },
];

export function getPalette(id: PaletteId): Palette {
  return WALLPAPER_PALETTES.find((palette) => palette.id === id) ?? WALLPAPER_PALETTES[0];
}

export function getTones(options: WallpaperOptions): PaletteTones {
  const palette = getPalette(options.palette);
  return options.theme === "dark" ? palette.dark : palette.light;
}

export const DEFAULT_WALLPAPER_OPTIONS: WallpaperOptions = {
  width: WALLPAPER_PRESETS[0].width,
  height: WALLPAPER_PRESETS[0].height,
  theme: "light",
  palette: "ocean",
  showLecturers: true,
  showVenue: true,
};

/** Keeps custom sizes inside a range that will not melt the browser. */
export function clampDimension(value: number): number {
  if (Number.isNaN(value)) return MIN_DIMENSION;
  return Math.round(Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, value)));
}

export type Measure = (text: string, size: number, weight: number) => number;

export interface TextRun {
  text: string;
  x: number;
  y: number;
  size: number;
  weight: number;
  color: string;
  align: "left" | "center" | "right";
}

export interface RowLayout {
  key: string;
  top: number;
  height: number;
  bar: { x: number; y: number; width: number; height: number; color: string };
  surface: { x: number; y: number; width: number; height: number; radius: number; color: string };
  time: TextRun | null;
  lines: TextRun[];
}

export interface WallpaperLayout {
  width: number;
  height: number;
  theme: WallpaperTheme;
  tones: PaletteTones;
  header: TextRun[];
  rule: { x: number; y: number; width: number; color: string };
  rows: RowLayout[];
  footer: TextRun[];
  empty: TextRun[];
}

export interface WallpaperInput {
  sessions: Session[];
  options: WallpaperOptions;
  /** Group label, e.g. "UR6523002 - Y1G1 (25)". */
  title: string;
  subtitle: string;
  /** Already-localised day name, e.g. "Isnin". */
  dayLabel: string;
  /** Already-localised date, e.g. "12 Oktober 2026". */
  dateLabel: string;
  measure: Measure;
}

function fit(
  text: string,
  maxWidth: number,
  size: number,
  weight: number,
  measure: Measure,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measure(candidate, size, weight) > maxWidth) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);

  // Everything that did not fit is dropped, and the last kept line gets an ellipsis.
  const consumed = lines.join(" ").replace(/…$/, "").split(/\s+/).filter(Boolean).length;
  if (consumed < words.length && lines.length > 0) {
    const last = lines.length - 1;
    let text = lines[last];
    while (text.length > 1 && measure(`${text}…`, size, weight) > maxWidth) {
      text = text.slice(0, -1).trimEnd();
    }
    lines[last] = `${text}…`;
  }
  return lines;
}

function sessionTitle(session: Session): string {
  const name = session.courseName?.trim();
  if (name) return name;
  return session.courseCode?.trim() || session.raw?.trim() || "Tanpa nama";
}

function sessionMeta(session: Session): string {
  const parts: string[] = [];
  if (session.courseCode) parts.push(session.courseCode);
  parts.push(TYPE_LABEL[session.type] ?? session.type);
  if (session.online) parts.push("ONLINE");
  return parts.join(" · ");
}

/** Pure layout: turns sessions plus options into positioned, already-wrapped text. */
export function layoutWallpaper(input: WallpaperInput): WallpaperLayout {
  const { sessions, options, measure } = input;
  const width = clampDimension(options.width);
  const height = clampDimension(options.height);
  const tones = getTones(options);

  const padding = Math.round(width * 0.075);
  const safeTop = Math.round(height * SAFE_TOP_RATIO);
  const headerSize = Math.round(width * 0.072);
  const subSize = Math.round(width * 0.034);
  const footerSize = Math.round(width * 0.026);

  let cursorY = safeTop + Math.round(height * 0.014);
  const header: TextRun[] = [];
  const pushHeader = (text: string, size: number, weight: number, color: string) => {
    if (!text) return;
    header.push({ text, x: padding, y: cursorY + size * 0.8, size, weight, color, align: "left" });
    cursorY += size * 1.28;
  };

  const dayLine = `${input.dayLabel} · ${input.dateLabel}`.trim();
  for (const line of fit(dayLine.toUpperCase(), width - padding * 2, headerSize, 700, measure, 1)) {
    pushHeader(line, headerSize, 700, tones.accent);
  }
  for (const line of fit(input.title, width - padding * 2, subSize * 1.18, 600, measure, 2)) {
    pushHeader(line, Math.round(subSize * 1.18), 600, tones.text);
  }
  for (const line of fit(input.subtitle, width - padding * 2, subSize, 400, measure, 1)) {
    pushHeader(line, subSize, 400, tones.muted);
  }

  const rule = { x: padding, y: cursorY + Math.round(height * 0.006), width: width - padding * 2, color: tones.accent };
  const contentTop = rule.y + Math.round(height * 0.022);
  const footerY = height - padding;
  const contentBottom = footerY - footerSize * 2;

  const rows: RowLayout[] = [];
  const gap = Math.max(4, Math.round(width * 0.014));
  const count = sessions.length;

  if (count > 0) {
    const available = Math.max(1, contentBottom - contentTop);
    const idealRow = Math.round(width * 0.3);
    const needed = count * idealRow + (count - 1) * gap;
    const scale = Math.min(1, available / needed);
    const minRow = Math.round(width * 0.16);

    let rowHeight = Math.max(minRow, Math.floor(idealRow * scale));
    if (count * rowHeight + (count - 1) * gap > available) {
      rowHeight = Math.max(1, Math.floor((available - (count - 1) * gap) / count));
    }

    const timeSize = Math.max(10, Math.round(width * 0.03 * scale));
    const nameSize = Math.max(12, Math.round(width * 0.04 * scale));
    const metaSize = Math.max(9, Math.round(width * 0.028 * scale));
    const timeColumn = Math.round(width * 0.27);
    const gutter = Math.round(width * 0.028);
    const textX = padding + timeColumn + gutter;
    const textWidth = Math.max(40, width - textX - padding);
    const nameLineHeight = nameSize * 1.18;
    const metaLineHeight = metaSize * 1.42;

    let top = contentTop;
    for (const [index, session] of sessions.entries()) {
      const nameLines = fit(sessionTitle(session), textWidth, nameSize, 700, measure, 2);
      const metaLines: string[] = [];
      const meta = sessionMeta(session);
      if (meta) metaLines.push(...fit(meta, textWidth, metaSize, 500, measure, 1));

      const detailLines: string[] = [];
      if (options.showVenue && session.venue) {
        detailLines.push(...fit(session.venue, textWidth, metaSize, 400, measure, 1));
      }
      if (options.showLecturers && session.lecturers.length > 0) {
        const who = session.lecturers.join(", ");
        detailLines.push(...fit(who, textWidth, metaSize, 400, measure, 1));
      }

      const inner = Math.max(4, Math.round(rowHeight * 0.13));
      const contentHeight =
        nameLines.length * nameLineHeight +
        metaLines.length * metaLineHeight +
        detailLines.length * metaLineHeight;
      const textTop = top + Math.max(inner, (rowHeight - contentHeight) / 2);

      const lines: TextRun[] = [];
      let lineY = textTop;
      for (const line of nameLines) {
        lines.push({ text: line, x: textX, y: lineY + nameSize * 0.82, size: nameSize, weight: 700, color: tones.text, align: "left" });
        lineY += nameLineHeight;
      }
      for (const line of [...metaLines, ...detailLines]) {
        lines.push({ text: line, x: textX, y: lineY + metaSize * 0.78, size: metaSize, weight: 500, color: tones.muted, align: "left" });
        lineY += metaLineHeight;
      }

      const timeLabel = `${session.start} – ${session.end}`;
      const time =
        measure(timeLabel, timeSize, 600) <= timeColumn
          ? {
              text: timeLabel,
              x: padding + timeColumn,
              y: top + rowHeight / 2,
              size: timeSize,
              weight: 600,
              color: tones.accent,
              align: "right" as const,
            }
          : {
              text: session.start,
              x: padding + timeColumn,
              y: top + rowHeight / 2,
              size: timeSize,
              weight: 600,
              color: tones.accent,
              align: "right" as const,
            };

      rows.push({
        key: `${session.day}-${session.start}-${index}`,
        top,
        height: rowHeight,
        surface: {
          x: padding,
          y: top,
          width: width - padding * 2,
          height: rowHeight,
          radius: Math.round(width * 0.035),
          color: tones.surface,
        },
        bar: {
          x: padding,
          y: top + inner,
          width: Math.max(3, Math.round(width * 0.009)),
          height: Math.max(3, rowHeight - inner * 2),
          color: tones.accent,
        },
        time,
        lines,
      });

      top += rowHeight + gap;
    }
  }

  const empty: TextRun[] = [];
  if (count === 0) {
    const size = Math.round(width * 0.05);
    const y = contentTop + (contentBottom - contentTop) / 2;
    empty.push({
      text: "Tiada kelas",
      x: width / 2,
      y,
      size,
      weight: 700,
      color: tones.text,
      align: "center",
    });
  }

  const footer: TextRun[] = [
    {
      text: "UniMAP Snap",
      x: padding,
      y: footerY,
      size: footerSize,
      weight: 600,
      color: tones.muted,
      align: "left",
    },
  ];

  return { width, height, theme: options.theme, tones, header, rule, rows, footer, empty };
}

type Ctx = CanvasRenderingContext2D;

function fillRoundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
  ctx.fill();
}

function paintRun(ctx: Ctx, run: TextRun) {
  ctx.font = `${run.weight} ${run.size}px ${WALLPAPER_FONT}`;
  ctx.fillStyle = run.color;
  ctx.textAlign = run.align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(run.text, run.x, run.y);
}

/** Paints a layout produced by `layoutWallpaper` onto a canvas context. */
export function drawWallpaper(ctx: Ctx, layout: WallpaperLayout): void {
  const { width, height, tones } = layout;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width * 0.35, height);
  gradient.addColorStop(0, tones.bgTop);
  gradient.addColorStop(1, tones.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (const run of layout.header) paintRun(ctx, run);

  ctx.fillStyle = layout.rule.color;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(layout.rule.x, layout.rule.y, layout.rule.width, Math.max(2, Math.round(height * 0.002)));
  ctx.globalAlpha = 1;

  for (const row of layout.rows) {
    ctx.fillStyle = row.surface.color;
    ctx.globalAlpha = layout.theme === "dark" ? 0.55 : 0.72;
    fillRoundRect(ctx, row.surface.x, row.surface.y, row.surface.width, row.surface.height, row.surface.radius);
    ctx.globalAlpha = 1;

    ctx.fillStyle = row.bar.color;
    fillRoundRect(ctx, row.bar.x, row.bar.y, row.bar.width, row.bar.height, row.bar.width / 2);

    if (row.time) paintRun(ctx, row.time);
    for (const run of row.lines) paintRun(ctx, run);
  }

  for (const run of layout.empty) paintRun(ctx, run);
  for (const run of layout.footer) paintRun(ctx, run);

  ctx.restore();
}