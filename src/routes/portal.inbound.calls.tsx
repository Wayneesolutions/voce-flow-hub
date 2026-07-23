import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { inboundCallsApi, type InboundCall } from "@/lib/api";
import {
  PhoneIncoming, Loader2, X, PlayCircle, ChevronDown, ChevronUp,
} from "lucide-react";

export const Route = createFileRoute("/portal/inbound/calls")({
  head: () => ({ meta: [{ title: "Inbound Calls · Portal" }] }),
  component: InboundCallsPage,
});

const OUTCOME_STYLE: Record<string, string> = {
  COMPLETED:   "bg-green-500/10 text-green-600",
  TRANSFERRED: "bg-blue-500/10 text-blue-600",
  VOICEMAIL:   "bg-purple-500/10 text-purple-600",
  NO_ANSWER:   "bg-red-500/10 text-red-600",
  FAILED:      "bg-muted text-muted-foreground",
};

function formatDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${OUTCOME_STYLE[outcome] || "bg-muted text-muted-foreground"}`}>
      {outcome}
    </span>
  );
}

function SidePanel({ call, onClose }: { call: InboundCall; onClose: () => void }) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <h3 className="font-semibold text-sm">Call Detail</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Detail label="Caller" value={call.callerNumber || "Unknown"} mono />
          <Detail label="Agent" value={call.assistant?.agentName || "—"} />
          <Detail label="Date" value={formatDate(call.startedAt)} />
          <Detail label="Duration" value={formatDuration(call.durationSeconds)} />
          <Detail label="Outcome" value={<OutcomeBadge outcome={call.outcome} />} />
          {call.costUsd != null && (
            <Detail label="Cost" value={`$${call.costUsd.toFixed(4)}`} mono />
          )}
        </div>

        {call.summary && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1.5">AI Summary</h4>
            <p className="text-sm leading-relaxed">{call.summary}</p>
          </div>
        )}

        {call.recordingUrl && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Recording</h4>
            <audio controls src={call.recordingUrl} className="w-full h-10" />
          </div>
        )}

        {Array.isArray(call.transcript) && call.transcript.length > 0 && (
          <div>
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showTranscript ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showTranscript ? "Hide" : "Show"} Transcript ({call.transcript.length} turns)
            </button>
            {showTranscript && (
              <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
                {call.transcript.map((t, i) => (
                  <div key={i} className={`text-xs px-3 py-2 rounded-lg ${t.role === "assistant" ? "bg-primary/5 text-foreground" : "bg-muted text-foreground"}`}>
                    <span className="font-medium text-muted-foreground mr-2">
                      {t.role === "assistant" ? call.assistant?.agentName || "Agent" : "Caller"}:
                    </span>
                    {t.content}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className={`text-sm mt-0.5 ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
    </div>
  );
}

function InboundCallsPage() {
  const [selected, setSelected] = useState<InboundCall | null>(null);
  const [outcome, setOutcome]   = useState("");
  const [page, setPage]         = useState(0);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["inbound-calls", outcome, page],
    queryFn: () => inboundCallsApi.list({ limit, offset: page * limit, outcome: outcome || undefined }),
    refetchInterval: 30_000,
  });

  const calls  = data?.calls  || [];
  const total  = data?.total  || 0;
  const pages  = Math.ceil(total / limit);

  return (
    <DashboardShell title="Inbound Calls" subtitle="All calls received by your AI receptionist." sidebar={null}>
      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={outcome} onChange={(e) => { setOutcome(e.target.value); setPage(0); }} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="">All outcomes</option>
          {["COMPLETED", "TRANSFERRED", "VOICEMAIL", "NO_ANSWER", "FAILED"].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground self-center">{total} call{total !== 1 ? "s" : ""}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : calls.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PhoneIncoming className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No inbound calls yet</p>
          <p className="text-sm mt-1">Calls will appear here once your receptionist is live.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Date & Time</th>
                  <th className="text-left px-4 py-2.5 font-medium">From</th>
                  <th className="text-left px-4 py-2.5 font-medium">Agent</th>
                  <th className="text-left px-4 py-2.5 font-medium">Duration</th>
                  <th className="text-left px-4 py-2.5 font-medium">Outcome</th>
                  <th className="text-left px-4 py-2.5 font-medium">Summary</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {calls.map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => setSelected(call)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(call.startedAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{call.callerNumber || "—"}</td>
                    <td className="px-4 py-3 text-xs">{call.assistant?.agentName || "—"}</td>
                    <td className="px-4 py-3 text-xs">{formatDuration(call.durationSeconds)}</td>
                    <td className="px-4 py-3"><OutcomeBadge outcome={call.outcome} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{call.summary || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {call.recordingUrl && <PlayCircle className="h-4 w-4 text-muted-foreground" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 h-8 rounded-md border border-border disabled:opacity-40">Previous</button>
              <span>Page {page + 1} of {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="px-3 h-8 rounded-md border border-border disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      {selected && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setSelected(null)} />
          <SidePanel call={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </DashboardShell>
  );
}
