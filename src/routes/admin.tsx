import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Users, FileCheck2, CreditCard, PhoneCall, Settings } from "lucide-react";
import { DashboardSidebar, type NavItem } from "@/components/dashboard/Sidebar";

const items: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4"/> },
  { to: "/admin/clients", label: "Clients", icon: <Users className="h-4 w-4"/> },
  { to: "/admin/scripts", label: "Script Review", icon: <FileCheck2 className="h-4 w-4"/> },
  { to: "/admin/billing", label: "Billing", icon: <CreditCard className="h-4 w-4"/> },
];

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  return (
    <>
      <DashboardSidebar
        brand={{
          name: "VoCallM",
          subtitle: "Wayne Solutions · Admin",
          mark: <PhoneCall className="h-4 w-4" />,
          markBg: "#2E86DE",
        }}
        items={items}
        footer={
          <div className="flex items-center gap-3 text-sm">
            <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center text-xs font-semibold">WS</div>
            <div className="min-w-0">
              <div className="text-white font-medium truncate text-[13px]">Wayne Bryce</div>
              <div className="text-[11px] text-sidebar-foreground truncate">admin@wayne.io</div>
            </div>
            <Settings className="h-4 w-4 ml-auto text-sidebar-foreground" />
          </div>
        }
      />
      <Outlet />
    </>
  );
}
