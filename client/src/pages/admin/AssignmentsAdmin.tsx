import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import api, { getErrorMessage } from "../../lib/api";
import { toList } from "../../lib/helpers";
import { Badge, Card, EmptyState, Loading } from "../../components/ui";
import {
  ErrorAlert,
  Field,
  buttonClass,
  inputClass,
} from "../../components/AuthLayout";
import SuccessAlert from "../../components/SuccessAlert";
import type { Course, CourseAssignment, Lecturer } from "../../types";

export default function AssignmentsAdmin() {
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [course, setCourse] = useState("");
  const [lecturer, setLecturer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const [a, c, l] = await Promise.all([
        api.get("/directory/assignments"),
        api.get("/courses"),
        api.get("/directory/lecturers"),
      ]);
      setAssignments(toList<CourseAssignment>(a.data));
      setCourses(toList<Course>(c.data));
      setLecturers(toList<Lecturer>(l.data));
    } catch (err) {
      // a 404 here usually means no current session has been set yet
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await api.post("/directory/assignments", { course, lecturer });
      setSuccess("Lecturer assigned.");
      setCourse("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err)); // assigning the same pair twice returns 409
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: CourseAssignment) => {
    if (!window.confirm(`Remove ${a.lecturer.name} from ${a.course.code}?`))
      return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/directory/assignments/${a._id}`);
      setSuccess("Assignment removed.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
      <Card title="Assign a lecturer">
        <form onSubmit={handleSubmit} className="grid gap-3.5">
          <p className="text-sm text-slate-500">
            Assignments belong to the current session.
          </p>
          <ErrorAlert message={error} />
          <SuccessAlert message={success} />

          <Field label="Course" htmlFor="as-course">
            <select
              id="as-course"
              className={inputClass}
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required>
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} · {c.title} ({c.level}L)
                </option>
              ))}
            </select>
          </Field>

          <Field label="Lecturer" htmlFor="as-lecturer">
            <select
              id="as-lecturer"
              className={inputClass}
              value={lecturer}
              onChange={(e) => setLecturer(e.target.value)}
              required>
              <option value="">Select a lecturer</option>
              {lecturers.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.title ? `${l.title} ` : ""}
                  {l.name}
                </option>
              ))}
            </select>
          </Field>

          <button className={buttonClass} disabled={saving}>
            {saving ? "Saving..." : "Assign"}
          </button>
        </form>
      </Card>

      <Card title="Course lecturers">
        {loading ? (
          <Loading />
        ) : assignments.length === 0 ? (
          <EmptyState message="No assignments for the current session yet." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <li
                key={a._id}
                className="flex min-w-0 flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {a.course.code} · {a.course.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <Badge tone="indigo">{a.course.level} level</Badge>
                    {a.lecturer.title ? `${a.lecturer.title} ` : ""}
                    {a.lecturer.name}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
