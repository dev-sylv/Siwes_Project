import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../lib/api";
import AuthLayout, {
  Field,
  PasswordInput,
  ErrorAlert,
  buttonClass,
} from "../components/AuthLayout";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      setDone(res.data.message);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Use at least 6 characters.">
      {done ? (
        <div className="grid gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
            {done} Taking you to the login page...
          </div>
          <Link
            to="/login"
            className="text-center text-sm font-semibold text-indigo-600 hover:underline">
            Log in now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-3.5">
          <ErrorAlert message={error} />
          <Field label="New password" htmlFor="password">
            <PasswordInput
              id="password"
              placeholder="New password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm">
            <PasswordInput
              id="confirm"
              placeholder="Type it again"
              autoComplete="new-password"
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Field>
          <button className={buttonClass} disabled={submitting}>
            {submitting ? "Saving..." : "Reset password"}
          </button>
          <Link
            to="/forgot-password"
            className="text-center text-sm text-slate-500 hover:underline">
            Link expired? Request a new one
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
