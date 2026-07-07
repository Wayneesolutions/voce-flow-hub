import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createPortal } from "react-dom";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminNumbersApi, adminTenantsApi, type AvailableNumber } from "@/lib/api";
import type { TenantPhone } from "@/lib/types";
import {
  Phone, Search, Plus, Trash2, CheckCircle2, AlertTriangle,
  Loader2, X, RefreshCw, Info,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/numbers")({
  head: () => ({ meta: [{ title: "Phone Numbers · Quor Admin" }] }),
  component: NumbersPage,
});

const COUNTRIES = [
  { code: "US", label: "United States", provider: "TWILIO" as const },
  { code: "CA", label: "Canada",         provider: "TWILIO" as const },
  { code: "GB", label: "United Kingdom", provider: "TWILIO" as const },
  { code: "AU", label: "Australia",      provider: "TWILIO" as const },
  { code: "IN", label: "India",          provider: "PLIVO"  as const },
];

const INPUT =
  "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition";

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      provider === "PLIVO"
        ? "bg-orange-500/10 text-orange-600"
        : "bg-[#F22F46]/10 text-[#F22F46]"
    }`}>
      {provider === "PLIVO" ? "Plivo" : "Twilio"}
    </span>
  );
}

function NumbersPage() {
  const qc = useQueryClient();

  const { data: allNumbers = [], isLoading: numbersLoading } = useQuery<TenantPhone[]>({
    queryKey: ["admin", "numbers"],
    queryFn: adminNumbersApi.listAll,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["admin", "tenants"],
    queryFn: adminTenantsApi.list,
  });

  const [showBuy, setShowBuy]       = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [areaCode, setAreaCode]     = useState("");
  const [pattern, setPattern]       = useState("");
  const [tenantId, setTenantId]     = useState("");
  const [isDefault, setIsDefault]   = useState(false);
  const [results, setResults]       = useState<AvailableNumber[]>([]);
  const [searching, setSearching]   = useState(false);
  const [buying, setBuying]         = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantPhone | null>(null);

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminNumbersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "numbers"] });
      toast.success("Number removed");
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to remove number"),
  });

  const handleSearch = async () => {
    setSearching(true);
    setResults([]);
    try {
      const data = await adminNumbersApi.search({
        provider: selectedCountry.provider,
        country:  selectedCountry.code,
        areaCode: areaCode || undefined,
        pattern:  pattern  || undefined,
      });
      setResults(data);
      if (data.length === 0) toast.info("No numbers found. Try different filters.");
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleBuy = async (num: AvailableNumber) => {
    if (!tenantId) { toast.error("Select a client first"); return; }
    setBuying(num.number);
    try {
      await adminNumbersApi.buy({
        number:   num.number,
        provider: num.provider,
        country:  num.country,
        tenantId,
        isDefault,
      });
      qc.invalidateQueries({ queryKey: ["admin", "numbers"] });
      toast.success(`${num.number} purchased and assigned`);
      setResults(r => r.filter(n => n.number !== num.number));
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Purchase failed");
    } finally {
      setBuying(null);
    }
  };

  const openBuy = () => {
    setResults([]);
    setAreaCode("");
    setPattern("");
    setTenantId("");
    setIsDefault(false);
    setSelectedCountry(COUNTRIES[0]);
    setShowBuy(true);
  };

  return (
    <DashboardShell
      sidebar={null}
      title="Phone Numbers"
      subtitle="Buy numbers from Twilio or Plivo and assign them to clients"
      actions={
        <button
          onClick={openBuy}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Buy &amp; assign number
        </button>
      }
    >
      {/* Assigned numbers */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2 font-semibold">
          <Phone className="h-4 w-4 text-muted-foreground" />
          Assigned numbers
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {allNumbers.length} total
          </span>
        </div>

        {numbersLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : allNumbers.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No numbers yet. Click "Buy &amp; assign number" to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Number</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Country</th>
                <th className="px-4 py-3 text-left">Provider</th>
                <th className="px-4 py-3 text-left">Vapi</th>
                <th className="px-4 py-3 text-left">Default</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allNumbers.map((n) => (
                <tr key={n.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3 font-mono font-medium">{n.number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{n.tenant?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{n.country}</td>
                  <td className="px-4 py-3"><ProviderBadge provider={n.provider} /></td>
                  <td className="px-4 py-3">
                    {n.vapiNumberId ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Registered
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {n.isDefault && (
                      <span className="inline-flex rounded-full bg-primary/10 text-primary text-[11px] font-medium px-2 py-0.5">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteTarget(n)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Buy & assign modal */}
      {showBuy && createPortal(
        <div
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
        >
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold">Buy &amp; assign number</h2>
              <button onClick={() => setShowBuy(false)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">

              {/* Step 1: Country */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  1 — Choose country &amp; provider
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setSelectedCountry(c); setResults([]); }}
                      className={`flex flex-col items-start px-4 py-3 rounded-xl border text-sm transition-colors ${
                        selectedCountry.code === c.code
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <span className="font-medium">{c.label}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        via {c.provider === "PLIVO" ? "Plivo" : "Twilio"}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedCountry.provider === "PLIVO" && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-400/30 bg-amber-500/5 px-4 py-3">
                    <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700">One-time Plivo setup needed</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add Plivo SIP credentials in <strong>Vapi Dashboard → Phone Numbers → SIP Trunks</strong>,
                        then set <code>PLIVO_VAPI_CREDENTIAL_ID</code> in your backend <code>.env</code>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {selectedCountry.provider === "TWILIO" ? "Area code (optional)" : "Pattern (optional)"}
                    </label>
                    <input
                      value={selectedCountry.provider === "TWILIO" ? areaCode : pattern}
                      onChange={(e) =>
                        selectedCountry.provider === "TWILIO"
                          ? setAreaCode(e.target.value)
                          : setPattern(e.target.value)
                      }
                      placeholder={selectedCountry.provider === "TWILIO" ? "e.g. 212" : "e.g. 9820"}
                      className={INPUT}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSearch}
                      disabled={searching}
                      className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
                    >
                      {searching
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching…</>
                        : <><Search className="h-4 w-4" /> Search numbers</>
                      }
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Client */}
              {results.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    2 — Assign to client
                  </p>
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Client</label>
                      <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={INPUT}>
                        <option value="">— Select client —</option>
                        {tenants.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer pb-1">
                      <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      Set as default for this country
                    </label>
                  </div>
                </div>
              )}

              {/* Step 3: Pick number */}
              {results.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    3 — Pick a number to buy
                  </p>
                  <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                    {results.map((num) => (
                      <div key={num.number} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-medium text-sm">{num.number}</div>
                          <div className="text-xs text-muted-foreground">
                            {[num.locality, num.region].filter(Boolean).join(", ") || num.country}
                            {num.monthlyPrice && <> · ${num.monthlyPrice}/mo</>}
                          </div>
                        </div>
                        <ProviderBadge provider={num.provider} />
                        <button
                          onClick={() => handleBuy(num)}
                          disabled={!!buying || !tenantId}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                        >
                          {buying === num.number
                            ? <><Loader2 className="h-3 w-3 animate-spin" /> Buying…</>
                            : "Buy & assign"
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSearch}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="h-3 w-3" /> Load more numbers
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation */}
      {deleteTarget && createPortal(
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
        >
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-destructive/10 inline-flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="font-semibold text-base">Remove {deleteTarget.number}?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                This removes the number from Quor. It stays in your Twilio/Plivo account — release it there manually if no longer needed.
              </p>
            </div>
            <div className="flex border-t border-border">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-12 text-sm font-medium hover:bg-secondary transition-colors border-r border-border"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(deleteTarget.id)}
                disabled={deleteMut.isPending}
                className="flex-1 h-12 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
              >
                {deleteMut.isPending ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </DashboardShell>
  );
}
