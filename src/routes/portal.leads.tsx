import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export const Route = createFileRoute("/portal/leads")({
  head: () => ({ meta: [{ title: "Upload Leads · Client Portal" }] }),
  component: Leads,
});

function Leads() {
  return (
    <DashboardShell sidebar={null} title="Upload leads" subtitle="Upload a CSV file of contacts to call">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border-2 border-dashed border-border bg-card p-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent"><UploadCloud className="h-7 w-7"/></div>
          <h3 className="mt-4 text-lg font-semibold">Drop your CSV here</h3>
          <p className="mt-1 text-sm text-muted-foreground">or click to browse · Max 10,000 leads per upload</p>
          <button className="mt-5 h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Select file</button>
          <div className="mt-6 text-left max-w-md mx-auto">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Required columns</div>
            <code className="block rounded-md bg-muted px-3 py-2 text-xs font-mono">name, phone, country, email, company, title</code>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 h-fit">
          <div className="font-semibold">Last upload</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><FileSpreadsheet className="h-3.5 w-3.5"/>toronto-realtors-q2.csv · 2h ago</div>
          <ul className="mt-5 space-y-3">
            <Result icon={<CheckCircle2 className="h-4 w-4 text-success"/>} label="Imported" value="1,248"/>
            <Result icon={<AlertTriangle className="h-4 w-4 text-warning"/>} label="Skipped (duplicates)" value="86"/>
            <Result icon={<XCircle className="h-4 w-4 text-destructive"/>} label="Errors (invalid)" value="12"/>
          </ul>
          <button className="mt-5 w-full h-9 rounded-md border border-border text-sm hover:bg-secondary">Download error report</button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <div className="font-semibold">Recent uploads</div>
        <table className="w-full text-sm mt-3">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr><th className="text-left font-medium py-2">File</th><th className="text-right font-medium py-2">Imported</th><th className="text-right font-medium py-2">Skipped</th><th className="text-right font-medium py-2">Errors</th><th className="text-right font-medium py-2">When</th></tr>
          </thead>
          <tbody>
            {[
              ["toronto-realtors-q2.csv", 1248, 86, 12, "2h ago"],
              ["gta-plumbers-list.csv", 980, 41, 4, "Yesterday"],
              ["dubai-saas-leads.csv", 540, 22, 0, "3 days ago"],
            ].map(([f,i,s,e,w]) => (
              <tr key={f as string} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{f}</td>
                <td className="py-3 text-right tabular-nums">{(i as number).toLocaleString()}</td>
                <td className="py-3 text-right tabular-nums text-muted-foreground">{s as number}</td>
                <td className="py-3 text-right tabular-nums text-destructive">{e as number}</td>
                <td className="py-3 text-right text-xs text-muted-foreground">{w}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

function Result({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </li>
  );
}
