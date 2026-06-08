import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { billingTotals, clients } from "@/lib/mock";
import { DollarSign, TrendingUp, Timer, Download, Receipt } from "lucide-react";

export const Route = createFileRoute("/admin/billing")({
  head: () => ({ meta: [{ title: "Billing · VoCallM Admin" }] }),
  component: Billing,
});

function Billing() {
  return (
    <DashboardShell
      sidebar={null}
      title="Billing"
      subtitle="Revenue, cost & margin across the platform"
      actions={
        <>
          <select className="h-9 rounded-md border border-border bg-background px-3 text-sm"><option>June 2026</option><option>May 2026</option></select>
          <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Download className="h-4 w-4"/>Export CSV</button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total minutes" value={billingTotals.minutes.toLocaleString()} icon={<Timer className="h-4 w-4"/>} delta={9}/>
        <StatCard label="Revenue" value={`$${billingTotals.revenue.toLocaleString()}`} icon={<DollarSign className="h-4 w-4"/>} delta={14}/>
        <StatCard label="Platform cost" value={`$${billingTotals.cost.toLocaleString()}`} icon={<Receipt className="h-4 w-4"/>} delta={6} hint="Twilio + Deepgram + GPT + ElevenLabs"/>
        <StatCard label="Gross profit" value={`$${billingTotals.profit.toLocaleString()}`} icon={<TrendingUp className="h-4 w-4"/>} delta={11} hint="60% margin"/>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-semibold">Per-client billing</div>
            <div className="text-xs text-muted-foreground">Cost calculated at $0.12/min platform cost</div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">Client</th>
              <th className="text-right font-medium px-3 py-2.5">Minutes</th>
              <th className="text-right font-medium px-3 py-2.5">Rate</th>
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
                <td className="px-3 py-3 text-right tabular-nums">${c.rate.toFixed(2)}</td>
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
              <td className="px-3 py-3 text-right tabular-nums font-semibold">{billingTotals.minutes.toLocaleString()}</td>
              <td className="px-3 py-3 text-right tabular-nums">—</td>
              <td className="px-3 py-3 text-right tabular-nums font-semibold">${billingTotals.revenue.toLocaleString()}</td>
              <td className="px-3 py-3 text-right tabular-nums">${billingTotals.cost.toLocaleString()}</td>
              <td className="px-3 py-3 text-right tabular-nums font-semibold">${billingTotals.profit.toLocaleString()}</td>
              <td className="px-5 py-3 text-right font-semibold">60%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
