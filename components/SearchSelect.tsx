"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  label: string;
  placeholder: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Mobile-friendly searchable select: tap to open, type to filter. */
export default function SearchSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(q) ||
        (option.hint?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  const selected = options.find((option) => option.value === value);

  return (
    <div>
      <span className="mb-1 block text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-3 text-left text-sm disabled:bg-slate-100 disabled:text-slate-400"
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>
          {selected?.label ?? placeholder}
        </span>
        <span aria-hidden className="text-slate-400">
          ▾
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white sm:mx-auto sm:mt-[15vh] sm:max-w-md sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-xl">
          <div className="border-b border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                {label}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500"
              >
                Tutup
              </button>
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <ul className="flex-1 overflow-y-auto overscroll-contain p-2">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-slate-400">Takde padanan.</li>
            )}
            {filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-baseline gap-2 rounded-lg px-3 py-3 text-left text-sm hover:bg-slate-100 ${
                    option.value === value ? "bg-sky-50 font-medium text-sky-700" : ""
                  }`}
                >
                  <span>{option.label}</span>
                  {option.hint && (
                    <span className="ml-auto shrink-0 text-xs text-slate-400">{option.hint}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}