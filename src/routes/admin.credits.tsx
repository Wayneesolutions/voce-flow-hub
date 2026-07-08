import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PlatformCreditsPanel } from "@/components/admin/PlatformCreditsPanel";
import { adminAlertsApi } from "@/lib/api";
import type { AdminAlert } from "@/lib/types";
import { Bell, CheckCheck, Mic2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/credits")({
  head: () => ({ meta: [{ title: "Platform Credits · Quor Admin" }] }),
  component: AdminCreditsPage,
});

function AdminCreditsPage() {
  const qc = useQueryClient();

  const { data: alertsData } = useQuery({
    queryKey: ["admin", "alerts"],
    queryFn: adminAlertsApi.list,
    refetchInterval: 60_000,
  });

  const markRead = useMutation({
    mutationFn: adminAlertsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "alerts"] }),
  });

  const markAll = useMutation({
    mutationFn: adminAlertsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "alerts"] }),
  });

  const alerts = alertsData?.alerts ?? [];
  const unread = alertsData?.unreadCount ?? 0;

  return (
    <DashboardShell
      sidebar={null}
      title="Platform Credits"
      subtitle="ElevenLabs character balance · VAPI monthly spend · alert history"
    >
      {/* Live credit data — always visible */}
      <PlatformCreditsPanel />

      {/* Alert history */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold">Alert History</div>
            <div className="text-xs text-muted-foreground">
              Alerts fire when ElevenLabs &lt; 5,000 chars or VAPI spend &gt; $5/month
            </div>
          </div>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <div className="text-sm font-medium">No alerts yet</div>
            <div className="text-xs text-muted-foreground mt-1">
              The credit monitor checks every 30 minutes and records alerts here.
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <ul className="divide-y divide-border">
              {alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onRead={() => markRead.mutate(alert.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function AlertRow({ alert, onRead }: { alert: AdminAlert; onRead: () => void }) {
  const isEl = alert.type === "ELEVENLABS_LOW";
  return (
    <li className={cn("flex items-start gap-4 px-5 py-4", !alert.isRead && "bg-destructive/5")}>
      <div
        className={cn(
          "mt-0.5 h-8 w-8 rounded-md inline-flex items-center justify-center shrink-0",
          isEl ? "bg-violet-500/10" : "bg-blue-500/10",
        )}
      >
        {isEl ? (
          <Mic2 className="h-4 w-4 text-violet-500" />
        ) : (
          <Zap className="h-4 w-4 text-blue-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{alert.title}</span>
          {!alert.isRead && (
            <span className="inline-flex rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold px-1.5 py-0.5">
              New
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          {alert.message}
        </div>
        <div className="text-xs text-muted-foreground/60 mt-1">
          {new Date(alert.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {!alert.isRead && (
        <button
          onClick={onRead}
          className="text-xs text-accent hover:underline shrink-0 mt-1"
        >
          Dismiss
        </button>
      )}
    </li>
  );
}
