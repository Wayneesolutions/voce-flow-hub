import { createFileRoute, Link } from "@tanstack/react-router";
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
  Trash2,
  Loader2,
  RotateCcw,
  Filter,
  X,
} from "lucide-react";

export const Route = createFileRoute("/portal/leads")({
  validateSearch: (search: Record<string, unknown>) => ({
    campaignId:   typeof search.campaignId   === "string" ? search.campaignId   : undefined,
    campaignName: typeof search.campaignName === "string" ? search.campaignName : undefined,
  }),
  head: () => ({ meta: [{ title: "Upload Leads · Client Portal" }] }),
  component: Leads,
});

function Leads() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { campaignId, campaignName } = Route.useSearch();
  const [uploadResult, setUploadResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Reset to page 1 whenever the campaign filter changes
  const [page, setPage] = useState(1);
  const prevCampaignId = useRef(campaignId);
  if (prevCampaignId.current !== campaignId) {
    prevCampaignId.current = campaignId;
    if (page !== 1) setPage(1);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["leads", page, campaignId],
    queryFn: () => leadsApi.list({ page, limit: 20, campaignId }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.optOut(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => leadsApi.reset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);
    try {
      const result = await leadsApi.uploadCsv(file, undefined, setUploadProgress);
      setUploadResult(result);
      qc.invalidateQueries({ queryKey: ["leads"] });
    } catch {
      setUploadResult({ imported: 0, skipped: 0, errors: ["Upload failed — check file format"] });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;

  return (
    <DashboardShell
      sidebar={null}
      title="Upload leads"
      subtitle={campaignId && campaignName ? `Showing leads for campaign: ${campaignName}` : "Upload a CSV or Excel file of contacts to call"}
    >
      {campaignId && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">
          <Filter className="h-4 w-4 text-accent shrink-0" />
          <span className="text-accent font-medium">
            Filtered by campaign: <span className="font-semibold">{campaignName ?? campaignId}</span>
          </span>
          <Link
            to="/portal/leads"
            search={{ campaignId: undefined, campaignName: undefined }}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-3 w-3" />
            Show all leads
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div
          className="lg:col-span-2 rounded-lg border-2 border-dashed border-border bg-card p-10 text-center cursor-pointer hover:border-accent/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
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
            {uploading
              ? uploadProgress < 100
                ? `Uploading… ${uploadProgress}%`
                : "Processing leads…"
              : "Drop your CSV or Excel file here"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {uploading
              ? uploadProgress < 100
                ? "Transferring file to server"
                : "Validating and importing rows — this may take a moment"
              : "or click to browse · CSV or XLSX · Max 10,000 leads per upload"}
          </p>

          {uploading && (
            <div className="mt-4 w-full max-w-xs mx-auto space-y-1.5">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full bg-accent transition-all duration-300 ${
                    uploadProgress >= 100 ? "w-full animate-pulse" : ""
                  }`}
                  style={uploadProgress < 100 ? { width: `${uploadProgress}%` } : undefined}
                />
              </div>
            </div>
          )}

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
                  label="Skipped"
                  value={String(uploadResult.skipped)}
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
                  No leads found. Upload a CSV or Excel file to get started.
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
                  <div className="flex items-center justify-end gap-1.5">
                    {l.status === "EXHAUSTED" && (
                      <button
                        title="Re-enable for calling"
                        onClick={() => resetMutation.mutate(l.id)}
                        disabled={resetMutation.isPending}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-success/30 text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                      >
                        {resetMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    {l.status !== "OPTED_OUT" && (
                      <button
                        title="Opt out lead"
                        onClick={() => deleteMutation.mutate(l.id)}
                        disabled={deleteMutation.isPending}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
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

const STATUS_STYLES: Partial<Record<LeadStatus, string>> = {
  PENDING: "bg-muted text-muted-foreground",
  CALLING: "bg-accent/10 text-accent",
  BOOKED: "bg-success/10 text-success",
  NOT_INTERESTED: "bg-warning/10 text-warning",
  CALLBACK: "bg-accent/10 text-accent",
  VOICEMAIL: "bg-muted text-muted-foreground",
  NO_ANSWER: "bg-muted text-muted-foreground",
  OPTED_OUT: "bg-destructive/10 text-destructive",
  EXHAUSTED: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}
