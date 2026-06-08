import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, PhoneCall, Timer, CalendarCheck2, DollarSign, TrendingUp, Plus, ArrowRight, Clock } from "lucide-react";
import { adminKpis, clients, pendingScripts, revenueByMonth } from "@/lib/mock";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard · VoCallM" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <DashboardShell
      sidebar={null}
      title="Dashboard"
      subtitle="Real-time business performance across all clients"
      actions={
        <>
          <button className="h-9 px-3 rounded-md border border-border bg-background text-sm hover:bg-secondary">Export</button>
          <Link to="/admin/clients" className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Plus className="h-4 w-4"/>New client</Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active clients" value={String(adminKpis.activeClients)} delta={12} hint="vs last month" icon={<Users className="h-4 w-4"/>} />
        <StatCard label="Calls today" value={adminKpis.callsToday.toLocaleString()} delta={8} hint="vs yesterday" icon={<PhoneCall className="h-4 w-4"/>} />
        <StatCard label="Minutes used" value={adminKpis.minutesUsed.toLocaleString()} delta={6} hint="this month" icon={<Timer className="h-4 w-4"/>} />
        <StatCard label="Meetings booked" value={String(adminKpis.meetingsBooked)} delta={18} hint="this month" icon={<CalendarCheck2 className="h-4 w-4"/>} />
        <StatCard label="Revenue" value={`$${adminKpis.revenue.toLocaleString()}`} delta={14} hint="MTD" icon={<DollarSign className="h-4 w-4"/>} />
        <StatCard label="Gross profit" value={`$${adminKpis.profit.toLocaleString()}`} delta={11} hint="60% margin" icon={<TrendingUp className="h-4 w-4"/>} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Revenue & profit</div>
              <div className="text-xs text-muted-foreground">Last 6 months</div>
            </div>
            <select className="h-8 text-xs rounded-md border border-border bg-background px-2"><option>6 months</option><option>12 months</option></select>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={revenueByMonth} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E86DE" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#2E86DE" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
                <Area dataKey="revenue" stroke="#2E86DE" strokeWidth={2} fill="url(#rev)" />
                <Area dataKey="profit" stroke="#10B981" strokeWidth={2} fill="url(#prof)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Revenue by client</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={clients} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#2E86DE" radius={[4,4,0,0]} />
                <Bar dataKey="profit" fill="#10B981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="font-semibold">Clients · profitability</div>
            <Link to="/admin/clients" className="text-xs text-accent hover:underline inline-flex items-center gap-1">View all <ArrowRight className="h-3 w-3"/></Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Client</th>
                <th className="text-right font-medium px-3 py-2.5">Minutes</th>
                <th className="text-right font-medium px-3 py-2.5">Revenue</th>
                <th className="text-right font-medium px-3 py-2.5">Cost</th>
                <th className="text-right font-medium px-3 py-2.5">Profit</th>
                <th className="text-right font-medium px-5 py-2.5">Margin</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c)=>(
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.minutes.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right tabular-nums">${c.revenue.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">${c.cost.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium text-success">${c.profit.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-medium">{Math.round((c.profit/c.revenue)*100)}%</span>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-border bg-primary text-primary-foreground">
                <td className="px-5 py-3 font-semibold">Total</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">{clients.reduce((a,c)=>a+c.minutes,0).toLocaleString()}</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">${clients.reduce((a,c)=>a+c.revenue,0).toLocaleString()}</td>
                <td className="px-3 py-3 text-right tabular-nums">${clients.reduce((a,c)=>a+c.cost,0).toLocaleString()}</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">${clients.reduce((a,c)=>a+c.profit,0).toLocaleString()}</td>
                <td className="px-5 py-3 text-right font-semibold">60%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <div className="font-semibold">Pending approvals</div>
              <div className="text-xs text-muted-foreground">Scripts waiting for review</div>
            </div>
            <span className="rounded-full bg-warning/10 text-warning text-xs font-semibold px-2 py-0.5">{pendingScripts.length}</span>
          </div>
          <ul className="divide-y divide-border">
            {pendingScripts.map((s)=>(
              <li key={s.id} className="p-5 flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md bg-warning/10 text-warning"><Clock className="h-4 w-4"/></span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.client} · submitted {s.submitted}</div>
                </div>
                <Link to="/admin/scripts" className="text-xs font-medium text-accent hover:underline">Review</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
