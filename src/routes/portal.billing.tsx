import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { billingApi, tenantApi, publicPlansApi } from "@/lib/api";
import type { Plan } from "@/lib/types";
import { Timer, DollarSign, PhoneCall, Receipt, Loader2, ExternalLink, FileText, CreditCard, CheckCircle2, Package, Zap, BadgeCheck, ArrowRight } from "lucide-react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from "sonner";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

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

async function fetchPaymentMethod() {
  const res = await axios.get("/api/stripe/payment-method", { headers: authHeader() });
  return res.data as { card: SavedCard | null };
}

interface SavedCard {
  id: string; brand: string; last4: string; expMonth: number; expYear: number;
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

  // Handle return from Stripe Checkout
  useEffect(() => {
    if (!checkout) return;
    if (checkout === "success") {
      toast.success("Payment successful! Your plan is now active.");
      setTimeout(() => refetchMe(), 2000);
    } else if (checkout === "cancelled") {
      toast.info("Checkout cancelled — no charge was made.");
    }
    // Remove query param from URL so it doesn't re-fire on page refresh
    navigate({ search: { checkout: undefined }, replace: true });
  }, [checkout]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: allPlans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["public", "plans"],
    queryFn: publicPlansApi.list,
    staleTime: 5 * 60_000,
  });

  // Free plans assign directly; paid plans go through Stripe checkout
  const selectablePlans = allPlans.filter((p) => p.minutesIncluded > 0); // exclude unlimited (contact sales)

  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const handleSelectPlan = async (p: Plan) => {
    if (p.id === plan?.id) return;
    setCheckingOut(p.id);
    try {
      if (p.price === 0) {
        // Free plan — assign directly
        await tenantApi.selectPlan(p.id);
        await refetchMe();
        toast.success(`Switched to ${p.name} plan`);
      } else {
        // Paid plan — go through Stripe
        const result = await tenantApi.startPlanCheckout(p.id);
        if (result.upgraded) {
          // Already had a subscription — upgraded inline
          await refetchMe();
          toast.success(`Upgraded to ${p.name} plan`);
        } else if (result.url) {
          window.location.href = result.url;
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? "Something went wrong";
      toast.error(msg);
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

  const { data: pmData, refetch: refetchPm } = useQuery({
    queryKey: ["stripe-payment-method"],
    queryFn: fetchPaymentMethod,
    retry: false,
  });

  const savedCard = pmData?.card ?? null;

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
        {plan && (
          <div className="px-5 py-4 border-b border-border bg-accent/5 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{plan.name}</span>
              {plan.price === 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success text-[11px] font-semibold px-2 py-0.5">
                  <Zap className="h-3 w-3" /> Free Trial
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
          </div>
        )}

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
                const monthlyTotal = p.price > 0
                  ? `$${(p.price * p.minutesIncluded).toFixed(0)}/mo`
                  : "Free";
                return (
                  <div
                    key={p.id}
                    className={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${
                      isCurrent
                        ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{p.name}</span>
                        {p.isPopular && !isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-accent/10 text-accent px-2 py-0.5">
                            Popular
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-success/10 text-success px-2 py-0.5 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        )}
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
                      disabled={isCurrent || !!checkingOut}
                      className={`w-full h-8 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        isCurrent
                          ? "bg-success/10 text-success cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      }`}
                    >
                      {isPending ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirecting to payment…</>
                      ) : isCurrent ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Current plan</>
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

      {/* Payment method */}
      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 font-semibold mb-4">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Payment method
        </div>
        {savedCard ? (
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-border px-4 py-3 flex items-center gap-3 bg-muted/30">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium capitalize">{savedCard.brand}</span>
              <span className="text-sm text-muted-foreground">•••• {savedCard.last4}</span>
              <span className="text-xs text-muted-foreground">
                {savedCard.expMonth}/{savedCard.expYear}
              </span>
            </div>
            <button
              onClick={() => refetchPm()}
              className="text-xs text-accent hover:underline"
            >
              Update card
            </button>
          </div>
        ) : stripePromise ? (
          <Elements stripe={stripePromise}>
            <AddCardForm onSuccess={() => { refetchPm(); qc.invalidateQueries({ queryKey: ["stripe-invoices"] }); }} />
          </Elements>
        ) : (
          <p className="text-sm text-muted-foreground">
            Stripe is not configured. Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to the frontend <code>.env</code>.
          </p>
        )}
      </div>

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

// ── Add Card Form (Stripe Elements) ──────────────────────────────────────────
function AddCardForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [error,  setError]  = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSaving(true);
    setError(null);

    try {
      // Get a SetupIntent clientSecret from our backend
      const { data } = await axios.post("/api/stripe/setup-intent", {}, { headers: authHeader() });
      const result = await stripe.confirmCardSetup(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });

      if (result.error) {
        setError(result.error.message ?? "Card setup failed");
      } else {
        setDone(true);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="h-4 w-4" /> Card saved successfully!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
      <p className="text-sm text-muted-foreground">
        Add a card to enable automatic monthly invoicing.
      </p>
      <div className="rounded-md border border-border px-3 py-3 bg-background">
        <CardElement options={{ style: { base: { fontSize: "14px", color: "#1a1a1a" } } }} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={saving || !stripe}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save card
      </button>
    </form>
  );
}
