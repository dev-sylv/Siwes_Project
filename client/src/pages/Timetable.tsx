import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApiList } from "../lib/useApiList";
import { courseInfo, formatTime } from "../lib/helpers";
import {
  Card,
  EmptyState,
  Loading,
  PageHeader,
  selectClass,
} from "../components/ui";
import { ErrorAlert } from "../components/AuthLayout";
import type { Day, TimetableEntry } from "../types";

const DAYS: Day[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function Timetable() {
  const { user } = useAuth();
  const [level, setLevel] = useState(user?.level ?? 100);
  const [semester, setSemester] = useState<"first" | "second">("first");
  const { data, loading, error } = useApiList<TimetableEntry>(
    `/timetable?level=${level}&semester=${semester}`,
  );

  const todayName = new Date().toLocaleDateString("en-GB", { weekday: "long" });

  const filters = (
    <div className="flex gap-2">
      <select
        className={selectClass}
        value={level}
        onChange={(e) => setLevel(Number(e.target.value))}>
        {[100, 200, 300, 400, 500].map((l) => (
          <option key={l} value={l}>
            {l} Level
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={semester}
        onChange={(e) => setSemester(e.target.value as "first" | "second")}>
        <option value="first">First semester</option>
        <option value="second">Second semester</option>
      </select>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle={`${level} Level · ${semester === "first" ? "First" : "Second"} semester`}
        action={filters}
      />

      {loading ? (
        <Loading text="Loading timetable..." />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : data.length === 0 ? (
        <Card>
          <EmptyState message="No classes have been added for this level and semester yet." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((day) => {
            const entries = data.filter((e) => e.day === day);
            const isToday = day === todayName;
            return (
              <section
                key={day}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${isToday ? "border-indigo-300 ring-4 ring-indigo-50" : "border-slate-200"}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">{day}</h2>
                  {isToday && (
                    <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
                      Today
                    </span>
                  )}
                </div>
                {entries.length === 0 ? (
                  <p className="text-sm text-slate-400">No classes</p>
                ) : (
                  <ul className="grid gap-2.5">
                    {entries.map((e) => {
                      const c = courseInfo(e.course);
                      return (
                        <li key={e._id} className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-medium text-indigo-700">
                            {formatTime(e.startTime)} – {formatTime(e.endTime)}
                          </p>
                          <p className="mt-0.5 font-semibold text-slate-900">
                            {c.code}
                          </p>
                          <p className="text-sm text-slate-500">{c.title}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            📍 {e.venue}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
