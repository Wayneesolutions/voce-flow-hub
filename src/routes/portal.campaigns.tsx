import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Plus, Play, Pause } from "lucide-react";

export const Route = createFileRoute("/portal/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns · Client Portal" }] }),
  component: Campaigns,
});

const campaigns = [
  { name: "Toronto Realtors Q2", script: "Realtor Outreach v2", hours: "9 AM – 5 PM", tz: "America/Toronto", retries: 3, status: "active", calls: 248, booked: 18 },
  { name: "GTA Plumbing Estimates", script: "Plumbing Spring Promo", hours: "8 AM – 6 PM", tz: "America/Toronto", retries: 3, status: "active", calls: 412, booked: 32 },
  { name: "Dubai SaaS Demo", script: "B2B SaaS Demos", hours: "10 AM – 7 PM", tz: "Asia/Dubai", retries: 2, status: "paused", calls: 96, booked: 6 },
];

function Campaigns() {
  return (
    <DashboardShell sidebar={null} title="Campaigns" subtitle="Active dialing campaigns"
      actions={<button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"><Plus className="h-4 w-4"/>New campaign</button>}>
      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((c)=>(
          <div key={c.name} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.script}</div>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${c.status==="active"?"bg-success/10 text-success":"bg-muted text-muted-foreground"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.status==="active"?"bg-success animate-pulse":"bg-muted-foreground"}`}/>{c.status}
              </span>
            </div>
            <dl className="grid grid-cols-3 gap-3 mt-5 text-sm">
              <div><dt className="text-xs text-muted-foreground">Hours</dt><dd className="font-medium">{c.hours}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Timezone</dt><dd className="font-medium">{c.tz}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Retries</dt><dd className="font-medium">{c.retries}</dd></div>
            </dl>
            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
              <div><div className="text-xs text-muted-foreground">Calls made</div><div className="text-xl font-semibold tabular-nums">{c.calls}</div></div>
              <div><div className="text-xs text-muted-foreground">Meetings booked</div><div className="text-xl font-semibold tabular-nums text-success">{c.booked}</div></div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <button className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-border text-sm hover:bg-secondary">
                {c.status==="active"?<><Pause className="h-3.5 w-3.5"/>Pause</>:<><Play className="h-3.5 w-3.5"/>Resume</>}
              </button>
              <button className="h-9 px-3 rounded-md border border-border text-sm hover:bg-secondary">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
