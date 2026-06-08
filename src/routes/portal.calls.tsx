import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { recentCalls } from "@/lib/mock";
import { Play, Download } from "lucide-react";

export const Route = createFileRoute("/portal/calls")({
  head: () => ({ meta: [{ title: "Call Log · Client Portal" }] }),
  component: Calls,
});

const transcript = [
  { who: "ai", text: "Hi Sarah, this is Alex from Northstar. Do you have a quick moment?" },
  { who: "lead", text: "Sure, what's this regarding?" },
  { who: "ai", text: "We're helping realtors in Toronto book 8–12 extra listings a month. Could I show you how on a 15-minute call this week?" },
  { who: "lead", text: "Yeah, Wednesday works." },
  { who: "ai", text: "Perfect — I've got 2 PM open. I'll send a calendar invite to confirm." },
];

function Calls() {
  const [selected, setSelected] = useState(recentCalls[0].id);
  const active = recentCalls.find(c=>c.id===selected) ?? recentCalls[0];
  return (
    <DashboardShell sidebar={null} title="Call log" subtitle="342 total calls">
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left font-medium px-5 py-2.5">Contact</th><th className="text-left font-medium px-3 py-2.5">Outcome</th><th className="text-right font-medium px-3 py-2.5">Duration</th><th className="text-right font-medium px-5 py-2.5">When</th></tr>
            </thead>
            <tbody>
              {recentCalls.map(c=>(
                <tr key={c.id} onClick={()=>setSelected(c.id)} className={`border-t border-border cursor-pointer ${selected===c.id?"bg-accent/5":"hover:bg-muted/30"}`}>
                  <td className="px-5 py-3"><div className="font-medium">{c.contact}</div><div className="text-xs text-muted-foreground">{c.company}</div></td>
                  <td className="px-3 py-3 text-xs">{c.outcome}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.duration}</td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">{c.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="font-semibold">{active.contact}</div>
            <div className="text-xs text-muted-foreground">{active.company} · {active.duration}</div>
          </div>
          <div className="p-5 border-b border-border">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">AI summary</div>
            <p className="text-sm">Prospect confirmed interest, agreed to a 15-min demo, booked Wednesday 2 PM. No major objections. High intent.</p>
            <div className="mt-3 inline-flex rounded-full bg-success/10 text-success px-2.5 py-1 text-xs font-medium">{active.outcome}</div>
          </div>
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3 rounded-md bg-muted/40 border border-border px-3 py-2">
              <button className="h-8 w-8 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center"><Play className="h-4 w-4"/></button>
              <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden"><div className="h-full bg-accent w-1/3"/></div>
              <span className="text-xs text-muted-foreground tabular-nums">1:12 / {active.duration}</span>
              <button className="text-muted-foreground hover:text-foreground"><Download className="h-4 w-4"/></button>
            </div>
          </div>
          <div className="p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Full transcript</div>
            <div className="space-y-2">
              {transcript.map((t,i)=>(
                <div key={i} className={t.who==="ai"?"flex justify-start":"flex justify-end"}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${t.who==="ai"?"bg-secondary rounded-bl-sm":"bg-accent text-accent-foreground rounded-br-sm"}`}>{t.text}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
