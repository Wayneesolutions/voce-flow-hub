import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { meetingsApi } from "@/lib/api";
import {
  CalendarCheck2,
  Loader2,
  ExternalLink,
  PhoneCall,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  CalendarDays,
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

// ── ISO date key helper ───────────────────────────────────────────────────────
function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

// ── Calendar view ─────────────────────────────────────────────────────────────
function CalendarView({ meetings }: { meetings: any[] }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const year  = current.getFullYear();
  const month = current.getMonth();

  const firstDow    = new Date(year, month, 1).getDay();   // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = toDateKey(new Date());

  // Group meetings by YYYY-MM-DD of scheduledAt
  const byDay: Record<string, any[]> = {};
  for (const m of meetings) {
    if (!m.scheduledAt) continue;
    const key = toDateKey(new Date(m.scheduledAt));
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(m);
  }

  const monthLabel = current.toLocaleString(undefined, { month: "long", year: "numeric" });
  const selectedMeetings = selectedKey ? (byDay[selectedKey] ?? []) : [];

  function prevMonth() { setCurrent(new Date(year, month - 1, 1)); setSelectedKey(null); }
  function nextMonth() { setCurrent(new Date(year, month + 1, 1)); setSelectedKey(null); }

  // Build grid cells: nulls for leading empty slots, then 1…daysInMonth
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
        <button
          onClick={prevMonth}
          className="h-8 w-8 rounded-md border border-border hover:bg-secondary flex items-center justify-center"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-semibold text-base">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="h-8 w-8 rounded-md border border-border hover:bg-secondary flex items-center justify-center"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) {
              return <div key={`e${idx}`} className="border-b border-r border-border/40 min-h-[72px]" />;
            }
            const key       = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayMeets  = byDay[key] ?? [];
            const isToday   = key === today;
            const isSelected = key === selectedKey;

            return (
              <button
                key={key}
                onClick={() => setSelectedKey(isSelected ? null : key)}
                className={`border-b border-r border-border/40 min-h-[72px] p-2 text-left transition-colors
                  ${isSelected ? "bg-accent/10 ring-1 ring-inset ring-accent/30" : "hover:bg-muted/30"}
                  ${(idx + 1) % 7 === 0 ? "border-r-0" : ""}
                `}
              >
                {/* Day number */}
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                  ${isToday ? "bg-accent text-accent-foreground" : "text-foreground"}`}>
                  {day}
                </span>

                {/* Meeting chips */}
                <div className="mt-1 flex flex-col gap-0.5">
                  {dayMeets.slice(0, 2).map((m) => (
                    <span
                      key={m.id}
                      className="block truncate rounded bg-accent/15 text-accent px-1.5 py-0.5 text-[10px] font-medium leading-tight"
                    >
                      {new Date(m.scheduledAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      {" "}
                      {m.leadName.split(" ")[0]}
                    </span>
                  ))}
                  {dayMeets.length > 2 && (
                    <span className="text-[10px] text-muted-foreground px-1">+{dayMeets.length - 2} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedKey && selectedMeetings.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No meetings on this day.</p>
      )}

      {selectedMeetings.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            {new Date(selectedKey + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {selectedMeetings.map((m) => <MeetingCard key={m.id} m={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Meeting card (extracted so both views share it) ───────────────────────────
function MeetingCard({ m }: { m: any }) {
  const initials    = m.leadName.split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2);
  const durationMin = m.duration ? Math.round(m.duration / 60) : null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
      <div className="h-1 bg-accent" />
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center text-sm font-bold shrink-0">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="font-semibold truncate">{m.leadName}</div>
            {m.leadCompany && <div className="text-xs text-muted-foreground truncate">{m.leadCompany}</div>}
            <div className="text-xs text-muted-foreground truncate">{m.leadPhone}</div>
          </div>
        </div>

        <div className="rounded-lg bg-accent/10 border border-accent/20 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent/70 mb-1">
            Meeting Scheduled For
          </p>
          <div className="flex items-center gap-2 text-accent font-semibold text-sm">
            <CalendarCheck2 className="h-4 w-4 shrink-0" />
            {m.scheduledAt ? fmtFull(m.scheduledAt) : "Time not recorded"}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {m.calledAt && (
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <PhoneCall className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
              <div>
                <span className="font-medium text-foreground">Agent called</span>
                <span className="mx-1">·</span>
                {fmt(m.calledAt)}
                {durationMin !== null && <span className="text-muted-foreground ml-1">· {durationMin} min</span>}
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

        {m.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{m.summary}</p>
        )}

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
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function Meetings() {
  const [view, setView] = useState<"list" | "calendar">("list");

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
      {/* View toggle */}
      {!isLoading && meetings.length > 0 && (
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit mb-5">
          <button
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${view === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${view === "calendar" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </button>
        </div>
      )}

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

      {/* List view */}
      {!isLoading && view === "list" && meetings.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((m) => <MeetingCard key={m.id} m={m} />)}
        </div>
      )}

      {/* Calendar view */}
      {!isLoading && view === "calendar" && meetings.length > 0 && (
        <CalendarView meetings={meetings} />
      )}
    </DashboardShell>
  );
}
