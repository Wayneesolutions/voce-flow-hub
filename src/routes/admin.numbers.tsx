import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminTenantsApi, adminNumbersApi } from "@/lib/api";
import type { Tenant, TenantPhone } from "@/lib/types";
import { Phone, Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/numbers")({
  head: () => ({ meta: [{ title: "Phone Numbers · VoCallM Admin" }] }),
  component: NumbersPage,
});

const COUNTRY_LABELS: Record<string, string> = { US: "🇺🇸 USA", CA: "🇨🇦 Canada", UAE: "🇦🇪 Dubai" };

function NumbersPage() {
  const qc = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    number: "",
    friendlyName: "",
    country: "US",
    twilioSid: "",
    vapiNumberId: "",
    isDefault: false,
  });

  const { data: tenants = [], isLoading: loadingTenants } = useQuery<Tenant[]>({
    queryKey: ["admin", "tenants"],
    queryFn: adminTenantsApi.list,
  });

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) ?? tenants[0];

  const { data: numbers = [], isLoading: loadingNumbers } = useQuery<TenantPhone[]>({
    queryKey: ["admin", "numbers", selectedTenant?.id],
    queryFn: () => adminNumbersApi.listByTenant(selectedTenant!.id),
    enabled: !!selectedTenant?.id,
  });

  const assignMut = useMutation({
    mutationFn: () =>
      adminNumbersApi.assign(selectedTenant!.id, {
        number: form.number,
        friendlyName: form.friendlyName || form.number,
        country: form.country,
        twilioSid: form.twilioSid || undefined,
        vapiNumberId: form.vapiNumberId || undefined,
        isDefault: form.isDefault,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "numbers", selectedTenant?.id] });
      setAdding(false);
      setForm({ number: "", friendlyName: "", country: "US", twilioSid: "", vapiNumberId: "", isDefault: false });
    },
  });

  const removeMut = useMutation({
    mutationFn: (numberId: string) => adminNumbersApi.remove(selectedTenant!.id, numberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "numbers", selectedTenant?.id] }),
  });

  const totalNumbers = tenants.reduce((sum, t) => sum + (t.phoneNumbers?.length ?? 0), 0);

  return (
    <DashboardShell
      sidebar={null}
      title="Phone Numbers"
      subtitle={`${totalNumbers} numbers across ${tenants.length} clients`}
      actions={
        selectedTenant && (
          <button
            onClick={() => setAdding(true)}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Assign number
          </button>
        )
      }
    >
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Client selector */}
        <div className="rounded-lg border border-border bg-card overflow-hidden h-fit">
          <div className="p-4 border-b border-border text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Select client
          </div>
          {loadingTenants ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <ul className="divide-y divide-border">
              {tenants.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setSelectedTenantId(t.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-muted/30 transition-colors ${
                      selectedTenant?.id === t.id ? "bg-accent/5 font-medium" : ""
                    }`}
                  >
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.phoneNumbers?.length ?? 0} number(s)
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Numbers table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="font-semibold text-sm">
              {selectedTenant ? `${selectedTenant.name} — numbers` : "Select a client"}
            </div>
          </div>

          {loadingNumbers ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : numbers.length === 0 ? (
            <div className="p-8 text-center">
              <Phone className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <div className="text-sm text-muted-foreground">No numbers assigned yet</div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">Number</th>
                  <th className="text-left font-medium px-3 py-2.5">Friendly name</th>
                  <th className="text-left font-medium px-3 py-2.5">Market</th>
                  <th className="text-left font-medium px-3 py-2.5">Twilio SID</th>
                  <th className="text-left font-medium px-3 py-2.5">Default</th>
                  <th className="text-left font-medium px-3 py-2.5">Active</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {numbers.map((n) => (
                  <tr key={n.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-sm">{n.number}</td>
                    <td className="px-3 py-3 text-muted-foreground">{n.friendlyName}</td>
                    <td className="px-3 py-3">{COUNTRY_LABELS[n.country] ?? n.country}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground truncate max-w-[140px]">
                      {n.twilioSid ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {n.isDefault ? (
                        <span className="inline-flex rounded-full bg-success/10 text-success text-xs px-2 py-0.5 font-medium">
                          Default
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full text-xs px-2 py-0.5 font-medium ${
                          n.isActive
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {n.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeMut.mutate(n.id)}
                        disabled={removeMut.isPending}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                        title="Remove number"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Assign number modal */}
      {adding && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <div className="font-semibold">Assign phone number</div>
                <div className="text-xs text-muted-foreground mt-0.5">Client: {selectedTenant.name}</div>
              </div>
              <button
                onClick={() => setAdding(false)}
                className="p-1 rounded hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Phone number (E.164)</label>
                <input
                  value={form.number}
                  onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                  placeholder="+12125550000"
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Friendly name</label>
                <input
                  value={form.friendlyName}
                  onChange={(e) => setForm((f) => ({ ...f, friendlyName: e.target.value }))}
                  placeholder="US Sales Line"
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Market</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="US">🇺🇸 USA</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="UAE">🇦🇪 Dubai / UAE</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Twilio SID</label>
                <input
                  value={form.twilioSid}
                  onChange={(e) => setForm((f) => ({ ...f, twilioSid: e.target.value }))}
                  placeholder="PNxxx… (optional)"
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Vapi Number ID</label>
                <input
                  value={form.vapiNumberId}
                  onChange={(e) => setForm((f) => ({ ...f, vapiNumberId: e.target.value }))}
                  placeholder="optional"
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <label htmlFor="isDefault" className="text-sm">
                  Set as default number for this market
                </label>
              </div>
            </div>

            {assignMut.isError && (
              <div className="mx-5 mb-4 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {(assignMut.error as Error)?.message ?? "Failed to assign number"}
              </div>
            )}

            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setAdding(false)}
                className="h-9 px-4 rounded-md border border-border text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => assignMut.mutate()}
                disabled={!form.number || assignMut.isPending}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                {assignMut.isPending ? "Assigning…" : "Assign number"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
