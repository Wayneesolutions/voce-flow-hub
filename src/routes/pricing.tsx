import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { publicPlansApi } from "@/lib/api";
import type { Plan } from "@/lib/types";
import { ArrowRight, BadgeCheck, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "VoCallM Pricing — pay per talk minute" },
      {
        name: "description",
        content: "Transparent per-minute pricing. Use the calculator to compare AI vs a human SDR.",
      },
    ],
  }),
  component: Pricing,
});

// Fallback tiers used while the API loads or if no plans exist in DB yet
const FALLBACK_TIERS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Test the waters",
    price: 0.35,
    minutesIncluded: 1000,
    features: ["1 phone number", "1 campaign", "Standard voice", "Email support", "Web dashboard"],
    isActive: true,
    isPopular: false,
    displayOrder: 0,
  },
  {
    id: "growth",
    name: "Growth",
    blurb: "Most popular",
    price: 0.3,
    minutesIncluded: 5000,
    features: [
      "5 phone numbers",
      "Unlimited campaigns",
      "Premium voices",
      "White-label portal",
      "Calendar + CRM integrations",
      "Account manager on WhatsApp",
    ],
    isActive: true,
    isPopular: true,
    displayOrder: 1,
  },
  {
    id: "scale",
    name: "Scale",
    blurb: "Agencies & enterprise",
    price: 0.25,
    minutesIncluded: 0,
    features: [
      "Custom phone numbers pool",
      "Multi-tenant white-label",
      "Custom domains",
      "SSO + audit logs",
      "SLA + priority routing",
      "Dedicated account team",
    ],
    isActive: true,
    isPopular: false,
    displayOrder: 2,
  },
];

function Pricing() {
  const [minutes, setMinutes] = useState(2000);
  const [rate, setRate] = useState(0.3);
  const cost = useMemo(() => (minutes * rate).toFixed(0), [minutes, rate]);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["public", "plans"],
    queryFn: publicPlansApi.list,
    staleTime: 5 * 60 * 1000,
  });

  const tiers = plans.length > 0 ? plans : FALLBACK_TIERS;

  return (
    <MarketingShell>
      <section className="border-b border-border">
        <div className="container-page py-20 text-center max-w-3xl mx-auto">
          <p className="text-sm font-medium text-accent uppercase tracking-widest">Pricing</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
            Pay only for what the AI talks.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            No setup fees. No retainers. No per-seat pricing. One rate per talk minute, billed
            monthly.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {tiers.map((t) => (
              <div
                key={t.id}
                className={`rounded-xl border bg-card p-6 flex flex-col ${t.isPopular ? "border-accent ring-2 ring-accent/30" : "border-border"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t.name}</div>
                  {t.isPopular && (
                    <span className="text-xs font-semibold uppercase tracking-wide rounded-full bg-accent/10 text-accent px-2.5 py-1">
                      Most popular
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{t.blurb}</div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">${t.price.toFixed(2)}</span>
                  <span className="text-muted-foreground text-sm">/ talk minute</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t.minutesIncluded > 0
                    ? `Up to ${t.minutesIncluded.toLocaleString()} talk min/mo`
                    : "Unlimited talk minutes"}
                </div>
                <ul className="mt-6 space-y-2.5 text-sm flex-1">
                  {(t.features as string[]).map((f) => (
                    <li key={f} className="flex gap-2">
                      <BadgeCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  search={{ plan: t.id }}
                  className={`mt-6 inline-flex h-10 items-center justify-center rounded-md text-sm font-medium ${t.isPopular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border bg-background hover:bg-secondary"}`}
                >
                  Get started <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Calculator */}
      <section className="border-y border-border bg-muted/40">
        <div className="container-page py-16 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Calculate your monthly cost</h2>
            <p className="mt-3 text-muted-foreground">
              Drag the slider to estimate. Most clients average 2,500–4,500 talk minutes per month.
            </p>
            <div className="mt-8 rounded-lg border border-border bg-card p-6 space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Talk minutes / month</span>
                  <span className="font-semibold">{minutes.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={10000}
                  step={500}
                  value={minutes}
                  onChange={(e) => setMinutes(+e.target.value)}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>500</span>
                  <span>10,000</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Plan</div>
                <div className="grid grid-cols-3 gap-2">
                  {tiers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setRate(t.price)}
                      className={`h-10 text-sm rounded-md border ${rate === t.price ? "border-accent bg-accent/10 text-accent font-medium" : "border-border hover:bg-secondary"}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="text-sm text-muted-foreground">Estimated monthly cost</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight">${(+cost).toLocaleString()}</span>
              <span className="text-muted-foreground">/ month</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {minutes.toLocaleString()} min × ${rate.toFixed(2)}
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <div className="text-sm font-semibold mb-3">Versus a human SDR</div>
              <CompareRow label="Salary + benefits" ai={+cost} human={6500} />
              <CompareRow
                label="Calls per month"
                ai={Math.round(minutes / 2)}
                human={1200}
                suffix=" calls"
              />
              <CompareRow label="Works weekends" aiOk humanOk={false} />
              <CompareRow label="Ramp time" aiText="48 hours" humanText="3 months" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container-page py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Want a custom quote for your team?
          </h3>
          <Link
            to="/contact"
            className="inline-flex h-11 px-6 items-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90"
          >
            Talk to sales <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

function CompareRow({
  label,
  ai,
  human,
  suffix,
  aiOk,
  humanOk,
  aiText,
  humanText,
}: {
  label: string;
  ai?: number;
  human?: number;
  suffix?: string;
  aiOk?: boolean;
  humanOk?: boolean;
  aiText?: string;
  humanText?: string;
}) {
  const renderCell = (val?: number, ok?: boolean, text?: string) => {
    if (typeof ok === "boolean")
      return ok ? (
        <BadgeCheck className="h-4 w-4 text-success" />
      ) : (
        <X className="h-4 w-4 text-destructive" />
      );
    if (text) return <span>{text}</span>;
    return (
      <span>
        ${val?.toLocaleString()}
        {suffix ?? ""}
      </span>
    );
  };
  return (
    <div className="grid grid-cols-3 items-center py-2 text-sm border-b border-border last:border-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium text-accent">
        {ai !== undefined ? renderCell(ai, aiOk, aiText) : renderCell(undefined, aiOk, aiText)}
      </div>
      <div className="font-medium text-foreground">
        {human !== undefined
          ? renderCell(human, humanOk, humanText)
          : renderCell(undefined, humanOk, humanText)}
      </div>
    </div>
  );
}
