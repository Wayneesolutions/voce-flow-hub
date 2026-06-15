import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
import { store } from "@/store";

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

export const Route = createFileRoute("/portal")({
  beforeLoad: () => {
    const client = store.getState().userAuth.user;
    if (!client) throw redirect({ to: "/login" });
  },
  component: PortalLayout,
});

function PortalLayout() {
  const client = useAppSelector((s) => s.userAuth.user);
  const tenant = useAppSelector((s) => s.userAuth.tenant);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logoutModal, setLogoutModal] = useState(false);

  // Component-level guard for soft navigation (beforeLoad handles hard navigation)
  useEffect(() => {
    if (!client) navigate({ to: "/login", replace: true });
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
      src={`/api/public/logo/${tenant.id}`}
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
              onClick={() => setLogoutModal(true)}
              title="Sign out"
              className="text-sidebar-foreground hover:text-white transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        }
      />
      <Outlet />

      {/* Logout confirmation modal */}
      {logoutModal && createPortal(
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
        >
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-xs overflow-hidden">
            <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-destructive/10 inline-flex items-center justify-center mb-4">
                <LogOut className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="font-semibold text-base">Sign out?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                You'll be returned to the login page. Any unsaved changes will be lost.
              </p>
            </div>
            <div className="flex border-t border-border">
              <button
                onClick={() => setLogoutModal(false)}
                className="flex-1 h-12 text-sm font-medium text-foreground hover:bg-secondary transition-colors border-r border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 h-12 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
