import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  PhoneCall,
  Calendar,
  BarChart3,
  FileAudio,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/userAuthSlice";
import { authApi } from "@/lib/api";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import axios from "axios";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · VoCallM" }] }),
  component: LoginPage,
});

const FEATURES = [
  {
    icon: Calendar,
    text: "Meetings booked straight to your calendar",
  },
  {
    icon: BarChart3,
    text: "Live analytics on every call and outcome",
  },
  {
    icon: FileAudio,
    text: "Full recordings and transcripts for every call",
  },
];

function LoginPage() {
  const dispatch = useAppDispatch();
  const client = useAppSelector((s) => s.userAuth.user);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (client) {
    navigate({ to: "/portal" });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.tenantLogin(email, password);
      dispatch(
        setUser({
          user: { email: res.user.email, name: res.user.name, role: "user" },
          token: res.token,
          tenant: res.tenant
            ? {
                id: res.tenant.id,
                name: res.tenant.name,
                slug: res.tenant.slug,
                logoUrl: res.tenant.logoUrl,
                primaryColor: res.tenant.primaryColor,
              }
            : undefined,
        }),
      );
      toast.success(`Welcome back, ${res.user.name}`);
      navigate({ to: "/portal" });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error)
        setError(err.response.data.error);
      else setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketingShell>
      <div className="flex flex-col lg:flex-row flex-1">

        {/* ── Left brand panel ───────────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-[44%] xl:w-[42%] bg-primary text-primary-foreground relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full p-12 xl:p-14">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-lg w-fit">
              <span className="h-9 w-9 rounded-xl bg-white/20 inline-flex items-center justify-center">
                <PhoneCall className="h-4 w-4" />
              </span>
              VoCallM
            </Link>

            {/* Main copy */}
            <div className="mt-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                AI agent active · 340+ clients
              </div>
              <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
                Your AI outbound<br />team is ready.
              </h2>
              <p className="mt-4 text-primary-foreground/75 text-base leading-relaxed max-w-sm">
                Upload your leads, approve a script, and watch meetings fill your calendar
                automatically.
              </p>

              {/* Feature list */}
              <ul className="mt-8 space-y-4">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3.5">
                    <span className="h-7 w-7 shrink-0 rounded-lg bg-white/15 inline-flex items-center justify-center mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-primary-foreground/90 leading-relaxed pt-0.5">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial */}
            <div className="mt-10 rounded-2xl bg-white/10 border border-white/15 p-5">
              <Quote className="h-4 w-4 text-white/40 mb-3" />
              <p className="text-sm text-primary-foreground/85 leading-relaxed">
                "We went from 3 booked demos a week to 14 within the first month. The AI handles
                objections better than half my SDR team."
              </p>
              <div className="mt-4 flex items-center gap-3 pt-3.5 border-t border-white/15">
                <div className="h-8 w-8 rounded-full bg-white/20 text-xs font-bold inline-flex items-center justify-center shrink-0">
                  MR
                </div>
                <div>
                  <div className="text-xs font-semibold">Marcus Reid</div>
                  <div className="text-[11px] text-primary-foreground/60">
                    Head of Sales · TechBase Inc.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right form panel ───────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-10 lg:px-16 bg-background">
          <div className="w-full max-w-[400px]">

            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-10">
              <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-xl">
                <span className="h-9 w-9 rounded-xl bg-primary inline-flex items-center justify-center">
                  <PhoneCall className="h-4 w-4 text-primary-foreground" />
                </span>
                VoCallM
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-1.5 text-muted-foreground text-sm">
                Sign in to your client portal to continue.
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    className="w-full h-10 rounded-lg border border-input bg-background px-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3.5 py-2.5">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {loading ? "Signing in…" : "Sign in to portal"}
                </button>
              </form>

              {/* Register link */}
              <div className="px-6 py-4 border-t border-border bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have access yet?{" "}
                  <a
                    href="/register"
                    className="text-primary font-semibold hover:underline"
                  >
                    Request access →
                  </a>
                </p>
              </div>
            </div>

            {/* Trust note */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
              <span>256-bit SSL encrypted · Your data stays private</span>
            </div>

            {/* Admin login */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Wayne Solutions team?{" "}
              <Link to="/admin/login" className="hover:underline text-muted-foreground font-medium">
                Admin login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
