"use client";

import { useEffect, useRef } from "react";
import type { Session } from "@/lib/types";
import {
  DEFAULT_WALLPAPER_OPTIONS,
  MAX_CANVAS_AREA,
  SAFE_BOTTOM_RATIO,
  SAFE_SIDE_RATIO,
  SAFE_TOP_RATIO,
  WALLPAPER_FONT,
  drawWallpaper,
  layoutWallpaper,
  safeArea,
  waitForFonts,
  type Measure,
  type WallpaperOptions,
} from "@/lib/wallpaper";
import { WEEKDAY_LABEL, activeDays, dateOfDay, sessionsOn } from "@/lib/today";

/** Every size the export is expected to handle. */
const TEST_SIZES = [
  { label: "1170 × 2532", width: 1170, height: 2532 },
  { label: "1290 × 2796", width: 1290, height: 2796 },
  { label: "1320 × 2868", width: 1320, height: 2868 },
  { label: "1080 × 2400", width: 1080, height: 2400 },
  { label: "1440 × 3120", width: 1440, height: 3120 },
  { label: "750 × 1334", width: 750, height: 1334 },
] as const;

const PREVIEW_WIDTH = 240;
const THUMB_WIDTH = 168;

let measureContext: CanvasRenderingContext2D | null = null;

function makeMeasure(): Measure {
  if (typeof document === "undefined") return (text, size) => text.length * size * 0.52;
  if (!measureContext) {
    measureContext = document.createElement("canvas").getContext("2d");
  }
  return (text, size, weight) => {
    if (!measureContext) return text.length * size * 0.52;
    measureContext.font = `${weight} ${size}px ${WALLPAPER_FONT}`;
    return measureContext.measureText(text).width;
  };
}

/** One full-size render plus a small thumbnail of the same pixels. */
function TestCanvas({
  size,
  sessions,
  options,
  title,
  subtitle,
  day,
  dateLabel,
}: {
  size: { label: string; width: number; height: number };
  sessions: Session[];
  options: WallpaperOptions;
  title: string;
  subtitle: string;
  day: string;
  dateLabel: string;
}) {
  const fullRef = useRef<HTMLCanvasElement | null>(null);
  const thumbRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const paint = async () => {
      await waitForFonts();
      if (cancelled) return;

      const layout = layoutWallpaper({
        sessions,
        options,
        title,
        subtitle,
        dayLabel: WEEKDAY_LABEL[day] ?? day,
        dateLabel,
        measure: makeMeasure(),
      });

      const source = document.createElement("canvas");
      source.width = layout.width;
      source.height = layout.height;
      const ctx = source.getContext("2d");
      if (!ctx) return;
      drawWallpaper(ctx, layout);

      const full = fullRef.current;
      if (full) {
        full.width = PREVIEW_WIDTH;
        full.height = Math.round((PREVIEW_WIDTH * layout.height) / layout.width);
        const fullCtx = full.getContext("2d");
        fullCtx?.drawImage(source, 0, 0, full.width, full.height);
      }

      const thumb = thumbRef.current;
      if (thumb) {
        thumb.width = THUMB_WIDTH;
        thumb.height = Math.round((THUMB_WIDTH * layout.height) / layout.width);
        const thumbCtx = thumb.getContext("2d");
        thumbCtx?.drawImage(source, 0, 0, thumb.width, thumb.height);
      }
    };

    void paint();
    return () => {
      cancelled = true;
    };
  }, [sessions, options, title, subtitle, day, dateLabel]);

  const safe = safeArea(size.width, size.height);
  const overArea = size.width * size.height > MAX_CANVAS_AREA;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tabular-nums">{size.label}</h2>
        <span className="text-xs tabular-nums text-slate-400">
          {(size.width * size.height / 1_000_000).toFixed(1)} MP
        </span>
      </div>

      {overArea && (
        <p className="mt-1 text-xs font-medium text-amber-700">
          Melebihi had kanvas, akan diturunkan secara automatik.
        </p>
      )}

      <p className="mt-1 text-xs text-slate-400">
        Zon selamat: {Math.round(safe.x)}px sisi, {safe.y}px atas, {size.height - safe.y - safe.height}px
        bawah
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-900 p-1.5 ring-1 ring-slate-300">
          <div className="relative overflow-hidden rounded-[1.2rem]">
            <canvas ref={fullRef} className="block w-full" aria-label={`Pratonton ${size.label}`} />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 bg-amber-400/40"
              style={{ height: `${SAFE_TOP_RATIO * 100}%` }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-amber-400/40"
              style={{ height: `${SAFE_BOTTOM_RATIO * 100}%` }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 left-0 bg-amber-400/40"
              style={{ width: `${SAFE_SIDE_RATIO * 100}%` }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 bg-amber-400/40"
              style={{ width: `${SAFE_SIDE_RATIO * 100}%` }}
              aria-hidden
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-300">
            <canvas ref={thumbRef} className="block w-full" aria-label={`Thumbnail ${size.label}`} />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 bg-amber-400/40"
              style={{ height: `${SAFE_TOP_RATIO * 100}%` }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-amber-400/40"
              style={{ height: `${SAFE_BOTTOM_RATIO * 100}%` }}
              aria-hidden
            />
          </div>
          <p className="max-w-[10rem] text-xs text-slate-500">
            Saiz sebenar {size.width} × {size.height}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function WallpaperTestGrid({
  sessions,
  title,
  subtitle,
}: {
  sessions: Session[];
  title: string;
  subtitle: string;
}) {
  const days = activeDays(sessions);
  const day = days[0] ?? "";
  const daySessions = sessionsOn(sessions, day || null);
  const dateLabel = day ? (dateOfDay(day) ?? "") : "";

  return (
    <div className="space-y-4">
      {days.length > 0 && (
        <p className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
          Hari diuji: <span className="font-medium">{WEEKDAY_LABEL[day] ?? day}</span> ·{" "}
          {daySessions.length} sesi
        </p>
      )}

      {TEST_SIZES.map((size) => (
        <TestCanvas
          key={size.label}
          size={size}
          sessions={daySessions}
          options={{
            ...DEFAULT_WALLPAPER_OPTIONS,
            sizeMode: "manual",
            width: size.width,
            height: size.height,
          }}
          title={title}
          subtitle={subtitle}
          day={day}
          dateLabel={dateLabel}
        />
      ))}
    </div>
  );
}