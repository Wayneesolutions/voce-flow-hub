import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { adminAlertsApi } from "@/lib/api";
import type { AdminAlert } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function AlertBell() {
  const qc = useQueryClient();

  const { data } = useQuery({
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

  const unread = data?.unreadCount ?? 0;
  const alerts = data?.alerts ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative text-sidebar-foreground hover:text-white transition-colors shrink-0"
          title="Platform alerts"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white inline-flex items-center justify-center leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" sideOffset={12} className="w-80 p-0 rounded-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-semibold text-sm">
            Platform Alerts
            {unread > 0 && (
              <span className="ml-2 rounded-full bg-destructive/10 text-destructive text-xs font-semibold px-1.5 py-0.5">
                {unread} new
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">
            No alerts — all systems normal
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto divide-y divide-border">
            {alerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onRead={() => markRead.mutate(alert.id)}
              />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function AlertItem({ alert, onRead }: { alert: AdminAlert; onRead: () => void }) {
  return (
    <li className={cn("px-4 py-3 flex gap-3 items-start", !alert.isRead && "bg-destructive/5")}>
      <span
        className={cn(
          "mt-1.5 h-2 w-2 rounded-full shrink-0",
          !alert.isRead ? "bg-destructive" : "bg-muted-foreground/30",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold leading-snug">{alert.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</div>
        <div className="text-[10px] text-muted-foreground/60 mt-1">
          {new Date(alert.createdAt).toLocaleString()}
        </div>
      </div>
      {!alert.isRead && (
        <button
          onClick={onRead}
          className="text-[10px] text-accent hover:underline shrink-0 mt-1"
        >
          Dismiss
        </button>
      )}
    </li>
  );
}
