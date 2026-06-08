import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { callOutcomes, callsByHour, portalKpis, recentCalls, upcomingMeetings } from "@/lib/mock";
import { CalendarCheck2, PhoneCall, PhoneIncoming, Timer } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/portal/")({
  head: () => ({ meta: [{ title: "Overview · Client Portal" }] }),
  component: PortalOverview,
});

function PortalOverview() {
  return (
    <DashboardShell sidebar={null} title="Overview" subtitle="Today's calling performance">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total calls" value={portalKpis.totalCalls.toLocaleString()} delta={12} hint="vs last week" icon={<PhoneCall className="h-4 w-4"/>}/>
        <StatCard label="Meetings booked" value={String(portalKpis.meetings)} delta={24} hint="vs last week" icon={<CalendarCheck2 className="h-4 w-4"/>}/>
        <StatCard label="Minutes used" value={portalKpis.minutes.toLocaleString()} delta={9} hint="this month" icon={<Timer className="h-4 w-4"/>}/>
        <StatCard label="Callbacks due" value={String(portalKpis.callbacks)} delta={-3} hint="vs last week" icon={<PhoneIncoming className="h-4 w-4"/>}/>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="font-semibold">Calls today</div>
          <div className="text-xs text-muted-foreground">8 AM – 5 PM · America/Toronto</div>
          <div className="h-72 mt-4">
            <ResponsiveContainer>
              <BarChart data={callsByHour} margin={{ left: -10, right: 8 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="h" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }}/>
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }}/>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}/>
                <Bar dataKey="calls" fill="#2E86DE" radius={[4,4,0,0]}/>
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
                <Pie data={callOutcomes} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {callOutcomes.map((o,i)=><Cell key={i} fill={o.color}/>)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8}/>
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
              <tr><th className="text-left font-medium px-5 py-2.5">Contact</th><th className="text-left font-medium px-3 py-2.5">Duration</th><th className="text-left font-medium px-3 py-2.5">Outcome</th><th className="text-right font-medium px-5 py-2.5">When</th></tr>
            </thead>
            <tbody>
              {recentCalls.map(c=>(
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-3"><div className="font-medium">{c.contact}</div><div className="text-xs text-muted-foreground">{c.company}</div></td>
                  <td className="px-3 py-3 tabular-nums">{c.duration}</td>
                  <td className="px-3 py-3"><OutcomeBadge outcome={c.outcome}/></td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">{c.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="p-5 border-b border-border font-semibold">Upcoming meetings</div>
          <ul className="divide-y divide-border">
            {upcomingMeetings.map(m=>(
              <li key={m.id} className="p-4 flex items-start gap-3">
                <span className="h-9 w-9 rounded-md bg-accent/10 text-accent inline-flex items-center justify-center"><CalendarCheck2 className="h-4 w-4"/></span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{m.contact}</div>
                  <div className="text-xs text-muted-foreground">{m.company}</div>
                  <div className="text-xs text-accent mt-1">{m.when}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string,string> = {
    "Meeting booked": "bg-success/10 text-success",
    "Callback": "bg-accent/10 text-accent",
    "Voicemail": "bg-muted text-muted-foreground",
    "Not interested": "bg-warning/10 text-warning",
    "No answer": "bg-muted text-muted-foreground",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[outcome] ?? "bg-muted text-muted-foreground"}`}>{outcome}</span>;
}
