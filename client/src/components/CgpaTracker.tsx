import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Badge, Card, EmptyState, selectClass } from "./ui";
import { inputClass } from "./AuthLayout";

/* Nigerian 5-point scale */
const GRADES: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
const LEVELS = [100, 200, 300, 400, 500];

interface CourseRow {
  id: string;
  name: string;
  units: string;
  grade: string; // "" until the student picks a grade
}

interface SemesterRecord {
  id: string;
  level: number;
  semester: "first" | "second";
  courses: CourseRow[];
}

interface Store {
  earlierCgpa: string;
  earlierUnits: string;
  semesters: SemesterRecord[];
}

const emptyStore: Store = { earlierCgpa: "", earlierUnits: "", semesters: [] };
const uid = () => Math.random().toString(36).slice(2, 9);
const newCourse = (): CourseRow => ({
  id: uid(),
  name: "",
  units: "3",
  grade: "",
});

/* ---------- storage (never trust it: it can be empty, blocked or edited) ---------- */
function sanitize(raw: unknown): Store {
  const data = (raw ?? {}) as Partial<Store>;
  const semesters = Array.isArray(data.semesters) ? data.semesters : [];
  return {
    earlierCgpa: typeof data.earlierCgpa === "string" ? data.earlierCgpa : "",
    earlierUnits:
      typeof data.earlierUnits === "string" ? data.earlierUnits : "",
    semesters: semesters
      .filter(
        (s) =>
          s &&
          LEVELS.includes(Number(s.level)) &&
          (s.semester === "first" || s.semester === "second"),
      )
      .map((s) => ({
        id: String(s.id ?? uid()),
        level: Number(s.level),
        semester: s.semester,
        courses: (Array.isArray(s.courses) ? s.courses : []).map((c) => ({
          id: String(c?.id ?? uid()),
          name: String(c?.name ?? ""),
          units: String(c?.units ?? "3"),
          grade: c?.grade && c.grade in GRADES ? c.grade : "",
        })),
      })),
  };
}

function loadStore(key: string): Store {
  try {
    const text = localStorage.getItem(key);
    return text ? sanitize(JSON.parse(text)) : emptyStore;
  } catch {
    return emptyStore;
  }
}

/* ---------- maths ---------- */
const counted = (c: CourseRow) => Number(c.units) > 0 && c.grade in GRADES;

function semesterStats(s: SemesterRecord) {
  const rows = s.courses.filter(counted);
  const units = rows.reduce((t, c) => t + Number(c.units), 0);
  const points = rows.reduce(
    (t, c) => t + Number(c.units) * GRADES[c.grade],
    0,
  );
  return { units, points, gpa: units > 0 ? points / units : null };
}

function degreeClass(cgpa: number): string {
  if (cgpa >= 4.5) return "First Class";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  if (cgpa >= 1.5) return "Third Class";
  if (cgpa >= 1.0) return "Pass";
  return "Below pass";
}

const fmt = (n: number | null) => (n === null ? "-" : n.toFixed(2));
const semLabel = (s: "first" | "second") =>
  s === "first" ? "First semester" : "Second semester";

export default function CgpaTracker() {
  const { user } = useAuth();
  const key = `cs_guide_gpa_${user?._id ?? "guest"}`;

  const [store, setStore] = useState<Store>(() => loadStore(key));
  const [newLevel, setNewLevel] = useState(user?.level ?? 100);
  const [newSemester, setNewSemester] = useState<"first" | "second">("first");
  const [target, setTarget] = useState("");
  const [remaining, setRemaining] = useState("");
  const [message, setMessage] = useState("");

  // save automatically whenever anything changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(store));
    } catch {
      /* storage blocked or full: the tracker still works, it just won't be remembered */
    }
  }, [key, store]);

  const sorted = [...store.semesters].sort(
    (a, b) => a.level - b.level || (a.semester === "first" ? -1 : 1),
  );

  /* ---------- overall numbers ---------- */
  const eu = Number(store.earlierUnits);
  const ec = Number(store.earlierCgpa);
  const earlierOutOfRange =
    store.earlierCgpa !== "" && (Number.isNaN(ec) || ec < 0 || ec > 5);
  const earlierValid = eu > 0 && store.earlierCgpa !== "" && !earlierOutOfRange;

  const stats = sorted.map(semesterStats);
  const semUnits = stats.reduce((t, s) => t + s.units, 0);
  const semPoints = stats.reduce((t, s) => t + s.points, 0);
  const totalUnits = semUnits + (earlierValid ? eu : 0);
  const totalPoints = semPoints + (earlierValid ? ec * eu : 0);
  const cgpa = totalUnits > 0 ? totalPoints / totalUnits : null;

  // per-level summary
  const byLevel = LEVELS.map((level) => {
    const list = sorted.filter((s) => s.level === level).map(semesterStats);
    const units = list.reduce((t, s) => t + s.units, 0);
    const points = list.reduce((t, s) => t + s.points, 0);
    return { level, units, gpa: units > 0 ? points / units : null };
  }).filter((l) => l.units > 0);

  // what average GPA is needed on the remaining units to reach a target CGPA?
  const t = Number(target);
  const r = Number(remaining);
  let targetMessage = "";
  if (target !== "" && remaining !== "" && t >= 0 && t <= 5 && r > 0) {
    const needed = (t * (totalUnits + r) - totalPoints) / r;
    if (needed > 5)
      targetMessage = `A CGPA of ${t.toFixed(2)} is not reachable with ${r} more units.`;
    else if (needed <= 0)
      targetMessage = `You have already secured ${t.toFixed(2)} even with the lowest grades.`;
    else
      targetMessage = `You need an average GPA of ${needed.toFixed(2)} over your next ${r} units.`;
  }

  /* ---------- actions ---------- */
  const patchSemester = (
    id: string,
    fn: (s: SemesterRecord) => SemesterRecord,
  ) =>
    setStore((st) => ({
      ...st,
      semesters: st.semesters.map((s) => (s.id === id ? fn(s) : s)),
    }));

  const addSemester = () => {
    setMessage("");
    if (
      store.semesters.some(
        (s) => s.level === newLevel && s.semester === newSemester,
      )
    ) {
      setMessage(
        `${newLevel} level ${semLabel(newSemester).toLowerCase()} is already added.`,
      );
      return;
    }
    setStore((st) => ({
      ...st,
      semesters: [
        ...st.semesters,
        {
          id: uid(),
          level: newLevel,
          semester: newSemester,
          courses: [newCourse(), newCourse(), newCourse()],
        },
      ],
    }));
  };

  const removeSemester = (s: SemesterRecord) => {
    if (
      !window.confirm(
        `Remove ${s.level} level ${semLabel(s.semester).toLowerCase()}?`,
      )
    )
      return;
    setStore((st) => ({
      ...st,
      semesters: st.semesters.filter((x) => x.id !== s.id),
    }));
  };

  const clearAll = () => {
    if (
      !window.confirm(
        "Delete all your saved results on this device? This cannot be undone.",
      )
    )
      return;
    setStore(emptyStore);
    setMessage("");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: 1, ...store }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-cgpa-records.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || !Array.isArray(parsed.semesters))
          throw new Error("bad file");
        setStore(sanitize(parsed));
        setMessage("Records imported.");
      } catch {
        setMessage("That file is not a valid records file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card title="CGPA tracker">
      <p className="mb-4 text-sm text-slate-500">
        Add each semester you have results for and your CGPA is worked out
        across all of them. Your records save automatically{" "}
        <strong>on this device only</strong> and are not sent to the portal's
        server. Use Export to keep a backup or move them to another device.
        Scale: A = 5, B = 4, C = 3, D = 2, E = 1, F = 0.
      </p>

      {/* overall result */}
      <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-indigo-50 p-4 text-center sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-700">
            Overall CGPA
          </p>
          <p className="text-3xl font-bold text-indigo-900">{fmt(cgpa)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-700">
            Total units
          </p>
          <p className="text-3xl font-bold text-indigo-900">{totalUnits}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs uppercase tracking-wide text-indigo-700">
            Class of degree
          </p>
          <p className="text-lg font-bold text-indigo-900">
            {cgpa === null ? "-" : degreeClass(cgpa)}
          </p>
        </div>
      </div>

      {byLevel.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {byLevel.map((l) => (
            <Badge key={l.level} tone="indigo">
              {l.level}L: {fmt(l.gpa)} ({l.units} units)
            </Badge>
          ))}
        </div>
      )}

      {/* earlier record */}
      <details className="mb-5 rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-800">
          Already know your CGPA from earlier levels? (optional)
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-800">
            CGPA so far
            <input
              className={inputClass}
              type="number"
              min={0}
              max={5}
              step="0.01"
              placeholder="e.g. 4.25"
              value={store.earlierCgpa}
              onChange={(e) =>
                setStore({ ...store, earlierCgpa: e.target.value })
              }
            />
            {earlierOutOfRange && (
              <span className="text-xs font-normal text-red-600">
                Enter a value between 0 and 5, for example 4.25.
              </span>
            )}
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-800">
            Total units so far
            <input
              className={inputClass}
              type="number"
              min={0}
              placeholder="e.g. 79"
              value={store.earlierUnits}
              onChange={(e) =>
                setStore({ ...store, earlierUnits: e.target.value })
              }
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Don't also add those same semesters below, or they will be counted
          twice.
        </p>
      </details>

      {/* add a semester */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className={selectClass}
          value={newLevel}
          onChange={(e) => setNewLevel(Number(e.target.value))}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l} level
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={newSemester}
          onChange={(e) =>
            setNewSemester(e.target.value as "first" | "second")
          }>
          <option value="first">First semester</option>
          <option value="second">Second semester</option>
        </select>
        <button
          type="button"
          onClick={addSemester}
          className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          + Add semester
        </button>
      </div>
      {message && <p className="mb-3 text-sm text-slate-600">{message}</p>}

      {/* semesters */}
      {sorted.length === 0 ? (
        <EmptyState message="No semesters yet. Pick a level and semester above, then add it." />
      ) : (
        <div className="grid gap-3">
          {sorted.map((s, i) => (
            <details
              key={s.id}
              open
              className="rounded-xl border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                {s.level} level · {semLabel(s.semester)}
                <span className="ml-2 font-normal text-slate-500">
                  GPA {fmt(stats[i].gpa)} · {stats[i].units} units
                </span>
              </summary>

              <div className="mt-3 grid gap-2">
                {s.courses.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-[1fr_60px_84px_auto] items-center gap-2">
                    <input
                      className={inputClass}
                      placeholder="Course (optional)"
                      aria-label="Course name"
                      value={c.name}
                      onChange={(e) =>
                        patchSemester(s.id, (x) => ({
                          ...x,
                          courses: x.courses.map((r2) =>
                            r2.id === c.id
                              ? { ...r2, name: e.target.value }
                              : r2,
                          ),
                        }))
                      }
                    />
                    <input
                      className={inputClass}
                      type="number"
                      min={1}
                      max={6}
                      aria-label="Units"
                      value={c.units}
                      onChange={(e) =>
                        patchSemester(s.id, (x) => ({
                          ...x,
                          courses: x.courses.map((r2) =>
                            r2.id === c.id
                              ? { ...r2, units: e.target.value }
                              : r2,
                          ),
                        }))
                      }
                    />
                    <select
                      className={selectClass}
                      aria-label="Grade"
                      value={c.grade}
                      onChange={(e) =>
                        patchSemester(s.id, (x) => ({
                          ...x,
                          courses: x.courses.map((r2) =>
                            r2.id === c.id
                              ? { ...r2, grade: e.target.value }
                              : r2,
                          ),
                        }))
                      }>
                      <option value="">Grade</option>
                      {Object.keys(GRADES).map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label="Remove course"
                      onClick={() =>
                        patchSemester(s.id, (x) => ({
                          ...x,
                          courses: x.courses.filter((r2) => r2.id !== c.id),
                        }))
                      }
                      className="rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:text-red-600">
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    patchSemester(s.id, (x) => ({
                      ...x,
                      courses: [...x.courses, newCourse()],
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  + Add course
                </button>
                <button
                  type="button"
                  onClick={() => removeSemester(s)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                  Remove semester
                </button>
              </div>
            </details>
          ))}
        </div>
      )}

      {/* target */}
      <div className="mt-6 rounded-xl border border-slate-200 p-3">
        <p className="mb-2 text-sm font-semibold text-slate-900">
          What do I need to reach a target CGPA?
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className={inputClass}
            type="number"
            min={0}
            max={5}
            step="0.01"
            placeholder="Target CGPA, e.g. 4.50"
            aria-label="Target CGPA"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <input
            className={inputClass}
            type="number"
            min={1}
            placeholder="Units still to take"
            aria-label="Units still to take"
            value={remaining}
            onChange={(e) => setRemaining(e.target.value)}
          />
        </div>
        {targetMessage && (
          <p className="mt-2 text-sm font-medium text-indigo-800">
            {targetMessage}
          </p>
        )}
      </div>

      {/* data controls */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500">Saved on this device.</span>
        <button
          type="button"
          onClick={exportData}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Export
        </button>
        <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Import
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={importData}
          />
        </label>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
          Delete all
        </button>
      </div>
    </Card>
  );
}
