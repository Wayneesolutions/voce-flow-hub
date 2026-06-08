import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { FileText, Upload, Send } from "lucide-react";

export const Route = createFileRoute("/portal/scripts")({
  head: () => ({ meta: [{ title: "Scripts · Client Portal" }] }),
  component: Scripts,
});

function Scripts() {
  return (
    <DashboardShell sidebar={null} title="Scripts" subtitle="Tell the AI what to say. We'll review before going live."
      actions={<button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Send className="h-4 w-4"/>Submit for review</button>}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="About company" hint="Who you are, where you operate" rows={3} value="Acme Plumbing — 12 years serving the Greater Toronto Area. 4.8★ on Google. 24/7 service."/>
        <Field label="Services" hint="What you sell" rows={3} value="Emergency plumbing, water heater install, drain cleaning, commercial maintenance."/>
        <Field label="Goal" hint="What should the AI achieve on the call?" rows={3} value="Book a free in-home estimate within the next 7 days."/>
        <Field label="Objection handling" hint="Common pushback + your response" rows={3} value={`"We already have a plumber" → free second-opinion visit.\n"Send me an email" → confirm email + book a 10-min slot.`}/>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">FAQ document</div>
          <div className="font-semibold mt-1">Upload PDF or TXT — AI learns from it</div>
          <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground"/>
            <div className="mt-2 text-sm text-muted-foreground">Drop file or browse</div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground"/>
            acme-plumbing-faq-v2.pdf · 184 KB
            <button className="ml-auto text-xs text-destructive hover:underline">Remove</button>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Voice selection</div>
          <div className="font-semibold mt-1">Pick a voice for your AI agent</div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { n: "Alex", d: "Warm · Male · EN-US", on: true },
              { n: "Maya", d: "Friendly · Female · EN-CA" },
              { n: "Omar", d: "Confident · Male · EN-AE" },
            ].map(v=>(
              <button key={v.n} className={`rounded-md border p-3 text-left ${v.on?"border-accent bg-accent/5":"border-border hover:bg-muted/40"}`}>
                <div className="text-sm font-medium">{v.n}</div>
                <div className="text-xs text-muted-foreground">{v.d}</div>
              </button>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">Your script will be reviewed by your account manager before going live. Usually within a few hours.</p>
        </div>
      </div>
    </DashboardShell>
  );
}

function Field({ label, hint, value, rows=3 }: { label: string; hint: string; value: string; rows?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
      <textarea rows={rows} defaultValue={value} className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"/>
    </div>
  );
}
