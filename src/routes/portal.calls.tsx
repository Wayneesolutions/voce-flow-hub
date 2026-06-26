import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { callsApi } from "@/lib/api";
import type { Call } from "@/lib/types";
import { Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/portal/calls")({
  head: () => ({ meta: [{ title: "Call Log · Client Portal" }] }),
  component: Calls,
});

const LIMIT = 25;

function Calls() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["calls", page],
    queryFn: () => callsApi.list({ page, limit: LIMIT }),
    refetchInterval: 30000,
  });

  const calls = data?.calls ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;
  const selected = calls.find((c) => c.id === selectedId) ?? calls[0] ?? null;

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["call-detail", selected?.id],
    queryFn: () => callsApi.get(selected!.id),
    enabled: !!selected?.id,
  });

  return (
    <DashboardShell sidebar={null} title="Call log" subtitle={`${total} total calls`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
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
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && calls.length === 0 && (
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
                  className={`border-t border-border cursor-pointer ${(selectedId ?? calls[0]?.id) === c.id ? "bg-accent/5" : "hover:bg-muted/30"}`}
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">{c.lead?.name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{c.lead?.company}</div>
                  </td>
                  <td className="px-3 py-3 text-xs capitalize">
                    {c.outcome?.replace(/_/g, " ").toLowerCase() ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatDuration(c.duration)}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                    {formatRelative(c.createdAt)}
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
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 px-3 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 px-3 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-border bg-card overflow-hidden self-start">
          {!selected ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              Select a call to view details
            </div>
          ) : (
            <CallDetail call={detail ?? selected} loading={detailLoading} />
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}

function CallDetail({ call, loading }: { call: Call; loading: boolean }) {
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
          {call.lead?.company} · {formatDuration(call.duration)}
        </div>
      </div>

      <div className="p-5 border-b border-border">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Outcome</div>
        <div
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
            call.outcome === "BOOKED"
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {call.outcome?.replace(/_/g, " ").toLowerCase() ?? "Unknown"}
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
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Transcript
        </div>
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

function formatDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
