import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../lib/api";
import { formatDate, toList } from "../../lib/helpers";
import { Badge, Card, EmptyState, Loading } from "../../components/ui";
import { ErrorAlert } from "../../components/AuthLayout";
import type { RoleRequest } from "../../types";

type Status = RoleRequest["status"];

const roleName: Record<string, string> = {
  student: "Student",
  course_rep: "Course Rep",
  president: "President",
  admin: "Admin",
};

const statusTone: Record<Status, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

export default function RoleRequestsAdmin() {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [filter, setFilter] = useState<Status>("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/roles/requests");
      setRequests(toList<RoleRequest>(res.data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (r: RoleRequest, decision: "approve" | "reject") => {
    const who = typeof r.user === "object" ? r.user.name : "this user";
    const verb = decision === "approve" ? "Approve" : "Reject";
    if (
      !window.confirm(
        `${verb} ${who}'s request to become ${roleName[r.requestedRole]}?`,
      )
    )
      return;

    setBusyId(r._id);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/roles/requests/${r._id}`, { decision });
      setSuccess(
        `Request ${decision === "approve" ? "approved" : "rejected"}.`,
      );
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loading text="Loading role requests..." />;

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };
  const shown = requests.filter((r) => r.status === filter);

  return (
    <Card title="Role requests">
      <div className="mb-4 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
              filter === s
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}>
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      <div className="mb-3 grid gap-3">
        <ErrorAlert message={error} />
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <EmptyState message={`No ${filter} requests.`} />
      ) : (
        <ul className="grid gap-3">
          {shown.map((r) => {
            const u = typeof r.user === "object" ? r.user : null;
            return (
              <li
                key={r._id}
                className="min-w-0 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {u?.name ?? "Unknown user"}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {u
                        ? `${u.email} · ${u.level} Level · currently ${roleName[u.role]}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="indigo">
                      Wants: {roleName[r.requestedRole]}
                    </Badge>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusTone[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                </div>

                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  “{r.reason}”
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">
                    Requested {formatDate(r.createdAt)}
                  </p>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === r._id}
                        onClick={() => decide(r, "reject")}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                        Reject
                      </button>
                      <button
                        disabled={busyId === r._id}
                        onClick={() => decide(r, "approve")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                        {busyId === r._id ? "Saving..." : "Approve"}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
