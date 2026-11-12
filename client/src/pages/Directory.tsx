import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../lib/api";
import { Badge, Card, EmptyState, Loading, PageHeader } from "../components/ui";
import { ErrorAlert } from "../components/AuthLayout";
import type { DirectoryData, Lecturer } from "../types";

const LEVELS = [100, 200, 300, 400, 500];

function initials(name: string) {
  return name
    .replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.|Comr\.)\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function fullName(l: Lecturer) {
  return l.title ? `${l.title} ${l.name}` : l.name;
}

function Avatar({
  name,
  tone = "indigo",
}: {
  name: string;
  tone?: "indigo" | "amber";
}) {
  const tones = {
    indigo: "bg-indigo-100 text-indigo-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <div
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ${tones[tone]}`}>
      {initials(name)}
    </div>
  );
}

export default function Directory() {
  const { user } = useAuth();
  const [data, setData] = useState<DirectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [level, setLevel] = useState<number | "all">(user?.level ?? "all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get<DirectoryData>("/directory")
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const lecturers = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.courseLecturers
      .filter((a) => level === "all" || a.course.level === level)
      .filter(
        (a) =>
          !q ||
          a.course.code.toLowerCase().includes(q) ||
          a.course.title.toLowerCase().includes(q) ||
          a.lecturer.name.toLowerCase().includes(q),
      )
      .sort((a, b) => a.course.code.localeCompare(b.course.code));
  }, [data, level, search]);

  if (loading) return <Loading text="Loading directory..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!data) return null;

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "bg-indigo-600 text-white"
        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
    }`;

  return (
    <>
      <PageHeader
        title="Department Directory"
        subtitle={
          data.session
            ? `${data.session.name} academic session`
            : "No current session set"
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* HOD */}
        <div className="min-w-0">
          <Card title="Head of Department">
            {data.hod ? (
              <div className="flex min-w-0 items-center gap-4">
                <Avatar name={data.hod.name} />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {fullName(data.hod)}
                  </p>
                  <p className="text-sm text-slate-500">Head of Department</p>
                  {data.hod.email && (
                    <a
                      href={`mailto:${data.hod.email}`}
                      className="mt-1 block truncate text-sm text-indigo-600 hover:underline">
                      {data.hod.email}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState message="HOD not set yet." />
            )}
          </Card>
        </div>

        {/* Excos */}
        <div className="min-w-0 lg:col-span-2">
          <Card title="Departmental Excos">
            {data.excos.length === 0 ? (
              <EmptyState message="Excos for this session have not been added yet." />
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data.excos.map((e) => (
                  <li
                    key={e._id}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 p-3">
                    <Avatar name={e.name} tone="amber" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {e.name}
                      </p>
                      <p className="text-sm text-slate-500">{e.position}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Course lecturers */}
      <div className="mt-5 min-w-0">
        <Card title="Course Lecturers">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              className={tabClass(level === "all")}
              onClick={() => setLevel("all")}>
              All
            </button>
            {LEVELS.map((l) => (
              <button
                key={l}
                className={tabClass(level === l)}
                onClick={() => setLevel(l)}>
                {l}L
              </button>
            ))}
            <input
              placeholder="Search course or lecturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-auto w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-64"
            />
          </div>

          {lecturers.length === 0 ? (
            <EmptyState
              message={
                search
                  ? "No match for your search."
                  : "No course lecturers added for this level yet."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4 font-medium">Course</th>
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="py-2 pr-4 font-medium">Lecturer</th>
                    <th className="py-2 font-medium">Semester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lecturers.map((a) => (
                    <tr key={a._id}>
                      <td className="py-3 pr-4 font-semibold whitespace-nowrap text-slate-900">
                        {a.course.code}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {a.course.title}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-slate-800">
                        {fullName(a.lecturer)}
                      </td>
                      <td className="py-3">
                        <Badge>
                          {a.course.semester === "first" ? "First" : "Second"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
