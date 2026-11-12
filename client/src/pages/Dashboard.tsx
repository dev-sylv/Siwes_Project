import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApiList } from "../lib/useApiList";
import { courseInfo, formatDate, formatTime } from "../lib/helpers";
import { Badge, Card, EmptyState, Loading, PageHeader } from "../components/ui";
import { ErrorAlert } from "../components/AuthLayout";
import type { Announcement, TimetableEntry } from "../types";

export default function Dashboard() {
  const { user } = useAuth();
  const today = useApiList<TimetableEntry>("/timetable/today");
  const news = useApiList<Announcement>("/announcements?limit=3");

  const dateText = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user?.name.split(" ")[0]}`}
        subtitle={`${dateText} · ${user?.level} Level`}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Today's classes"
          action={
            <Link
              to="/timetable"
              className="text-sm font-medium text-indigo-600 hover:underline">
              Full timetable
            </Link>
          }>
          {today.loading ? (
            <Loading />
          ) : today.error ? (
            <ErrorAlert message={today.error} />
          ) : today.data.length === 0 ? (
            <EmptyState message="No classes today. Enjoy your day!" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {today.data.map((e) => {
                const c = courseInfo(e.course);
                return (
                  <li key={e._id} className="flex items-center gap-4 py-3">
                    <div className="w-24 shrink-0 text-sm font-medium text-indigo-700">
                      {formatTime(e.startTime)}
                      <span className="block text-xs font-normal text-slate-400">
                        to {formatTime(e.endTime)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{c.code}</p>
                      <p className="truncate text-sm text-slate-500">
                        {c.title} · {e.venue}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          title="Latest announcements"
          action={
            <Link
              to="/announcements"
              className="text-sm font-medium text-indigo-600 hover:underline">
              See all
            </Link>
          }>
          {news.loading ? (
            <Loading />
          ) : news.error ? (
            <ErrorAlert message={news.error} />
          ) : news.data.length === 0 ? (
            <EmptyState message="No announcements yet." />
          ) : (
            <ul className="grid gap-3">
              {news.data.slice(0, 3).map((a) => (
                <li
                  key={a._id}
                  className="rounded-xl border border-slate-100 p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    {a.pinned && <Badge tone="amber">Pinned</Badge>}
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">
                    {a.message}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {formatDate(a.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
