import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { campaignsApi, scriptsApi } from "@/lib/api";
import type { Campaign, Script } from "@/lib/types";
import { Plus, Play, Pause, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-success/10 text-success",
  PAUSED: "bg-warning/10 text-warning",
  COMPLETED: "bg-muted text-muted-foreground",
};

const defaultForm = {
  name: "",
  scriptId: "",
  callFromHour: "9",
  callToHour: "17",
  timezone: "America/New_York",
  callDays: "MON,TUE,WED,THU,FRI",
  maxAttempts: "3",
  retryAfterHours: "24",
};

function Campaigns() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: campaignsApi.list,
    refetchInterval: 15_000,
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["scripts"],
    queryFn: scriptsApi.list,
  });

  const liveScripts = scripts.filter((s) => s.status === "LIVE" || s.status === "APPROVED");

  const createMut = useMutation({
    mutationFn: () =>
      campaignsApi.create({
        name: form.name,
        scriptId: form.scriptId,
        callFromHour: parseInt(form.callFromHour),
        callToHour: parseInt(form.callToHour),
        timezone: form.timezone,
        callDays: form.callDays,
        maxAttempts: parseInt(form.maxAttempts),
        retryAfterHours: parseInt(form.retryAfterHours),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      setCreating(false);
      setForm(defaultForm);
      toast.success("Campaign created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const startMut = useMutation({
    mutationFn: (id: string) => campaignsApi.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign started");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pauseMut = useMutation({
    mutationFn: (id: string) => campaignsApi.pause(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign paused");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const f = (key: keyof typeof form, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <DashboardShell
      sidebar={null}
      title="Campaigns"
      subtitle={`${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""}`}
      actions={
        <button
          onClick={() => setCreating(true)}
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New campaign
        </button>
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="text-lg font-semibold">No campaigns yet</div>
          <div className="text-sm text-muted-foreground mt-1">
            Create a campaign to start dialing your leads.
          </div>
          <button
            onClick={() => setCreating(true)}
            className="mt-4 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Create first campaign
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Campaign</th>
                <th className="text-left font-medium px-3 py-2.5">Script</th>
                <th className="text-left font-medium px-3 py-2.5">Hours</th>
                <th className="text-right font-medium px-3 py-2.5">Leads</th>
                <th className="text-right font-medium px-3 py-2.5">Calls</th>
                <th className="text-left font-medium px-3 py-2.5">Status</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">
                    {c.script?.agentName ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground text-xs tabular-nums">
                    {c.callFromHour}:00 – {c.callToHour}:00
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {c._count?.leads ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {c._count?.calls ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full text-xs px-2 py-0.5 font-medium ${STATUS_STYLES[c.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {c.status === "ACTIVE" ? (
                      <button
                        onClick={() => pauseMut.mutate(c.id)}
                        disabled={pauseMut.isPending}
                        className="h-8 px-3 rounded-md border border-border text-xs hover:bg-secondary inline-flex items-center gap-1 disabled:opacity-60"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </button>
                    ) : c.status !== "COMPLETED" ? (
                      <button
                        onClick={() => startMut.mutate(c.id)}
                        disabled={startMut.isPending}
                        className="h-8 px-3 rounded-md bg-success text-white text-xs hover:opacity-90 inline-flex items-center gap-1 disabled:opacity-60"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Start
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create campaign modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-xl rounded-lg border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="font-semibold">New campaign</div>
              <button onClick={() => setCreating(false)} className="p-1 rounded hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Campaign name</label>
                <input
                  value={form.name}
                  onChange={(e) => f("name", e.target.value)}
                  placeholder="US Outreach — June"
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Script</label>
                {liveScripts.length === 0 ? (
                  <p className="mt-1.5 text-sm text-warning">
                    No approved scripts. Submit a script first.
                  </p>
                ) : (
                  <select
                    value={form.scriptId}
                    onChange={(e) => f("scriptId", e.target.value)}
                    className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <option value="">Select script…</option>
                    {liveScripts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.agentName})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Call from (hour)</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={form.callFromHour}
                  onChange={(e) => f("callFromHour", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Call to (hour)</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={form.callToHour}
                  onChange={(e) => f("callToHour", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => f("timezone", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Max attempts per lead</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.maxAttempts}
                  onChange={(e) => f("maxAttempts", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Retry after (hours)</label>
                <input
                  type="number"
                  min={1}
                  value={form.retryAfterHours}
                  onChange={(e) => f("retryAfterHours", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
            {createMut.isError && (
              <div className="mx-5 mb-4 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {(createMut.error as Error)?.message ?? "Failed to create campaign"}
              </div>
            )}
            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setCreating(false)}
                className="h-9 px-4 rounded-md border border-border text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => createMut.mutate()}
                disabled={!form.name || !form.scriptId || createMut.isPending}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                {createMut.isPending ? "Creating…" : "Create campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
