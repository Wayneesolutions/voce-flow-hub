import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminScriptsApi } from "@/lib/api";
import type { Script } from "@/lib/types";
import { Check, FileText, X, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/scripts")({
  head: () => ({ meta: [{ title: "Script Review · VoCallM Admin" }] }),
  component: ScriptReview,
});

function ScriptReview() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const { data: scripts = [], isLoading } = useQuery<Script[]>({
    queryKey: ["admin", "scripts", "pending"],
    queryFn: adminScriptsApi.pending,
    refetchInterval: 30_000,
  });

  const active = scripts.find((s) => s.id === selectedId) ?? scripts[0];

  const approveMut = useMutation({
    mutationFn: (id: string) => adminScriptsApi.approve(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin", "scripts", "pending"] });
      toast.success(`Script approved — Vapi assistant created`);
      const remaining = scripts.filter((s) => s.id !== updated.id);
      setSelectedId(remaining[0]?.id ?? null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => adminScriptsApi.reject(id, note),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin", "scripts", "pending"] });
      toast.success("Script rejected — client notified");
      setRejectNote("");
      setRejecting(false);
      const remaining = scripts.filter((s) => s.id !== updated.id);
      setSelectedId(remaining[0]?.id ?? null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DashboardShell
      sidebar={null}
      title="Script review"
      subtitle={
        isLoading
          ? "Loading…"
          : scripts.length === 0
          ? "All scripts reviewed"
          : `${scripts.length} script${scripts.length !== 1 ? "s" : ""} awaiting approval`
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading scripts…
        </div>
      ) : scripts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Check className="h-10 w-10 mx-auto text-success mb-3" />
          <div className="text-lg font-semibold">All caught up!</div>
          <div className="text-sm text-muted-foreground mt-1">No scripts waiting for review.</div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Script list */}
          <aside className="rounded-lg border border-border bg-card divide-y divide-border h-fit">
            {scripts.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedId(s.id); setRejecting(false); setRejectNote(""); }}
                className={`w-full text-left p-4 transition-colors ${
                  active?.id === s.id
                    ? "bg-accent/5 border-l-2 border-l-accent"
                    : "hover:bg-muted/30"
                }`}
              >
                <div className="text-sm font-medium truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.tenant?.name ?? "Unknown"}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </aside>

          {/* Script detail */}
          {active && (
            <main className="rounded-lg border border-border bg-card">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {active.tenant?.name ?? "Unknown client"}
                  </div>
                  <h2 className="mt-1 text-lg font-semibold">{active.name}</h2>
                </div>
                <span className="inline-flex rounded-full bg-warning/10 text-warning text-xs font-medium px-2.5 py-1">
                  Awaiting review
                </span>
              </div>

              <div className="p-5 grid gap-5">
                <Section title="Agent name">
                  <p>{active.agentName}</p>
                </Section>
                <Section title="Company information">
                  <p>{active.companyInfo}</p>
                </Section>
                <Section title="Services">
                  <p>{active.servicesInfo}</p>
                </Section>
                <Section title="Goal">
                  <p>{active.goalText}</p>
                </Section>
                {active.objections && (
                  <Section title="Objection handling">
                    <p className="whitespace-pre-wrap">{active.objections}</p>
                  </Section>
                )}
                {active.faqDocument && (
                  <Section title="FAQ document">
                    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      FAQ document uploaded ({active.faqDocument.length.toLocaleString()} chars)
                    </div>
                  </Section>
                )}
                {active.voiceId && (
                  <Section title="Voice ID">
                    <p className="font-mono text-xs">{active.voiceId}</p>
                  </Section>
                )}
              </div>

              <div className="border-t border-border p-5 bg-muted/20 space-y-4">
                {rejecting ? (
                  <>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Rejection reason (sent to client)
                    </label>
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      rows={3}
                      placeholder="Explain why the script was rejected so the client can fix it…"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setRejecting(false); setRejectNote(""); }}
                        className="h-9 px-4 rounded-md border border-border text-sm hover:bg-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => rejectMut.mutate({ id: active.id, note: rejectNote })}
                        disabled={!rejectNote.trim() || rejectMut.isPending}
                        className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 disabled:opacity-60"
                      >
                        {rejectMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Send rejection
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setRejecting(true)}
                      className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => approveMut.mutate(active.id)}
                      disabled={approveMut.isPending}
                      className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md bg-success text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
                    >
                      {approveMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve script
                    </button>
                  </div>
                )}
              </div>
            </main>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </section>
  );
}
