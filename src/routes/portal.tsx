import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Megaphone,
  PhoneCall,
  CalendarCheck,
  CreditCard,
  Wrench,
  LogOut,
} from "lucide-react";
import { DashboardSidebar, type NavItem } from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/auth";

export const tenant = {
  name: "Acme Plumbing",
  subtitle: "AI Calling Platform",
  accent: "#0EA5E9",
  initials: "AP",
};

const items: NavItem[] = [
  { to: "/portal", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/portal/leads", label: "Upload Leads", icon: <Upload className="h-4 w-4" /> },
  { to: "/portal/scripts", label: "Scripts", icon: <FileText className="h-4 w-4" /> },
  { to: "/portal/campaigns", label: "Campaigns", icon: <Megaphone className="h-4 w-4" /> },
  { to: "/portal/calls", label: "Call Log", icon: <PhoneCall className="h-4 w-4" /> },
  { to: "/portal/meetings", label: "Meetings", icon: <CalendarCheck className="h-4 w-4" /> },
  { to: "/portal/billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
];

export const Route = createFileRoute("/portal")({ component: PortalLayout });

function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <DashboardSidebar
        brand={{
          name: tenant.name,
          subtitle: tenant.subtitle,
          mark: <Wrench className="h-4 w-4" />,
          markBg: tenant.accent,
        }}
        items={items}
        footer={
          <div className="flex items-center gap-3 text-sm">
            <div
              className="h-8 w-8 rounded-full inline-flex items-center justify-center text-xs font-semibold text-white shrink-0"
              style={{ background: tenant.accent }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-medium text-[13px] truncate">{user.name}</div>
              <div className="text-[11px] text-sidebar-foreground truncate">{user.email}</div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-sidebar-foreground hover:text-white transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        }
      />
      <Outlet />
    </>
  );
}
