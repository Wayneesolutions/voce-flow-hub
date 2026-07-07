import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, PhoneCall, CheckCircle2, XCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import axios from "axios";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  head: () => ({ meta: [{ title: "Reset password · Quor" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = useSearch({ from: "/reset-password" });
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      await authApi.tenantResetPassword(token ?? "", password);
      setSuccess(true);
      setTimeout(() => navigate({ to: "/login" }), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error)
        setError(err.response.data.error);
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-[380px] space-y-6">

        {/* Logo */}
        <div className="flex justify-center">
          <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-xl">
            <span className="h-9 w-9 rounded-xl bg-primary inline-flex items-center justify-center">
              <PhoneCall className="h-4 w-4 text-primary-foreground" />
            </span>
            Quor
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">

          {!token ? (
            /* No token in URL */
            <div className="text-center space-y-3 py-2">
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="font-semibold text-sm">Invalid reset link</p>
              <p className="text-sm text-muted-foreground">
                This link is missing a reset token. Please request a new one.
              </p>
              <Link to="/login" className="text-sm text-primary font-medium hover:underline block pt-1">
                Back to sign in →
              </Link>
            </div>
          ) : success ? (
            /* Success */
            <div className="text-center space-y-3 py-2">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="font-semibold text-sm">Password updated!</p>
              <p className="text-sm text-muted-foreground">
                Redirecting you to sign in…
              </p>
            </div>
          ) : (
            /* Reset form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="font-semibold text-sm mb-1">Choose a new password</p>
                <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="pw" className="text-sm font-medium">New password</label>
                <div className="relative">
                  <input
                    id="pw"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoFocus
                    className="w-full h-10 rounded-lg border border-input bg-background px-3.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm" className="text-sm font-medium">Confirm password</label>
                <input
                  id="confirm"
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3.5 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? "Updating…" : "Set new password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/login" className="hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
