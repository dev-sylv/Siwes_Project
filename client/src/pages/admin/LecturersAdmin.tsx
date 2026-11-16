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
import type { Lecturer } from "../../types";

const emptyForm = { title: "", name: "", email: "", isHod: false };

export default function LecturersAdmin() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/directory/lecturers");
      setLecturers(toList<Lecturer>(res.data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

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
    const body = {
      title: form.title.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      isHod: form.isHod,
    };
    try {
      if (editingId) {
        await api.patch(`/directory/lecturers/${editingId}`, body);
        setSuccess("Lecturer updated.");
      } else {
        await api.post("/directory/lecturers", body);
        setSuccess("Lecturer added.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (l: Lecturer) => {
    setEditingId(l._id);
    setForm({
      title: l.title ?? "",
      name: l.name,
      email: l.email ?? "",
      isHod: Boolean(l.isHod),
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (l: Lecturer) => {
    if (
      !window.confirm(
        `Delete ${l.name}? Their course assignments are removed too.`,
      )
    )
      return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/directory/lecturers/${l._id}`);
      setSuccess("Lecturer deleted.");
      if (editingId === l._id) resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
      <Card title={editingId ? "Edit lecturer" : "Add lecturer"}>
        <form onSubmit={handleSubmit} className="grid gap-3.5">
          <ErrorAlert message={error} />
          <SuccessAlert message={success} />

          <Field label="Title (Prof., Dr., Mr...)" htmlFor="lec-title">
            <input
              id="lec-title"
              className={inputClass}
              maxLength={20}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>

          <Field label="Full name" htmlFor="lec-name">
            <input
              id="lec-name"
              className={inputClass}
              minLength={2}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>

          <Field label="Email (optional)" htmlFor="lec-email">
            <input
              id="lec-email"
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isHod}
              onChange={(e) => setForm({ ...form, isHod: e.target.checked })}
            />
            Head of Department (only one at a time)
          </label>

          <button className={buttonClass} disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Add lecturer"}
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

      <Card title="Lecturers">
        {loading ? (
          <Loading />
        ) : lecturers.length === 0 ? (
          <EmptyState message="No lecturers yet." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {lecturers.map((l) => (
              <li
                key={l._id}
                className="flex min-w-0 flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {l.title ? `${l.title} ` : ""}
                    {l.name} {l.isHod && <Badge tone="indigo">HOD</Badge>}
                  </p>
                  {l.email && (
                    <p className="truncate text-sm text-slate-500">{l.email}</p>
                  )}
                </div>
                <button
                  onClick={() => startEdit(l)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(l)}
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
