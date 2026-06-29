import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { waApi } from "@/lib/api";
import type { WaMessage, WaMessageDirection } from "@/lib/types";
import {
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Eye,
  Send,
  XCircle,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/portal/whatsapp/messages")({
  head: () => ({ meta: [{ title: "WhatsApp Messages · Client Portal" }] }),
  component: WhatsAppMessages,
});

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  SENT:      "bg-blue-50 text-blue-700",
  DELIVERED: "bg-indigo-50 text-indigo-700",
  READ:      "bg-emerald-50 text-emerald-700",
  FAILED:    "bg-rose-50 text-rose-700",
  RECEIVED:  "bg-purple-50 text-purple-700",
  QUEUED:    "bg-muted text-muted-foreground",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  SENT:      Send,
  DELIVERED: CheckCircle2,
  READ:      Eye,
  FAILED:    XCircle,
  RECEIVED:  ArrowDownLeft,
  QUEUED:    Clock,
};

function StatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status] || Clock;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || "bg-muted text-muted-foreground"}`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function WhatsAppMessages() {
  const [page,      setPage]      = useState(1);
  const [direction, setDirection] = useState<WaMessageDirection | "">("");

  const { data, isLoading } = useQuery({
    queryKey: ["wa-messages", page, direction],
    queryFn:  () => waApi.getMessages({ page, limit: 50, direction: direction || undefined }),
    staleTime: 15_000,
  });

  const messages: WaMessage[] = data?.messages ?? [];
  const total:   number       = data?.total    ?? 0;
  const pages:   number       = data?.pages    ?? 1;

  return (
    <DashboardShell
      title="WhatsApp Messages"
      description="Full inbound and outbound message log across all campaigns."
    >
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={direction}
          onChange={(e) => { setDirection(e.target.value as WaMessageDirection | ""); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All directions</option>
          <option value="OUTBOUND">Outbound</option>
          <option value="INBOUND">Inbound</option>
        </select>

        <span className="text-xs text-muted-foreground ml-auto">
          {total.toLocaleString()} total messages
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : !messages.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
            <MessageSquare className="h-8 w-8 mb-3 opacity-40" />
            <p className="font-medium text-sm">No messages yet</p>
            <p className="text-xs mt-1">Messages appear here once a campaign is sent or a contact replies.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Direction</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Campaign</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Template / Body</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            msg.direction === "OUTBOUND"
                              ? "text-blue-600"
                              : "text-purple-600"
                          }`}
                        >
                          {msg.direction === "OUTBOUND" ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          )}
                          {msg.direction === "OUTBOUND" ? "Out" : "In"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium text-xs">
                          {msg.contact?.fullName || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {msg.contact?.phone}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {msg.campaign?.name || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={msg.status} />
                        {msg.error && (
                          <p className="text-xs text-destructive mt-0.5 max-w-[160px] truncate" title={msg.error}>
                            {msg.error}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                        {msg.templateName ? (
                          <code className="bg-muted px-1 rounded">{msg.templateName}</code>
                        ) : (
                          <span className="truncate block">{msg.body || "—"}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {pages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-7 w-7 inline-flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="h-7 w-7 inline-flex items-center justify-center rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
