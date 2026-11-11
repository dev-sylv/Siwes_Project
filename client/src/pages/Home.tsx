import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome, {user?.name}
      </h1>
      <p className="mt-1 text-gray-600">
        Role: {user?.role} · Level: {user?.level}
      </p>
      <button
        onClick={logout}
        className="mt-6 rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100">
        Log out
      </button>
    </div>
  );
}
