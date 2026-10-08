import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TimetableGrid from "@/components/TimetableGrid";
import { findGroup, getFlatGroups, getTimetable } from "@/lib/data";
import { formatGeneratedAt } from "@/lib/schedule";

export function generateStaticParams() {
  return getFlatGroups().map((group) => ({ groupId: group.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}): Promise<Metadata> {
  const { groupId } = await params;
  const found = findGroup(groupId);
  if (!found) return { title: "Kumpulan tidak dijumpai" };
  return { title: `${found.label} · UniMAP Snap` };
}

export default async function JadualPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const found = findGroup(groupId);
  if (!found) notFound();

  const timetable = getTimetable();
  const sessions = found.group.sessions;

  return (
    <div className="space-y-4">
      <Link href="/" className="inline-block text-sm text-sky-700">
        ← Ganti kumpulan
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          {found.facultyCode} · {found.programCode}
        </p>
        <h1 className="mt-0.5 text-lg font-semibold break-words">{found.label}</h1>
        <p className="text-sm break-words text-slate-500">{found.programName}</p>
        <p className="mt-2 text-xs text-slate-400">
          {sessions.length} sesi · Dijana pada {formatGeneratedAt(timetable.generatedAt)}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-2">
        <TimetableGrid sessions={sessions} />
      </section>

      <section className="space-y-1 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        <p>Tidak rasmi. Rujuk jadual rasmi UniMAP untuk pengesahan akhir.</p>
        <a
          href={timetable.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="block break-all underline decoration-dotted"
        >
          {timetable.sourceUrl}
        </a>
      </section>
    </div>
  );
}