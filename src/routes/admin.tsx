import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { store } from "@/store";
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  CreditCard,
  PhoneCall,
  Phone,
  LogOut,
  Tag,
  UserCog,
  MessageSquare,
} from "lucide-react";
import { DashboardSidebar, type NavItem } from "@/components/dashboard/Sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAdmin } from "@/store/adminAuthSlice";

const items: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/clients", label: "Clients", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/numbers", label: "Phone Numbers", icon: <Phone className="h-4 w-4" /> },
  { to: "/admin/scripts", label: "Script Review", icon: <FileCheck2 className="h-4 w-4" /> },
  { to: "/admin/wa-templates", label: "WA Templates", icon: <MessageSquare className="h-4 w-4" /> },
  { to: "/admin/plans", label: "Plans", icon: <Tag className="h-4 w-4" /> },
  { to: "/admin/billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
  { to: "/admin/profile", label: "My Profile", icon: <UserCog className="h-4 w-4" /> },
];

const AUTH_ROUTES = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => {
    // localStorage is unavailable during SSR — skip the guard and let the
    // client handle it after hydration (component-level null guards below).
    if (typeof window === "undefined") return;

    const isAuthRoute = AUTH_ROUTES.some((r) => location.pathname.startsWith(r));
    const user = store.getState().adminAuth.user;

    // Logged-in admin trying to open login/forgot/reset → send to dashboard
    if (isAuthRoute && user) throw redirect({ to: "/admin" });

    // Guest trying to open a protected admin page → send to login
    if (!isAuthRoute && !user) throw redirect({ to: "/admin/login" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const admin = useAppSelector((s) => s.adminAuth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [logoutModal, setLogoutModal] = useState(false);

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Component-level guard — runs on every child navigation within /admin/*
  // beforeLoad only fires on initial match, not on soft child-to-child navigation
  useEffect(() => {
    if (isAuthRoute && admin) navigate({ to: "/admin", replace: true });
    else if (!isAuthRoute && !admin) navigate({ to: "/admin/login", replace: true });
  }, [isAuthRoute, admin, navigate]);

  // Block render immediately (no flash) while the effect redirects
  if (isAuthRoute && admin) return null;
  if (!isAuthRoute && !admin) return null;

  if (isAuthRoute) return <Outlet />;

  // The guards above already guarantee admin is non-null here at runtime —
  // if !isAuthRoute && !admin we already returned null. TypeScript can't
  // trace that across two separate if-branches, so we assert it explicitly.
  const currentAdmin = admin!;

  const initials = currentAdmin.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    dispatch(clearAdmin());
    navigate({ to: "/admin/login" });
  };

  return (
    <>
      <DashboardSidebar
        brand={{
          name: "Quor Admin",
          subtitle: "Wayne E Solutions",
          mark: <PhoneCall className="h-4 w-4" />,
          markBg: "#2E86DE",
        }}
        items={items}
        footer={
          <div className="flex items-center gap-3 text-sm">
            <div
              className="h-8 w-8 rounded-full inline-flex items-center justify-center text-xs font-semibold text-white shrink-0"
              style={{ background: "#2E86DE" }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-medium text-[13px] truncate">{currentAdmin.name}</div>
              <div className="text-[11px] text-sidebar-foreground truncate">{currentAdmin.email}</div>
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
