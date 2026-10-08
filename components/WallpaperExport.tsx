"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@/lib/types";
import {
  DEFAULT_WALLPAPER_OPTIONS,
  PALETTE_IDS,
  WALLPAPER_FONT,
  WALLPAPER_PALETTES,
  WALLPAPER_PRESETS,
  clampDimension,
  drawWallpaper,
  layoutWallpaper,
  type Measure,
  type WallpaperOptions,
  type WallpaperTheme,
} from "@/lib/wallpaper";
import {
  WEEKDAY_LABEL,
  activeDays,
  dateOfDay,
  sessionsOn,
} from "@/lib/today";

const OPTIONS_KEY = "unimapsnap:wallpaper";
const PREVIEW_WIDTH = 400;

interface Props {
  groupLabel: string;
  programName: string;
  sessions: Session[];
}

let measureContext: CanvasRenderingContext2D | null = null;

/** Text measurement needs a real canvas, so it is only ever built in the browser. */
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

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isPaletteId(value: unknown): value is WallpaperOptions["palette"] {
  return typeof value === "string" && (PALETTE_IDS as readonly string[]).includes(value);
}

function sanitizeOptions(value: unknown): WallpaperOptions {
  const input = (value ?? {}) as Partial<WallpaperOptions>;
  return {
    width: clampDimension(Number(input.width) || DEFAULT_WALLPAPER_OPTIONS.width),
    height: clampDimension(Number(input.height) || DEFAULT_WALLPAPER_OPTIONS.height),
    theme: input.theme === "dark" ? "dark" : "light",
    palette: isPaletteId(input.palette) ? input.palette : DEFAULT_WALLPAPER_OPTIONS.palette,
    showLecturers: input.showLecturers !== false,
    showVenue: input.showVenue !== false,
  };
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "jadual"
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-sm">{label}</span>
      <span className="relative shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="block h-6 w-10 rounded-full bg-slate-300 transition peer-checked:bg-sky-600" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export default function WallpaperExport({ groupLabel, programName, sessions }: Props) {
  const [options, setOptions] = useState<WallpaperOptions>(DEFAULT_WALLPAPER_OPTIONS);
  const [hydrated, setHydrated] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [day, setDay] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const renderedRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(OPTIONS_KEY);
      if (stored) setOptions(sanitizeOptions(JSON.parse(stored)));
    } catch {
      /* malformed or unavailable storage: fall back to defaults */
    }
    setHydrated(true);

    if (typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
      try {
        const probe = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "probe.png", {
          type: "image/png",
        });
        setCanShareFiles(navigator.canShare({ files: [probe] }));
      } catch {
        setCanShareFiles(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
    } catch {
      /* private mode or quota: options simply do not persist */
    }
  }, [options, hydrated]);

  const days = useMemo(() => activeDays(sessions), [sessions]);

  const activeDay = day && days.includes(day) ? day : (days[0] ?? "");
  const daySessions = useMemo(
    () => sessionsOn(sessions, activeDay || null),
    [sessions, activeDay],
  );

  const update = useCallback((patch: Partial<WallpaperOptions>) => {
    setOptions((previous) => ({ ...previous, ...patch }));
    setNotice(null);
  }, []);

  // Repaint the preview whenever anything that affects the image changes.
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || typeof document === "undefined") return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const layout = layoutWallpaper({
      sessions: daySessions,
      options,
      title: groupLabel,
      subtitle: programName,
      dayLabel: WEEKDAY_LABEL[activeDay] ?? activeDay,
      dateLabel: dateOfDay(activeDay) ?? "",
      measure: makeMeasure(),
    });

    canvas.width = layout.width;
    canvas.height = layout.height;
    drawWallpaper(ctx, layout);
    renderedRef.current = canvas;

    preview.width = PREVIEW_WIDTH;
    preview.height = Math.round((PREVIEW_WIDTH * layout.height) / layout.width);
    const previewCtx = preview.getContext("2d");
    if (!previewCtx) return;
    previewCtx.clearRect(0, 0, preview.width, preview.height);
    previewCtx.drawImage(canvas, 0, 0, preview.width, preview.height);
  }, [daySessions, options, groupLabel, programName, activeDay]);

  const handleExport = useCallback(async () => {
    const canvas = renderedRef.current;
    if (!canvas) return;
    setBusy(true);
    setNotice(null);

    // iOS Safari ignores the download attribute on blob URLs, so the tab that will
    // hold the image is opened synchronously while the click gesture is still active.
    const needsTab = isIOS() && !canShareFiles;
    const tab = needsTab ? window.open("", "_blank") : null;

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("canvas returned no data");

      const filename = `jadual-${slug(groupLabel)}-${slug(WEEKDAY_LABEL[activeDay] ?? activeDay)}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (canShareFiles && navigator.canShare({ files: [file] })) {
        tab?.close();
        await navigator.share({ files: [file], title: "Jadual UniMAP" });
        setNotice("Kongsi siap.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const release = () => window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

      if (tab) {
        tab.location.href = url;
        release();
        setNotice("Dalam tab baharu, tekan lama gambar untuk menyimpan.");
        return;
      }

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      release();
      setNotice("Wallpaper disimpan.");
    } catch (error) {
      tab?.close();
      const name = error instanceof Error ? error.name : "";
      if (name === "AbortError") {
        setNotice(null);
        return;
      }
      setNotice("Gagal menjana imej. Cuba saiz lain.");
    } finally {
      setBusy(false);
    }
  }, [canShareFiles, groupLabel, activeDay]);

  const ratio = `${options.width} × ${options.height}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold">Wallpaper jadual</h2>
      <p className="mt-1 text-sm text-slate-500">
        Jana sendiri dalam pelayar. Ruang atas dikosongkan untuk jam skrin kunci.
      </p>

      {days.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
          Kumpulan ini tiada kelas, jadi tiada wallpaper untuk dijana.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {days.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDay(item)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  item === activeDay
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {WEEKDAY_LABEL[item] ?? item}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-4">
            <canvas
              ref={previewRef}
              className="w-full max-w-[13rem] shrink-0 rounded-xl shadow-sm"
              aria-label="Pratonton wallpaper"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <Toggle
                label="Tunjuk pensyarah"
                checked={options.showLecturers}
                onChange={(value) => update({ showLecturers: value })}
              />
              <Toggle
                label="Tunjuk tempat"
                checked={options.showVenue}
                onChange={(value) => update({ showVenue: value })}
              />

              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Tema</p>
                <div className="mt-1 flex gap-1">
                  {(["light", "dark"] as WallpaperTheme[]).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => update({ theme })}
                      className={`flex-1 rounded-lg px-2 py-1 text-xs font-medium capitalize ${
                        options.theme === theme
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-600 ring-1 ring-slate-200"
                      }`}
                    >
                      {theme === "light" ? "Cerah" : "Gelap"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Warna</p>
                <div className="mt-1.5 flex gap-1.5">
                  {WALLPAPER_PALETTES.map((palette) => {
                    const tones = options.theme === "dark" ? palette.dark : palette.light;
                    const active = options.palette === palette.id;
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        title={palette.label}
                        aria-label={palette.label}
                        onClick={() => update({ palette: palette.id })}
                        className={`h-7 w-7 rounded-full ring-2 ${
                          active ? "ring-sky-600" : "ring-slate-200"
                        }`}
                        style={{ backgroundColor: tones.accent }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs text-slate-500">Saiz</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {WALLPAPER_PRESETS.map((preset) => {
                  const active = options.width === preset.width && options.height === preset.height;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => update({ width: preset.width, height: preset.height })}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                        active
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <label className="flex-1">
                <span className="text-xs text-slate-500">Lebar (px)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={480}
                  max={4000}
                  value={options.width}
                  onChange={(event) => update({ width: clampDimension(Number(event.target.value)) })}
                  className="mt-1 w-full rounded-lg bg-slate-50 px-2 py-1.5 text-sm tabular-nums"
                />
              </label>
              <label className="flex-1">
                <span className="text-xs text-slate-500">Tinggi (px)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={480}
                  max={4000}
                  value={options.height}
                  onChange={(event) => update({ height: clampDimension(Number(event.target.value)) })}
                  className="mt-1 w-full rounded-lg bg-slate-50 px-2 py-1.5 text-sm tabular-nums"
                />
              </label>
              <p className="pb-2 text-xs tabular-nums text-slate-400">{ratio}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Menjana…" : "Muat turun wallpaper"}
          </button>

          {notice && <p className="mt-2 text-xs text-slate-500">{notice}</p>}
          {!canShareFiles && (
            <p className="mt-2 text-xs text-slate-400">
              Pelayar ini tidak sokong perkongsian fail, jadi imej akan dibuka atau disimpan terus.
            </p>
          )}
        </>
      )}
    </section>
  );
}