import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { upcomingMeetings } from "@/lib/mock";
import { CalendarCheck2, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/portal/meetings")({
  head: () => ({ meta: [{ title: "Meetings · Client Portal" }] }),
  component: Meetings,
});

function Meetings() {
  return (
    <DashboardShell sidebar={null} title="Meetings" subtitle="Meetings booked by your AI agent">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {upcomingMeetings.map((m)=>(
          <div key={m.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center text-sm font-semibold">{m.contact.split(" ").map(s=>s[0]).join("")}</span>
              <div className="min-w-0">
                <div className="font-semibold truncate">{m.contact}</div>
                <div className="text-xs text-muted-foreground truncate">{m.company}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-md bg-accent/10 text-accent text-sm font-medium px-3 py-2">
              <CalendarCheck2 className="h-4 w-4"/>{m.when}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-border text-sm hover:bg-secondary"><Mail className="h-3.5 w-3.5"/>Email</button>
              <button className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-border text-sm hover:bg-secondary"><Phone className="h-3.5 w-3.5"/>Call</button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
