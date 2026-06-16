import { createFileRoute, Outlet, Link, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Mic,
  Megaphone,
  PhoneCall,
  CalendarCheck,
  CreditCard,
  Settings,
  LogOut,
  Lock,
  ArrowRight,
} from "lucide-react";
import { DashboardSidebar, type NavItem } from "@/components/dashboard/Sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/store/userAuthSlice";
import { store } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";

function PlanGate({ accentColor }: { accentColor: string }) {
  const LOCKED_FEATURES = [
    { icon: Megaphone, label: "AI Calling Campaigns" },
    { icon: Upload,    label: "Lead Management" },
    { icon: PhoneCall, label: "Call Recordings & Transcripts" },
    { icon: CalendarCheck, label: "Auto Meeting Booking" },
    { icon: FileText,  label: "Custom AI Scripts" },
    { icon: Mic,       label: "Voice Cloning" },
  ];

  return (
    <div className="lg:pl-60 min-h-screen bg-muted/40 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div
          className="mx-auto mb-6 h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: `${accentColor}18` }}
        >
          <Lock className="h-9 w-9" style={{ color: accentColor }} />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight">Activate your plan</h2>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
          Your account is ready. Choose a plan to unlock AI calling campaigns and all platform features.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-2.5 text-left max-w-sm mx-auto">
          {LOCKED_FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 opacity-50"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
            </div>
          ))}
        </div>

        <Link
          to="/portal/billing"
          search={{ checkout: undefined }}
          className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-lg"
          style={{ background: accentColor }}
        >
          View plans &amp; pricing <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="mt-4 text-xs text-muted-foreground">
          Need help?{" "}
          <a href="mailto:support@waynesolutions.com" className="hover:underline" style={{ color: accentColor }}>
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

const items: NavItem[] = [
  { to: "/portal", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/portal/leads", label: "Upload Leads", icon: <Upload className="h-4 w-4" /> },
  { to: "/portal/scripts", label: "Scripts", icon: <FileText className="h-4 w-4" /> },
  { to: "/portal/voice", label: "My Voice", icon: <Mic className="h-4 w-4" /> },
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

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["tenant-me"],
    queryFn: tenantApi.me,
    staleTime: 60_000,
    enabled: !!client,
  });

  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const isOnBilling = currentPath.startsWith("/portal/billing");
  const hasPlan = !!me?.plan;
  // Only gate once me is confirmed loaded (avoids flashing gate on page load)
  const showGate = !meLoading && me !== undefined && !hasPlan && !isOnBilling;

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
      {showGate ? <PlanGate accentColor={accentColor} /> : <Outlet />}

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
