import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { Download, Receipt, Timer, DollarSign, PhoneCall } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/portal/billing")({
  head: () => ({ meta: [{ title: "Billing · Client Portal" }] }),
  component: PortalBilling,
});

const weekly = [
  { w: "W1", min: 240 },
  { w: "W2", min: 310 },
  { w: "W3", min: 295 },
  { w: "W4", min: 355 },
];

const invoices = [
  { id: "INV-0426", month: "May 2026", min: 1180, amount: 1770 },
  { id: "INV-0327", month: "Apr 2026", min: 1042, amount: 1563 },
  { id: "INV-0228", month: "Mar 2026", min: 920, amount: 1380 },
];

function PortalBilling() {
  return (
    <DashboardShell sidebar={null} title="Billing" subtitle="Usage and invoices">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Minutes used (MTD)"
          value="1,200"
          icon={<Timer className="h-4 w-4" />}
          delta={9}
        />
        <StatCard
          label="Calls made"
          value="342"
          icon={<PhoneCall className="h-4 w-4" />}
          delta={12}
        />
        <StatCard
          label="Amount billed"
          value="$1,800"
          icon={<DollarSign className="h-4 w-4" />}
          delta={9}
          hint="@ $1.50/min"
        />
        <StatCard
          label="Next invoice"
          value="Jul 1"
          icon={<Receipt className="h-4 w-4" />}
          hint="auto-charge"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="font-semibold">Weekly usage</div>
          <div className="h-64 mt-4">
            <ResponsiveContainer>
              <BarChart data={weekly} margin={{ left: -10, right: 8 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="w"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
                />
                <Bar dataKey="min" fill="#2E86DE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="font-semibold">Payment method</div>
          <div className="mt-4 rounded-md border border-border p-4">
            <div className="text-sm font-medium">Visa •••• 4242</div>
            <div className="text-xs text-muted-foreground">Expires 08/28</div>
          </div>
          <button className="mt-3 w-full h-9 rounded-md border border-border text-sm hover:bg-secondary">
            Update card
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border font-semibold">Invoices</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">Invoice</th>
              <th className="text-left font-medium px-3 py-2.5">Month</th>
              <th className="text-right font-medium px-3 py-2.5">Minutes</th>
              <th className="text-right font-medium px-3 py-2.5">Amount</th>
              <th className="text-right font-medium px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-5 py-3 font-medium">{i.id}</td>
                <td className="px-3 py-3 text-muted-foreground">{i.month}</td>
                <td className="px-3 py-3 text-right tabular-nums">{i.min.toLocaleString()}</td>
                <td className="px-3 py-3 text-right tabular-nums font-medium">
                  ${i.amount.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-accent text-xs hover:underline inline-flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
