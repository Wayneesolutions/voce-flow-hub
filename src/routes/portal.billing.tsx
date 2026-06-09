import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { billingApi } from "@/lib/api";
import { Timer, DollarSign, PhoneCall, Receipt, Loader2 } from "lucide-react";

export const Route = createFileRoute("/portal/billing")({
  head: () => ({ meta: [{ title: "Billing · Client Portal" }] }),
  component: PortalBilling,
});

function PortalBilling() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["portal-billing-summary"],
    queryFn: () => billingApi.summary(),
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["portal-billing-history"],
    queryFn: billingApi.history,
  });

  return (
    <DashboardShell sidebar={null} title="Billing" subtitle="Usage and invoice history">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rate per minute"
          value={summaryLoading ? "—" : `$${summary?.ratePerMinute.toFixed(2) ?? "0.00"}`}
          icon={<DollarSign className="h-4 w-4" />}
          hint="your plan rate"
        />
        <StatCard
          label="Minutes used"
          value={summaryLoading ? "—" : (summary?.totalMinutes.toFixed(1) ?? "0")}
          icon={<Timer className="h-4 w-4" />}
          hint="this period"
        />
        <StatCard
          label="Amount billed"
          value={summaryLoading ? "—" : `$${summary?.totalAmount.toFixed(2) ?? "0.00"}`}
          icon={<Receipt className="h-4 w-4" />}
          hint="this period"
        />
        <StatCard
          label="Billable calls"
          value={summaryLoading ? "—" : String(history.length)}
          icon={<PhoneCall className="h-4 w-4" />}
          hint="with usage"
        />
      </div>

      {summary && (
        <p className="mt-3 text-xs text-muted-foreground">
          Period:{" "}
          {new Date(summary.period.from).toLocaleDateString()} –{" "}
          {new Date(summary.period.to).toLocaleDateString()}
        </p>
      )}

      <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border font-semibold">Usage log</div>
        {historyLoading ? (
          <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No usage recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Date</th>
                <th className="text-right font-medium px-3 py-2.5">Minutes</th>
                <th className="text-right font-medium px-3 py-2.5">Rate</th>
                <th className="text-right font-medium px-5 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {history.map((log) => (
                <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{log.minutes.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">${log.rate.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium">
                    ${log.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}
