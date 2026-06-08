import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { leadsApi } from "@/lib/api";
import type { LeadStatus } from "@/lib/types";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PhoneCall,
  Trash2,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/portal/leads")({
  head: () => ({ meta: [{ title: "Upload Leads · Client Portal" }] }),
  component: Leads,
});

function Leads() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<{ imported: number; errors: string[] } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["leads", page, search],
    queryFn: () => leadsApi.list({ page, pageSize: 20, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const callMutation = useMutation({
    mutationFn: (id: string) => leadsApi.triggerCall(id),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await leadsApi.uploadCsv(file);
      setUploadResult(result);
      qc.invalidateQueries({ queryKey: ["leads"] });
    } catch {
      setUploadResult({ imported: 0, errors: ["Upload failed — check file format"] });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const leads = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <DashboardShell
      sidebar={null}
      title="Upload leads"
      subtitle="Upload a CSV file of contacts to call"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div
          className="lg:col-span-2 rounded-lg border-2 border-dashed border-border bg-card p-10 text-center cursor-pointer hover:border-accent/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <UploadCloud className="h-7 w-7" />
            )}
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {uploading ? "Uploading…" : "Drop your CSV here"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse · Max 10,000 leads per upload
          </p>
          <button
            className="mt-5 h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation();
              fileRef.current?.click();
            }}
          >
            Select file
          </button>
          <div className="mt-6 text-left max-w-md mx-auto">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Required columns
            </div>
            <code className="block rounded-md bg-muted px-3 py-2 text-xs font-mono">
              name, phone, country, email, company, title
            </code>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 h-fit">
          <div className="font-semibold">Last upload</div>
          {uploadResult ? (
            <>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Processed just now
              </div>
              <ul className="mt-5 space-y-3">
                <UploadStat
                  icon={<CheckCircle2 className="h-4 w-4 text-success" />}
                  label="Imported"
                  value={uploadResult.imported.toLocaleString()}
                />
                <UploadStat
                  icon={<AlertTriangle className="h-4 w-4 text-warning" />}
                  label="Errors"
                  value={String(uploadResult.errors.length)}
                />
              </ul>
              {uploadResult.errors.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {uploadResult.errors.slice(0, 3).map((e, i) => (
                    <li key={i} className="text-xs text-destructive">
                      {e}
                    </li>
                  ))}
                  {uploadResult.errors.length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      +{uploadResult.errors.length - 3} more
                    </li>
                  )}
                </ul>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No uploads yet this session.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between gap-3">
          <div className="font-semibold">
            Leads <span className="text-muted-foreground font-normal text-sm">({total})</span>
          </div>
          <input
            type="search"
            placeholder="Search name, company…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 w-48"
          />
        </div>

        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">Name</th>
              <th className="text-left font-medium px-3 py-2.5">Phone</th>
              <th className="text-left font-medium px-3 py-2.5">Country</th>
              <th className="text-left font-medium px-3 py-2.5">Status</th>
              <th className="text-right font-medium px-3 py-2.5">Attempts</th>
              <th className="text-right font-medium px-5 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  No leads found. Upload a CSV to get started.
                </td>
              </tr>
            )}
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-5 py-3">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.company}</div>
                </td>
                <td className="px-3 py-3 tabular-nums text-muted-foreground">{l.phone}</td>
                <td className="px-3 py-3">{l.country}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={l.status} />
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{l.callAttempts}</td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      title="Trigger call"
                      onClick={() => callMutation.mutate(l.id)}
                      disabled={callMutation.isPending}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors disabled:opacity-50"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title="Delete lead"
                      onClick={() => deleteMutation.mutate(l.id)}
                      disabled={deleteMutation.isPending}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-3 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3 rounded-md border border-border hover:bg-secondary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function UploadStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </li>
  );
}

const STATUS_STYLES: Record<LeadStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  calling: "bg-accent/10 text-accent",
  booked: "bg-success/10 text-success",
  not_interested: "bg-warning/10 text-warning",
  callback: "bg-accent/10 text-accent",
  voicemail: "bg-muted text-muted-foreground",
  no_answer: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
