import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import api, { getErrorMessage } from "../../lib/api";
import { toList } from "../../lib/helpers";
import { Card, EmptyState, Loading } from "../../components/ui";
import {
  ErrorAlert,
  Field,
  inputClass,
  buttonClass,
} from "../../components/AuthLayout";
import type { Exco } from "../../types";

type SessionRef = { _id: string; name: string };
type ExcoRow = Exco & { session?: string | SessionRef };

const POSITIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Assistant General Secretary",
  "Financial Secretary",
  "Treasurer",
  "Director of Socials",
  "Director of Sports",
  "Director of Welfare",
  "Public Relations Officer",
];

const emptyForm = { position: "", name: "" };

export default function ExcosAdmin() {
  const [session, setSession] = useState<SessionRef | null>(null);
  const [excos, setExcos] = useState<ExcoRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, e] = await Promise.all([
        api.get("/sessions/current"),
        api.get("/directory/excos"),
      ]);
      const sBody = s.data?.data ?? s.data;
      const current: SessionRef | null = (sBody?.session ?? sBody)?._id
        ? (sBody?.session ?? sBody)
        : null;
      setSession(current);

      const all = toList<ExcoRow>(e.data);
      const sessionId = (x: ExcoRow) =>
        typeof x.session === "string" ? x.session : x.session?._id;
      setExcos(
        current
          ? all.filter((x) => !x.session || sessionId(x) === current._id)
          : all,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        await api.patch(`/directory/excos/${editingId}`, form);
        setSuccess("Exco updated.");
      } else {
        await api.post("/directory/excos", { ...form, session: session?._id });
        setSuccess("Exco added.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (x: ExcoRow) => {
    setEditingId(x._id);
    setForm({ position: x.position, name: x.name });
    setSuccess("");
    setError("");
  };

  const handleDelete = async (x: ExcoRow) => {
    if (!window.confirm(`Remove ${x.name} (${x.position})?`)) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/directory/excos/${x._id}`);
      setSuccess("Exco removed.");
      if (editingId === x._id) resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <Loading text="Loading excos..." />;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
      <Card title={editingId ? "Edit exco" : "Add exco"}>
        {!session ? (
          <EmptyState message="Set a current session first (Sessions tab)." />
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-3.5">
            <p className="text-sm text-slate-500">
              Session:{" "}
              <span className="font-semibold text-slate-800">
                {session.name}
              </span>
            </p>
            <ErrorAlert message={error} />
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <Field label="Position" htmlFor="position">
              <input
                id="position"
                list="exco-positions"
                placeholder="e.g. Vice President"
                className={inputClass}
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                required
              />
              <datalist id="exco-positions">
                {POSITIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </Field>

            <Field label="Full name" htmlFor="exco-name">
              <input
                id="exco-name"
                placeholder="e.g. Comr. Okafor Adaeze"
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>

            <button className={buttonClass} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add exco"}
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
        )}
      </Card>

      <Card title={`Excos${session ? ` · ${session.name}` : ""}`}>
        {excos.length === 0 ? (
          <EmptyState message="No excos added for this session yet." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {excos.map((x) => (
              <li key={x._id} className="flex min-w-0 items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {x.name}
                  </p>
                  <p className="text-sm text-slate-500">{x.position}</p>
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
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
