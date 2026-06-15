import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { callStatsApi, callsApi } from "@/lib/api";
import { CalendarCheck2, PhoneCall, PhoneIncoming, TrendingUp } from "lucide-react";
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
    <DashboardShell sidebar={null} title="Overview" subtitle="Today's calling performance">
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
                    {c.duration
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
