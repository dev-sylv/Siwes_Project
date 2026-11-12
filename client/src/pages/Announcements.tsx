import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../lib/api";
import { formatDate, toList } from "../lib/helpers";
import {
  Badge,
  Card,
  EmptyState,
  Loading,
  PageHeader,
  selectClass,
} from "../components/ui";
import { ErrorAlert } from "../components/AuthLayout";
import type { Announcement } from "../types";

const PAGE_SIZE = 10;

function authorName(postedBy: Announcement["postedBy"]) {
  return typeof postedBy === "object" && postedBy ? postedBy.name : undefined;
}

export default function Announcements() {
  const { user } = useAuth();
  const canFilter = user?.role === "president" || user?.role === "admin";

  const [page, setPage] = useState(1);
  const [level, setLevel] = useState("");
  const [items, setItems] = useState<Announcement[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (canFilter && level) params.set("level", level);

    api
      .get(`/announcements?${params}`)
      .then((res) => {
        if (!active) return;
        setItems(toList<Announcement>(res.data));
        const body = res.data?.data ?? res.data;
        const pages =
          body?.totalPages ??
          body?.pages ??
          body?.pagination?.totalPages ??
          body?.pagination?.pages ??
          1;
        setTotalPages(Number(pages) || 1);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, level, canFilter]);

  const filter = canFilter ? (
    <select
      className={selectClass}
      value={level}
      onChange={(e) => {
        setLevel(e.target.value);
        setPage(1);
      }}>
      <option value="">All levels</option>
      {[100, 200, 300, 400, 500].map((l) => (
        <option key={l} value={l}>
          {l} Level
        </option>
      ))}
    </select>
  ) : undefined;

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle={
          canFilter
            ? "All announcements across the department"
            : `For everyone and ${user?.level} Level`
        }
        action={filter}
      />

      {loading ? (
        <Loading text="Loading announcements..." />
      ) : error ? (
        <ErrorAlert message={error} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState message="No announcements yet." />
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((a) => {
            const isLong = a.message.length > 220;
            const isOpen = expanded === a._id;
            const author = authorName(a.postedBy);
            return (
              <article
                key={a._id}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${a.pinned ? "border-amber-200" : "border-slate-200"}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {a.title}
                  </h2>
                  {a.pinned && <Badge tone="amber">📌 Pinned</Badge>}
                  <Badge tone="indigo">
                    {a.targetLevel ? `${a.targetLevel} Level` : "Everyone"}
                  </Badge>
                </div>

                <p
                  className={`whitespace-pre-line text-[15px] leading-relaxed text-slate-700 ${isLong && !isOpen ? "line-clamp-3" : ""}`}>
                  {a.message}
                </p>
                {isLong && (
                  <button
                    onClick={() => setExpanded(isOpen ? null : a._id)}
                    className="mt-1 text-sm font-medium text-indigo-600 hover:underline">
                    {isOpen ? "Show less" : "Read more"}
                  </button>
                )}

                <p className="mt-3 text-xs text-slate-400">
                  {author ? `Posted by ${author} · ` : ""}
                  {formatDate(a.createdAt)}
                </p>
              </article>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40">
                ← Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40">
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
