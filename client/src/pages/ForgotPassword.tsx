import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../lib/api";
import AuthLayout, {
  Field,
  ErrorAlert,
  inputClass,
  buttonClass,
} from "../components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSentMessage(res.data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link.">
      {sentMessage ? (
        <div className="grid gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
            {sentMessage} Check your inbox and spam folder. The link expires in
            30 minutes.
          </div>
          <Link
            to="/login"
            className="text-center text-sm font-semibold text-indigo-600 hover:underline">
            Back to log in
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="grid gap-3.5">
            <ErrorAlert message={error} />
            <Field label="Email address" htmlFor="email">
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <button className={buttonClass} disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered it?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:underline">
              Log in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
