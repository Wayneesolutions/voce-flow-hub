import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminTenantsApi } from "@/lib/api";
import type { Tenant } from "@/lib/types";
import { Plus, Search, X, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export const Route = createFileRoute("/admin/clients")({
  head: () => ({ meta: [{ title: "Clients · VoCallM Admin" }] }),
  component: ClientsPage,
});

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  PAUSED: "bg-warning/10 text-warning",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

const defaultForm = {
  name: "",
  slug: "",
  ownerName: "",
  ownerEmail: "",
  ownerPassword: "",
  ratePerMinute: "0.30",
  primaryColor: "#2E86DE",
};

function ClientsPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const createLogoRef = useRef<HTMLInputElement>(null);
  const detailLogoRef = useRef<HTMLInputElement>(null);

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ["admin", "tenants"],
    queryFn: adminTenantsApi.list,
  });

  const selected = tenants.find((t) => t.id === selectedId) ?? tenants[0];

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(query.toLowerCase()),
  );

  const createMut = useMutation({
    mutationFn: async () => {
      try {
        return await adminTenantsApi.create({
          name: form.name,
          slug: form.slug,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          ownerPassword: form.ownerPassword,
          ratePerMinute: parseFloat(form.ratePerMinute) || 0.3,
          primaryColor: form.primaryColor,
        });
      } catch (err) {
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.error ?? err.message
          : err instanceof Error ? err.message : "Failed to create client";
        throw new Error(msg);
      }
    },
    onSuccess: async (newTenant) => {
      // Upload logo after creation if one was selected
      if (logoFile) {
        try {
          await adminTenantsApi.uploadLogo(newTenant.id, logoFile);
        } catch {
          toast.warning("Client created but logo upload failed. Upload it from the detail panel.");
        }
      }
      qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      setCreating(false);
      setForm(defaultForm);
      setLogoFile(null);
      setLogoPreview(null);
      setSelectedId(newTenant.id);
      toast.success(`Client "${newTenant.name}" created`);
    },
    onError: () => { /* error shown inline in modal */ },
  });

  const uploadLogoMut = useMutation({
    mutationFn: ({ tenantId, file }: { tenantId: string; file: File }) =>
      adminTenantsApi.uploadLogo(tenantId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success("Logo updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: import("@/lib/types").TenantStatus }) =>
      adminTenantsApi.update(id, { status }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
      toast.success(`Client ${status === "SUSPENDED" ? "suspended" : status === "PAUSED" ? "paused" : "activated"}`);
    },
    onError: () => toast.error("Failed to update status"),
  });

  const f = (key: keyof typeof form, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleLogoSelect = (file: File) => {
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  };

  return (
    <DashboardShell
      sidebar={null}
      title="Clients"
      subtitle={`${tenants.length} client${tenants.length !== 1 ? "s" : ""}`}
      actions={
        <button
          onClick={() => setCreating(true)}
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create client
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Client list */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients…"
              className="bg-transparent text-sm outline-none flex-1"
            />
          </div>
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No clients found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">Client</th>
                  <th className="text-left font-medium px-3 py-2.5">Slug</th>
                  <th className="text-right font-medium px-3 py-2.5">Rate/min</th>
                  <th className="text-right font-medium px-3 py-2.5">Minutes</th>
                  <th className="text-left font-medium px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`border-t border-border cursor-pointer ${selected?.id === t.id ? "bg-accent/5" : "hover:bg-muted/30"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {t.logoUrl ? (
                          <img
                            src={`/api/public/logo/${t.id}`}
                            alt={t.name}
                            className="h-7 w-7 rounded object-contain border border-border bg-muted/30"
                          />
                        ) : (
                          <div
                            className="h-7 w-7 rounded inline-flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: t.primaryColor ?? "#2E86DE" }}
                          >
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.ownerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground font-mono text-xs">{t.slug}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      ${t.ratePerMinute.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {t.totalMinutes.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full text-xs px-2 py-0.5 font-medium ${STATUS_STYLES[t.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Client detail panel */}
        {selected && (
          <aside className="rounded-lg border border-border bg-card p-5 h-fit space-y-4">
            {/* Logo display + upload */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                {selected.logoUrl ? (
                  <img
                    src={`/api/public/logo/${selected.id}`}
                    alt={selected.name}
                    className="h-14 w-14 rounded-lg object-contain border border-border bg-muted/30"
                  />
                ) : (
                  <div
                    className="h-14 w-14 rounded-lg inline-flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: selected.primaryColor ?? "#2E86DE" }}
                  >
                    {selected.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => detailLogoRef.current?.click()}
                  title="Upload logo"
                  className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Upload className="h-4 w-4 text-white" />
                </button>
                <input
                  ref={detailLogoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogoMut.mutate({ tenantId: selected.id, file });
                    e.target.value = "";
                  }}
                />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Client detail
                </div>
                <h3 className="mt-0.5 text-lg font-semibold">{selected.name}</h3>
                <div className="text-sm text-muted-foreground">{selected.ownerEmail}</div>
              </div>
            </div>

            {uploadLogoMut.isPending && (
              <div className="text-xs text-muted-foreground">Uploading logo…</div>
            )}

            <dl className="space-y-3 text-sm">
              <Row label="Owner" value={selected.ownerName} />
              <Row label="Rate per minute" value={`$${selected.ratePerMinute.toFixed(2)}`} />
              <Row label="Total minutes" value={selected.totalMinutes.toLocaleString()} />
              <Row label="Subdomain" value={`${selected.slug}.vocallm.com`} />
              <Row label="Status" value={selected.status} />
              <Row label="Campaigns" value={String(selected._count?.campaigns ?? "—")} />
              <Row label="Calls" value={String(selected._count?.calls ?? "—")} />
              <Row label="Leads" value={String(selected._count?.leads ?? "—")} />
              <Row label="Inbound calls" value={String(selected._count?.inboundCalls ?? "—")} />
              <Row label="Receptionists" value={String(selected._count?.inboundAssistants ?? "—")} />
            </dl>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() =>
                  statusMut.mutate({
                    id: selected.id,
                    status: selected.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
                  })
                }
                disabled={statusMut.isPending || selected.status === "SUSPENDED"}
                className={`h-9 rounded-md border text-sm disabled:opacity-40 ${
                  selected.status === "ACTIVE"
                    ? "border-warning/30 text-warning hover:bg-warning/5"
                    : "border-success/30 text-success hover:bg-success/5"
                }`}
              >
                {selected.status === "ACTIVE" ? "Pause" : "Activate"}
              </button>
              <button
                onClick={() =>
                  statusMut.mutate({
                    id: selected.id,
                    status: selected.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
                  })
                }
                disabled={statusMut.isPending}
                className={`h-9 rounded-md border text-sm disabled:opacity-40 ${
                  selected.status === "SUSPENDED"
                    ? "border-success/30 text-success hover:bg-success/5"
                    : "border-destructive/30 text-destructive hover:bg-destructive/5"
                }`}
              >
                {selected.status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Create client modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-xl rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="font-semibold">Create new client</div>
              <button
                onClick={() => {
                  setCreating(false);
                  setLogoFile(null);
                  setLogoPreview(null);
                }}
                className="p-1 rounded hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Logo upload */}
              <div>
                <label className="text-sm font-medium">Company logo</label>
                <div
                  onClick={() => createLogoRef.current?.click()}
                  className="mt-1.5 flex items-center gap-3 cursor-pointer rounded-md border border-dashed border-border hover:border-primary/50 transition-colors p-3"
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-10 w-10 rounded object-contain border border-border bg-muted/30"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded border border-border bg-muted/30 inline-flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {logoFile ? logoFile.name : "Click to upload logo (PNG, JPG, SVG · max 2 MB)"}
                  </div>
                  <input
                    ref={createLogoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoSelect(file);
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name" value={form.name} onChange={(v) => f("name", v)} />
                <Field
                  label="Subdomain slug"
                  value={form.slug}
                  onChange={(v) => f("slug", v.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="acme-plumbing"
                />
                <Field
                  label="Owner name"
                  value={form.ownerName}
                  onChange={(v) => f("ownerName", v)}
                />
                <Field
                  label="Owner email"
                  type="email"
                  value={form.ownerEmail}
                  onChange={(v) => f("ownerEmail", v)}
                />
                <Field
                  label="Portal password"
                  type="password"
                  value={form.ownerPassword}
                  onChange={(v) => f("ownerPassword", v)}
                />
                <Field
                  label="Rate per minute ($)"
                  type="number"
                  value={form.ratePerMinute}
                  onChange={(v) => f("ratePerMinute", v)}
                />
              </div>
            </div>

            {createMut.isError && (
              <div className="mx-5 mb-4 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {(createMut.error as Error)?.message ?? "Failed to create client"}
              </div>
            )}
            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => {
                  setCreating(false);
                  setLogoFile(null);
                  setLogoPreview(null);
                }}
                className="h-9 px-4 rounded-md border border-border text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => createMut.mutate()}
                disabled={
                  !form.name ||
                  !form.slug ||
                  !form.ownerEmail ||
                  !form.ownerPassword ||
                  createMut.isPending
                }
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                {createMut.isPending ? "Creating…" : "Create client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border pb-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
    </div>
  );
}
