import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { clients } from "@/lib/mock";
import { Plus, Search, X } from "lucide-react";

export const Route = createFileRoute("/admin/clients")({
  head: () => ({ meta: [{ title: "Clients · VoCallM Admin" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(clients[0].id);
  const filtered = clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const active = clients.find(c=>c.id===selected) ?? clients[0];

  return (
    <DashboardShell
      sidebar={null}
      title="Clients"
      subtitle={`${clients.length} active clients`}
      actions={
        <button onClick={()=>setCreating(true)} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4"/>Create client
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground"/>
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search clients…" className="bg-transparent text-sm outline-none flex-1"/>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Client</th>
                <th className="text-left font-medium px-3 py-2.5">Owner</th>
                <th className="text-right font-medium px-3 py-2.5">Rate</th>
                <th className="text-right font-medium px-3 py-2.5">Minutes</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c)=>(
                <tr key={c.id} onClick={()=>setSelected(c.id)} className={`border-t border-border cursor-pointer ${selected===c.id?"bg-accent/5":"hover:bg-muted/30"}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{c.owner}</td>
                  <td className="px-3 py-3 text-right tabular-nums">${c.rate.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.minutes.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full text-xs px-2 py-0.5 font-medium ${c.status==="active"?"bg-success/10 text-success":"bg-warning/10 text-warning"}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="rounded-lg border border-border bg-card p-5 h-fit">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Client detail</div>
          <h3 className="mt-1 text-lg font-semibold">{active.name}</h3>
          <div className="text-sm text-muted-foreground">{active.email}</div>

          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Owner" value={active.owner}/>
            <Row label="Rate per minute" value={`$${active.rate.toFixed(2)}`}/>
            <Row label="Subdomain" value={`${active.id}.vocallm.app`}/>
            <Row label="Phone numbers" value="+1 416 555 0142, +1 647 555 0188"/>
            <Row label="Integrations" value="HubSpot · Google Calendar"/>
          </dl>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button className="h-9 rounded-md border border-border text-sm hover:bg-secondary">Manage numbers</button>
            <button className="h-9 rounded-md border border-border text-sm hover:bg-secondary">Edit billing</button>
            <button className="h-9 rounded-md border border-border text-sm hover:bg-secondary">Branding</button>
            <button className="h-9 rounded-md border border-destructive/30 text-destructive text-sm hover:bg-destructive/5">Suspend</button>
          </div>
        </aside>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-xl rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="font-semibold">Create new client</div>
              <button onClick={()=>setCreating(false)} className="p-1 rounded hover:bg-secondary"><X className="h-4 w-4"/></button>
            </div>
            <div className="p-5 grid gap-4 sm:grid-cols-2">
              <FormField label="Company name" />
              <FormField label="Subdomain slug" />
              <FormField label="Owner name" />
              <FormField label="Owner email" type="email"/>
              <FormField label="Portal password" type="password"/>
              <FormField label="Rate per minute" type="number"/>
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button onClick={()=>setCreating(false)} className="h-9 px-4 rounded-md border border-border text-sm hover:bg-secondary">Cancel</button>
              <button onClick={()=>setCreating(false)} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Create client</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border pb-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
function FormField({ label, type="text" }: { label: string; type?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input type={type} className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"/>
    </div>
  );
}
