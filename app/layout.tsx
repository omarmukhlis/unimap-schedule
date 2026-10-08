import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniMAP Snap",
  description: "Jadual waktu pelajar UniMAP dalam satu skrin.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body className="min-h-dvh bg-slate-100 text-slate-900 antialiased">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              UniMAP <span className="text-sky-600">Snap</span>
            </Link>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
              Sem 1 2026/2027
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-4 pb-16">{children}</main>
        <footer className="mx-auto max-w-3xl space-y-1 px-4 pb-10 text-xs leading-relaxed text-slate-500">
          <p>
            Tidak rasmi. Rujuk jadual rasmi UniMAP (
            <a
              href="https://timetables2.unimap.edu.my/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted"
            >
              timetables2.unimap.edu.my
            </a>
            ) untuk pengesahan akhir.
          </p>
        </footer>
      </body>
    </html>
  );
}