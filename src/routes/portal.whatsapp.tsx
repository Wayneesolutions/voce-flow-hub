import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/whatsapp")({
  component: () => <Outlet />,
});
