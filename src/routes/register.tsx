import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Request access · VoCallM" }] }),
  component: RegisterPage,
});

const STEPS = [
  {
    step: "01",
    title: "Submit your request",
    body: "Tell us about your company, team size, and outbound goals.",
  },
  {
    step: "02",
    title: "We review in 24 hours",
    body: "Our team sets up your dedicated portal with custom branding and numbers.",
  },
  {
    step: "03",
    title: "Go live in 48 hours",
    body: "Upload leads, approve your script, and your AI agent starts dialing.",
  },
];

const BENEFITS = [
  "Dedicated white-label client portal",
  "AI agent trained on your script",
  "Real-time call transcripts + recordings",
  "Calendar & CRM integrations",
  "US, Canada, and Dubai coverage",
  "No setup fees. Pay per minute.",
];

const COUNTRIES = ["United States", "Canada", "United Arab Emirates", "United Kingdom", "Australia", "Other"];

const defaultForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  message: "",
};

function RegisterPage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const f = (key: keyof typeof form, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Simulate request (backend provisioning is done manually by admin)
      await new Promise((r) => setTimeout(r, 900));
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketingShell>
      <div className="flex flex-col lg:flex-row flex-1">

        {/* ── Left info panel ───────────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-[44%] xl:w-[42%] bg-primary text-primary-foreground relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute bottom-10 -left-20 h-44 w-44 rounded-full bg-white/5 pointer-events-none" />

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
                <Sparkles className="h-3 w-3" />
                GPT-4o powered · Live in 48 hours
              </div>
              <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
                Start booking<br />meetings on autopilot.
              </h2>
              <p className="mt-4 text-primary-foreground/75 text-base leading-relaxed max-w-sm">
                Join 340+ businesses using VoCallM to fill their sales calendar with qualified
                meetings — without hiring SDRs.
              </p>

              {/* How it works */}
              <div className="mt-9 space-y-5">
                {STEPS.map(({ step, title, body }) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-white/15 inline-flex items-center justify-center text-xs font-bold tabular-nums">
                      {step}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{title}</div>
                      <div className="text-xs text-primary-foreground/65 mt-0.5 leading-relaxed">
                        {body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-10 rounded-2xl bg-white/10 border border-white/15 p-5">
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
                VoCallM
              </Link>
            </div>

            {submitted ? (
              <SuccessState email={form.email} />
            ) : (
              <>
                {/* Heading */}
                <div className="mb-7">
                  <h1 className="text-2xl font-bold tracking-tight">Request access</h1>
                  <p className="mt-1.5 text-muted-foreground text-sm">
                    Tell us about yourself and we'll get your portal ready within 24 hours.
                  </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Row: Name + Company */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="name" className="text-sm font-medium">
                          Full name
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

                    {/* Row: Phone + Country */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="phone" className="text-sm font-medium">
                          Phone{" "}
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => f("phone", e.target.value)}
                          placeholder="+1 212 555 0000"
                          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="country" className="text-sm font-medium">
                          Country
                        </label>
                        <select
                          id="country"
                          value={form.country}
                          onChange={(e) => f("country", e.target.value)}
                          required
                          className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition"
                        >
                          <option value="" disabled>
                            Select…
                          </option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label htmlFor="message" className="text-sm font-medium">
                        What's your goal?{" "}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <textarea
                        id="message"
                        rows={3}
                        value={form.message}
                        onChange={(e) => f("message", e.target.value)}
                        placeholder="e.g. Book 20+ demos per month for our SaaS product targeting SMBs in the US…"
                        className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition resize-none"
                      />
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
                      className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm inline-flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        "Submitting…"
                      ) : (
                        <>
                          Request access <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
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
                    <Clock className="h-3.5 w-3.5" />
                    Response within 24 hours
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

function SuccessState({ email }: { email: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-5">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Request received!</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed max-w-sm mx-auto">
        Thanks for your interest in VoCallM. We've received your request and will reach out to{" "}
        <span className="font-medium text-foreground">{email}</span> within 24 hours to set up your
        portal.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-left space-y-3 max-w-sm mx-auto">
        {[
          "Check your inbox for a confirmation email",
          "Our team will set up your branded portal",
          "You'll be live and calling leads in 48 hours",
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
        <Link
          to="/"
          className="h-10 px-6 inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-secondary transition-colors"
        >
          Back to home
        </Link>
        <Link
          to="/how-it-works"
          className="h-10 px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          See how it works <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
