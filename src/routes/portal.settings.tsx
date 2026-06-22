import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { tenantApi, type IntegrationUpdate } from "@/lib/api";
import {
  Building2, KeyRound, Palette, Upload, Loader2,
  CheckCircle2, Circle, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/settings")({
  head: () => ({ meta: [{ title: "Settings · Client Portal" }] }),
  component: Settings,
});

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  PAUSED: "bg-warning/10 text-warning",
  SUSPENDED: "bg-destructive/10 text-destructive",
};

function Settings() {
  const qc = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-me"],
    queryFn: tenantApi.me,
  });

  // Profile form — synced from tenant on load
  const [profile, setProfile] = useState({ name: "", ownerName: "", primaryColor: "" });
  useEffect(() => {
    if (tenant) setProfile({
      name: tenant.name,
      ownerName: tenant.ownerName ?? "",
      primaryColor: tenant.primaryColor ?? "#2E86DE",
    });
  }, [tenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const profileMut = useMutation({
    mutationFn: tenantApi.updateProfile,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenant-me"] }); toast.success("Profile saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const logoMut = useMutation({
    mutationFn: tenantApi.uploadLogo,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenant-me"] }); toast.success("Logo updated"); },
    onError: () => toast.error("Logo upload failed"),
  });

  // Password form
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false });

  const passwordMut = useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      tenantApi.changePassword(current, next),
    onSuccess: () => {
      toast.success("Password updated");
      setPwForm({ current: "", next: "" });
      setShowPwForm(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Integrations
  const integMut = useMutation({
    mutationFn: tenantApi.updateIntegrations,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant-me"] }),
  });

  if (isLoading || !tenant) {
    return (
      <DashboardShell sidebar={null} title="Settings" subtitle="Account & integrations">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </DashboardShell>
    );
  }

  const initials = tenant.name.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2);

  return (
    <DashboardShell sidebar={null} title="Settings" subtitle="Account and integrations">
      <div className="max-w-2xl space-y-6">

        {/* ── Company profile ──────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Company profile</span>
          </div>

          <div className="p-6 space-y-5">
            {/* Logo + identity */}
            <div className="flex items-start gap-5">
              <div className="relative group shrink-0">
                {tenant.logoUrl ? (
                  <img
                    src={`/api/public/logo/${tenant.id}`}
                    alt={tenant.name}
                    className="h-16 w-16 rounded-xl object-contain border border-border bg-muted/30"
                  />
                ) : (
                  <div
                    className="h-16 w-16 rounded-xl inline-flex items-center justify-center text-lg font-bold text-white shrink-0"
                    style={{ background: profile.primaryColor || tenant.primaryColor || "#2E86DE" }}
                  >
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => logoRef.current?.click()}
                  title="Upload logo"
                  className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  {logoMut.isPending
                    ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                    : <Upload className="h-4 w-4 text-white" />}
                </button>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) logoMut.mutate(file);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="pt-0.5 min-w-0">
                <div className="font-semibold text-base leading-tight truncate">{tenant.name}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">
                    {tenant.slug}.vocallm.com
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[tenant.status] ?? "bg-muted text-muted-foreground"}`}>
                    {tenant.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Hover the logo and click to upload (PNG, JPG, SVG · max 2 MB)
                </p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">Company name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Owner name</label>
                <input
                  value={profile.ownerName}
                  onChange={(e) => setProfile((p) => ({ ...p, ownerName: e.target.value }))}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                Brand colour
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={profile.primaryColor}
                  onChange={(e) => setProfile((p) => ({ ...p, primaryColor: e.target.value }))}
                  className="h-10 w-10 rounded-md border border-border cursor-pointer bg-background p-0.5"
                />
                <input
                  value={profile.primaryColor}
                  onChange={(e) => setProfile((p) => ({ ...p, primaryColor: e.target.value }))}
                  placeholder="#2E86DE"
                  maxLength={7}
                  className="w-28 h-10 rounded-md border border-border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <div
                  className="h-10 w-10 rounded-md border border-border shrink-0 transition-colors"
                  style={{ background: profile.primaryColor }}
                />
                <span className="text-xs text-muted-foreground">Used for your logo initials</span>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <button
                onClick={() => profileMut.mutate(profile)}
                disabled={profileMut.isPending}
                className="h-9 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {profileMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save profile
              </button>
            </div>
          </div>
        </section>

        {/* ── Account / password ───────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Account</span>
          </div>

          <div className="p-6 space-y-5">
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Email</dt>
                <dd className="font-medium">{tenant.ownerEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Plan</dt>
                <dd className="font-medium">
                  {tenant.plan
                    ? `${tenant.plan.name} · $${tenant.plan.price.toFixed(2)}/min`
                    : <span className="text-muted-foreground">No plan assigned</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Rate per minute</dt>
                <dd className="font-medium">${tenant.ratePerMinute.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Total minutes used</dt>
                <dd className="font-medium">{tenant.totalMinutes.toLocaleString()}</dd>
              </div>
            </dl>

            <div className="border-t border-border pt-4">
              <button
                onClick={() => setShowPwForm((s) => !s)}
                className="text-sm font-medium text-accent hover:underline"
              >
                {showPwForm ? "← Cancel" : "Change password"}
              </button>

              {showPwForm && (
                <div className="mt-4 space-y-3 max-w-sm">
                  {(["current", "next"] as const).map((key) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-1.5">
                        {key === "current" ? "Current password" : "New password"}
                      </label>
                      <div className="relative">
                        <input
                          type={showPw[key] ? "text" : "password"}
                          value={pwForm[key]}
                          onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                          placeholder={key === "next" ? "Min. 8 characters" : ""}
                          className="w-full h-10 rounded-md border border-border bg-background px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPw[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  {passwordMut.isError && (
                    <p className="text-xs text-destructive">{(passwordMut.error as Error).message}</p>
                  )}
                  <button
                    onClick={() => passwordMut.mutate({ current: pwForm.current, next: pwForm.next })}
                    disabled={!pwForm.current || !pwForm.next || passwordMut.isPending}
                    className="h-9 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-2"
                  >
                    {passwordMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Update password
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </DashboardShell>
  );
}

// ── IntegrationCard ───────────────────────────────────────────────────────────

interface Field { key: keyof IntegrationUpdate; label: string; placeholder: string; secret: boolean; }
interface CardProps {
  title: string; description: string; connected: boolean;
  fields: Field[]; onSave: (d: IntegrationUpdate) => void;
  saving: boolean; error?: string;
}

function IntegrationCard({ title, description, connected, fields, onSave, saving, error }: CardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [shown,  setShown]  = useState<Record<string, boolean>>({});
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (saved) { const t = setTimeout(() => setSaved(false), 2500); return () => clearTimeout(t); }
  }, [saved]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: IntegrationUpdate = {};
    fields.forEach((f) => { if (values[f.key]) (payload as Record<string, string>)[f.key] = values[f.key]; });
    onSave(payload);
    setSaved(true);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${connected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
          {connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
            <div className="relative">
              <input
                type={f.secret && !shown[f.key] ? "password" : "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={connected ? "•••••••••••• (leave blank to keep current)" : f.placeholder}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {f.secret && (
                <button type="button" tabIndex={-1}
                  onClick={() => setShown((s) => ({ ...s, [f.key]: !s[f.key] }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {shown[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        ))}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={saving || fields.every((f) => !values[f.key])}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saved && !saving ? "Saved ✓" : "Save"}
        </button>
      </form>
    </div>
  );
}
