import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { inboundAnalyticsApi } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { PhoneIncoming, Clock, ArrowRightLeft, Radio, Loader2 } from "lucide-react";

export const Route = createFileRoute("/portal/inbound/analytics")({
  head: () => ({ meta: [{ title: "Inbound Analytics · Portal" }] }),
  component: InboundAnalyticsPage,
});

const OUTCOME_COLORS: Record<string, string> = {
  COMPLETED:   "#22c55e",
  TRANSFERRED: "#3b82f6",
  VOICEMAIL:   "#a855f7",
  NO_ANSWER:   "#ef4444",
  FAILED:      "#6b7280",
};

function formatDuration(s: number) {
  if (!s) return "0s";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function InboundAnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ["inbound-analytics", days],
    queryFn: () => inboundAnalyticsApi.get({ days }),
    refetchInterval: 60_000,
  });

  const s = data?.summary;

  return (
    <DashboardShell title="Inbound Analytics" subtitle="Call performance metrics for your AI receptionist." sidebar={null}>
      <div className="space-y-6">
        {/* Period filter */}
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`h-8 px-4 rounded-md text-sm font-medium transition-colors border ${
                days === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : !s ? null : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Calls"
                value={String(s.totalCalls)}
                icon={<PhoneIncoming className="h-4 w-4" />}
              />
              <StatCard
                title="Avg Duration"
                value={formatDuration(s.avgDuration)}
                icon={<Clock className="h-4 w-4" />}
              />
              <StatCard
                title="Transfer Rate"
                value={`${s.transferRate}%`}
                icon={<ArrowRightLeft className="h-4 w-4" />}
              />
              <StatCard
                title="Live Now"
                value={String(s.liveNow)}
                icon={<Radio className="h-4 w-4" />}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calls per day */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-4">Calls per Day</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data?.daily || []} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" name="Calls" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Outcome breakdown */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-4">Outcome Breakdown</h3>
                {(data?.byOutcome || []).filter((o) => o.outcome && o.count > 0).length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={(data?.byOutcome || []).filter((o) => o.outcome && o.count > 0)}
                        dataKey="count"
                        nameKey="outcome"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ outcome, percent }) => `${outcome} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {(data?.byOutcome || []).map((entry) => (
                          <Cell key={entry.outcome || "unknown"} fill={OUTCOME_COLORS[entry.outcome || ""] || "#6b7280"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Peak hours */}
              <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold mb-4">Peak Calling Hours</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data?.byHour || []} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(h: number) => `${h}:00`}
                    />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      labelFormatter={(h: number) => `${h}:00 – ${h + 1}:00`}
                    />
                    <Bar dataKey="count" name="Calls" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
