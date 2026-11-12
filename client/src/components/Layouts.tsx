import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

const links: { to: string; label: string; roles?: Role[] }[] = [
  { to: "/", label: "Dashboard" },
  { to: "/timetable", label: "Timetable" },
  { to: "/directory", label: "Directory" },
  { to: "/announcements", label: "Announcements" },
  { to: "/guide", label: "Freshers' Guide" },
  {
    to: "/manage/timetable",
    label: "Manage Timetable",
    roles: ["course_rep", "admin"],
  },
  {
    to: "/announcements/new",
    label: "Post Announcement",
    roles: ["president", "admin"],
  },
  { to: "/admin", label: "Admin", roles: ["admin"] },
];

const roleLabel: Record<Role, string> = {
  student: "Student",
  course_rep: "Course Rep",
  president: "President",
  admin: "Admin",
};

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const visible = links.filter(
    (l) => !l.roles || (user && l.roles.includes(user.role)),
  );

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              CS
            </div>
            <span className="hidden font-semibold text-slate-900 sm:block">
              Student Guide
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden flex-1 flex-wrap gap-1 lg:flex">
            {visible.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-900">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500">
                {user && roleLabel[user.role]} · {user?.level} Level
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Log out
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="ml-auto rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 lg:hidden">
            {open ? "Close" : "Menu"}
          </button>
        </div>

        {/* Mobile nav */}
        {open && (
          <div className="border-t border-slate-200 px-4 py-3 lg:hidden">
            <p className="mb-2 text-sm text-slate-500">
              {user?.name} · {user && roleLabel[user.role]}
            </p>
            <nav className="grid gap-1">
              {visible.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={linkClass}
                  onClick={() => setOpen(false)}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={logout}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              Log out
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
