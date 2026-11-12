import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../lib/api";
import { formatDate, toList } from "../lib/helpers";
import { Card } from "./ui";
import { ErrorAlert, Field, inputClass, buttonClass } from "./AuthLayout";
import type { RoleRequest } from "../types";

const roleName = { course_rep: "Course Rep", president: "President" } as const;

export default function RoleRequestCard() {
  const { user } = useAuth();
  const [mine, setMine] = useState<RoleRequest[]>([]);
  const [requestedRole, setRequestedRole] = useState<
    "course_rep" | "president"
  >(user?.role === "course_rep" ? "president" : "course_rep");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const load = () =>
    api
      .get("/roles/my-requests")
      .then((res) => setMine(toList<RoleRequest>(res.data)))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const pending = mine.find((r) => r.status === "pending");
  const latest = [...mine].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await api.post("/roles/request", { requestedRole, reason });
      setReason("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card title="Request a role">
      {pending ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your request to become{" "}
          <strong>{roleName[pending.requestedRole]}</strong> is pending admin
          approval (sent {formatDate(pending.createdAt)}).
        </div>
      ) : (
        <>
          {latest && latest.status !== "pending" && (
            <p className="mb-4 text-sm text-slate-600">
              Your last request ({roleName[latest.requestedRole]}) was{" "}
              <strong
                className={
                  latest.status === "approved"
                    ? "text-emerald-700"
                    : "text-red-600"
                }>
                {latest.status}
              </strong>
              .
              {latest.status === "approved" &&
                " Refresh the page to see your new menu."}
            </p>
          )}
          <p className="mb-4 text-sm text-slate-500">
            Course reps manage their level's timetable. The president posts
            department announcements.
          </p>
          <form onSubmit={handleSubmit} className="grid gap-3.5">
            <ErrorAlert message={error} />
            <Field label="Role" htmlFor="requested-role">
              <select
                id="requested-role"
                className={inputClass}
                value={requestedRole}
                onChange={(e) =>
                  setRequestedRole(e.target.value as "course_rep" | "president")
                }>
                {user?.role === "student" && (
                  <option value="course_rep">
                    Course Rep ({user.level} Level)
                  </option>
                )}
                <option value="president">Department President</option>
              </select>
            </Field>
            <Field label="Why should you get this role?" htmlFor="reason">
              <textarea
                id="reason"
                rows={3}
                placeholder="e.g. I was elected course rep for 300 Level this session."
                className={inputClass}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minLength={10}
                required
              />
            </Field>
            <button className={buttonClass} disabled={sending}>
              {sending ? "Sending..." : "Send request"}
            </button>
          </form>
        </>
      )}
    </Card>
  );
}
