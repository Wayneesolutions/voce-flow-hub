import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { scriptsApi, voicesApi } from "@/lib/api";
import type { ElevenLabsVoice } from "@/lib/api";
import type { Script } from "@/lib/types";
import {
  Plus,
  FileText,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Mic,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/scripts")({
  head: () => ({ meta: [{ title: "Scripts · Client Portal" }] }),
  component: Scripts,
});

const STATUS_CONFIG: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  PENDING_REVIEW: { label: "Pending review", cls: "bg-warning/10 text-warning", Icon: Clock },
  APPROVED: { label: "Approved", cls: "bg-success/10 text-success", Icon: CheckCircle2 },
  LIVE: { label: "Live", cls: "bg-success/10 text-success", Icon: CheckCircle2 },
  REJECTED: { label: "Rejected", cls: "bg-destructive/10 text-destructive", Icon: AlertTriangle },
};

const LANGUAGES = [
  { code: "en",      label: "English" },
  { code: "hi",      label: "Hindi (हिन्दी)" },
  { code: "hinglish", label: "Hinglish (Hindi + English mix)" },
  { code: "pa",      label: "Punjabi (ਪੰਜਾਬੀ)" },
];

const defaultForm = {
  name: "",
  agentName: "",
  companyInfo: "",
  servicesInfo: "",
  goalText: "",
  objections: "",
  voiceId: "",
  language: "en",
};

function Scripts() {
  const qc = useQueryClient();
  const faqRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [faqScriptId, setFaqScriptId] = useState<string | null>(null);
  const [uploadingFaq, setUploadingFaq] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");

  const { data: scripts = [], isLoading } = useQuery<Script[]>({
    queryKey: ["scripts"],
    queryFn: scriptsApi.list,
    refetchInterval: 30_000,
  });

  const { data: voices = [], isLoading: voicesLoading } = useQuery<ElevenLabsVoice[]>({
    queryKey: ["voices"],
    queryFn: voicesApi.list,
    staleTime: 5 * 60 * 1000,
  });

  const filteredVoices = voices.filter((v) =>
    !voiceSearch ||
    v.name.toLowerCase().includes(voiceSearch.toLowerCase()) ||
    (v.language ?? "").toLowerCase().includes(voiceSearch.toLowerCase()) ||
    (v.accent ?? "").toLowerCase().includes(voiceSearch.toLowerCase())
  );

  const selected = scripts.find((s) => s.id === selectedId) ?? scripts[0] ?? null;

  const createMut = useMutation({
    mutationFn: () =>
      scriptsApi.create({
        name: form.name,
        agentName: form.agentName,
        companyInfo: form.companyInfo,
        servicesInfo: form.servicesInfo,
        goalText: form.goalText,
        objections: form.objections || undefined,
        voiceId: form.voiceId || undefined,
        language: form.language || "en",
      }),
    onSuccess: (script) => {
      qc.invalidateQueries({ queryKey: ["scripts"] });
      setCreating(false);
      setForm(defaultForm);
      setSelectedId(script.id);
      setFaqScriptId(script.id);
      toast.success("Script submitted for review");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const f = (key: keyof typeof form, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleFaqUpload = async (e: React.ChangeEvent<HTMLInputElement>, scriptId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFaq(true);
    try {
      await scriptsApi.uploadFaq(scriptId, file);
      qc.invalidateQueries({ queryKey: ["scripts"] });
      toast.success("FAQ document uploaded");
    } catch {
      toast.error("Failed to upload FAQ document");
    } finally {
      setUploadingFaq(false);
      if (faqRef.current) faqRef.current.value = "";
    }
  };

  return (
    <DashboardShell
      sidebar={null}
      title="Scripts"
      subtitle="Tell the AI what to say. We review before going live."
      actions={
        <button
          onClick={() => setCreating(true)}
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New script
        </button>
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : scripts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <div className="text-lg font-semibold">No scripts yet</div>
          <div className="text-sm text-muted-foreground mt-1">
            Submit a script and we'll review it before going live.
          </div>
          <button
            onClick={() => setCreating(true)}
            className="mt-4 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Submit first script
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-lg border border-border bg-card divide-y divide-border h-fit">
            {scripts.map((s) => {
              const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.PENDING_REVIEW;
              const Icon = cfg.Icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    selected?.id === s.id
                      ? "bg-accent/5 border-l-2 border-l-accent"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </button>
              );
            })}
          </aside>

          {selected && (
            <main className="rounded-lg border border-border bg-card">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selected.name}</h2>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Agent: {selected.agentName}
                  </div>
                </div>
                {(() => {
                  const cfg = STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.PENDING_REVIEW;
                  const Icon = cfg.Icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {selected.status === "REJECTED" && selected.reviewNote && (
                <div className="mx-5 mt-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  <div className="font-medium mb-1">Rejection note</div>
                  {selected.reviewNote}
                </div>
              )}

              <div className="p-5 grid gap-5">
                <ScriptSection title="Company information">
                  <p>{selected.companyInfo}</p>
                </ScriptSection>
                <ScriptSection title="Services">
                  <p>{selected.servicesInfo}</p>
                </ScriptSection>
                <ScriptSection title="Goal">
                  <p>{selected.goalText}</p>
                </ScriptSection>
                {selected.objections && (
                  <ScriptSection title="Objection handling">
                    <p className="whitespace-pre-wrap">{selected.objections}</p>
                  </ScriptSection>
                )}
                {selected.voiceId && (
                  <ScriptSection title="Voice">
                    <p>
                      {voices.find((v) => v.id === selected.voiceId)?.name ?? selected.voiceId}
                    </p>
                  </ScriptSection>
                )}
                <ScriptSection title="Call language">
                  <p>
                    {LANGUAGES.find((l) => l.code === (selected.language || "en"))?.label ?? "English"}
                  </p>
                </ScriptSection>
                <ScriptSection title="FAQ document">
                  {selected.faqDocument ? (
                    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      FAQ uploaded ({selected.faqDocument.length.toLocaleString()} chars)
                    </div>
                  ) : (
                    <div
                      className="rounded-md border border-dashed border-border p-4 text-center cursor-pointer hover:border-accent/50 transition-colors"
                      onClick={() => {
                        setFaqScriptId(selected.id);
                        faqRef.current?.click();
                      }}
                    >
                      {uploadingFaq && faqScriptId === selected.id ? (
                        <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">Upload PDF or TXT</p>
                    </div>
                  )}
                </ScriptSection>
              </div>
            </main>
          )}
        </div>
      )}

      <input
        ref={faqRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={(e) => faqScriptId && handleFaqUpload(e, faqScriptId)}
      />

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="font-semibold">New script</div>
              <button onClick={() => setCreating(false)} className="p-1 rounded hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Script name</label>
                <input
                  value={form.name}
                  onChange={(e) => f("name", e.target.value)}
                  placeholder="US Outreach v1"
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Agent name</label>
                <input
                  value={form.agentName}
                  onChange={(e) => f("agentName", e.target.value)}
                  placeholder="Sarah"
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Call language</label>
                <select
                  value={form.language}
                  onChange={(e) => f("language", e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  The AI will speak in this language and transcribe responses in it.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Company information</label>
                <textarea
                  rows={3}
                  value={form.companyInfo}
                  onChange={(e) => f("companyInfo", e.target.value)}
                  placeholder="Describe your company, what you do, and your key differentiators…"
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Services / products</label>
                <textarea
                  rows={3}
                  value={form.servicesInfo}
                  onChange={(e) => f("servicesInfo", e.target.value)}
                  placeholder="List the services or products the agent should be able to discuss…"
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Call goal</label>
                <textarea
                  rows={2}
                  value={form.goalText}
                  onChange={(e) => f("goalText", e.target.value)}
                  placeholder="e.g. Book a 30-minute discovery call with the decision maker…"
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">
                  Objection handling{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.objections}
                  onChange={(e) => f("objections", e.target.value)}
                  placeholder="If prospect says 'we already have a solution', agent should…"
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">
                  Voice <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="mt-1.5 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    value={voiceSearch}
                    onChange={(e) => setVoiceSearch(e.target.value)}
                    placeholder="Search by name, language, accent…"
                    className="w-full h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                {voicesLoading ? (
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading voices…
                  </div>
                ) : (
                  <div className="mt-2 max-h-48 overflow-y-auto grid grid-cols-2 gap-1.5 pr-0.5">
                    {filteredVoices.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => f("voiceId", form.voiceId === v.id ? "" : v.id)}
                        className={`rounded-md border p-3 text-left transition-colors ${
                          form.voiceId === v.id
                            ? "border-accent bg-accent/5"
                            : "border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {v.category === "cloned" && (
                            <Mic className="h-3 w-3 text-green-500 shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{v.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {[v.gender, v.accent, v.language].filter(Boolean).join(" · ") || v.category}
                        </div>
                        {v.category === "cloned" && (
                          <span className="inline-block mt-1 text-[10px] font-medium bg-green-500/10 text-green-600 rounded px-1.5 py-0.5">
                            Your voice
                          </span>
                        )}
                      </button>
                    ))}
                    {filteredVoices.length === 0 && (
                      <div className="col-span-2 py-6 text-center text-sm text-muted-foreground">
                        No voices match "{voiceSearch}"
                      </div>
                    )}
                  </div>
                )}
                {form.voiceId && (
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">
                      {voices.find((v) => v.id === form.voiceId)?.name ?? form.voiceId}
                    </span>
                    <button
                      type="button"
                      onClick={() => f("voiceId", "")}
                      className="ml-2 text-destructive hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
            {createMut.isError && (
              <div className="mx-5 mb-4 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {(createMut.error as Error)?.message ?? "Failed to submit script"}
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
                disabled={
                  !form.name ||
                  !form.agentName ||
                  !form.companyInfo ||
                  !form.servicesInfo ||
                  !form.goalText ||
                  createMut.isPending
                }
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                {createMut.isPending ? "Submitting…" : "Submit for review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function ScriptSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </section>
  );
}
