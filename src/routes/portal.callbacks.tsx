import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { leadsApi } from "@/lib/api";
import type { Lead } from "@/lib/types";
import { Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/portal/callbacks")({
  head: () => ({ meta: [{ title: "Callback List · Client Portal" }] }),
  component: CallbackList,
});

const LIMIT = 25;

function CallbackList() {
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["callbacks", page],
    queryFn: () => leadsApi.list({ status: "CALLBACK", page, limit: LIMIT }),
  });

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;

  async function handleExport() {
    setExporting(true);
    try {
      const all = await leadsApi.list({ status: "CALLBACK", page: 1, limit: 1000 });
      const header = ["Name", "Phone", "Company", "Title", "Country", "Callback Scheduled", "Last Called", "Call Attempts"];
      const csv = [
        header.join(","),
        ...all.leads.map((l: Lead) =>
          [
            csvCell(l.name),
            csvCell(l.phone),
            csvCell(l.company ?? ""),
            csvCell(l.title ?? ""),
            csvCell(l.country),
            csvCell(l.callbackAt ? `${formatCallbackAt(l.callbackAt).label}${formatCallbackAt(l.callbackAt).sub ? " " + formatCallbackAt(l.callbackAt).sub : ""}` : ""),
            csvCell(l.lastCalledAt ? new Date(l.lastCalledAt).toLocaleString() : ""),
            String(l.callAttempts),
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `callbacks-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <DashboardShell
      sidebar={null}
      title="Callback List"
      subtitle={`${total} lead${total !== 1 ? "s" : ""} requested a callback`}
      actions={
        <button
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary disabled:opacity-40 transition-colors"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </button>
      }
    >
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">Name</th>
              <th className="text-left font-medium px-3 py-2.5">Phone</th>
              <th className="text-left font-medium px-3 py-2.5">Company</th>
              <th className="text-left font-medium px-3 py-2.5">Callback Scheduled</th>
              <th className="text-right font-medium px-3 py-2.5">Last Called</th>
              <th className="text-right font-medium px-5 py-2.5">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  No callback leads yet
                </td>
              </tr>
            )}
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-5 py-3">
                  <div className="font-medium">{l.name}</div>
                  {l.title && <div className="text-xs text-muted-foreground">{l.title}</div>}
                </td>
                <td className="px-3 py-3 tabular-nums">{l.phone}</td>
                <td className="px-3 py-3 text-muted-foreground">{l.company ?? "—"}</td>
                <td className="px-3 py-3 text-xs">
                  <CallbackBadge iso={l.callbackAt} />
                </td>
                <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                  {l.lastCalledAt ? formatRelative(l.lastCalledAt) : "—"}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">{l.callAttempts}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-3 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function formatCallbackAt(iso: string | null | undefined): {
  label: string;
  sub: string | null;
  variant: "today" | "tomorrow" | "overdue" | "future" | "none";
} {
  if (!iso) return { label: "—", sub: null, variant: "none" };

  const date = new Date(iso);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 86400000);
  const startOfDayAfter = new Date(startOfTomorrow.getTime() + 86400000);

  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (date < startOfToday) {
    const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
    return { label: "Overdue", sub: `${dateStr} · ${timeStr}`, variant: "overdue" };
  }
  if (date >= startOfToday && date < startOfTomorrow) {
    return { label: "Today", sub: timeStr, variant: "today" };
  }
  if (date >= startOfTomorrow && date < startOfDayAfter) {
    return { label: "Tomorrow", sub: timeStr, variant: "tomorrow" };
  }
  const dateStr = date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return { label: dateStr, sub: timeStr, variant: "future" };
}

function CallbackBadge({ iso }: { iso: string | null | undefined }) {
  const { label, sub, variant } = formatCallbackAt(iso);

  if (variant === "none") {
    return <span className="text-muted-foreground">—</span>;
  }

  const colors: Record<string, string> = {
    overdue:  "bg-destructive/10 text-destructive",
    today:    "bg-success/10 text-success",
    tomorrow: "bg-accent/10 text-accent",
    future:   "bg-muted text-muted-foreground",
  };

  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colors[variant]}`}>
        {label}
      </span>
      {sub && <span className="text-[11px] text-muted-foreground pl-0.5">{sub}</span>}
    </span>
  );
}

function csvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
