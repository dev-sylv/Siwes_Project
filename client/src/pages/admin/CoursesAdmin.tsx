import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import api, { getErrorMessage } from "../../lib/api";
import { toList } from "../../lib/helpers";
import {
  Badge,
  Card,
  EmptyState,
  Loading,
  selectClass,
} from "../../components/ui";
import {
  ErrorAlert,
  Field,
  buttonClass,
  inputClass,
} from "../../components/AuthLayout";
import SuccessAlert from "../../components/SuccessAlert";
import type { Course } from "../../types";

const LEVELS = [100, 200, 300, 400, 500];

const emptyForm = {
  code: "",
  title: "",
  units: 3,
  level: 100,
  semester: "first" as Course["semester"],
};

export default function CoursesAdmin() {
  const [filter, setFilter] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/courses", {
        params: filter ? { level: filter } : {},
      });
      setCourses(toList<Course>(res.data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm((f) => ({ ...emptyForm, level: f.level, semester: f.semester }));
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const body = { ...form, code: form.code.trim(), title: form.title.trim() };
    try {
      if (editingId) {
        await api.patch(`/courses/${editingId}`, body);
        setSuccess("Course updated.");
      } else {
        await api.post("/courses", body);
        setSuccess("Course added.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err)); // a duplicate course code returns 409
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: Course) => {
    setEditingId(c._id);
    setForm({
      code: c.code,
      title: c.title,
      units: c.units,
      level: c.level,
      semester: c.semester,
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (c: Course) => {
    if (!window.confirm(`Delete ${c.code}?`)) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/courses/${c._id}`);
      setSuccess("Course deleted.");
      if (editingId === c._id) resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
      <Card title={editingId ? "Edit course" : "Add course"}>
        <form onSubmit={handleSubmit} className="grid gap-3.5">
          <ErrorAlert message={error} />
          <SuccessAlert message={success} />

          <Field label="Course code" htmlFor="course-code">
            <input
              id="course-code"
              className={inputClass}
              placeholder="CSC 301"
              pattern="[A-Za-z]{3}\s?\d{3}"
              title="Use a code like CSC 301"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </Field>

          <Field label="Course title" htmlFor="course-title">
            <input
              id="course-title"
              className={inputClass}
              minLength={3}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Units" htmlFor="course-units">
              <input
                id="course-units"
                type="number"
                min={1}
                max={6}
                className={inputClass}
                value={form.units}
                onChange={(e) =>
                  setForm({ ...form, units: Number(e.target.value) })
                }
                required
              />
            </Field>
            <Field label="Level" htmlFor="course-level">
              <select
                id="course-level"
                className={inputClass}
                value={form.level}
                onChange={(e) =>
                  setForm({ ...form, level: Number(e.target.value) })
                }>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Semester" htmlFor="course-sem">
              <select
                id="course-sem"
                className={inputClass}
                value={form.semester}
                onChange={(e) =>
                  setForm({
                    ...form,
                    semester: e.target.value as Course["semester"],
                  })
                }>
                <option value="first">First</option>
                <option value="second">Second</option>
              </select>
            </Field>
          </div>

          <button className={buttonClass} disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Add course"}
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

      <Card
        title="Courses"
        action={
          <select
            className={selectClass}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}>
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l} level
              </option>
            ))}
          </select>
        }>
        {loading ? (
          <Loading />
        ) : courses.length === 0 ? (
          <EmptyState message="No courses yet." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {courses.map((c) => (
              <li
                key={c._id}
                className="flex min-w-0 flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {c.code} · {c.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <Badge tone="indigo">{c.level} level</Badge>
                    <span className="capitalize">
                      {c.semester} semester
                    </span>· {c.units} unit(s)
                  </p>
                </div>
                <button
                  onClick={() => startEdit(c)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
