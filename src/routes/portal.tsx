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
  Settings,
  LogOut,
} from "lucide-react";
import { DashboardSidebar, type NavItem } from "@/components/dashboard/Sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/store/userAuthSlice";

const items: NavItem[] = [
  { to: "/portal", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/portal/leads", label: "Upload Leads", icon: <Upload className="h-4 w-4" /> },
  { to: "/portal/scripts", label: "Scripts", icon: <FileText className="h-4 w-4" /> },
  { to: "/portal/campaigns", label: "Campaigns", icon: <Megaphone className="h-4 w-4" /> },
  { to: "/portal/calls", label: "Call Log", icon: <PhoneCall className="h-4 w-4" /> },
  { to: "/portal/meetings", label: "Meetings", icon: <CalendarCheck className="h-4 w-4" /> },
  { to: "/portal/billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
  { to: "/portal/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

export const Route = createFileRoute("/portal")({ component: PortalLayout });

function PortalLayout() {
  const client = useAppSelector((s) => s.userAuth.user);
  const tenant = useAppSelector((s) => s.userAuth.tenant);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!client) navigate({ to: "/login" });
  }, [client, navigate]);

  if (!client) return null;

  const accentColor = tenant?.primaryColor ?? "#0EA5E9";

  const initials = client.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const brandMark = tenant?.logoUrl ? (
    <img
      src={tenant.logoUrl}
      alt={tenant.name}
      className="h-5 w-5 object-contain"
    />
  ) : (
    <span className="text-xs font-bold text-white">{initials}</span>
  );

  const handleLogout = () => {
    dispatch(clearUser());
    navigate({ to: "/login" });
  };

  return (
    <>
      <DashboardSidebar
        brand={{
          name: tenant?.name ?? client.name,
          subtitle: "AI Calling Platform",
          mark: brandMark,
          markBg: accentColor,
        }}
        items={items}
        footer={
          <div className="flex items-center gap-3 text-sm">
            <div
              className="h-8 w-8 rounded-full inline-flex items-center justify-center text-xs font-semibold text-white shrink-0"
              style={{ background: accentColor }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-medium text-[13px] truncate">{client.name}</div>
              <div className="text-[11px] text-sidebar-foreground truncate">{client.email}</div>
            </div>
            <button
              onClick={handleLogout}
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
