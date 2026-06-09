import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { adminBillingApi } from "@/lib/api";
import type { AdminBillingSummary } from "@/lib/types";
import { DollarSign, TrendingUp, Timer, Download, Receipt } from "lucide-react";

export const Route = createFileRoute("/admin/billing")({
  head: () => ({ meta: [{ title: "Billing · VoCallM Admin" }] }),
  component: Billing,
});

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Billing() {
  const [month, setMonth] = useState(currentMonth());

  const { data: rows = [], isLoading } = useQuery<AdminBillingSummary[]>({
    queryKey: ["admin", "billing", month],
    queryFn: () => adminBillingApi.summary(month),
  });

  const totalMinutes = rows.reduce((s, r) => s + r.totalMinutes, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.totalRevenue, 0);
  const totalCost = rows.reduce((s, r) => s + r.platformCost, 0);
  const totalProfit = rows.reduce((s, r) => s + r.grossProfit, 0);

  // Generate last 6 months for the selector
  const months: string[] = [];
  const d = new Date();
  for (let i = 0; i < 6; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <DashboardShell
      sidebar={null}
      title="Billing"
      subtitle="Revenue, cost & margin across the platform"
      actions={
        <>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            {months.map((m) => {
              const [y, mo] = m.split("-");
              const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
          <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total minutes" value={totalMinutes.toLocaleString()} icon={<Timer className="h-4 w-4" />} />
        <StatCard label="Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard
          label="Platform cost"
          value={`$${totalCost.toFixed(2)}`}
          icon={<Receipt className="h-4 w-4" />}
          hint="Twilio + Deepgram + GPT + ElevenLabs"
        />
        <StatCard
          label="Gross profit"
          value={`$${totalProfit.toFixed(2)}`}
          icon={<TrendingUp className="h-4 w-4" />}
          hint={totalRevenue > 0 ? `${Math.round((totalProfit / totalRevenue) * 100)}% margin` : ""}
        />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="font-semibold">Per-client billing</div>
          <div className="text-xs text-muted-foreground">Platform cost calculated at $0.12/min</div>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No billing data for this month.</div>
        ) : (
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
              {rows.map((r) => {
                const margin = r.totalRevenue > 0
                  ? Math.round((r.grossProfit / r.totalRevenue) * 100)
                  : 0;
                return (
                  <tr key={r.tenant.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{r.tenant.name}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{r.totalMinutes.toFixed(1)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">${r.tenant.ratePerMinute.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">${r.totalRevenue.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">${r.platformCost.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-success">${r.grossProfit.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-medium">
                        {margin}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-border bg-primary text-primary-foreground">
                <td className="px-5 py-3 font-semibold">Total</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">{totalMinutes.toFixed(1)}</td>
                <td className="px-3 py-3 text-right">—</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">${totalRevenue.toFixed(2)}</td>
                <td className="px-3 py-3 text-right tabular-nums">${totalCost.toFixed(2)}</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">${totalProfit.toFixed(2)}</td>
                <td className="px-5 py-3 text-right font-semibold">
                  {totalRevenue > 0 ? `${Math.round((totalProfit / totalRevenue) * 100)}%` : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
