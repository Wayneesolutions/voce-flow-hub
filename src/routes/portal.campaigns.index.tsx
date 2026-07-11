import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Fragment } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { campaignsApi, scriptsApi, leadsApi } from "@/lib/api";
import type { LeadBatch } from "@/lib/api";
import type { Campaign, Script } from "@/lib/types";
import { Plus, Play, Pause, X, Loader2, Settings2, List, PhoneOff, Phone, RotateCcw, AlertTriangle, CheckCircle2, Clock, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/campaigns/")({
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
  DRAFT:     "bg-muted text-muted-foreground",
  ACTIVE:    "bg-success/10 text-success",
  PAUSED:    "bg-warning/10 text-warning",
  COMPLETED: "bg-muted text-muted-foreground",
};

const CALLS_PER_MINUTE = 2;

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

function formatEta(remainingLeads: number): string {
  if (remainingLeads <= 0) return "Done";
  const mins = Math.ceil(remainingLeads / CALLS_PER_MINUTE);
  if (mins < 60) return `~${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`;
}

function formatRelative(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── No Answer Modal ─────────────────────────────────────────────────────────

function NoAnswerModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const qc = useQueryClient();
  const [retryResult, setRetryResult] = useState<{ reset: number; queued: boolean; campaignStatus: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["campaign-no-answers", campaign.id],
    queryFn: () => campaignsApi.noAnswers(campaign.id),
  });

  const retryMut = useMutation({
    mutationFn: (includeExhausted: boolean) =>
      campaignsApi.retryNoAnswers(campaign.id, includeExhausted),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign-no-answers", campaign.id] });
      setRetryResult(result);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const leads          = data?.leads          ?? [];
  const maxAttempts    = data?.maxAttempts    ?? campaign.maxAttempts;
  const retryableCount = data?.retryableCount ?? 0;
  const exhaustedCount = data?.exhaustedCount ?? 0;
  const total          = data?.total          ?? 0;
  const isActive       = campaign.status === "ACTIVE";

  const scheduleLabel = `${campaign.callFromHour}:00 – ${campaign.callToHour}:00 · ${campaign.callDays.replace(/,/g, " · ")} · ${campaign.timezone}`;
  const etaText       = retryResult ? formatEta(retryResult.reset) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-semibold flex items-center gap-2">
              <PhoneOff className="h-4 w-4 text-warning" />
              No Answer Leads
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{campaign.name}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── POST-RETRY CONFIRMATION SCREEN ── */}
        {retryResult ? (
          <>
            <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-12 text-center">
              <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>

              <div>
                <div className="text-xl font-semibold">
                  {retryResult.reset} lead{retryResult.reset !== 1 ? "s" : ""} queued for retry
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {retryResult.queued
                    ? "The AI dialer has been triggered and will start calling shortly."
                    : "Leads have been reset. Start or resume the campaign to begin dialing."}
                </div>
              </div>

              <div className="w-full max-w-sm rounded-lg border border-border bg-muted/30 divide-y divide-border text-sm">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Calling window</div>
                    <div className="font-medium mt-0.5">
                      {campaign.callFromHour}:00 – {campaign.callToHour}:00
                      <span className="text-muted-foreground font-normal ml-1">({campaign.timezone})</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Calling days</div>
                    <div className="font-medium mt-0.5">
                      {campaign.callDays.replace(/,/g, " · ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Estimated time to complete</div>
                    <div className="font-medium mt-0.5">
                      {etaText}
                      <span className="text-muted-foreground font-normal ml-1.5">at {CALLS_PER_MINUTE} calls/min</span>
                    </div>
                  </div>
                </div>
              </div>

              {!retryResult.queued && (
                <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 rounded-md px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Campaign is {retryResult.campaignStatus.toLowerCase()} — go to Campaigns and press Start to begin dialing
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-border flex justify-end">
              <button
                onClick={onClose}
                className="h-9 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ── NORMAL VIEW ── */}

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-5 px-5 py-3 border-b border-border bg-muted/30 text-sm">
              <div>
                <span className="font-semibold tabular-nums">{total}</span>
                <span className="text-muted-foreground ml-1.5">total</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div>
                <span className="font-semibold tabular-nums text-success">{retryableCount}</span>
                <span className="text-muted-foreground ml-1.5">retryable</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div>
                <span className="font-semibold tabular-nums text-muted-foreground">{exhaustedCount}</span>
                <span className="text-muted-foreground ml-1.5">exhausted (all {maxAttempts} attempts used)</span>
              </div>
            </div>

            {/* Campaign schedule info bar */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border bg-muted/10 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Calls go out during: <span className="text-foreground font-medium">{scheduleLabel}</span></span>
              {!isActive && (
                <span className="ml-auto flex items-center gap-1 text-warning font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Campaign {campaign.status.toLowerCase()}
                </span>
              )}
            </div>

            {/* Lead table */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading leads…
                </div>
              ) : leads.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No no-answer leads for this campaign
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground sticky top-0 z-10">
                    <tr>
                      <th className="text-left font-medium px-5 py-2.5">Lead</th>
                      <th className="text-left font-medium px-3 py-2.5">Phone</th>
                      <th className="text-center font-medium px-3 py-2.5">Attempts</th>
                      <th className="text-right font-medium px-5 py-2.5">Last Called</th>
                      <th className="text-center font-medium px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      const isExhausted = lead.callAttempts >= maxAttempts;
                      return (
                        <tr key={lead.id} className="border-t border-border hover:bg-muted/20">
                          <td className="px-5 py-3">
                            <div className="font-medium">{lead.name}</div>
                            {lead.company && (
                              <div className="text-xs text-muted-foreground">{lead.company}</div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground tabular-nums text-xs">
                            {lead.phone}
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums">
                            <span className={isExhausted ? "text-destructive font-medium" : "text-foreground font-medium"}>
                              {lead.callAttempts}
                            </span>
                            <span className="text-muted-foreground"> / {maxAttempts}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                            {formatRelative(lead.lastCalledAt)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isExhausted
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-success/10 text-success"
                              }`}
                            >
                              {isExhausted ? "Exhausted" : "Retryable"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                <strong>Retryable</strong> — resets to PENDING, dials within the calling window above.<br />
                <strong>Exhausted</strong> — resets attempt counter to 0 for a fresh start.
              </p>
              <div className="flex gap-2 shrink-0">
                {exhaustedCount > 0 && (
                  <button
                    onClick={() => retryMut.mutate(true)}
                    disabled={retryMut.isPending || total === 0}
                    title="Resets attempt counter to 0 so exhausted leads get fresh tries"
                    className="h-9 px-4 rounded-md border border-border text-sm hover:bg-secondary disabled:opacity-60 inline-flex items-center gap-1.5"
                  >
                    {retryMut.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Retry all incl. exhausted ({total})
                  </button>
                )}
                <button
                  onClick={() => retryMut.mutate(false)}
                  disabled={retryMut.isPending || retryableCount === 0}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {retryMut.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Phone className="h-3.5 w-3.5" />
                  )}
                  Retry retryable ({retryableCount})
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Campaign Progress Row ───────────────────────────────────────────────────

function CampaignProgress({
  c,
  onNoAnswerClick,
  isNoAnswerOpen,
}: {
  c: Campaign;
  onNoAnswerClick: () => void;
  isNoAnswerOpen: boolean;
}) {
  const totalLeads = c._count?.leads ?? 0;
  const totalCalls = c._count?.calls ?? 0;
  const pct        = totalLeads > 0 ? Math.min(100, Math.round((totalCalls / totalLeads) * 100)) : 0;
  const remaining  = Math.max(0, totalLeads - totalCalls);
  const outcomes   = c.outcomeCounts ?? {};
  const booked     = outcomes.BOOKED         ?? 0;
  const voicemail  = outcomes.VOICEMAIL      ?? 0;
  const noAnswer   = outcomes.NO_ANSWER      ?? 0;
  const notInt     = outcomes.NOT_INTERESTED ?? 0;
  const callback   = outcomes.CALLBACK       ?? 0;

  return (
    <td colSpan={7} className="px-5 pb-3 pt-0">
      <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-3 space-y-2.5">

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground w-24 text-right shrink-0">
            {totalCalls} / {totalLeads} leads
          </span>
          <span className="text-xs font-semibold tabular-nums w-10 text-right shrink-0">
            {pct}%
          </span>
        </div>

        {/* Outcome pills + ETA */}
        <div className="flex items-center flex-wrap gap-2">
          {booked > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success text-xs px-2 py-0.5 font-medium">
              Booked: {booked}
            </span>
          )}
          {callback > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent-foreground text-xs px-2 py-0.5 font-medium">
              Callback: {callback}
            </span>
          )}
          {voicemail > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground text-xs px-2 py-0.5 font-medium">
              Voicemail: {voicemail}
            </span>
          )}

          {noAnswer > 0 && (
            <button
              onClick={onNoAnswerClick}
              className={`inline-flex items-center gap-1.5 rounded-full text-xs px-2.5 py-0.5 font-semibold transition-colors ${
                isNoAnswerOpen
                  ? "bg-warning/30 text-warning border border-warning/60 ring-2 ring-warning/20"
                  : "bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20 hover:border-warning/40"
              }`}
              title="Click to view and retry no-answer leads"
            >
              <PhoneOff className="h-3 w-3" />
              No Answer: {noAnswer}
            </button>
          )}

          {notInt > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive text-xs px-2 py-0.5 font-medium">
              Not Interested: {notInt}
            </span>
          )}
          {totalCalls === 0 && (
            <span className="text-xs text-muted-foreground">No calls yet</span>
          )}

          {c.status === "ACTIVE" && remaining > 0 && (
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              ETA: {formatEta(remaining)} · {CALLS_PER_MINUTE} calls/min
            </span>
          )}
          {c.status === "PAUSED" ? (
            <span className="ml-auto text-xs text-warning">Paused — resume to continue</span>
          ) : pct >= 100 ? (
            <span className="ml-auto text-xs text-muted-foreground">
              All leads dialed · use <span className="font-medium">No Answer</span> to retry
            </span>
          ) : null}
        </div>
      </div>
    </td>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

function Campaigns() {
  const qc = useQueryClient();
  const [creating, setCreating]                 = useState(false);
  const [form, setForm]                         = useState(defaultForm);
  const [editing, setEditing]                   = useState<Campaign | null>(null);
  const [editForm, setEditForm]                 = useState({ callFromHour: "9", callToHour: "17", timezone: "America/New_York", callDays: "MON,TUE,WED,THU,FRI", maxAttempts: "3", retryAfterHours: "24" });
  const [selectedBatchId, setSelectedBatchId]   = useState<string | null>(null);
  const [batchLimit, setBatchLimit]             = useState<string>("");
  const [noAnswerCampaign, setNoAnswerCampaign] = useState<Campaign | null>(null);

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: campaignsApi.list,
    refetchInterval: 15_000,
  });

  const { data: scripts = [] } = useQuery<Script[]>({
    queryKey: ["scripts"],
    queryFn: scriptsApi.list,
  });

  const { data: batches = [], isLoading: batchesLoading } = useQuery<LeadBatch[]>({
    queryKey: ["leads", "batches"],
    queryFn: leadsApi.listBatches,
    enabled: creating,
  });

  const liveScripts      = scripts.filter((s) => s.status === "LIVE" || s.status === "APPROVED");
  const selectedBatch    = batches.find((b) => b.id === selectedBatchId) ?? null;
  const availableInBatch = selectedBatch?.available ?? 0;
  const parsedLimit      = parseInt(batchLimit) || 0;

  function openCreate() {
    setSelectedBatchId(null);
    setBatchLimit("");
    setForm(defaultForm);
    setCreating(true);
  }

  const createMut = useMutation({
    mutationFn: () =>
      campaignsApi.create({
        name:            form.name,
        scriptId:        form.scriptId,
        callFromHour:    parseInt(form.callFromHour),
        callToHour:      parseInt(form.callToHour),
        timezone:        form.timezone,
        callDays:        form.callDays,
        maxAttempts:     parseInt(form.maxAttempts),
        retryAfterHours: parseInt(form.retryAfterHours),
        batchId:         selectedBatchId ?? undefined,
        batchLimit:      parsedLimit > 0 ? parsedLimit : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["leads", "batches"] });
      setCreating(false);
      setForm(defaultForm);
      setSelectedBatchId(null);
      setBatchLimit("");
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
      callFromHour:    String(c.callFromHour),
      callToHour:      String(c.callToHour),
      timezone:        c.timezone,
      callDays:        c.callDays,
      maxAttempts:     String(c.maxAttempts),
      retryAfterHours: String(c.retryAfterHours),
    });
    setEditing(c);
  };

  const ef = (key: keyof typeof editForm, val: string) => setEditForm((p) => ({ ...p, [key]: val }));
  const f  = (key: keyof typeof form, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const showProgress = (c: Campaign) => c.status === "ACTIVE" || c.status === "PAUSED";

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
                <th className="text-left font-medium px-3 py-2.5">Schedule</th>
                <th className="text-right font-medium px-3 py-2.5">Leads</th>
                <th className="text-right font-medium px-3 py-2.5">Calls</th>
                <th className="text-left font-medium px-3 py-2.5">Status</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <Fragment key={c.id}>
                  <tr className="border-t border-border hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <Link
                        to="/portal/campaigns/$id"
                        params={{ id: c.id }}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {c.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {c.script?.agentName ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground text-xs tabular-nums">
                      {c.callFromHour}:00 – {c.callToHour}:00
                      <div className="mt-0.5">{c.callDays.replace(/,/g, " · ")}</div>
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
                        {(() => {
                          const totalLeads = c._count?.leads ?? 0;
                          const totalCalls = c._count?.calls ?? 0;
                          const maxAttempts = c.maxAttempts ?? 3;
                          const roundsDone = totalLeads > 0
                            ? Math.min(maxAttempts, Math.floor(totalCalls / totalLeads))
                            : 0;
                          const attemptsLeft = Math.max(0, maxAttempts - roundsDone);
                          // Only show Retry when at least one full round is done (totalCalls >= totalLeads).
                          // If paused mid-round (e.g. 30/95 calls), show Resume instead.
                          const oneRoundComplete = totalLeads > 0 && totalCalls >= totalLeads;
                          const isRetryState = c.status === "PAUSED" && oneRoundComplete && attemptsLeft > 0;

                          if (c.status === "ACTIVE") {
                            return (
                              <button
                                onClick={() => pauseMut.mutate(c.id)}
                                disabled={pauseMut.isPending}
                                className="h-8 px-3 rounded-md border border-border text-xs hover:bg-secondary inline-flex items-center gap-1 disabled:opacity-60"
                              >
                                <Pause className="h-3.5 w-3.5" />
                                Pause
                              </button>
                            );
                          }
                          if (c.status === "COMPLETED") {
                            return (
                              <span className="h-8 px-3 rounded-md bg-muted text-muted-foreground text-xs inline-flex items-center gap-1 font-medium">
                                All dialed
                              </span>
                            );
                          }
                          if (isRetryState) {
                            return (
                              <button
                                onClick={() => startMut.mutate(c.id)}
                                disabled={startMut.isPending}
                                className="h-8 px-3 rounded-md bg-success text-white text-xs hover:opacity-90 inline-flex items-center gap-1 disabled:opacity-60"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Retry · {attemptsLeft} left
                              </button>
                            );
                          }
                          const hasStarted = totalCalls > 0;
                          return (
                            <button
                              onClick={() => startMut.mutate(c.id)}
                              disabled={startMut.isPending}
                              className="h-8 px-3 rounded-md bg-success text-white text-xs hover:opacity-90 inline-flex items-center gap-1 disabled:opacity-60"
                            >
                              <Play className="h-3.5 w-3.5" />
                              {hasStarted ? "Resume" : "Start"}
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>

                  {showProgress(c) && (
                    <tr className="border-t border-border/40 bg-muted/5">
                      <CampaignProgress
                        c={c}
                        onNoAnswerClick={() => setNoAnswerCampaign(c)}
                        isNoAnswerOpen={noAnswerCampaign?.id === c.id}
                      />
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Answer Modal */}
      {noAnswerCampaign && (
        <NoAnswerModal
          campaign={noAnswerCampaign}
          onClose={() => setNoAnswerCampaign(null)}
        />
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
                  callFromHour:    parseInt(editForm.callFromHour),
                  callToHour:      parseInt(editForm.callToHour),
                  timezone:        editForm.timezone,
                  callDays:        editForm.callDays,
                  maxAttempts:     parseInt(editForm.maxAttempts),
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
              <button onClick={() => { setCreating(false); setSelectedBatchId(null); setBatchLimit(""); }} className="p-1 rounded hover:bg-secondary">
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

              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Lead batch</label>
                {batchesLoading ? (
                  <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading batches…
                  </div>
                ) : batches.filter((b) => b.available > 0).length === 0 ? (
                  <div className="mt-1.5 rounded-md border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
                    {batches.length === 0
                      ? "No lead batches found. Upload a CSV/XLSX file first."
                      : "All uploaded batches are fully used. Upload a new CSV/XLSX file to start a new campaign."}
                  </div>
                ) : (
                  <div className="mt-1.5 grid gap-2">
                    {batches.filter((b) => b.available > 0).map((b) => {
                      const selected = selectedBatchId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedBatchId(b.id);
                            setBatchLimit(String(b.available));
                          }}
                          className={`w-full text-left rounded-md border px-4 py-3 transition-colors ${
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">{b.filename}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                            <span className="text-success font-medium">{b.available} available</span>
                            <span>{b.used} used</span>
                            <span>{b.totalCount} total</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedBatch && (
                  <div className="mt-3">
                    <label className="text-sm font-medium">How many leads to include</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={availableInBatch}
                        value={batchLimit}
                        onChange={(e) => setBatchLimit(e.target.value)}
                        className="w-36 h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                      />
                      <span className="text-sm text-muted-foreground">
                        / {availableInBatch} available
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Call from (hour)</label>
                <input
                  type="number" min={0} max={23}
                  value={form.callFromHour}
                  onChange={(e) => f("callFromHour", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Call to (hour)</label>
                <input
                  type="number" min={0} max={23}
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
                  Scheduled callbacks always fire regardless of these days.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Max attempts per lead</label>
                <input
                  type="number" min={1} max={10}
                  value={form.maxAttempts}
                  onChange={(e) => f("maxAttempts", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Retry after (hours)</label>
                <input
                  type="number" min={1}
                  value={form.retryAfterHours}
                  onChange={(e) => f("retryAfterHours", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>

            <div className="mx-5 mb-4 rounded-md bg-muted/50 border border-border px-4 py-2.5 text-xs text-muted-foreground">
              Calls will be placed at <span className="font-semibold text-foreground">{CALLS_PER_MINUTE} calls/minute</span>.
              {parsedLimit > 0 && (
                <> &nbsp;{parsedLimit} leads → ETA <span className="font-semibold text-foreground">{formatEta(parsedLimit)}</span>.</>
              )}
            </div>

            {createMut.isError && (
              <div className="mx-5 mb-4 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {(createMut.error as Error)?.message ?? "Failed to create campaign"}
              </div>
            )}
            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => { setCreating(false); setSelectedBatchId(null); setBatchLimit(""); }}
                className="h-9 px-4 rounded-md border border-border text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => createMut.mutate()}
                disabled={!form.name || !form.scriptId || !selectedBatchId || parsedLimit === 0 || createMut.isPending}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                title={!selectedBatchId ? "Select a batch" : parsedLimit === 0 ? "Set lead count above 0" : undefined}
              >
                {createMut.isPending ? "Creating…" : `Create campaign${parsedLimit > 0 ? ` (${parsedLimit} leads)` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
