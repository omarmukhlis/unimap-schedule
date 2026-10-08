import WallpaperTestGrid from "@/components/WallpaperTestGrid";
import { getFlatGroups, getTimetable } from "@/lib/data";

/**
 * Renders the wallpaper at every size the export has to cope with, so wrapping
 * and the reserved bands can be eyeballed side by side. Picks the group with
 * the most sessions, since that is the layout most likely to overflow.
 */
export default function WallpaperTestPage() {
  const groups = getFlatGroups();
  const timetable = getTimetable();

  const sessionsByGroup = groups.map((group) => {
    for (const faculty of timetable.faculties) {
      for (const program of faculty.programs) {
        const match = program.groups.find((candidate) => candidate.id === group.id);
        if (match) return match.sessions;
      }
    }
    return [];
  });

  let best = 0;
  for (const [index, sessions] of sessionsByGroup.entries()) {
    if (sessions.length > sessionsByGroup[best].length) best = index;
  }

  const group = groups[best];
  const sessions = sessionsByGroup[best];

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-4">
        <h1 className="text-base font-semibold">Ujian saiz wallpaper</h1>
        <p className="mt-1 text-sm text-slate-500">
          Setiap saiz dilukis pada kanvas sebenar, denganzon yang dikosongkan untuk jam, widget dan
          ikon skrin kunci disorot.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Kumpulan: <span className="font-medium text-slate-700">{group?.label}</span> ·{" "}
          {sessions.length} sesi
        </p>
      </header>

      <WallpaperTestGrid sessions={sessions} title={group?.label ?? ""} subtitle={group?.programName ?? ""} />
    </div>
  );
}