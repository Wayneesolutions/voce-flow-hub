import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface Props {
  brand: { name: string; subtitle?: string; mark: ReactNode; markBg?: string };
  items: NavItem[];
  footer?: ReactNode;
}

export function DashboardSidebar({ brand, items, footer }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const Nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {items.map((item) => {
        const active =
          pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
            )}
          >
            <span className="h-4 w-4 shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const Brand = (
    <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white font-semibold"
        style={{ background: brand.markBg ?? "var(--color-accent)" }}
      >
        {brand.mark}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white truncate">{brand.name}</div>
        {brand.subtitle && (
          <div className="text-[11px] text-sidebar-foreground truncate">{brand.subtitle}</div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-background">
        <div className="flex items-center gap-2 font-semibold">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white"
            style={{ background: brand.markBg ?? "var(--color-accent)" }}
          >
            {brand.mark}
          </span>
          {brand.name}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-md hover:bg-secondary"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 bg-sidebar text-sidebar-foreground flex-col z-20">
        {Brand}
        {Nav}
        {footer && <div className="border-t border-sidebar-border p-4">{footer}</div>}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-sidebar text-sidebar-foreground">
            <div className="absolute right-3 top-3">
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-md text-white/80 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {Brand}
            {Nav}
            {footer && <div className="border-t border-sidebar-border p-4">{footer}</div>}
          </aside>
        </div>
      )}
    </>
  );
}
