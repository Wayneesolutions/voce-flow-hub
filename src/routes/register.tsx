import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  PhoneCall,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { publicPlansApi, registerApi } from "@/lib/api";
import type { Plan } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: typeof search.plan === "string" ? search.plan : undefined,
  }),
  head: () => ({ meta: [{ title: "Create your account · Quor" }] }),
  component: RegisterPage,
});

const BENEFITS = [
  "Dedicated white-label client portal",
  "AI agent trained on your script",
  "Real-time call transcripts + recordings",
  "Calendar & CRM integrations",
  "US, Canada, and Dubai coverage",
  "No setup fees. Pay per minute.",
];

const defaultForm = {
  name: "",
  company: "",
  email: "",
  password: "",
};

function RegisterPage() {
  const { plan: planId } = useSearch({ from: "/register" });
  const navigate = useNavigate();

  const [form, setForm] = useState(defaultForm);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const f = (key: keyof typeof form, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["public", "plans"],
    queryFn: publicPlansApi.list,
    staleTime: 5 * 60 * 1000,
  });

  const selectedPlan = plans.find((p) => p.id === planId) ?? null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const result = await registerApi.signup({
        name: form.name,
        company: form.company,
        email: form.email,
        password: form.password,
        planId: planId,
      });
      // Auto-login: store token exactly like the login page does
      localStorage.setItem("vfh_token", result.token);
      localStorage.setItem("vfh_tenant", JSON.stringify(result.tenant));
      localStorage.setItem("vfh_user", JSON.stringify(result.user));
      setUserEmail(form.email);
      setRegistered(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketingShell>
      <div className="flex flex-col lg:flex-row flex-1">

        {/* ── Left info panel ───────────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-[44%] xl:w-[42%] bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-10 -left-20 h-44 w-44 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full p-12 xl:p-14">
            <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-lg w-fit">
              <span className="h-9 w-9 rounded-xl bg-white/20 inline-flex items-center justify-center">
                <PhoneCall className="h-4 w-4" />
              </span>
              Quor
            </Link>

            <div className="mt-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium mb-5">
                <Sparkles className="h-3 w-3" />
                GPT-4o powered · Live in 48 hours
              </div>
              <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
                Start booking<br />meetings on autopilot.
              </h2>
              <p className="mt-4 text-primary-foreground/75 text-base leading-relaxed max-w-sm">
                Create your account in 60 seconds and your AI agent can start dialing leads today.
              </p>

              {/* Selected plan badge */}
              {selectedPlan && (
                <div className="mt-8 rounded-2xl bg-white/10 border border-white/15 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60 mb-1">
                    Selected plan
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold">${selectedPlan.price.toFixed(2)}</span>
                    <span className="text-sm text-primary-foreground/70">/ talk min</span>
                    {selectedPlan.isPopular && (
                      <span className="ml-2 text-xs font-semibold uppercase tracking-wide rounded-full bg-white/20 px-2 py-0.5">
                        Most popular
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-semibold">{selectedPlan.name}</div>
                  {selectedPlan.blurb && (
                    <div className="mt-0.5 text-xs text-primary-foreground/60">{selectedPlan.blurb}</div>
                  )}
                  <ul className="mt-3 space-y-1.5">
                    {(selectedPlan.features as string[]).slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-primary-foreground/80">
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-green-300" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/pricing"
                    className="mt-3 text-xs text-primary-foreground/50 hover:text-primary-foreground/80 underline"
                  >
                    Change plan
                  </Link>
                </div>
              )}

              {!selectedPlan && (
                <div className="mt-9 rounded-2xl bg-white/10 border border-white/15 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60 mb-3">
                    What's included
                  </div>
                  <ul className="space-y-2">
                    {BENEFITS.map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-sm text-primary-foreground/85">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-green-300" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right form panel ───────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-10 lg:px-16 bg-background">
          <div className="w-full max-w-[440px]">

            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-10">
              <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-xl">
                <span className="h-9 w-9 rounded-xl bg-primary inline-flex items-center justify-center">
                  <PhoneCall className="h-4 w-4 text-primary-foreground" />
                </span>
                Quor
              </Link>
            </div>

            {registered ? (
              <SuccessState email={userEmail} onGoToDashboard={() => navigate({ to: "/portal" })} />
            ) : (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
                  <p className="mt-1.5 text-muted-foreground text-sm">
                    {selectedPlan
                      ? `You selected the ${selectedPlan.name} plan ($${selectedPlan.price.toFixed(2)}/min). Fill in your details to get started.`
                      : "Fill in your details to get started. No credit card required."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Row: Name + Company */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="name" className="text-sm font-medium">
                          Your name
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={form.name}
                          onChange={(e) => f("name", e.target.value)}
                          placeholder="John Smith"
                          required
                          autoFocus
                          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="company" className="text-sm font-medium">
                          Company
                        </label>
                        <input
                          id="company"
                          type="text"
                          value={form.company}
                          onChange={(e) => f("company", e.target.value)}
                          placeholder="Acme Corp"
                          required
                          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label htmlFor="reg-email" className="text-sm font-medium">
                        Work email
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => f("email", e.target.value)}
                        placeholder="you@company.com"
                        required
                        className="w-full h-10 rounded-lg border border-input bg-background px-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label htmlFor="reg-pw" className="text-sm font-medium">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="reg-pw"
                          type={showPw ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => f("password", e.target.value)}
                          placeholder="Min 8 characters"
                          required
                          minLength={8}
                          className="w-full h-10 rounded-lg border border-input bg-background px-3.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm inline-flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        "Creating account…"
                      ) : (
                        <>
                          Create account <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <p className="text-xs text-muted-foreground text-center">
                      By creating an account you agree to our Terms and Privacy Policy.
                    </p>
                  </form>

                  {/* Login link */}
                  <div className="px-6 py-4 border-t border-border bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link to="/login" className="text-primary font-semibold hover:underline">
                        Sign in →
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Trust row */}
                <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    No credit card required
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5 text-success" />
                    Live in 48 hours
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}

function SuccessState({ email, onGoToDashboard }: { email: string; onGoToDashboard: () => void }) {
  return (
    <div className="text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-5">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Account created!</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed max-w-sm mx-auto">
        Your Quor account is ready. You're logged in as{" "}
        <span className="font-medium text-foreground">{email}</span>.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-left space-y-3 max-w-sm mx-auto">
        {[
          "Upload your lead list to get started",
          "Create your first AI calling script",
          "Launch a campaign and watch meetings get booked",
        ].map((step, i) => (
          <div key={step} className="flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-sm text-muted-foreground">{step}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onGoToDashboard}
          className="h-10 px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Go to dashboard <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
