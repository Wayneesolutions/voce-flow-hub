import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  CreditCard,
  PhoneCall,
  Phone,
  LogOut,
} from "lucide-react";
import { DashboardSidebar, type NavItem } from "@/components/dashboard/Sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAdmin } from "@/store/adminAuthSlice";

const items: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/clients", label: "Clients", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/numbers", label: "Phone Numbers", icon: <Phone className="h-4 w-4" /> },
  { to: "/admin/scripts", label: "Script Review", icon: <FileCheck2 className="h-4 w-4" /> },
  { to: "/admin/billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
];

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const admin = useAppSelector((s) => s.adminAuth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false);

  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!admin && !isLoginRoute) navigate({ to: "/admin/login" });
  }, [admin, isLoginRoute, navigate, mounted]);

  // Login page renders without the sidebar shell
  if (isLoginRoute) return <Outlet />;

  // Server has no localStorage so admin is null on SSR.
  // Render null until client mounts — matches server output and avoids hydration mismatch.
  if (!mounted || !admin) return null;

  const initials = admin.name
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
          name: "VoCallM Admin",
          subtitle: "Wayne Solutions",
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
              <div className="text-white font-medium text-[13px] truncate">{admin.name}</div>
              <div className="text-[11px] text-sidebar-foreground truncate">{admin.email}</div>
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
