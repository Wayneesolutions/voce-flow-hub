import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { callsApi } from "@/lib/api";
import { CalendarCheck2, Mail, Phone, Loader2 } from "lucide-react";

export const Route = createFileRoute("/portal/meetings")({
  head: () => ({ meta: [{ title: "Meetings · Client Portal" }] }),
  component: Meetings,
});

function Meetings() {
  const { data, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => callsApi.list({ outcome: "booked", pageSize: 50 }),
    refetchInterval: 60_000,
  });

  const meetings = (data?.data ?? []).filter((c) => c.meetingAt);

  return (
    <DashboardShell sidebar={null} title="Meetings" subtitle="Meetings booked by your AI agent">
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading meetings…
        </div>
      )}

      {!isLoading && meetings.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <CalendarCheck2 className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 font-semibold">No meetings booked yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once your AI agent books meetings, they'll appear here.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meetings.map((m) => {
          const initials = (m.lead?.name ?? "?")
            .split(" ")
            .map((s) => s[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div key={m.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center text-sm font-semibold shrink-0">
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{m.lead?.name ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.lead?.company}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-md bg-accent/10 text-accent text-sm font-medium px-3 py-2">
                <CalendarCheck2 className="h-4 w-4 shrink-0" />
                {m.meetingAt
                  ? new Date(m.meetingAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "TBD"}
              </div>
              {m.lead?.phone && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-border text-sm hover:bg-secondary">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </button>
                  <a
                    href={`tel:${m.lead.phone}`}
                    className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-border text-sm hover:bg-secondary"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
