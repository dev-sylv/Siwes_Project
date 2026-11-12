import { useState } from "react";
import type { ReactNode, InputHTMLAttributes } from "react";

/* Shared styles for auth forms */
export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[15px] text-slate-900 " +
  "placeholder:text-slate-400 outline-none transition " +
  "focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

export const buttonClass =
  "mt-1 w-full rounded-xl bg-indigo-600 py-2.5 text-[15px] font-semibold text-white transition " +
  "hover:bg-indigo-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70";

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      {children}
    </div>
  );
}

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`${inputClass} pr-16`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1.5 text-[13px] font-semibold text-indigo-600 hover:bg-indigo-50">
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-600">
      {message}
    </div>
  );
}

const features = [
  "Class timetables for every level",
  "HOD, excos and course lecturers",
  "Department announcements",
  "Freshers' guide and CGPA calculator",
];

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-slate-50 md:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (hidden on phones) */}
      <aside className="relative hidden flex-col justify-center gap-5 overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-600 px-16 py-14 text-white md:flex">
        <div className="pointer-events-none absolute -right-40 -top-36 h-[420px] w-[420px] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-[300px] w-[300px] rounded-full bg-white/5" />

        <div className="relative grid h-13 w-13 place-items-center rounded-2xl border border-white/25 bg-white/15 text-lg font-bold tracking-wide">
          CS
        </div>
        <h1 className="relative text-4xl font-bold leading-tight">
          Student Guide Portal
        </h1>
        <p className="relative max-w-md leading-relaxed text-white/80">
          Department of Computer Science, Nnamdi Azikiwe University, Awka.
        </p>
        <ul className="relative mt-3 grid gap-3.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-white/90">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20 text-xs font-bold">
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
        <span className="relative mt-7 text-sm text-white/60">
          Everything you need, in one place.
        </span>
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-[0_10px_40px_rgba(15,23,42,0.08)] sm:px-8">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 font-bold text-white md:hidden">
            CS
          </div>
          <h2 className="mb-1 text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mb-5 text-[15px] leading-relaxed text-slate-500">
            {subtitle}
          </p>
          {children}
        </div>
      </main>
    </div>
  );
}
