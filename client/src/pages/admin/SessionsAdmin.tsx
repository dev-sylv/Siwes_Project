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

interface SessionRow {
  _id: string;
  name: string;
  isCurrent: boolean;
}

export default function SessionsAdmin() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [name, setName] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/sessions");
      setSessions(toList<SessionRow>(res.data));
    } catch (err) {
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
      await api.post("/sessions", { name: name.trim(), isCurrent });
      setSuccess("Session added.");
      setName("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const makeCurrent = async (s: SessionRow) => {
    setError("");
    setSuccess("");
    try {
      await api.patch(`/sessions/${s._id}/current`);
      setSuccess(`${s.name} is now the current session.`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
      <Card title="Add session">
        <form onSubmit={handleSubmit} className="grid gap-3.5">
          <ErrorAlert message={error} />
          <SuccessAlert message={success} />
          <Field label="Session (e.g. 2026/2027)" htmlFor="session-name">
            <input
              id="session-name"
              className={inputClass}
              placeholder="2026/2027"
              pattern="\d{4}/\d{4}"
              title="Use the format 2026/2027"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
            />
            Make this the current session
          </label>
          <button className={buttonClass} disabled={saving}>
            {saving ? "Saving..." : "Add session"}
          </button>
        </form>
      </Card>

      <Card title="Sessions">
        {loading ? (
          <Loading />
        ) : sessions.length === 0 ? (
          <EmptyState message="No sessions yet. Add one to get started." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <li key={s._id} className="flex items-center gap-3 py-3">
                <p className="flex-1 font-semibold text-slate-900">
                  {s.name} {s.isCurrent && <Badge tone="indigo">Current</Badge>}
                </p>
                {!s.isCurrent && (
                  <button
                    onClick={() => makeCurrent(s)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    Make current
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
