"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/lib/types";
import { TYPE_LABEL, courseColor } from "@/lib/schedule";
import {
  WEEKDAY_LABEL,
  formatCountdown,
  formatMalaysiaDate,
  kualaLumpurNow,
  planDay,
  type Clock,
} from "@/lib/today";

interface Props {
  sessions: Session[];
}

function Row({
  session,
  badge,
  dimmed,
}: {
  session: Session;
  badge: { label: string; live: boolean } | null;
  dimmed: boolean;
}) {
  const color = courseColor(session.courseCode);
  const title = session.courseName?.trim() || session.courseCode?.trim() || "Tanpa nama";
  const meta = [session.courseCode, TYPE_LABEL[session.type], session.online ? "Online" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className={`flex gap-3 rounded-xl p-3 ${
        badge?.live ? "bg-sky-50 ring-1 ring-sky-300" : dimmed ? "bg-slate-50 opacity-45" : "bg-slate-50"
      }`}
    >
      <span className="w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color.fg }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold break-words">{title}</p>
          {badge && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                badge.live ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {badge.label}
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs tabular-nums text-sky-700">
          {session.start} – {session.end}
        </p>
        {meta && <p className="mt-0.5 text-xs break-words text-slate-500">{meta}</p>}
        {session.venue && <p className="text-xs break-words text-slate-500">{session.venue}</p>}
        {session.lecturers.length > 0 && (
          <p className="mt-0.5 text-xs break-words text-slate-400">
            {session.lecturers.join(", ")}
          </p>
        )}
      </div>
    </li>
  );
}

export default function TodayPanel({ sessions }: Props) {
  const [clock, setClock] = useState<Clock | null>(null);

  useEffect(() => {
    const update = () => setClock(kualaLumpurNow());
    update();
    const timer = window.setInterval(update, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const plan = clock ? planDay(sessions, clock) : null;
  const countdown = formatCountdown(plan?.minutesUntilChange ?? null);
  const hasClasses = (plan?.sessions.length ?? 0) > 0;

  let status: string | null = null;
  if (countdown && plan) {
    if (plan.currentIndex >= 0) status = `Berlangsung · tamat dalam ${countdown}`;
    else if (plan.nextIndex >= 0) status = `Kelas seterusnya mula dalam ${countdown}`;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold">
          Hari ini{clock?.day ? ` · ${WEEKDAY_LABEL[clock.day] ?? clock.day}` : ""}
        </h2>
        <p className="text-xs text-slate-500">{clock ? formatMalaysiaDate(new Date()) : "…"}</p>
      </div>

      {!clock || !plan ? (
        <p className="mt-3 text-sm text-slate-400">Memuatkan jadual hari ini…</p>
      ) : !hasClasses ? (
        <div className="mt-3 rounded-xl bg-slate-50 p-4 text-center">
          <p className="text-sm font-medium text-slate-700">Tiada kelas hari ini</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {clock.isTeachingDay ? "Selamat berehat!" : "Akhir minggu."}
          </p>
        </div>
      ) : (
        <>
          {status && <p className="mt-1 text-xs text-slate-500">{status}</p>}
          <ul className="mt-3 space-y-2">
            {plan.sessions.map((session, index) => (
              <Row
                key={`${session.day}-${session.start}-${index}`}
                session={session}
                dimmed={plan.statuses[index] === "past"}
                badge={
                  index === plan.currentIndex
                    ? { label: "Kini", live: true }
                    : index === plan.nextIndex
                      ? { label: "Seterusnya", live: false }
                      : null
                    }
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}