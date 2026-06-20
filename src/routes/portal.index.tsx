import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { callStatsApi, callsApi, tenantApi, billingApi } from "@/lib/api";
import type { TenantMe } from "@/lib/api";
import type { BillingSummary } from "@/lib/types";
import { CalendarCheck2, PhoneCall, PhoneIncoming, TrendingUp, BadgeCheck, ArrowRight, Zap, Package, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/portal/")({
  head: () => ({ meta: [{ title: "Overview · Client Portal" }] }),
  component: PortalOverview,
});

const OUTCOME_COLORS: Record<string, string> = {
  BOOKED: "#10B981",
  CALLBACK: "#2E86DE",
  NOT_INTERESTED: "#F59E0B",
  VOICEMAIL: "#94A3B8",
  NO_ANSWER: "#CBD5E1",
};

function PortalOverview() {
  const { data: me } = useQuery<TenantMe>({
    queryKey: ["tenant-me"],
    queryFn: tenantApi.me,
    staleTime: 60_000,
  });

  const { data: billing } = useQuery<BillingSummary>({
    queryKey: ["portal-billing-summary"],
    queryFn: () => billingApi.summary(),
    staleTime: 5 * 60_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["call-stats"],
    queryFn: () => callStatsApi.get(),
    refetchInterval: 30_000,
  });

  const { data: callsData } = useQuery({
    queryKey: ["calls-recent"],
    queryFn: () => callsApi.list({ limit: 6 }),
    refetchInterval: 30_000,
  });

  const { data: meetingsData } = useQuery({
    queryKey: ["calls-booked"],
    queryFn: () => callsApi.list({ outcome: "BOOKED", limit: 4 }),
  });

  const recentCalls = callsData?.calls ?? [];
  const upcomingMeetings = meetingsData?.calls ?? [];

  const outcomeChartData = Object.entries({
    BOOKED: stats?.booked ?? 0,
    CALLBACK: stats?.callback ?? 0,
    NOT_INTERESTED: stats?.notInterested ?? 0,
    VOICEMAIL: stats?.voicemail ?? 0,
    NO_ANSWER: stats?.noAnswer ?? 0,
  })
    .filter(([, v]) => v > 0)
    .map(([outcome, count]) => ({
      name: outcome.replace(/_/g, " ").toLowerCase(),
      value: count,
      color: OUTCOME_COLORS[outcome] ?? "#94A3B8",
    }));

  const callbackCount = stats?.callback ?? 0;

  return (
    <DashboardShell sidebar={null} title="Overview" subtitle={me?.plan ? `${me.plan.name} plan · Today's performance` : "Today's calling performance"}>
      {me?.plan && (
        <PlanStatusCard me={me} billing={billing} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total calls"
          value={statsLoading ? "—" : String(stats?.total ?? 0)}
          hint="all time"
          icon={<PhoneCall className="h-4 w-4" />}
        />
        <StatCard
          label="Meetings booked"
          value={statsLoading ? "—" : String(stats?.booked ?? 0)}
          hint="all time"
          icon={<CalendarCheck2 className="h-4 w-4" />}
        />
        <StatCard
          label="Conversion rate"
          value={statsLoading ? "—" : `${stats?.conversionRate ?? 0}%`}
          hint="booked / total"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Callbacks pending"
          value={statsLoading ? "—" : String(callbackCount)}
          hint="scheduled"
          icon={<PhoneIncoming className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="font-semibold">Calls this week</div>
          <div className="text-xs text-muted-foreground">Daily breakdown</div>
          <div className="h-72 mt-4">
            <ResponsiveContainer>
              <BarChart data={stats?.callsByDay ?? []} margin={{ left: -10, right: 8 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
                />
                <Bar dataKey="calls" fill="#2E86DE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="booked" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="font-semibold">Call outcomes</div>
          <div className="text-xs text-muted-foreground">Last 7 days</div>
          <div className="h-72 mt-4">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={outcomeChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {outcomeChartData.map((o, i) => (
                    <Cell key={i} fill={o.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border font-semibold">Recent calls</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Contact</th>
                <th className="text-left font-medium px-3 py-2.5">Duration</th>
                <th className="text-left font-medium px-3 py-2.5">Outcome</th>
                <th className="text-right font-medium px-5 py-2.5">When</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="font-medium">{c.lead?.name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{c.lead?.company}</div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {c.duration !== null && c.duration !== undefined
                      ? `${Math.floor(c.duration / 60)}:${String(c.duration % 60).padStart(2, "0")}`
                      : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <OutcomeBadge outcome={c.outcome ?? ""} />
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                    {formatRelative(c.createdAt)}
                  </td>
                </tr>
              ))}
              {recentCalls.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm">
                    No calls yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="p-5 border-b border-border font-semibold">Upcoming meetings</div>
          <ul className="divide-y divide-border">
            {upcomingMeetings.map((m) => (
              <li key={m.id} className="p-4 flex items-start gap-3">
                <span className="h-9 w-9 rounded-md bg-accent/10 text-accent inline-flex items-center justify-center shrink-0">
                  <CalendarCheck2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{m.lead?.name ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{m.lead?.company}</div>
                  <div className="text-xs text-accent mt-1">
                    {m.meetingAt ? new Date(m.meetingAt).toLocaleString() : ""}
                  </div>
                </div>
              </li>
            ))}
            {upcomingMeetings.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground text-center">
                No meetings booked yet
              </li>
            )}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}

function PlanStatusCard({ me, billing }: { me: TenantMe; billing?: BillingSummary }) {
  const plan = me.plan!;
  const usedMinutes  = billing?.totalMinutes ?? 0;
  const totalMinutes = plan.minutesIncluded;
  const pct          = totalMinutes > 0 ? Math.min((usedMinutes / totalMinutes) * 100, 100) : 0;
  const remaining    = Math.max(totalMinutes - usedMinutes, 0);
  const monthlyTotal = plan.price > 0 ? `$${(plan.price * plan.minutesIncluded).toFixed(0)}/mo` : "Free";

  const barColor =
    pct >= 90 ? "bg-destructive" :
    pct >= 70 ? "bg-warning" :
    "bg-success";

  const statusBadge =
    pct >= 90 ? { label: "Critical", cls: "bg-destructive/10 text-destructive" } :
    pct >= 70 ? { label: "Running low", cls: "bg-warning/10 text-warning" } :
    { label: "Active", cls: "bg-success/10 text-success" };

  const features = plan.features;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{plan.name} Plan</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadge.cls}`}>
                {pct >= 90 ? <AlertTriangle className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />}
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan.price === 0 ? "Free tier" : `$${plan.price.toFixed(2)}/min · ${monthlyTotal}`}
            </p>
          </div>
        </div>
        <Link
          to="/portal/billing"
          search={{ checkout: undefined }}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
        >
          Manage plan <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Body */}
      <div className="px-5 py-4 grid gap-5 lg:grid-cols-2">
        {/* Left: minutes usage */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Minutes this month</span>
            <span className="text-xs font-semibold tabular-nums">
              {usedMinutes.toFixed(0)} / {totalMinutes.toLocaleString()} min
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{pct.toFixed(0)}% used</span>
            <span className={
              remaining === 0
                ? "text-destructive font-medium"
                : remaining < totalMinutes * 0.1
                ? "text-warning font-medium"
                : "text-muted-foreground"
            }>
              {remaining === 0
                ? "Limit reached"
                : `${remaining.toFixed(0)} min remaining`}
            </span>
          </div>

          {/* Usage breakdown */}
          {billing && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Used</div>
                <div className="text-base font-bold tabular-nums mt-0.5">{usedMinutes.toFixed(1)} min</div>
                <div className="text-[11px] text-muted-foreground">${billing.totalAmount.toFixed(2)} billed</div>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Remaining</div>
                <div className="text-base font-bold tabular-nums mt-0.5">{remaining.toFixed(0)} min</div>
                <div className="text-[11px] text-muted-foreground">
                  ~${(remaining * plan.price).toFixed(2)} value left
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: features */}
        {features.length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Included features</span>
            <ul className="mt-2 space-y-1.5">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <BadgeCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Warning footer when near limit */}
      {pct >= 80 && (
        <div className={`px-5 py-3 border-t border-border flex items-center justify-between ${pct >= 90 ? "bg-destructive/5" : "bg-warning/5"}`}>
          <p className={`text-xs font-medium ${pct >= 90 ? "text-destructive" : "text-warning"}`}>
            {pct >= 90
              ? "You've used 90%+ of your plan minutes. Upgrade to avoid interruptions."
              : "You're approaching your monthly minute limit. Consider upgrading soon."}
          </p>
          <Link
            to="/portal/billing"
            search={{ checkout: undefined }}
            className={`text-xs font-semibold hover:underline shrink-0 ml-4 ${pct >= 90 ? "text-destructive" : "text-warning"}`}
          >
            Upgrade now →
          </Link>
        </div>
      )}
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, string> = {
    booked: "bg-success/10 text-success",
    callback: "bg-accent/10 text-accent",
    voicemail: "bg-muted text-muted-foreground",
    not_interested: "bg-warning/10 text-warning",
    no_answer: "bg-muted text-muted-foreground",
  };
  const label = outcome.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[outcome] ?? "bg-muted text-muted-foreground"}`}
    >
      {label}
    </span>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
