"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@/lib/types";
import {
  DEFAULT_WALLPAPER_OPTIONS,
  MAX_CANVAS_AREA,
  MAX_DIMENSION,
  MIN_DIMENSION,
  PALETTE_IDS,
  SAFE_BOTTOM_RATIO,
  SAFE_SIDE_RATIO,
  SAFE_TOP_RATIO,
  WALLPAPER_FONT,
  WALLPAPER_PALETTES,
  WALLPAPER_PRESETS,
  clampCanvasSize,
  currentScreenCanvasSize,
  drawWallpaper,
  layoutWallpaper,
  waitForFonts,
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
  const sizeMode = input.sizeMode === "manual" ? "manual" : "screen";
  // In screen mode the stored numbers are only a cached snapshot of the device
  // size, so an unusable one falls back to the preset rather than the minimum.
  const size = sizeMode === "manual" ? clampCanvasSize(Number(input.width), Number(input.height)) : null;

  return {
    sizeMode,
    width: size?.width ?? DEFAULT_WALLPAPER_OPTIONS.width,
    height: size?.height ?? DEFAULT_WALLPAPER_OPTIONS.height,
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
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [screenSize, setScreenSize] = useState(() => currentScreenCanvasSize());
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const renderedRef = useRef<HTMLCanvasElement | null>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setScreenSize(currentScreenCanvasSize());
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

  // Rotating the phone or moving it to another display changes the pixel grid,
  // so screen mode has to be re-measured rather than frozen at mount.
  useEffect(() => {
    if (!hydrated || options.sizeMode !== "screen") return;
    const remeasure = () => setScreenSize(currentScreenCanvasSize());
    window.addEventListener("resize", remeasure);
    window.addEventListener("orientationchange", remeasure);
    screen.orientation?.addEventListener?.("change", remeasure);
    return () => {
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("orientationchange", remeasure);
      screen.orientation?.removeEventListener?.("change", remeasure);
    };
  }, [hydrated, options.sizeMode]);

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

  const applyScreenSize = useCallback(() => {
    const size = currentScreenCanvasSize();
    setScreenSize(size);
    setOptions((previous) => ({ ...previous, sizeMode: "screen", ...size }));
  }, []);

  const applyPresetSize = useCallback((width: number, height: number) => {
    setOptions((previous) => ({ ...previous, sizeMode: "manual", width, height }));
  }, []);

  // Repaint the preview whenever anything that affects the image changes.
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || typeof document === "undefined") return;

    let cancelled = false;

    const paint = async () => {
      // Wrapping is measured against the loaded font, so wait for it first.
      await waitForFonts();
      if (cancelled) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx || cancelled) return;

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
      setPreviewSize({ width: layout.width, height: layout.height });

      preview.width = PREVIEW_WIDTH;
      preview.height = Math.round((PREVIEW_WIDTH * layout.height) / layout.width);
      const previewCtx = preview.getContext("2d");
      if (!previewCtx) return;
      previewCtx.clearRect(0, 0, preview.width, preview.height);
      previewCtx.drawImage(canvas, 0, 0, preview.width, preview.height);
    };

    void paint();
    return () => {
      cancelled = true;
    };
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
      await waitForFonts();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob || blob.size === 0) throw new Error("canvas returned no data");

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

  const isScreenSize = options.sizeMode === "screen";
  const ratio = isScreenSize
    ? `${screenSize.width} × ${screenSize.height}`
    : `${options.width} × ${options.height}`;
  const safeBox =
    previewSize.width > 0
      ? {
          top: `${SAFE_TOP_RATIO * 100}%`,
          bottom: `${SAFE_BOTTOM_RATIO * 100}%`,
          left: `${SAFE_SIDE_RATIO * 100}%`,
          right: `${SAFE_SIDE_RATIO * 100}%`,
        }
      : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold">Wallpaper jadual</h2>
      <p className="mt-1 text-sm text-slate-500">
        Jana sendiri dalam pelayar. Ruang atas dan bawah dikosongkan untuk jam serta ikon skrin
        kunci.
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
            {/* Phone frame: the wallpaper is drawn inside it exactly as it will
                be saved, so the shaded bands line up with the real safe area. */}
            <div className="w-full max-w-[13rem] shrink-0">
              <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-900 p-1.5 shadow-sm ring-1 ring-slate-300">
                <div className="relative overflow-hidden rounded-[1.4rem]">
                  <canvas
                    ref={previewRef}
                    className="block w-full"
                    aria-label="Pratonton wallpaper"
                  />

                  {showSafeZones && safeBox && (
                    <>
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 bg-amber-400/35"
                        style={{ height: safeBox.top }}
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 bg-amber-400/35"
                        style={{ height: safeBox.bottom }}
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute inset-y-0 left-0 bg-amber-400/35"
                        style={{ width: safeBox.left }}
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute inset-y-0 right-0 bg-amber-400/35"
                        style={{ width: safeBox.right }}
                        aria-hidden
                      />
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSafeZones((value) => !value)}
                aria-pressed={showSafeZones}
                className="mt-2 w-full rounded-lg bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {showSafeZones ? "Sembunyikan zon selamat" : "Tunjuk zon selamat"}
              </button>
              <p className="mt-1 text-center text-[11px] leading-snug text-slate-400">
                {SAFE_TOP_RATIO * 100}% atas, {SAFE_BOTTOM_RATIO * 100}% bawah,{" "}
                {SAFE_SIDE_RATIO * 100}% sisi dikosongkan
              </p>
            </div>

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
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500">Saiz</p>
                <button
                  type="button"
                  onClick={
                    isScreenSize
                      ? () => applyPresetSize(screenSize.width, screenSize.height)
                      : applyScreenSize
                  }
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                    isScreenSize
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {isScreenSize ? "Skrin ini" : "Saiz tetap"}
                </button>
              </div>

              <div className="mt-1 flex flex-wrap gap-1.5">
                {WALLPAPER_PRESETS.map((preset) => {
                  const active =
                    options.sizeMode === "manual" &&
                    options.width === preset.width &&
                    options.height === preset.height;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPresetSize(preset.width, preset.height)}
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
                  min={MIN_DIMENSION}
                  max={MAX_DIMENSION}
                  value={isScreenSize ? screenSize.width : options.width}
                  onChange={(event) => {
                    const size = clampCanvasSize(Number(event.target.value), options.height);
                    applyPresetSize(size.width, size.height);
                  }}
                  className="mt-1 w-full rounded-lg bg-slate-50 px-2 py-1.5 text-sm tabular-nums disabled:opacity-60"
                  disabled={isScreenSize}
                />
              </label>
              <label className="flex-1">
                <span className="text-xs text-slate-500">Tinggi (px)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={MIN_DIMENSION}
                  max={MAX_DIMENSION}
                  value={isScreenSize ? screenSize.height : options.height}
                  onChange={(event) => {
                    const size = clampCanvasSize(options.width, Number(event.target.value));
                    applyPresetSize(size.width, size.height);
                  }}
                  className="mt-1 w-full rounded-lg bg-slate-50 px-2 py-1.5 text-sm tabular-nums disabled:opacity-60"
                  disabled={isScreenSize}
                />
              </label>
              <p className="pb-2 text-xs tabular-nums text-slate-400">{ratio}</p>
            </div>

            <p className="text-xs text-slate-400">
              {isScreenSize
                ? `Ikut skrin ini (${screenSize.width} × ${screenSize.height}). Had kanvas ${(MAX_CANVAS_AREA / 1_000_000).toFixed(0)} juta piksel.`
                : `Saiz tetap. Had kanvas ${(MAX_CANVAS_AREA / 1_000_000).toFixed(0)} juta piksel.`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Menjana…" : "Muat turun wallpaper"}
          </button>

          <p className="mt-2 text-xs text-slate-500">Paling sesuai untuk lock screen</p>

          {notice && <p className="mt-1 text-xs text-slate-500">{notice}</p>}
          {!canShareFiles && (
            <p className="mt-1 text-xs text-slate-400">
              Pelayar ini tidak sokong perkongsian fail, jadi imej akan dibuka atau disimpan terus.
            </p>
          )}
        </>
      )}
    </section>
  );
}