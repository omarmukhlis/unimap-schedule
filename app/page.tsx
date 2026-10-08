import Link from "next/link";
import GroupPicker from "@/components/GroupPicker";
import TodayPanel from "@/components/TodayPanel";
import WallpaperExport from "@/components/WallpaperExport";
import { findGroup, getFlatGroups, getTimetable } from "@/lib/data";
import { formatGeneratedAt } from "@/lib/schedule";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.g) ? params.g[0] : params.g;
  const found = requested ? findGroup(requested) : null;

  const timetable = getTimetable();
  const groups = getFlatGroups();

  return (
    <div className="space-y-4">
      <GroupPicker groups={groups} activeGroupId={found?.id ?? null} />

      {found && (
        <>
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 className="text-sm font-semibold break-words">{found.label}</h2>
            <span className="shrink-0 text-xs text-slate-500">{found.facultyCode}</span>
          </div>

          <TodayPanel sessions={found.group.sessions} />

          <WallpaperExport
            groupLabel={found.label}
            programName={found.programName}
            sessions={found.group.sessions}
          />

          <Link
            href={`/jadual/${found.id}`}
            className="block rounded-2xl border border-slate-200 bg-white p-3.5 text-center text-sm font-medium text-sky-700"
          >
            Lihat jadual penuh
          </Link>
        </>
      )}

      <p className="px-1 text-xs text-slate-400">
        {groups.length} kumpulan · Dijana pada {formatGeneratedAt(timetable.generatedAt)}
      </p>
    </div>
  );
}