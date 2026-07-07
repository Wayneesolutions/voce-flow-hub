import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminWaTemplatesApi } from "@/lib/api";
import type { WaTemplateRequest } from "@/lib/types";
import { CheckCircle2, XCircle, Loader2, MessageSquare, ChevronRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/wa-templates")({
  head: () => ({ meta: [{ title: "WA Template Review · Quor Admin" }] }),
  component: WaTemplateReview,
});

const STATUS_COLOR: Record<string, string> = {
  PENDING_ADMIN:     "bg-amber-50 text-amber-700 border-amber-200",
  ADMIN_REJECTED:    "bg-rose-50 text-rose-700 border-rose-200",
  SUBMITTED_TO_META: "bg-blue-50 text-blue-700 border-blue-200",
  APPROVED:          "bg-emerald-50 text-emerald-700 border-emerald-200",
  META_REJECTED:     "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_ADMIN:     "Pending Review",
  ADMIN_REJECTED:    "Admin Rejected",
  SUBMITTED_TO_META: "Sent to Meta",
  APPROVED:          "Approved",
  META_REJECTED:     "Meta Rejected",
};

function WaTemplateReview() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [rejectNote, setRejectNote]   = useState("");
  const [rejecting, setRejecting]     = useState(false);
  const [statusFilter, setStatusFilter] = useState("PENDING_ADMIN");

  const { data: templates = [], isLoading } = useQuery<WaTemplateRequest[]>({
    queryKey: ["admin", "wa-templates", statusFilter],
    queryFn:  () => adminWaTemplatesApi.list(statusFilter),
    refetchInterval: 30_000,
  });

  const active = templates.find(t => t.id === selectedId) ?? templates[0];

  const approveMut = useMutation({
    mutationFn: (id: string) => adminWaTemplatesApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "wa-templates"] });
      toast.success("Template submitted to Meta — awaiting their approval");
      const remaining = templates.filter(t => t.id !== active?.id);
      setSelectedId(remaining[0]?.id ?? null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => adminWaTemplatesApi.reject(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "wa-templates"] });
      toast.success("Template rejected — client notified via status update");
      setRejectNote("");
      setRejecting(false);
      const remaining = templates.filter(t => t.id !== active?.id);
      setSelectedId(remaining[0]?.id ?? null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = templates.filter(t => t.status === "PENDING_ADMIN").length;

  return (
    <DashboardShell
      sidebar={null}
      title="WhatsApp Template Review"
      description="Review client template requests and submit approved ones to Meta."
    >
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["PENDING_ADMIN", "SUBMITTED_TO_META", "APPROVED", "META_REJECTED", "ADMIN_REJECTED"].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setSelectedId(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {STATUS_LABEL[s]}
            {s === "PENDING_ADMIN" && pending > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 text-white px-1.5 py-0.5 text-[10px]">{pending}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        {/* ── List ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden h-fit">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm px-4">
              No templates with status "{STATUS_LABEL[statusFilter]}"
            </div>
          ) : (
            <div className="divide-y divide-border">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    active?.id === t.id ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium font-mono truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.tenant?.name}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Detail ── */}
        {active ? (
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold font-mono">{active.name}</h3>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[active.status] ?? ""}`}>
                    {STATUS_LABEL[active.status]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {active.tenant?.name} · {active.category} · {active.languageCode} · submitted {new Date(active.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Content preview */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              {active.headerText && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Header</p>
                  <p className="text-sm font-semibold">{active.headerText}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Body</p>
                <p className="text-sm whitespace-pre-wrap">{active.bodyText}</p>
              </div>
              {active.footerText && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Footer</p>
                  <p className="text-xs text-muted-foreground">{active.footerText}</p>
                </div>
              )}
              {Array.isArray(active.buttons) && active.buttons.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Buttons</p>
                  <div className="flex gap-2 flex-wrap">
                    {(active.buttons as { text: string }[]).map((b, i) => (
                      <span key={i} className="rounded-full border border-border bg-card px-3 py-0.5 text-xs">{b.text}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes / rejection reasons */}
            {active.adminNote && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                Admin note: {active.adminNote}
              </div>
            )}
            {active.metaRejectionReason && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <XCircle className="h-3.5 w-3.5 inline mr-1" />
                Meta rejection: {active.metaRejectionReason}
              </div>
            )}
            {active.metaTemplateId && (
              <p className="text-xs text-muted-foreground">Meta template ID: {active.metaTemplateId}</p>
            )}

            {/* Actions — only for PENDING_ADMIN */}
            {active.status === "PENDING_ADMIN" && (
              <div className="space-y-3 pt-2 border-t border-border">
                {!rejecting ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveMut.mutate(active.id)}
                      disabled={approveMut.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {approveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve & Submit to Meta
                    </button>
                    <button
                      onClick={() => setRejecting(true)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                      placeholder="Reason for rejection (shown to client)…"
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => rejectMut.mutate({ id: active.id, note: rejectNote })}
                        disabled={rejectMut.isPending || !rejectNote.trim()}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                      >
                        {rejectMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Confirm Rejection
                      </button>
                      <button onClick={() => setRejecting(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {active.status === "SUBMITTED_TO_META" && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                <MessageSquare className="h-3.5 w-3.5 inline mr-1" />
                Submitted to Meta. Status will auto-update when Meta approves or rejects (usually minutes to hours).
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card flex items-center justify-center py-20 text-muted-foreground text-sm">
            Select a template to review
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
