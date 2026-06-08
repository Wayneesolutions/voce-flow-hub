import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { agentApi } from "@/lib/api";
import type { AgentSettings } from "@/lib/types";
import { FileText, Upload, Save, Phone, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/portal/scripts")({
  head: () => ({ meta: [{ title: "Scripts · Client Portal" }] }),
  component: Scripts,
});

const LLM_MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet" },
];

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Alex", desc: "Warm · Male · EN-US", provider: "11labs" },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Maya",
    desc: "Friendly · Female · EN-CA",
    provider: "11labs",
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Omar",
    desc: "Confident · Male · EN-AE",
    provider: "11labs",
  },
];

function Scripts() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["agent-settings"],
    queryFn: () => agentApi.get(),
  });

  const [form, setForm] = useState<Partial<AgentSettings>>({});
  const [testNumber, setTestNumber] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (values: Partial<AgentSettings>) => agentApi.update(values),
    onSuccess: (updated) => {
      qc.setQueryData(["agent-settings"], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const testMutation = useMutation({
    mutationFn: (toNumber: string) => agentApi.testCall(toNumber),
    onSuccess: (res) => setTestResult(`Call initiated — SID: ${res.callSid}`),
    onError: () => setTestResult("Test call failed. Check backend connection."),
  });

  const set = <K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (isLoading) {
    return (
      <DashboardShell sidebar={null} title="Scripts" subtitle="Configure your AI agent">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading settings…
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      sidebar={null}
      title="Scripts"
      subtitle="Tell the AI what to say. We'll review before going live."
      actions={
        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved!" : "Save changes"}
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">System prompt</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Full instructions for the AI agent
          </div>
          <textarea
            rows={10}
            value={form.systemPrompt ?? ""}
            onChange={(e) => set("systemPrompt", e.target.value)}
            className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none font-mono"
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">First message</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            What the AI says when the call connects
          </div>
          <textarea
            rows={3}
            value={form.firstMessage ?? ""}
            onChange={(e) => set("firstMessage", e.target.value)}
            className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">LLM model</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            AI brain powering the conversation
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {LLM_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => set("llmModel", m.id)}
                className={`rounded-md border p-2.5 text-left text-sm transition-colors ${form.llmModel === m.id ? "border-accent bg-accent/5 text-foreground" : "border-border hover:bg-muted/40 text-muted-foreground"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Max tokens</label>
              <input
                type="number"
                min={50}
                max={1000}
                value={form.maxTokens ?? ""}
                onChange={(e) => set("maxTokens", Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Temperature (0–1)</label>
              <input
                type="number"
                step={0.1}
                min={0}
                max={1}
                value={form.temperature ?? ""}
                onChange={(e) => set("temperature", Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Voice selection
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Pick a voice for your AI agent</div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => set("voiceId", v.id)}
                className={`rounded-md border p-3 text-left transition-colors ${form.voiceId === v.id ? "border-accent bg-accent/5" : "border-border hover:bg-muted/40"}`}
              >
                <div className="text-sm font-medium">{v.name}</div>
                <div className="text-xs text-muted-foreground">{v.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">FAQ document</div>
          <div className="font-semibold mt-1">Upload PDF or TXT — AI learns from it</div>
          <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center cursor-pointer hover:border-accent/50 transition-colors">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
            <div className="mt-2 text-sm text-muted-foreground">Drop file or browse</div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-muted-foreground">No file uploaded</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Test call</div>
          <div className="font-semibold mt-1">Dial your own number to hear the agent</div>
          <div className="mt-4 flex gap-2">
            <input
              type="tel"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              placeholder="+12125550000"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <button
              onClick={() => {
                setTestResult(null);
                testMutation.mutate(testNumber);
              }}
              disabled={!testNumber || testMutation.isPending}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {testMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Phone className="h-4 w-4" />
              )}
              Call
            </button>
          </div>
          {testResult && (
            <p className="mt-3 text-xs text-muted-foreground rounded-md bg-muted/40 px-3 py-2">
              {testResult}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Save changes before testing to use the latest settings.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
