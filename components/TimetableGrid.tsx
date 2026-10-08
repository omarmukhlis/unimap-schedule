"use client";

import { useState } from "react";
import type { Session } from "@/lib/types";
import {
  DAY_LABEL,
  DAY_ORDER,
  DAY_SHORT,
  GRID_SLOTS,
  TYPE_LABEL,
  courseColor,
  durationRows,
  slotIndex,
} from "@/lib/schedule";

function Block({ session, onSelect }: { session: Session; onSelect: () => void }) {
  const color = courseColor(session.courseCode);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-full w-full flex-col items-start overflow-hidden rounded-md px-1 py-0.5 text-left ring-1 ring-black/5 active:ring-2 active:ring-sky-500"
      style={{ backgroundColor: color.bg, color: color.fg }}
    >
      <span className="line-clamp-2 w-full text-[10px] leading-tight font-semibold">
        {session.courseCode ?? (session.courseName || "Tanpa kod")}
      </span>
      {durationRows(session) > 1 && (
        <span className="line-clamp-1 w-full text-[9px] leading-tight opacity-80">
          {session.courseName}
        </span>
      )}
      {session.online && <span className="text-[9px] leading-tight font-medium">ONLINE</span>}
    </button>
  );
}

export default function TimetableGrid({ sessions }: { sessions: Session[] }) {
  const [selected, setSelected] = useState<Session | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-[34rem]">
          <div
            className="grid gap-px text-center text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
            style={{ gridTemplateColumns: "3rem repeat(5, minmax(0, 1fr))" }}
          >
            <span />
            {DAY_ORDER.map((day) => (
              <span key={day} className="pb-1">
                <span className="sm:hidden">{DAY_SHORT[day]}</span>
                <span className="hidden sm:inline">{DAY_LABEL[day]}</span>
              </span>
            ))}
          </div>

          <div
            className="relative grid gap-px"
            style={{ gridTemplateColumns: "3rem repeat(5, minmax(0, 1fr))" }}
          >
            {GRID_SLOTS.map((slot, index) => (
              <span
                key={slot}
                className="pt-0.5 text-right pr-1 text-[10px] text-slate-400 tabular-nums"
                style={{ gridColumn: 1, gridRow: index + 1 }}
              >
                {slot}
              </span>
            ))}

            {/* background cells */}
            {GRID_SLOTS.map((slot, rowIndex) =>
              DAY_ORDER.map((day) => (
                <span
                  key={`${day}-${slot}`}
                  className="min-h-11 rounded-sm bg-white"
                  style={{ gridColumn: DAY_ORDER.indexOf(day) + 2, gridRow: rowIndex + 1 }}
                />
              )),
            )}

            {/* sessions */}
            {sessions.map((session, index) => {
              const dayIndex = DAY_ORDER.indexOf(session.day as (typeof DAY_ORDER)[number]);
              const row = slotIndex(session.start);
              if (dayIndex < 0 || row === null) return null;
              const color = courseColor(session.courseCode);
              const rows = durationRows(session);
              return (
                <div
                  key={`${session.day}-${session.start}-${index}`}
                  className="z-10 min-h-11"
                  style={{
                    gridColumn: dayIndex + 2,
                    gridRow: `${row + 1} / span ${rows}`,
                  }}
                >
                  <Block session={session} onSelect={() => setSelected(session)} />
                  {session.raw && (
                    <span className="sr-only" style={{ color: color.fg }}>
                      {session.raw}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: courseColor(selected.courseCode).fg }}
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold break-words">
                  {selected.courseCode ?? (selected.courseName || "Maklumat tidak lengkap")}
                </h2>
                {selected.courseName && (
                  <p className="text-sm break-words text-slate-600">{selected.courseName}</p>
                )}
              </div>
            </div>

            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-slate-500">Hari</dt>
                <dd>{DAY_LABEL[selected.day] ?? selected.day}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-slate-500">Masa</dt>
                <dd className="tabular-nums">
                  {selected.start} – {selected.end}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-slate-500">Jenis</dt>
                <dd>
                  {TYPE_LABEL[selected.type]}
                  {selected.online && (
                    <span className="ml-2 rounded-full bg-sky-100 px-1.5 py-0.5 text-[11px] text-sky-700">
                      Online
                    </span>
                  )}
                </dd>
              </div>
              {selected.venue && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-slate-500">Tempat</dt>
                  <dd className="break-words">{selected.venue}</dd>
                </div>
              )}
              {selected.lecturers.length > 0 && (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-slate-500">Pensyarah</dt>
                  <dd className="break-words">{selected.lecturers.join(", ")}</dd>
                </div>
              )}
            </dl>

            {selected.raw && (
              <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs break-words text-slate-500">
                {selected.raw}
              </p>
            )}

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}