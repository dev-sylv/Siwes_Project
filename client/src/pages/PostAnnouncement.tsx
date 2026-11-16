import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import api, { getErrorMessage } from "../lib/api";
import { formatDate, toList } from "../lib/helpers";
import { useAuth } from "../context/AuthContext";
import { Badge, Card, EmptyState, Loading, PageHeader } from "../components/ui";
import {
  ErrorAlert,
  Field,
  buttonClass,
  inputClass,
} from "../components/AuthLayout";
import SuccessAlert from "../components/SuccessAlert";
import type { Announcement } from "../types";

const LEVELS = [100, 200, 300, 400, 500];

const emptyForm = {
  title: "",
  message: "",
  targetLevel: "",
  pinned: false,
  notifyByEmail: false,
};

export default function PostAnnouncement() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/announcements", { params: { limit: 50 } });
      setItems(toList<Announcement>(res.data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // the author can manage their own posts; an admin can manage all of them
  const canManage = (a: Announcement) => {
    if (user?.role === "admin") return true;
    const authorId =
      typeof a.postedBy === "string" ? a.postedBy : a.postedBy?._id;
    return authorId === user?._id;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const targetLevel = form.targetLevel ? Number(form.targetLevel) : null;
    try {
      if (editingId) {
        await api.patch(`/announcements/${editingId}`, {
          title: form.title,
          message: form.message,
          targetLevel,
          pinned: form.pinned,
        });
        setSuccess("Announcement updated.");
      } else {
        const res = await api.post("/announcements", {
          title: form.title,
          message: form.message,
          targetLevel,
          pinned: form.pinned,
          notifyByEmail: form.notifyByEmail,
        });
        const sent = res.data?.emailRecipients;
        setSuccess(
          form.notifyByEmail
            ? `Announcement posted. Emailing ${sent ?? 0} student(s).`
            : "Announcement posted.",
        );
      }
      resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a._id);
    setForm({
      title: a.title,
      message: a.message,
      targetLevel: a.targetLevel ? String(a.targetLevel) : "",
      pinned: a.pinned,
      notifyByEmail: false,
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (a: Announcement) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/announcements/${a._id}`);
      setSuccess("Announcement deleted.");
      if (editingId === a._id) resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const manageable = items.filter(canManage);

  return (
    <>
      <PageHeader
        title="Post announcement"
        subtitle="Send an update to everyone or to one level."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[420px_1fr]">
        <Card title={editingId ? "Edit announcement" : "New announcement"}>
          <form onSubmit={handleSubmit} className="grid gap-3.5">
            <ErrorAlert message={error} />
            <SuccessAlert message={success} />

            <Field label="Title" htmlFor="an-title">
              <input
                id="an-title"
                className={inputClass}
                minLength={3}
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </Field>

            <Field label="Message" htmlFor="an-message">
              <textarea
                id="an-message"
                rows={6}
                className={inputClass}
                minLength={5}
                maxLength={2000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </Field>

            <Field label="Who is it for?" htmlFor="an-level">
              <select
                id="an-level"
                className={inputClass}
                value={form.targetLevel}
                onChange={(e) =>
                  setForm({ ...form, targetLevel: e.target.value })
                }>
                <option value="">Everyone</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l} level only
                  </option>
                ))}
              </select>
            </Field>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              Pin to the top
            </label>

            {!editingId && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.notifyByEmail}
                  onChange={(e) =>
                    setForm({ ...form, notifyByEmail: e.target.checked })
                  }
                />
                Also send an email alert to the students
              </label>
            )}

            <button className={buttonClass} disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Post announcement"}
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
          title={
            user?.role === "admin" ? "All announcements" : "Your announcements"
          }>
          {loading ? (
            <Loading />
          ) : manageable.length === 0 ? (
            <EmptyState message="Nothing posted yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {manageable.map((a) => (
                <li
                  key={a._id}
                  className="flex min-w-0 flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {a.pinned && "📌 "}
                      {a.title}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <Badge tone={a.targetLevel ? "indigo" : "slate"}>
                        {a.targetLevel ? `${a.targetLevel} level` : "Everyone"}
                      </Badge>
                      {formatDate(a.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => startEdit(a)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
