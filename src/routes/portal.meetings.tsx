import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { meetingsApi } from "@/lib/api";
import {
  CalendarCheck2,
  Mail,
  Phone,
  Loader2,
  ExternalLink,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/portal/meetings")({
  head: () => ({ meta: [{ title: "Meetings · Client Portal" }] }),
  component: Meetings,
});

function fmt(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleString(undefined, opts ?? {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function fmtFull(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Meetings() {
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: meetingsApi.list,
    refetchInterval: 60_000,
  });

  return (
    <DashboardShell
      sidebar={null}
      title="Meetings"
      subtitle={`${meetings.length} meeting${meetings.length !== 1 ? "s" : ""} booked`}
    >
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
          const initials = m.leadName
            .split(" ")
            .map((s) => s[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          const durationMin = m.duration ? Math.round(m.duration / 60) : null;

          return (
            <div
              key={m.id}
              className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col"
            >
              {/* Accent top bar */}
              <div className="h-1 bg-accent" />

              <div className="p-5 flex flex-col gap-4 flex-1">
                {/* Lead header */}
                <div className="flex items-center gap-3">
                  <span className="h-11 w-11 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center text-sm font-bold shrink-0">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{m.leadName}</div>
                    {m.leadCompany && (
                      <div className="text-xs text-muted-foreground truncate">{m.leadCompany}</div>
                    )}
                    <div className="text-xs text-muted-foreground truncate">{m.leadPhone}</div>
                  </div>
                </div>

                {/* Scheduled meeting time — prominent */}
                <div className="rounded-lg bg-accent/10 border border-accent/20 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-accent/70 mb-1">
                    Meeting Scheduled For
                  </p>
                  <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                    <CalendarCheck2 className="h-4 w-4 shrink-0" />
                    {m.scheduledAt ? fmtFull(m.scheduledAt) : "Time not recorded"}
                  </div>
                </div>

                {/* Timeline: called → booked */}
                <div className="flex flex-col gap-2">
                  {m.calledAt && (
                    <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <PhoneCall className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">Agent called</span>
                        <span className="mx-1">·</span>
                        {fmt(m.calledAt)}
                        {durationMin !== null && (
                          <span className="text-muted-foreground ml-1">· {durationMin} min</span>
                        )}
                      </div>
                    </div>
                  )}
                  {m.bookedAt && (
                    <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">Meeting booked</span>
                        <span className="mx-1">·</span>
                        {fmt(m.bookedAt)}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI call summary */}
                {m.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {m.summary}
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-auto pt-1">
                  {m.meetingLink && (
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Join meeting
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={m.leadEmail ? `mailto:${m.leadEmail}` : undefined}
                      className={`h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-border text-sm transition-colors ${m.leadEmail ? "hover:bg-secondary" : "opacity-40 pointer-events-none"}`}
                      title={m.leadEmail ?? "No email on file"}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </a>
                    <a
                      href={`tel:${m.leadPhone}`}
                      className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-border text-sm hover:bg-secondary transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
