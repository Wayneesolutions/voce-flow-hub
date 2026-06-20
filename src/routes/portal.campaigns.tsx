import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { campaignsApi, scriptsApi, leadsApi } from "@/lib/api";
import type { Campaign, Lead, Script } from "@/lib/types";
import { Plus, Play, Pause, X, Loader2, Settings2, List, CheckSquare, Square, Search } from "lucide-react";
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
  "Asia/Kolkata",
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
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [editForm, setEditForm] = useState({ callFromHour: "9", callToHour: "17", timezone: "America/New_York", callDays: "MON,TUE,WED,THU,FRI", maxAttempts: "3", retryAfterHours: "24" });
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [leadSearch, setLeadSearch] = useState("");

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: campaignsApi.list,
    refetchInterval: 15_000,
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["scripts"],
    queryFn: scriptsApi.list,
  });

  const { data: unassignedLeads, isLoading: leadsLoading } = useQuery<{ leads: Lead[]; total: number; page: number; pages: number }>({
    queryKey: ["leads", "unassigned-list"],
    queryFn: () => leadsApi.list({ unassigned: true, limit: 500 }),
    enabled: creating,
  });

  const liveScripts = scripts.filter((s) => s.status === "LIVE" || s.status === "APPROVED");
  const availableLeads = unassignedLeads?.leads ?? [];

  const q = leadSearch.trim().toLowerCase();
  const filteredLeads = q
    ? availableLeads.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.company ?? "").toLowerCase().includes(q) ||
          l.phone.includes(q)
      )
    : availableLeads;

  const allFilteredSelected =
    filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.has(l.id));
  const someFilteredSelected = filteredLeads.some((l) => selectedLeadIds.has(l.id)) && !allFilteredSelected;

  function toggleLead(id: string) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allFilteredSelected) {
      setSelectedLeadIds((prev) => {
        const next = new Set(prev);
        filteredLeads.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedLeadIds((prev) => {
        const next = new Set(prev);
        filteredLeads.forEach((l) => next.add(l.id));
        return next;
      });
    }
  }

  function openCreate() {
    setSelectedLeadIds(new Set());
    setLeadSearch("");
    setForm(defaultForm);
    setCreating(true);
  }

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
        leadIds: selectedLeadIds.size > 0 ? Array.from(selectedLeadIds) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      setCreating(false);
      setForm(defaultForm);
      setSelectedLeadIds(new Set());
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

  const updateMut = useMutation({
    mutationFn: (data: Parameters<typeof campaignsApi.update>[1]) =>
      campaignsApi.update(editing!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      setEditing(null);
      toast.success("Campaign updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = (c: Campaign) => {
    setEditForm({
      callFromHour: String(c.callFromHour),
      callToHour: String(c.callToHour),
      timezone: c.timezone,
      callDays: c.callDays,
      maxAttempts: String(c.maxAttempts),
      retryAfterHours: String(c.retryAfterHours),
    });
    setEditing(c);
  };

  const ef = (key: keyof typeof editForm, val: string) => setEditForm((p) => ({ ...p, [key]: val }));

  const f = (key: keyof typeof form, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <DashboardShell
      sidebar={null}
      title="Campaigns"
      subtitle={`${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""}`}
      actions={
        <button
          onClick={openCreate}
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
            onClick={openCreate}
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
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to="/portal/leads"
                        search={{ campaignId: c.id, campaignName: c.name }}
                        className="h-8 w-8 rounded-md border border-border text-xs hover:bg-secondary inline-flex items-center justify-center"
                        title="View leads"
                      >
                        <List className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => openEdit(c)}
                        className="h-8 w-8 rounded-md border border-border text-xs hover:bg-secondary inline-flex items-center justify-center"
                        title="Edit schedule"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit schedule modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="font-semibold">Edit schedule — {editing.name}</div>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Call from (hour)</label>
                <input
                  type="number" min={0} max={23}
                  value={editForm.callFromHour}
                  onChange={(e) => ef("callFromHour", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Call to (hour)</label>
                <input
                  type="number" min={0} max={23}
                  value={editForm.callToHour}
                  onChange={(e) => ef("callToHour", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Timezone</label>
                <select
                  value={editForm.timezone}
                  onChange={(e) => ef("timezone", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Call days</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day) => {
                    const active = editForm.callDays.split(",").includes(day);
                    const toggle = () => {
                      const days = editForm.callDays.split(",").filter(Boolean);
                      const next = active ? days.filter((d) => d !== day) : [...days, day];
                      ef("callDays", next.join(","));
                    };
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={toggle}
                        className={`h-8 w-12 rounded-md text-xs font-medium border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Max attempts</label>
                <input
                  type="number" min={1} max={10}
                  value={editForm.maxAttempts}
                  onChange={(e) => ef("maxAttempts", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Retry after (hours)</label>
                <input
                  type="number" min={1}
                  value={editForm.retryAfterHours}
                  onChange={(e) => ef("retryAfterHours", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="h-9 px-4 rounded-md border border-border text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => updateMut.mutate({
                  callFromHour: parseInt(editForm.callFromHour),
                  callToHour: parseInt(editForm.callToHour),
                  timezone: editForm.timezone,
                  callDays: editForm.callDays,
                  maxAttempts: parseInt(editForm.maxAttempts),
                  retryAfterHours: parseInt(editForm.retryAfterHours),
                })}
                disabled={updateMut.isPending}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                {updateMut.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create campaign modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-xl rounded-lg border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="font-semibold">New campaign</div>
              <button onClick={() => { setCreating(false); setSelectedLeadIds(new Set()); }} className="p-1 rounded hover:bg-secondary">
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
              {/* Leads assignment */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Leads to include</label>
                  {availableLeads.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {selectedLeadIds.size} of {availableLeads.length} selected
                    </span>
                  )}
                </div>

                {leadsLoading ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading leads…
                  </div>
                ) : availableLeads.length === 0 ? (
                  <div className="rounded-md border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
                    No unassigned leads. Upload leads first before creating a campaign.
                  </div>
                ) : (
                  <div className="rounded-md border border-border overflow-hidden">
                    {/* Search */}
                    <div className="relative border-b border-border">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        placeholder="Search by name, company or phone…"
                        className="w-full h-9 bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent/40"
                      />
                    </div>

                    {/* Select all header */}
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/40 hover:bg-muted/70 text-sm font-medium transition-colors border-b border-border"
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                      ) : someFilteredSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary/50 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      {allFilteredSelected ? "Deselect all" : "Select all"}
                      {q && <span className="ml-auto text-xs text-muted-foreground font-normal">{filteredLeads.length} match{filteredLeads.length !== 1 ? "es" : ""}</span>}
                    </button>

                    {/* Lead rows */}
                    <div className="max-h-52 overflow-y-auto divide-y divide-border">
                      {filteredLeads.length === 0 && (
                        <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                          No leads match "{leadSearch}"
                        </div>
                      )}
                      {filteredLeads.map((lead) => {
                        const checked = selectedLeadIds.has(lead.id);
                        return (
                          <button
                            key={lead.id}
                            type="button"
                            onClick={() => toggleLead(lead.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40 ${checked ? "bg-primary/5" : ""}`}
                          >
                            {checked ? (
                              <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{lead.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {[lead.company, lead.phone].filter(Boolean).join(" · ")}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{lead.country}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Call days</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((day) => {
                    const active = form.callDays.split(",").includes(day);
                    const toggle = () => {
                      const days = form.callDays.split(",").filter(Boolean);
                      const next = active ? days.filter((d) => d !== day) : [...days, day];
                      f("callDays", next.join(","));
                    };
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={toggle}
                        className={`h-8 w-12 rounded-md text-xs font-medium border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Scheduled callbacks (lead requested a specific time) always fire regardless of these days.
                </p>
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
                onClick={() => { setCreating(false); setSelectedLeadIds(new Set()); }}
                className="h-9 px-4 rounded-md border border-border text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => createMut.mutate()}
                disabled={!form.name || !form.scriptId || selectedLeadIds.size === 0 || createMut.isPending}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                title={selectedLeadIds.size === 0 ? "Select at least one lead" : undefined}
              >
                {createMut.isPending ? "Creating…" : `Create campaign${selectedLeadIds.size > 0 ? ` (${selectedLeadIds.size} leads)` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
