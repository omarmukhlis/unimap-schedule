"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FlatGroup } from "@/lib/data";
import SearchSelect from "./SearchSelect";

const LAST_KEY = "unimapsnap:lastGroup";

export default function GroupPicker({
  groups,
  activeGroupId,
}: {
  groups: FlatGroup[];
  activeGroupId: string | null;
}) {
  const router = useRouter();
  const [faculty, setFaculty] = useState("");
  const [program, setProgram] = useState("");
  const [group, setGroup] = useState("");
  const [last, setLast] = useState<FlatGroup | null>(null);

  // Restore the active (or last opened) choice once, after hydration.
  useEffect(() => {
    const id = activeGroupId ?? window.localStorage.getItem(LAST_KEY);
    if (!id) return;
    const found = groups.find((candidate) => candidate.id === id);
    if (!found) return;
    setLast(found);
    setFaculty(found.facultyCode);
    setProgram(`${found.facultyCode}/${found.programCode}`);
    setGroup(found.id);
  }, [groups, activeGroupId]);

  const faculties = useMemo(() => {
    const seen = new Set<string>();
    for (const item of groups) seen.add(item.facultyCode);
    return [...seen].map((code) => ({ value: code, label: code }));
  }, [groups]);

  const programs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of groups) {
      if (faculty && item.facultyCode !== faculty) continue;
      seen.set(`${item.facultyCode}/${item.programCode}`, item.programName);
    }
    return [...seen].map(([value, label]) => ({ value, label }));
  }, [groups, faculty]);

  const groupOptions = useMemo(
    () =>
      groups
        .filter((item) => !faculty || item.facultyCode === faculty)
        .filter((item) => !program || `${item.facultyCode}/${item.programCode}` === program)
        .map((item) => ({ value: item.id, label: item.label, hint: item.programCode })),
    [groups, faculty, program],
  );

  function pickGroup(id: string) {
    setGroup(id);
    window.localStorage.setItem(LAST_KEY, id);
    router.push(`/?g=${encodeURIComponent(id)}`);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h1 className="text-base font-semibold">Pilih jadual kamu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fakulti, kemudian program, kemudian kumpulan. Pilihan terakhir akan disimpan sendiri.
        </p>

        <div className="mt-4 space-y-3">
          <SearchSelect
            label="Fakulti"
            placeholder="Pilih fakulti"
            options={faculties}
            value={faculty}
            onChange={(value) => {
              setFaculty(value);
              setProgram("");
              setGroup("");
            }}
          />

          <SearchSelect
            label="Program"
            placeholder={faculty ? "Pilih program" : "Pilih fakulti dulu"}
            options={programs}
            value={program}
            disabled={!faculty}
            onChange={(value) => {
              setProgram(value);
              setGroup("");
            }}
          />

          <SearchSelect
            label="Kumpulan"
            placeholder={program ? "Pilih kumpulan" : "Pilih program dulu"}
            options={groupOptions}
            value={group}
            disabled={!program}
            onChange={pickGroup}
          />
        </div>
      </section>

      {last && !activeGroupId && (
        <Link
          href={`/?g=${encodeURIComponent(last.id)}`}
          className="block rounded-2xl border border-sky-200 bg-sky-50 p-4"
        >
          <span className="text-xs font-medium tracking-wide text-sky-700 uppercase">
            Terakhir dibuka
          </span>
          <span className="mt-1 block text-sm font-medium text-slate-900">{last.label}</span>
          <span className="mt-0.5 block text-xs text-slate-500">{last.programName}</span>
        </Link>
      )}
    </div>
  );
}