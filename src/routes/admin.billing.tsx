import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { adminBillingApi } from "@/lib/api";
import type { AdminBillingSummary } from "@/lib/types";
import {
  DollarSign, TrendingUp, Timer, Download, Receipt,
  Send, X, ExternalLink, FileText, CheckCircle2, AlertCircle, CreditCard,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/billing")({
  head: () => ({ meta: [{ title: "Billing · Quor Admin" }] }),
  component: Billing,
});

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });
}

// ── Invoice modal ─────────────────────────────────────────────────────────────
interface InvoiceModalProps {
  row: AdminBillingSummary;
  month: string;
  onClose: () => void;
}

function InvoiceModal({ row, month, onClose }: InvoiceModalProps) {
  const [result, setResult] = useState<{
    invoiceId: string; amount: number; hostedUrl: string; pdfUrl: string; description: string;
  } | null>(null);

  const sendMut = useMutation({
    mutationFn: () => adminBillingApi.sendInvoice(row.tenant.id, month),
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Invoice sent to ${row.tenant.name}`);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error ?? "Failed to send invoice");
    },
  });

  const tax = row.totalRevenue * 0; // set tax rate here if needed
  const period = monthLabel(month);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">
              {result ? "Invoice sent" : "Send invoice"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {result ? (
            /* ── Success state ── */
            <div className="text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <div>
                <div className="font-semibold">Invoice created & sent</div>
                <div className="text-sm text-muted-foreground mt-1">
                  ${result.amount.toFixed(2)} usage invoice sent to {row.tenant.name}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-left space-y-1.5">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Invoice details</div>
                <div className="text-sm truncate">{result.description}</div>
                <div className="text-sm font-semibold">${result.amount.toFixed(2)} USD</div>
              </div>
              <div className="flex gap-2 pt-1">
                {result.hostedUrl && (
                  <a
                    href={result.hostedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View invoice
                  </a>
                )}
                {result.pdfUrl && (
                  <a
                    href={result.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" /> Download PDF
                  </a>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* ── Invoice preview ── */
            <>
              {/* Client info */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Bill to</span>
                  <span className="text-xs text-muted-foreground">{period}</span>
                </div>
                <div className="font-semibold">{row.tenant.name}</div>
                {row.tenant.plan && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5">
                    {row.tenant.plan.name} plan
                  </span>
                )}
              </div>

              {/* Line items */}
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Description</th>
                      <th className="px-4 py-2.5 text-right">Qty</th>
                      <th className="px-4 py-2.5 text-right">Rate</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="font-medium">AI Calling — Talk minutes</div>
                        <div className="text-xs text-muted-foreground">{period}</div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.totalMinutes.toFixed(1)} min</td>
                      <td className="px-4 py-3 text-right tabular-nums">${row.tenant.ratePerMinute.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">${row.usageRevenue.toFixed(2)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-muted/20 border-t-2 border-border">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total due</td>
                      <td className="px-4 py-3 text-right font-bold text-lg">${row.usageRevenue.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Stripe notice */}
              {!row.tenant.stripeCustomerId ? (
                <div className="flex items-start gap-2.5 rounded-lg bg-warning/10 border border-warning/20 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm text-warning">
                    This client has no payment method on file. They need to add a card in their billing settings before you can send an invoice.
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center">
                  Invoice will be charged immediately to the card on file via Stripe.
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 h-10 rounded-lg border border-border bg-background text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => sendMut.mutate()}
                  disabled={sendMut.isPending || !row.tenant.stripeCustomerId}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                >
                  {sendMut.isPending ? (
                    "Sending…"
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send invoice
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main billing page ─────────────────────────────────────────────────────────
function Billing() {
  const [month, setMonth] = useState(currentMonth());
  const [invoiceRow, setInvoiceRow] = useState<AdminBillingSummary | null>(null);

  const { data: rows = [], isLoading } = useQuery<AdminBillingSummary[]>({
    queryKey: ["admin", "billing", month],
    queryFn: () => adminBillingApi.summary(month),
  });

  const totalMinutes      = rows.reduce((s, r) => s + r.totalMinutes, 0);
  const totalSubRevenue   = rows.reduce((s, r) => s + r.subscriptionRevenue, 0);
  const totalUsageRevenue = rows.reduce((s, r) => s + r.usageRevenue, 0);
  const totalRevenue      = rows.reduce((s, r) => s + r.totalRevenue, 0);
  const totalCost         = rows.reduce((s, r) => s + r.platformCost, 0);
  const totalProfit       = rows.reduce((s, r) => s + r.grossProfit, 0);

  const months: string[] = [];
  const d = new Date();
  for (let i = 0; i < 6; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }

  const handleExportCSV = () => {
    if (!rows.length) return;
    const header = ["Client", "Plan", "Sub Revenue", "Minutes", "Usage Revenue", "Total Revenue", "Cost", "Profit", "Margin"].join(",");
    const body = rows.map((r) => {
      const margin = r.totalRevenue > 0 ? Math.round((r.grossProfit / r.totalRevenue) * 100) : 0;
      return [
        r.tenant.name,
        r.tenant.plan?.name ?? "—",
        r.subscriptionRevenue.toFixed(2),
        r.totalMinutes.toFixed(1),
        r.usageRevenue.toFixed(2),
        r.totalRevenue.toFixed(2),
        r.platformCost.toFixed(2),
        r.grossProfit.toFixed(2),
        `${margin}%`,
      ].join(",");
    });
    const csv = [header, ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quor-billing-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
          <button
            onClick={handleExportCSV}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-background text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total minutes" value={totalMinutes.toLocaleString()} icon={<Timer className="h-4 w-4" />} />
        <StatCard
          label="Subscription revenue"
          value={`$${totalSubRevenue.toFixed(2)}`}
          icon={<CreditCard className="h-4 w-4" />}
          hint={`+ $${totalUsageRevenue.toFixed(2)} usage = $${totalRevenue.toFixed(2)} total`}
        />
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
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-semibold">Per-client billing — {monthLabel(month)}</div>
            <div className="text-xs text-muted-foreground">Platform cost at $0.12/min. Subscription clients are billed via Stripe automatically. "Invoice" sends a manual usage charge.</div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No billing data for this month.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Client</th>
                  <th className="text-left font-medium px-3 py-2.5">Plan</th>
                  <th className="text-right font-medium px-3 py-2.5">Sub</th>
                  <th className="text-right font-medium px-3 py-2.5">Minutes</th>
                  <th className="text-right font-medium px-3 py-2.5">Usage</th>
                  <th className="text-right font-medium px-3 py-2.5">Total Rev.</th>
                  <th className="text-right font-medium px-3 py-2.5">Cost</th>
                  <th className="text-right font-medium px-3 py-2.5">Profit</th>
                  <th className="text-right font-medium px-5 py-2.5">Margin</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const margin = r.totalRevenue > 0
                    ? Math.round((r.grossProfit / r.totalRevenue) * 100) : 0;
                  const hasActiveSub = !!r.tenant.stripeSubscriptionId;
                  const planExpiry = r.tenant.planExpiresAt ? new Date(r.tenant.planExpiresAt) : null;
                  return (
                    <tr key={r.tenant.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium">{r.tenant.name}</div>
                      </td>
                      <td className="px-3 py-3">
                        {r.tenant.plan ? (
                          <div className="space-y-1">
                            <span className={`inline-flex items-center rounded-full text-xs font-medium px-2 py-0.5 ${hasActiveSub ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {r.tenant.plan.name}
                            </span>
                            {planExpiry && (
                              <div className="text-[10px] text-muted-foreground">
                                {planExpiry < new Date() ? "Expired" : "Renews"} {planExpiry.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Free Trial</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {r.subscriptionRevenue > 0 ? (
                          <span className="text-primary font-medium">${r.subscriptionRevenue.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.totalMinutes.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">${r.usageRevenue.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium">${r.totalRevenue.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">${r.platformCost.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium text-success">${r.grossProfit.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-medium">
                          {margin}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setInvoiceRow(r)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          <Receipt className="h-3.5 w-3.5" /> Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Totals row */}
                <tr className="border-t-2 border-border bg-primary text-primary-foreground">
                  <td className="px-5 py-3 font-semibold" colSpan={2}>Total</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">${totalSubRevenue.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">{totalMinutes.toFixed(1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">${totalUsageRevenue.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">${totalRevenue.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">${totalCost.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">${totalProfit.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right font-semibold">
                    {totalRevenue > 0 ? `${Math.round((totalProfit / totalRevenue) * 100)}%` : "—"}
                  </td>
                  <td className="px-5 py-3" />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {invoiceRow && (
        <InvoiceModal
          row={invoiceRow}
          month={month}
          onClose={() => setInvoiceRow(null)}
        />
      )}
    </DashboardShell>
  );
}
