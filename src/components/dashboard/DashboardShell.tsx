import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";

interface Props {
  sidebar: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({ sidebar, title, subtitle, actions, children }: Props) {
  return (
    <div className="min-h-screen bg-muted/40">
      {sidebar}
      <div className="lg:pl-60">
        <header className="hidden lg:flex sticky top-0 z-10 h-16 items-center justify-between border-b border-border bg-background/90 backdrop-blur px-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Search className="h-4 w-4" />
            <input
              placeholder="Search clients, calls, scripts…"
              className="bg-transparent outline-none text-sm w-80 placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-secondary">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-xs font-medium">
              WS
            </div>
          </div>
        </header>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
