import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { campaignsApi, callsApi } from "@/lib/api";
import type { Campaign, Call } from "@/lib/types";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/portal/campaigns/$id")({
  head: () => ({ meta: [{ title: "Campaign Detail · Client Portal" }] }),
  component: CampaignDetail,
});

const LIMIT = 25;

const OUTCOME_STYLES: Record<string, string> = {
  BOOKED:         "bg-success/10 text-success",
  NOT_INTERESTED: "bg-destructive/10 text-destructive",
  VOICEMAIL:      "bg-blue-500/10 text-blue-500",
  NO_ANSWER:      "bg-muted text-muted-foreground",
  CALLBACK:       "bg-warning/10 text-warning",
  OPTED_OUT:      "bg-muted text-muted-foreground",
  ERROR:          "bg-destructive/10 text-destructive",
};

const OUTCOME_LABELS: Record<string, string> = {
  BOOKED:         "Booked",
  NOT_INTERESTED: "Not Interested",
  VOICEMAIL:      "Voicemail",
  NO_ANSWER:      "No Answer",
  CALLBACK:       "Callback",
  OPTED_OUT:      "Opted Out",
  ERROR:          "Error",
};

const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  DRAFT:     "bg-muted text-muted-foreground",
  ACTIVE:    "bg-success/10 text-success",
  PAUSED:    "bg-warning/10 text-warning",
  COMPLETED: "bg-muted text-muted-foreground",
};

function formatDuration(seconds?: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Call Detail Panel ────────────────────────────────────────────────────────

function CallDetailPanel({ call, loading }: { call: Call; loading: boolean }) {
  const lines = call.transcript
    ? call.transcript
        .split("\n")
        .filter(Boolean)
        .filter((line) => !/^\[SYSTEM\]/i.test(line))
        .map((line) => {
          const isAgent = /^\[ASSISTANT\]/i.test(line) || /^\[BOT\]/i.test(line);
          return { who: isAgent ? "ai" : "lead", text: line.replace(/^\[\w+\]\s*/, "") };
        })
    : [];

  return (
    <>
      <div className="p-5 border-b border-border">
        <div className="font-semibold">{call.lead?.name ?? "Unknown"}</div>
        <div className="text-xs text-muted-foreground">
          {call.lead?.phone}
          {call.lead?.company ? ` · ${call.lead.company}` : ""}
        </div>
      </div>

      <div className="p-5 border-b border-border">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Duration</div>
        <div className="text-lg font-semibold tabular-nums">{formatDuration(call.duration)}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {call.startedAt ? formatDateTime(call.startedAt) : "—"}
        </div>
      </div>

      <div className="p-5 border-b border-border">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Outcome</div>
        <div
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            call.outcome
              ? (OUTCOME_STYLES[call.outcome] ?? "bg-muted text-muted-foreground")
              : "bg-muted text-muted-foreground"
          }`}
        >
          {call.outcome ? (OUTCOME_LABELS[call.outcome] ?? call.outcome.replace(/_/g, " ")) : "Unknown"}
        </div>
        {call.meetingAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Meeting booked · {new Date(call.meetingAt).toLocaleString()}
          </p>
        )}
        {(call as any).scheduledAt && (
          <p className="mt-1 text-xs text-accent font-medium">
            Scheduled for · {new Date((call as any).scheduledAt).toLocaleString()}
          </p>
        )}
        {call.meetingLink && (
          <a
            href={call.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block text-xs text-primary hover:underline"
          >
            Open meeting link
          </a>
        )}
      </div>

      {(call as any).summary && (
        <div className="p-5 border-b border-border">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Summary</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{(call as any).summary}</p>
        </div>
      )}

      {call.recordingUrl && (
        <div className="p-5 border-b border-border">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recording</div>
          <audio controls src={call.recordingUrl} className="w-full h-9" preload="metadata" />
          <a
            href={call.recordingUrl}
            download
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Download recording
          </a>
        </div>
      )}

      <div className="p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Transcript</div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {!loading && lines.length === 0 && (
          <p className="text-sm text-muted-foreground">No transcript available</p>
        )}
        <div className="space-y-2">
          {lines.map((t, i) => (
            <div key={i} className={t.who === "ai" ? "flex justify-start" : "flex justify-end"}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${
                  t.who === "ai"
                    ? "bg-secondary rounded-bl-sm"
                    : "bg-accent text-accent-foreground rounded-br-sm"
                }`}
              >
                {t.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

function CampaignDetail() {
  const { id } = Route.useParams();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<string>("");

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: campaignsApi.list,
  });
  const campaign = campaigns.find((c) => c.id === id);

  const { data: callsData, isLoading: callsLoading } = useQuery({
    queryKey: ["calls", { campaignId: id, page, outcome: outcomeFilter || undefined }],
    queryFn: () =>
      callsApi.list({
        campaignId: id,
        page,
        limit: LIMIT,
        outcome: outcomeFilter || undefined,
      }),
  });

  const calls = callsData?.calls ?? [];
  const total = callsData?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;

  const selected = calls.find((c) => c.id === selectedId) ?? calls[0] ?? null;

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["call-detail", selected?.id],
    queryFn: () => callsApi.get(selected!.id),
    enabled: !!selected?.id,
  });

  const oc = campaign?.outcomeCounts ?? {};
  const totalLeads = campaign?._count?.leads ?? 0;
  const totalCalls = campaign?._count?.calls ?? 0;

  return (
    <DashboardShell
      sidebar={null}
      title={campaign?.name ?? "Campaign"}
      subtitle={campaign ? `${totalLeads} leads · ${totalCalls} calls` : "Loading…"}
      actions={
        <Link
          to="/portal/campaigns"
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border text-sm hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          All campaigns
        </Link>
      }
    >
      {/* Campaign header */}
      {campaign && (
        <div className="rounded-lg border border-border bg-card px-4 py-3 mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span
            className={`inline-flex rounded-full text-xs px-2.5 py-0.5 font-medium ${CAMPAIGN_STATUS_STYLES[campaign.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {campaign.status}
          </span>
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">
              {campaign.callFromHour}:00 – {campaign.callToHour}:00
            </span>
            {" · "}
            {campaign.callDays.replace(/,/g, " · ")}
            {" · "}
            {campaign.timezone}
          </span>
          {campaign.script && (
            <span className="text-muted-foreground">
              Script:{" "}
              <span className="font-medium text-foreground">{campaign.script.name}</span>
            </span>
          )}
        </div>
      )}

      {/* Stats bar */}
      {campaign && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
          {[
            { label: "Total calls",    value: totalCalls,              color: "" },
            { label: "Booked",         value: oc.BOOKED ?? 0,          color: "text-success" },
            { label: "No Answer",      value: oc.NO_ANSWER ?? 0,       color: "text-muted-foreground" },
            { label: "Voicemail",      value: oc.VOICEMAIL ?? 0,       color: "text-blue-500" },
            { label: "Not Interested", value: oc.NOT_INTERESTED ?? 0,  color: "text-destructive" },
            { label: "Callback",       value: oc.CALLBACK ?? 0,        color: "text-warning" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3">
              <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Call log + detail panel */}
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        {/* Left: call table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-muted/30">
            <span className="text-sm font-medium">Call Log</span>
            <div className="flex items-center gap-3">
              <select
                value={outcomeFilter}
                onChange={(e) => {
                  setOutcomeFilter(e.target.value);
                  setPage(1);
                  setSelectedId(null);
                }}
                className="h-7 rounded-md border border-border bg-background px-2 text-xs focus:outline-none"
              >
                <option value="">All outcomes</option>
                {(["BOOKED", "NOT_INTERESTED", "NO_ANSWER", "VOICEMAIL", "CALLBACK", "OPTED_OUT", "ERROR"] as const).map(
                  (o) => (
                    <option key={o} value={o}>
                      {OUTCOME_LABELS[o]}
                    </option>
                  ),
                )}
              </select>
              <span className="text-xs text-muted-foreground">{total} calls</span>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Contact</th>
                <th className="text-left font-medium px-3 py-2.5">Outcome</th>
                <th className="text-right font-medium px-3 py-2.5">Duration</th>
                <th className="text-right font-medium px-5 py-2.5">When</th>
              </tr>
            </thead>
            <tbody>
              {callsLoading && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-1.5" />
                    Loading…
                  </td>
                </tr>
              )}
              {!callsLoading && calls.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                    No calls yet
                  </td>
                </tr>
              )}
              {calls.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`border-t border-border cursor-pointer ${
                    (selectedId ?? calls[0]?.id) === c.id ? "bg-accent/5" : "hover:bg-muted/30"
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">{c.lead?.name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{c.lead?.company}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full text-xs px-2 py-0.5 font-medium ${
                        c.outcome
                          ? (OUTCOME_STYLES[c.outcome] ?? "bg-muted text-muted-foreground")
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.outcome ? (OUTCOME_LABELS[c.outcome] ?? c.outcome) : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                    {formatDuration(c.duration)}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                    {formatRelative(c.startedAt ?? c.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => { setPage((p) => p - 1); setSelectedId(null); }}
                  className="h-8 px-3 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => { setPage((p) => p + 1); setSelectedId(null); }}
                  className="h-8 px-3 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: call detail */}
        <aside className="rounded-lg border border-border bg-card overflow-hidden self-start">
          {!selected ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              Select a call to view details
            </div>
          ) : (
            <CallDetailPanel call={detail ?? selected} loading={detailLoading} />
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}
