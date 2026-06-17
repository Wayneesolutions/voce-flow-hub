import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { tenantApi } from "@/lib/api";
import { CheckCircle2, ArrowRight, Zap, BadgeCheck, PhoneCall, Clock, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  head: () => ({ meta: [{ title: "Payment Successful" }] }),
  component: CheckoutSuccess,
});

const REDIRECT_SECS = 6;

function CheckoutSuccess() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECS);
  const [planReady, setPlanReady] = useState(false);
  const pollCount = useRef(0);

  // Poll until the webhook fires and plan is assigned (max ~10 seconds)
  const { data: me } = useQuery({
    queryKey: ["tenant-me-success"],
    queryFn: tenantApi.me,
    refetchInterval: (query) => {
      if (query.state.data?.plan) return false; // stop polling once plan is set
      if (pollCount.current > 8) return false;   // give up after 8 tries
      pollCount.current++;
      return 1200;
    },
    staleTime: 0,
  });

  const plan = me?.plan ?? null;

  // Once plan is loaded, mark ready and start countdown
  useEffect(() => {
    if (plan && !planReady) setPlanReady(true);
  }, [plan]);

  // Start countdown after a short grace period regardless of plan load
  useEffect(() => {
    const start = setTimeout(() => {
      const tick = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(tick);
            navigate({ to: "/portal" });
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearInterval(tick);
    }, 800);
    return () => clearTimeout(start);
  }, []);

  const progress = ((REDIRECT_SECS - secondsLeft) / REDIRECT_SECS) * 100;

  const defaultFeatures = [
    "AI-powered outbound calling",
    "Automated lead follow-up",
    "Real-time call analytics",
    "Campaign management",
  ];

  const features: string[] = plan?.features?.length ? plan.features : defaultFeatures;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-success/5 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-bounce"
            style={{
              width: `${4 + (i % 3) * 4}px`,
              height: `${4 + (i % 3) * 4}px`,
              background: i % 3 === 0 ? 'hsl(var(--success) / 0.4)' : i % 3 === 1 ? 'hsl(var(--accent) / 0.4)' : 'hsl(var(--primary) / 0.3)',
              left: `${8 + (i * 7.5) % 84}%`,
              top: `${10 + (i * 11) % 70}%`,
              animationDuration: `${2 + (i % 4) * 0.7}s`,
              animationDelay: `${(i % 5) * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Checkmark */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center ring-8 ring-success/10">
              <CheckCircle2 className="h-12 w-12 text-success" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            {plan
              ? <>Your <span className="font-semibold text-foreground">{plan.name}</span> plan is now active.</>
              : "Your plan is being activated…"}
          </p>
        </div>

        {/* Plan card */}
        <div className="rounded-xl border border-success/20 bg-success/5 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-success" />
              <span className="font-semibold">
                {plan ? plan.name : "Your plan"}
              </span>
            </div>
            {plan && (
              <span className="text-sm text-muted-foreground">
                {plan.minutesIncluded.toLocaleString()} min/month
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {features.slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <BadgeCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick start tiles */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: <PhoneCall className="h-5 w-5" />, label: "Upload Leads", sub: "Start calling" },
            { icon: <BarChart3 className="h-5 w-5" />, label: "View Dashboard", sub: "See analytics" },
            { icon: <Clock className="h-5 w-5" />, label: "Set Schedule", sub: "Call hours" },
          ].map((tile) => (
            <div
              key={tile.label}
              className="rounded-lg border border-border bg-card p-3 text-center"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent mb-2">
                {tile.icon}
              </div>
              <div className="text-xs font-medium">{tile.label}</div>
              <div className="text-xs text-muted-foreground">{tile.sub}</div>
            </div>
          ))}
        </div>

        {/* CTA + auto-redirect */}
        <button
          onClick={() => navigate({ to: "/portal" })}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mb-4"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </button>

        {/* Countdown bar */}
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Redirecting to dashboard in {secondsLeft}s…
          </p>
        </div>

      </div>
    </div>
  );
}
