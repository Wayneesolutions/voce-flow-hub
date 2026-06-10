import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { tenantApi, type IntegrationUpdate } from "@/lib/api";
import { CheckCircle2, Circle, Loader2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/portal/settings")({
  head: () => ({ meta: [{ title: "Settings · Client Portal" }] }),
  component: Settings,
});

function Settings() {
  const qc = useQueryClient();
  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-me"],
    queryFn: tenantApi.me,
  });

  const save = useMutation({
    mutationFn: (data: IntegrationUpdate) => tenantApi.updateIntegrations(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant-me"] }),
  });

  if (isLoading) {
    return (
      <DashboardShell sidebar={null} title="Settings" subtitle="Integrations & account">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell sidebar={null} title="Settings" subtitle="Connect your calendar and CRM">
      <div className="max-w-2xl space-y-6">
        <IntegrationCard
          title="Cal.com"
          description="Where meetings get booked when a prospect agrees to a call. Connect your own Cal.com account so meetings appear in your calendar, not Wayne Solutions'."
          connected={!!tenant?.hasCalcom}
          fields={[
            { key: "calcomApiKey",      label: "API Key",        placeholder: "cal_live_…",   secret: true },
            { key: "calcomEventTypeId", label: "Event Type ID",  placeholder: "123456",       secret: false },
          ]}
          onSave={(data) => save.mutate(data)}
          saving={save.isPending}
          error={save.isError ? (save.error as Error).message : undefined}
        />

        <IntegrationCard
          title="HubSpot"
          description="After each call, the prospect contact and call activity are logged here automatically. Connect your HubSpot to see all your leads in one place."
          connected={!!tenant?.hasHubspot}
          fields={[
            { key: "hubspotAccessToken", label: "Private App Access Token", placeholder: "pat-na1-…", secret: true },
          ]}
          onSave={(data) => save.mutate(data)}
          saving={save.isPending}
          error={save.isError ? (save.error as Error).message : undefined}
        />

        <IntegrationCard
          title="Google Calendar"
          description="Optional — sync booked meetings directly to Google Calendar in addition to Cal.com."
          connected={!!tenant?.hasGcal}
          fields={[
            { key: "googleCalendarToken", label: "OAuth Token", placeholder: "ya29.…", secret: true },
          ]}
          onSave={(data) => save.mutate(data)}
          saving={save.isPending}
          error={save.isError ? (save.error as Error).message : undefined}
        />
      </div>
    </DashboardShell>
  );
}

// ── IntegrationCard ───────────────────────────────────────────────────────────

interface Field {
  key: keyof IntegrationUpdate;
  label: string;
  placeholder: string;
  secret: boolean;
}

interface CardProps {
  title: string;
  description: string;
  connected: boolean;
  fields: Field[];
  onSave: (data: IntegrationUpdate) => void;
  saving: boolean;
  error?: string;
}

function IntegrationCard({ title, description, connected, fields, onSave, saving, error }: CardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: IntegrationUpdate = {};
    fields.forEach((f) => {
      if (values[f.key] !== undefined && values[f.key] !== "") {
        (payload as Record<string, string>)[f.key] = values[f.key];
      }
    });
    onSave(payload);
    setSaved(true);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${
            connected
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {connected ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {f.label}
            </label>
            <div className="relative">
              <input
                type={f.secret && !shown[f.key] ? "password" : "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={connected ? "••••••••••••  (leave blank to keep current)" : f.placeholder}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {f.secret && (
                <button
                  type="button"
                  tabIndex={-1}
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
          {saved && !saving ? "Saved" : "Save"}
        </button>
      </form>
    </div>
  );
}
