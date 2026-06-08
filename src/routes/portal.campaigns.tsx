import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { campaignApi } from "@/lib/api";
import type { CampaignSettings } from "@/lib/types";
import { Save, Loader2 } from "lucide-react";

export const Route = createFileRoute("/portal/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns · Client Portal" }] }),
  component: Campaigns,
});

const TIMEZONES = [
  "America/New_York",
  "America/Toronto",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Dubai",
  "UTC",
];

function Campaigns() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["campaign-settings"],
    queryFn: () => campaignApi.get(),
  });

  const [form, setForm] = useState<Partial<CampaignSettings>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (values: Partial<CampaignSettings>) => campaignApi.update(values),
    onSuccess: (updated) => {
      qc.setQueryData(["campaign-settings"], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const set = <K extends keyof CampaignSettings>(key: K, value: CampaignSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (isLoading) {
    return (
      <DashboardShell sidebar={null} title="Campaigns" subtitle="Active dialing campaigns">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading settings…
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      sidebar={null}
      title="Campaigns"
      subtitle="Configure your dialing campaign settings"
      actions={
        <button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved!" : "Save changes"}
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Calling hours">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time">
              <input
                type="time"
                value={form.callingHoursStart ?? ""}
                onChange={(e) => set("callingHoursStart", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="End time">
              <input
                type="time"
                value={form.callingHoursEnd ?? ""}
                onChange={(e) => set("callingHoursEnd", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Timezone">
            <select
              value={form.timezone ?? ""}
              onChange={(e) => set("timezone", e.target.value)}
              className={inputCls}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Dialing rules">
          <Field label="Max attempts per lead">
            <input
              type="number"
              min={1}
              max={10}
              value={form.maxAttemptsPerLead ?? ""}
              onChange={(e) => set("maxAttemptsPerLead", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Retry interval (minutes)">
            <input
              type="number"
              min={15}
              value={form.retryIntervalMinutes ?? ""}
              onChange={(e) => set("retryIntervalMinutes", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
        </Section>

        <Section title="Phone numbers">
          <Field label="US number">
            <input
              type="tel"
              value={form.usNumber ?? ""}
              onChange={(e) => set("usNumber", e.target.value)}
              placeholder="+12125550000"
              className={inputCls}
            />
          </Field>
          <Field label="Canada number">
            <input
              type="tel"
              value={form.caNumber ?? ""}
              onChange={(e) => set("caNumber", e.target.value)}
              placeholder="+14165550000"
              className={inputCls}
            />
          </Field>
          <Field label="UAE number">
            <input
              type="tel"
              value={form.uaeNumber ?? ""}
              onChange={(e) => set("uaeNumber", e.target.value)}
              placeholder="+97145550000"
              className={inputCls}
            />
          </Field>
        </Section>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Current config
          </div>
          <div className="font-semibold mt-1">Summary</div>
          <dl className="mt-4 space-y-2 text-sm">
            <Row
              label="Hours"
              value={`${form.callingHoursStart ?? "—"} – ${form.callingHoursEnd ?? "—"}`}
            />
            <Row label="Timezone" value={form.timezone ?? "—"} />
            <Row label="Max attempts" value={String(form.maxAttemptsPerLead ?? "—")} />
            <Row
              label="Retry interval"
              value={form.retryIntervalMinutes ? `${form.retryIntervalMinutes} min` : "—"}
            />
          </dl>
          {mutation.isError && (
            <p className="mt-3 text-xs text-destructive">
              Failed to save. Backend may be offline — changes are cached locally.
            </p>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="font-semibold">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
