import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createPortal } from "react-dom";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminPlansApi } from "@/lib/api";
import type { Plan } from "@/lib/types";
import { Plus, Trash2, BadgeCheck, Star, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/plans")({
  head: () => ({ meta: [{ title: "Plans · Quor Admin" }] }),
  component: PlansPage,
});

const INPUT = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition";

const emptyForm = {
  name: "", blurb: "", price: "0.30", minutesIncluded: "0",
  features: "", isActive: true, isPopular: false, displayOrder: "0",
};
type FormState = typeof emptyForm;

function planToForm(p: Plan): FormState {
  return {
    name: p.name, blurb: p.blurb ?? "",
    price: String(p.price), minutesIncluded: String(p.minutesIncluded),
    features: (p.features as string[]).join("\n"),
    isActive: p.isActive, isPopular: p.isPopular,
    displayOrder: String(p.displayOrder),
  };
}

function PlansPage() {
  const qc = useQueryClient();
  const [modal, setModal]           = useState<boolean>(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(emptyForm);
  const [selected, setSelected]     = useState<Plan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["admin", "plans"],
    queryFn: adminPlansApi.list,
  });

  const f = (key: keyof FormState, val: string | boolean) =>
    setForm((p) => ({ ...p, [key]: val }));

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const buildPayload = () => ({
    name: form.name.trim(), blurb: form.blurb.trim() || undefined,
    price: parseFloat(form.price),
    minutesIncluded: parseInt(form.minutesIncluded) || 0,
    features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
    isActive: form.isActive, isPopular: form.isPopular,
    displayOrder: parseInt(form.displayOrder) || 0,
  });

  const createMut = useMutation({
    mutationFn: () => adminPlansApi.create(buildPayload()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
      qc.invalidateQueries({ queryKey: ["public", "plans"] });
      toast.success("Plan created"); setModal(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to create plan"),
  });

  const updateMut = { isPending: false }; // edit disabled

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminPlansApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
      qc.invalidateQueries({ queryKey: ["public", "plans"] });
      toast.success("Plan deleted");
      if (selected?.id === deleteTarget?.id) setSelected(null);
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to delete plan"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminPlansApi.update(id, { isActive }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
      qc.invalidateQueries({ queryKey: ["public", "plans"] });
      toast.success(updated.isActive ? "Plan activated" : "Plan deactivated");
      if (selected?.id === updated.id) setSelected(updated);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to update plan"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate();
  };

  const busy = createMut.isPending || updateMut.isPending;

  return (
    <DashboardShell
      sidebar={null}
      title="Plans"
      subtitle="Plans shown on the public pricing page. Tenants pick a plan when they self-register."
      actions={
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New plan
        </button>
      }
    >
      <div className={`grid gap-4 ${selected ? "lg:grid-cols-[1fr_340px]" : ""}`}>

        {/* ── Table ── */}
        <div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-12 text-center">Loading…</div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground text-sm">
              No plans yet. Create one to show it on the pricing page.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Rate / min</th>
                    <th className="px-4 py-3 text-left">Included min</th>
                    <th className="px-4 py-3 text-left">Features</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plans.map((plan) => (
                    <tr
                      key={plan.id}
                      onClick={() => setSelected(selected?.id === plan.id ? null : plan)}
                      className={`cursor-pointer transition-colors ${
                        selected?.id === plan.id
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{plan.displayOrder}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium flex items-center gap-2">
                          {plan.name}
                          {plan.isPopular && <Star className="h-3.5 w-3.5 text-accent fill-accent" />}
                        </div>
                        {plan.blurb && <div className="text-xs text-muted-foreground mt-0.5">{plan.blurb}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">${plan.price.toFixed(2)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {plan.minutesIncluded > 0 ? plan.minutesIncluded.toLocaleString() : "Unlimited"}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="space-y-0.5">
                          {(plan.features as string[]).map((feat) => (
                            <div key={feat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <BadgeCheck className="h-3 w-3 text-success shrink-0" />
                              {feat}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleMut.mutate({ id: plan.id, isActive: !plan.isActive })}
                          disabled={toggleMut.isPending}
                          title={plan.isActive ? "Click to deactivate" : "Click to activate"}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                            plan.isActive ? "bg-success" : "bg-muted-foreground/30"
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            plan.isActive ? "translate-x-6" : "translate-x-1"
                          }`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(plan); }}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors"
                            title="Delete plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Detail panel ── */}
        {selected && (
          <aside className="rounded-xl border border-border bg-card overflow-hidden h-fit">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base">{selected.name}</h3>
                  {selected.isPopular && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent text-[10px] font-semibold px-2 py-0.5">
                      <Star className="h-2.5 w-2.5 fill-accent" /> Popular
                    </span>
                  )}
                </div>
                {selected.blurb && <p className="text-xs text-muted-foreground mt-0.5">{selected.blurb}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-secondary shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground">Rate / min</p>
                <p className="text-xl font-bold mt-0.5">${selected.price.toFixed(2)}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground">Included minutes</p>
                <p className="text-xl font-bold mt-0.5">
                  {selected.minutesIncluded > 0 ? selected.minutesIncluded.toLocaleString() : "Unlimited"}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Features</p>
              <div className="space-y-2">
                {(selected.features as string[]).map((feat) => (
                  <div key={feat} className="flex items-start gap-2 text-sm">
                    <BadgeCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta */}
            <div className="px-5 py-4 border-b border-border space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${selected.isActive ? "text-success" : "text-muted-foreground"}`}>
                    {selected.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => toggleMut.mutate({ id: selected.id, isActive: !selected.isActive })}
                    disabled={toggleMut.isPending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                      selected.isActive ? "bg-success" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      selected.isActive ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Display order</span>
                <span className="font-medium">{selected.displayOrder}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4">
              <button
                onClick={() => setDeleteTarget(selected)}
                className="w-full h-9 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete plan
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && createPortal(
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
        >
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-destructive/10 inline-flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="font-semibold text-base">Delete "{deleteTarget.name}"?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                This plan will be removed from the pricing page. Existing tenants on this plan won't be affected.
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
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Create modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold">New plan</h2>
              <button onClick={() => setModal(false)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <input value={form.name} onChange={(e) => f("name", e.target.value)} required placeholder="Starter" className={INPUT} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Blurb</label>
                  <input value={form.blurb} onChange={(e) => f("blurb", e.target.value)} placeholder="Test the waters" className={INPUT} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Rate / min ($)</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => f("price", e.target.value)} required className={INPUT} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Included min</label>
                  <input type="number" min="0" value={form.minutesIncluded} onChange={(e) => f("minutesIncluded", e.target.value)} placeholder="0 = unlimited" className={INPUT} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Display order</label>
                  <input type="number" min="0" value={form.displayOrder} onChange={(e) => f("displayOrder", e.target.value)} className={INPUT} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Features <span className="text-muted-foreground font-normal">(one per line)</span>
                </label>
                <textarea
                  rows={5}
                  value={form.features}
                  onChange={(e) => f("features", e.target.value)}
                  placeholder={"1 phone number\n1 campaign\nEmail support"}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition resize-none"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => f("isActive", e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
                  Active (shown on pricing page)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isPopular} onChange={(e) => f("isPopular", e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
                  Mark as Most Popular
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 h-10 rounded-lg border border-border bg-background text-sm font-medium hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {busy ? "Saving…" : "Create plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
