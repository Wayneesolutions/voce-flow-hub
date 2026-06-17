import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { billingApi, tenantApi, publicPlansApi } from "@/lib/api";
import type { Plan } from "@/lib/types";
import { Timer, DollarSign, PhoneCall, Receipt, Loader2, ExternalLink, FileText, CreditCard, CheckCircle2, Package, Zap, BadgeCheck, ArrowRight, Lock, CalendarClock } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/billing")({
  validateSearch: (s: Record<string, unknown>) => ({
    checkout: typeof s.checkout === "string" ? s.checkout : undefined,
  }),
  head: () => ({ meta: [{ title: "Billing · Client Portal" }] }),
  component: PortalBilling,
});

function authHeader() {
  const token = localStorage.getItem("vfh_token");
  return { Authorization: `Bearer ${token}` };
}

async function fetchInvoices() {
  const res = await axios.get("/api/stripe/invoices", { headers: authHeader() });
  return res.data as StripeInvoice[];
}

interface StripeInvoice {
  id: string;
  period: string;
  amount: number;
  status: string;
  paidAt: string | null;
  hostedUrl: string | null;
  pdfUrl: string | null;
}

function PortalBilling() {
  const qc = useQueryClient();
  const { checkout } = useSearch({ from: "/portal/billing" });
  const navigate = useNavigate({ from: "/portal/billing" });

  const { data: me, refetch: refetchMe } = useQuery({
    queryKey: ["tenant-me"],
    queryFn: tenantApi.me,
    staleTime: 60_000,
  });
  const plan = me?.plan ?? null;

  // Handle cancelled checkout return (success now lands on /checkout/success)
  useEffect(() => {
    if (checkout !== "cancelled") return;
    toast.info("Checkout cancelled — no charge was made.");
    navigate({ search: { checkout: undefined }, replace: true });
  }, [checkout]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: allPlans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["public", "plans"],
    queryFn: publicPlansApi.list,
    staleTime: 5 * 60_000,
  });

  // Show all active plans (backend returns only isActive ones)
  const selectablePlans = allPlans;

  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  // Plan is locked mid-cycle if an active Stripe subscription exists (regardless of planExpiresAt)
  const planExpiry = me?.planExpiresAt ? new Date(me.planExpiresAt) : null;
  const planExpired = planExpiry ? planExpiry < new Date() : false;
  const isLocked = !!plan && plan.price > 0 && !!me?.hasSubscription && !planExpired;

  const handleSelectPlan = async (p: Plan) => {
    if (p.id === plan?.id) return;

    // Block mid-cycle switching in the UI as a safeguard (backend also blocks it)
    if (isLocked && p.price > 0) {
      toast.error(
        `You can switch plans after your current plan expires on ${planExpiry!.toLocaleDateString()}.`
      );
      return;
    }

    setCheckingOut(p.id);
    try {
      if (p.price === 0) {
        await tenantApi.selectPlan(p.id);
        await refetchMe();
        toast.success(`Switched to ${p.name} plan`);
      } else {
        const result = await tenantApi.startPlanCheckout(p.id);
        if (result.alreadyActive) {
          toast.info("This is already your active plan.");
        } else if (result.url) {
          window.location.href = result.url;
        }
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; planExpiresAt?: string; code?: string } } })?.response?.data;
      if (data?.code === "MID_CYCLE_CHANGE" && data.planExpiresAt) {
        const date = new Date(data.planExpiresAt).toLocaleDateString();
        toast.error(`Plan switch locked until ${date} — your current plan is still active.`);
      } else {
        toast.error(data?.error ?? "Something went wrong");
      }
    } finally {
      setCheckingOut(null);
    }
  };

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["portal-billing-summary"],
    queryFn: () => billingApi.summary(),
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["portal-billing-history"],
    queryFn: billingApi.history,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["stripe-invoices"],
    queryFn: fetchInvoices,
    retry: false,
  });

  const statusColor: Record<string, string> = {
    paid:   "bg-success/10 text-success",
    open:   "bg-warning/10 text-warning",
    void:   "bg-muted text-muted-foreground",
    draft:  "bg-muted text-muted-foreground",
    uncollectible: "bg-destructive/10 text-destructive",
  };

  return (
    <DashboardShell sidebar={null} title="Billing" subtitle="Usage and invoice history">

      {/* Current plan + plan picker */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
        <div className="p-5 border-b border-border flex items-center gap-2 font-semibold">
          <Package className="h-4 w-4 text-muted-foreground" />
          {plan ? "Your plan" : "Choose a plan"}
        </div>

        {/* Active plan summary strip */}
        {plan && (() => {
          const expiry = me?.planExpiresAt ? new Date(me.planExpiresAt) : null;
          const expired = expiry ? expiry < new Date() : false;
          return (
            <div className="px-5 py-4 border-b border-border bg-accent/5 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{plan.name}</span>
                {plan.price === 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success text-[11px] font-semibold px-2 py-0.5">
                    <Zap className="h-3 w-3" /> Free Trial
                  </span>
                ) : expired ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold px-2 py-0.5">
                    Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success text-[11px] font-semibold px-2 py-0.5">
                    Active
                  </span>
                )}
              </div>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)}/min`}
                </span>
                {" · "}
                {plan.minutesIncluded === 0 ? "Unlimited minutes" : `${plan.minutesIncluded.toLocaleString()} min included`}
              </div>
              {expiry && plan.price > 0 && (
                <>
                  <div className="h-6 w-px bg-border hidden sm:block" />
                  <div className="text-sm">
                    {expired ? (
                      <span className="text-destructive font-medium">
                        Expired {expiry.toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Renews <span className="font-medium text-foreground">{expiry.toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* All plans grid */}
        <div className="p-5">
          {!plan && (
            <p className="text-sm text-muted-foreground mb-4">
              Select a plan below to get started. Your AI agent will use this rate per talk minute.
            </p>
          )}
          {plansLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
            </div>
          ) : selectablePlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No plans available yet. Contact{" "}
              <a href="mailto:support@waynesolutions.com" className="text-primary hover:underline">
                support@waynesolutions.com
              </a>{" "}
              to get set up.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectablePlans.map((p) => {
                const isCurrent = plan?.id === p.id;
                const isPending = checkingOut === p.id;
                const isOtherPaidLocked = isLocked && !isCurrent && p.price > 0;
                const monthlyTotal = p.price > 0
                  ? `$${(p.price * p.minutesIncluded).toFixed(0)}/mo`
                  : "Free";
                return (
                  <div
                    key={p.id}
                    className={`rounded-lg border p-4 flex flex-col gap-3 transition-colors relative ${
                      isCurrent
                        ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                        : isOtherPaidLocked
                        ? "border-border/50 opacity-60"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{p.name}</span>
                        {isOtherPaidLocked ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-muted text-muted-foreground px-2 py-0.5 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> Locked
                          </span>
                        ) : p.isPopular && !isCurrent ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-accent/10 text-accent px-2 py-0.5">
                            Popular
                          </span>
                        ) : isCurrent ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-success/10 text-success px-2 py-0.5 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : null}
                      </div>
                      {p.blurb && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.blurb}</p>
                      )}
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{monthlyTotal}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.price > 0
                          ? `${p.minutesIncluded.toLocaleString()} min · $${p.price.toFixed(2)}/min`
                          : `${p.minutesIncluded.toLocaleString()} min included`}
                      </p>
                    </div>
                    <ul className="space-y-1 flex-1">
                      {(p.features as string[]).slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <BadgeCheck className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSelectPlan(p)}
                      disabled={isCurrent || !!checkingOut || isOtherPaidLocked}
                      className={`w-full h-8 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        isCurrent
                          ? "bg-success/10 text-success cursor-default"
                          : isOtherPaidLocked
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      }`}
                    >
                      {isPending ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirecting…</>
                      ) : isCurrent ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Current plan</>
                      ) : isOtherPaidLocked ? (
                        <><CalendarClock className="h-3.5 w-3.5" /> Available {planExpiry ? planExpiry.toLocaleDateString() : "after renewal"}</>
                      ) : p.price === 0 ? (
                        <>Select plan <ArrowRight className="h-3.5 w-3.5" /></>
                      ) : (
                        <>Subscribe · {monthlyTotal} <ArrowRight className="h-3.5 w-3.5" /></>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rate per minute"
          value={summaryLoading ? "—" : `$${(summary?.ratePerMinute ?? 0).toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          hint="your plan rate"
        />
        <StatCard
          label="Minutes used"
          value={summaryLoading ? "—" : (summary?.totalMinutes ?? 0).toFixed(1)}
          icon={<Timer className="h-4 w-4" />}
          hint="this period"
        />
        <StatCard
          label="Amount billed"
          value={summaryLoading ? "—" : `$${(summary?.totalAmount ?? 0).toFixed(2)}`}
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

      {/* Stripe invoices */}
      <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2 font-semibold">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Invoices
        </div>
        {invoicesLoading ? (
          <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No invoices yet. Invoices are generated monthly based on your usage.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Period</th>
                <th className="text-left font-medium px-3 py-2.5">Status</th>
                <th className="text-right font-medium px-3 py-2.5">Amount</th>
                <th className="text-right font-medium px-3 py-2.5">Paid on</th>
                <th className="text-right font-medium px-5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{inv.period}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor[inv.status] ?? "bg-muted text-muted-foreground"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium">
                    ${inv.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right text-muted-foreground text-xs">
                    {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.hostedUrl && (
                        <a href={inv.hostedUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                      )}
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <FileText className="h-3 w-3" /> PDF
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Usage log */}
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
