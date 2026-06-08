import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { pendingScripts } from "@/lib/mock";
import { Check, FileText, X, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/admin/scripts")({
  head: () => ({ meta: [{ title: "Script Review · VoCallM Admin" }] }),
  component: ScriptReview,
});

function ScriptReview() {
  const [selected, setSelected] = useState(pendingScripts[0].id);
  const [comment, setComment] = useState("");
  const active = pendingScripts.find(s=>s.id===selected) ?? pendingScripts[0];

  return (
    <DashboardShell sidebar={null} title="Script review" subtitle={`${pendingScripts.length} scripts awaiting approval`}>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-border bg-card divide-y divide-border">
          {pendingScripts.map((s)=>(
            <button key={s.id} onClick={()=>setSelected(s.id)} className={`w-full text-left p-4 ${selected===s.id?"bg-accent/5 border-l-2 border-l-accent":"hover:bg-muted/30"}`}>
              <div className="text-sm font-medium truncate">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.client}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{s.submitted}</div>
            </button>
          ))}
        </aside>

        <main className="rounded-lg border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{active.client}</div>
              <h2 className="mt-1 text-lg font-semibold">{active.title}</h2>
            </div>
            <span className="inline-flex rounded-full bg-warning/10 text-warning text-xs font-medium px-2.5 py-1">Awaiting review</span>
          </div>

          <div className="p-5 grid gap-5">
            <Section title="Company information">
              <p>Acme Plumbing is a residential & light-commercial plumbing service operating across the Greater Toronto Area. 12 years in business, 4.8★ on Google. Specializing in emergency calls and water heater installs.</p>
            </Section>
            <Section title="Services">
              <ul className="list-disc pl-5 space-y-1">
                <li>24/7 emergency plumbing</li>
                <li>Water heater installation & repair</li>
                <li>Drain cleaning & camera inspection</li>
                <li>Commercial maintenance contracts</li>
              </ul>
            </Section>
            <Section title="Goal">
              <p>Book a free in-home estimate within the next 7 days. Confirm address and preferred time window.</p>
            </Section>
            <Section title="Objection handling">
              <ul className="space-y-2">
                <Objection q="We already have a plumber." a="Totally understand — we're not asking you to switch. We offer a free second-opinion visit; many homeowners save 20–30% on quoted repairs." />
                <Objection q="Send me an email instead." a="Happy to — what's the best email? I'll also book a quick 10-min slot so the technician can call if anything's unclear." />
                <Objection q="Is this an AI?" a="Yes, I'm Acme's AI assistant. Want me to connect you to a human technician or finish booking your estimate?" />
              </ul>
            </Section>
            <Section title="FAQ document">
              <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground"/>
                acme-plumbing-faq-v2.pdf · 184 KB
                <button className="ml-auto text-xs text-accent hover:underline">Open</button>
              </div>
            </Section>
            <Section title="Voice selection">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { n: "Alex", d: "Warm · Male · EN-US", on: true },
                  { n: "Maya", d: "Friendly · Female · EN-CA" },
                  { n: "Omar", d: "Confident · Male · EN-AE" },
                ].map(v=>(
                  <div key={v.n} className={`rounded-md border p-3 ${v.on?"border-accent bg-accent/5":"border-border"}`}>
                    <div className="text-sm font-medium">{v.n}</div>
                    <div className="text-xs text-muted-foreground">{v.d}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div className="border-t border-border p-5 bg-muted/20">
            <label className="text-sm font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4"/>Reviewer comments</label>
            <textarea value={comment} onChange={(e)=>setComment(e.target.value)} rows={3} placeholder="Add notes for the client…" className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"/>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5"><X className="h-4 w-4"/>Reject</button>
              <button className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md bg-success text-success-foreground text-sm font-medium hover:opacity-90"><Check className="h-4 w-4"/>Approve script</button>
            </div>
          </div>
        </main>
      </div>
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
function Objection({ q, a }: { q: string; a: string }) {
  return (
    <li className="rounded-md border border-border bg-muted/30 p-3">
      <div className="text-sm font-medium">Q: {q}</div>
      <div className="text-sm text-muted-foreground mt-1">A: {a}</div>
    </li>
  );
}
