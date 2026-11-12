import { useState } from "react";
import { Card, EmptyState, PageHeader } from "../../components/ui";
import ExcosAdmin from "./ExcosAdmin";
import RoleRequestsAdmin from "./RoleRequestsAdmin";

const TABS = [
  { key: "requests", label: "Role Requests" },
  { key: "sessions", label: "Sessions" },
  { key: "courses", label: "Courses" },
  { key: "lecturers", label: "Lecturers" },
  { key: "assignments", label: "Course Assignments" },
  { key: "excos", label: "Excos" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminPage() {
  const [tab, setTab] = useState<TabKey>("requests");

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Manage the department's data and user roles"
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "requests" ? (
        <RoleRequestsAdmin />
      ) : tab === "excos" ? (
        <ExcosAdmin />
      ) : (
        <Card>
          <EmptyState message="This section is coming next." />
        </Card>
      )}
    </>
  );
}
