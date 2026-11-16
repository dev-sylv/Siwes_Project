import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import api, { getErrorMessage } from "../lib/api";
import { courseInfo, formatTime, toList } from "../lib/helpers";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  EmptyState,
  Loading,
  PageHeader,
  selectClass,
} from "../components/ui";
import {
  ErrorAlert,
  Field,
  buttonClass,
  inputClass,
} from "../components/AuthLayout";
import SuccessAlert from "../components/SuccessAlert";
import type { Course, Day, TimetableEntry } from "../types";

const DAYS: Day[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const LEVELS = [100, 200, 300, 400, 500];

const emptyForm = {
  course: "",
  day: "Monday" as Day,
  startTime: "08:00",
  endTime: "10:00",
  venue: "",
};

export default function ManageTimetable() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // a course rep can only manage their own level; an admin can pick any level
  const [level, setLevel] = useState<number>(user?.level ?? 100);
  const [courses, setCourses] = useState<Course[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        api.get("/courses", { params: { level } }),
        api.get("/timetable", { params: { level } }),
      ]);
      setCourses(toList<Course>(c.data));
      setEntries(toList<TimetableEntry>(t.data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/timetable/${editingId}`, {
          day: form.day,
          startTime: form.startTime,
          endTime: form.endTime,
          venue: form.venue,
        });
        setSuccess("Class updated.");
      } else {
        await api.post("/timetable", form);
        setSuccess("Class added.");
      }
      resetForm();
      await load();
    } catch (err) {
      // 409 (clash), 403 (wrong level) and 400 (validation) messages come from the API
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (x: TimetableEntry) => {
    setEditingId(x._id);
    setForm({
      course: typeof x.course === "string" ? x.course : x.course._id,
      day: x.day,
      startTime: x.startTime,
      endTime: x.endTime,
      venue: x.venue,
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (x: TimetableEntry) => {
    const info = courseInfo(x.course);
    if (!window.confirm(`Remove ${info.code} on ${x.day}?`)) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/timetable/${x._id}`);
      setSuccess("Class removed.");
      if (editingId === x._id) resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const changeLevel = (l: number) => {
    setLevel(l);
    resetForm();
    setError("");
    setSuccess("");
  };

  return (
    <>
      <PageHeader
        title="Manage timetable"
        subtitle={
          isAdmin
            ? "Add, edit or remove classes for any level."
            : `You can manage the ${user?.level} level timetable.`
        }
        action={
          isAdmin ? (
            <select
              className={selectClass}
              value={level}
              onChange={(e) => changeLevel(Number(e.target.value))}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l} level
                </option>
              ))}
            </select>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
        <Card title={editingId ? "Edit class" : "Add a class"}>
          <form onSubmit={handleSubmit} className="grid gap-3.5">
            <ErrorAlert message={error} />
            <SuccessAlert message={success} />

            <Field label="Course" htmlFor="tt-course">
              <select
                id="tt-course"
                className={inputClass}
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                disabled={Boolean(editingId)}
                required>
                <option value="">
                  {courses.length
                    ? "Select a course"
                    : `No ${level} level courses yet`}
                </option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} · {c.title} ({c.semester})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Day" htmlFor="tt-day">
              <select
                id="tt-day"
                className={inputClass}
                value={form.day}
                onChange={(e) =>
                  setForm({ ...form, day: e.target.value as Day })
                }>
                {DAYS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts" htmlFor="tt-start">
                <input
                  id="tt-start"
                  type="time"
                  className={inputClass}
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Ends" htmlFor="tt-end">
                <input
                  id="tt-end"
                  type="time"
                  className={inputClass}
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                  required
                />
              </Field>
            </div>

            <Field label="Venue" htmlFor="tt-venue">
              <input
                id="tt-venue"
                className={inputClass}
                placeholder="e.g. LT 2"
                minLength={2}
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                required
              />
            </Field>

            <button
              className={buttonClass}
              disabled={saving || courses.length === 0}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add class"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium text-slate-500 hover:underline">
                Cancel editing
              </button>
            )}
          </form>
        </Card>

        <Card title={`${level} level classes`}>
          {loading ? (
            <Loading />
          ) : entries.length === 0 ? (
            <EmptyState message="Nothing on the timetable yet. Add the first class." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {entries.map((x) => {
                const info = courseInfo(x.course);
                return (
                  <li
                    key={x._id}
                    className="flex min-w-0 flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {info.code} {info.title && `· ${info.title}`}
                      </p>
                      <p className="text-sm text-slate-500">
                        {x.day} · {formatTime(x.startTime)} to{" "}
                        {formatTime(x.endTime)} · {x.venue}
                      </p>
                    </div>
                    <button
                      onClick={() => startEdit(x)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(x)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
