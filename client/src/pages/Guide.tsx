import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../lib/api";
import { toList } from "../lib/helpers";
import { useAuth } from "../context/AuthContext";
import {
  Badge,
  Card,
  EmptyState,
  Loading,
  PageHeader,
  selectClass,
} from "../components/ui";
import { ErrorAlert } from "../components/AuthLayout";
import CgpaTracker from "../components/CgpaTracker";
import type { Faq } from "../lib/faq";
import type { Course, CourseAssignment, DirectoryData } from "../types";

const LEVELS = [100, 200, 300, 400, 500];

const STEPS = [
  "Create an account with your level, then sign in.",
  "Open Timetable to see when and where your classes hold. Today's classes also show on your dashboard.",
  "Open Directory to find the HOD, the student executives and who teaches each course.",
  "Check Announcements for updates from the president and the department.",
  "Need to help your class? Request the course rep role from your dashboard and an admin will review it.",
];

export default function Guide() {
  const { user } = useAuth();
  // the guide opens on the student's own level; they can look at any other level too
  const [level, setLevel] = useState<number>(user?.level ?? 100);

  const [courses, setCourses] = useState<Course[]>([]);
  const [directory, setDirectory] = useState<DirectoryData | null>(null);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [error, setError] = useState("");

  // people and lecturers: loaded once
  useEffect(() => {
    api
      .get("/directory")
      .then((res) =>
        setDirectory((res.data?.data ?? res.data) as DirectoryData),
      )
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoadingDirectory(false));

    // FAQs are managed by admins; a failure here must not break the rest of the guide
    api
      .get("/faqs")
      .then((res) => setFaqs(toList<Faq>(res.data)))
      .catch(() => setFaqs([]));
  }, []);

  // courses: reloaded whenever the selected level changes
  useEffect(() => {
    let cancelled = false;
    setLoadingCourses(true);
    api
      .get("/courses", { params: { level } })
      .then((res) => !cancelled && setCourses(toList<Course>(res.data)))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoadingCourses(false));
    return () => {
      cancelled = true;
    };
  }, [level]);

  const lecturerFor = (courseId: string) => {
    const match: CourseAssignment | undefined =
      directory?.courseLecturers?.find((a) => a.course._id === courseId);
    if (!match) return "Lecturer not assigned yet";
    return `${match.lecturer.title ? match.lecturer.title + " " : ""}${match.lecturer.name}`;
  };

  const bySemester = (s: "first" | "second") =>
    courses.filter((c) => c.semester === s);
  const totalUnits = (s: "first" | "second") =>
    bySemester(s).reduce((t, c) => t + c.units, 0);

  return (
    <>
      <PageHeader
        title="Student guide"
        subtitle="Your courses, lecturers and tools, for every level, from the department's own records."
      />

      <div className="grid gap-5">
        <Card title="Getting started">
          <ol className="grid list-decimal gap-1.5 pl-5 text-sm text-slate-700">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </Card>

        <Card title="People to know">
          <ErrorAlert message={error} />
          {loadingDirectory ? (
            <Loading />
          ) : (
            <ul className="grid gap-1.5 text-sm text-slate-700">
              <li>
                <span className="text-slate-500">Head of Department: </span>
                {directory?.hod
                  ? `${directory.hod.title ?? ""} ${directory.hod.name}`.trim()
                  : "not set yet"}
              </li>
              {(directory?.excos ?? []).map((x) => (
                <li key={x._id}>
                  <span className="text-slate-500">{x.position}: </span>
                  {x.name}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* courses for the selected level */}
        <Card
          title={`${level} level courses`}
          action={
            <select
              className={selectClass}
              value={level}
              aria-label="Choose a level"
              onChange={(e) => setLevel(Number(e.target.value))}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l} level{l === user?.level ? " (yours)" : ""}
                </option>
              ))}
            </select>
          }>
          {loadingCourses || loadingDirectory ? (
            <Loading />
          ) : courses.length === 0 ? (
            <EmptyState
              message={`No ${level} level courses have been added yet.`}
            />
          ) : (
            <div className="grid gap-6">
              {(["first", "second"] as const).map((sem) => (
                <div key={sem}>
                  <p className="mb-1 flex flex-wrap items-center gap-2 text-sm font-semibold capitalize text-slate-900">
                    {sem} semester
                    <Badge tone="indigo">{totalUnits(sem)} units</Badge>
                  </p>
                  {bySemester(sem).length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No courses added for this semester yet.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {bySemester(sem).map((c) => (
                        <li
                          key={c._id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                          <span className="min-w-0">
                            <span className="font-semibold text-slate-900">
                              {c.code}
                            </span>{" "}
                            {c.title} <Badge>{c.units} unit(s)</Badge>
                          </span>
                          <span className="text-slate-500">
                            {lecturerFor(c._id)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <CgpaTracker />

        <Card title="Frequently asked questions">
          {faqs.length === 0 ? (
            <EmptyState message="No FAQs have been added yet." />
          ) : (
            <div className="grid gap-4">
              {faqs.map((f) => (
                <div key={f._id}>
                  <p className="font-semibold text-slate-900">{f.question}</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600">
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
