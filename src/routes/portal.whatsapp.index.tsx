import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { waApi } from "@/lib/api";
import type { WaContactList, WaListStats } from "@/lib/types";
import {
  Upload,
  Users,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  BarChart3,
  ChevronRight,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/portal/whatsapp/")({
  head: () => ({ meta: [{ title: "WhatsApp Contacts · Client Portal" }] }),
  component: WhatsAppContacts,
});

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-semibold leading-none">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── List stats row ────────────────────────────────────────────────────────────

function ListStatsRow({ listId }: { listId: string }) {
  const { data: stats, isLoading } = useQuery<WaListStats>({
    queryKey: ["wa-list-stats", listId],
    queryFn:  () => waApi.getListStats(listId),
    staleTime: 30_000,
  });

  if (isLoading) return <span className="text-xs text-muted-foreground">Loading…</span>;
  if (!stats)    return null;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        {stats.OPTED_IN} opted in
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3 text-amber-500" />
        {stats.PENDING} pending
      </span>
      <span className="inline-flex items-center gap-1">
        <XCircle className="h-3 w-3 text-rose-400" />
        {stats.DECLINED + stats.NO_ANSWER + stats.VOICEMAIL} declined / no answer
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function WhatsAppContacts() {
  const qc      = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [listName,        setListName]        = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [uploadResult,    setUploadResult]    = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [uploading,       setUploading]       = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState(0);
  const [triggeringId,    setTriggeringId]    = useState<string | null>(null);

  const { data: lists, isLoading } = useQuery<WaContactList[]>({
    queryKey: ["wa-lists"],
    queryFn:  waApi.getLists,
    staleTime: 15_000,
  });

  const triggerMutation = useMutation({
    mutationFn: (listId: string) => waApi.triggerOptIn(listId),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["wa-lists"] }); setTriggeringId(null); },
    onError:    () => setTriggeringId(null),
  });

  async function handleUpload(file: File) {
    if (!listName.trim()) {
      alert("Please enter a contact list name before uploading.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);
    try {
      const res = await waApi.uploadContacts(file, listName.trim(), setUploadProgress, consentConfirmed);
      setUploadResult({ imported: res.imported, skipped: res.skipped, errors: res.errors });
      setListName("");
      setConsentConfirmed(false);
      qc.invalidateQueries({ queryKey: ["wa-lists"] });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const totalOptedIn = lists?.length ?? 0;

  return (
    <DashboardShell
      title="WhatsApp Outreach"
      description="Upload contact lists, trigger opt-in calls, and track consent."
    >
      {/* ── Upload panel ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          Upload Contact List
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              List Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="e.g. Toronto Leads — June 2026"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              File (CSV or XLSX)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !listName.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Choose file
                </>
              )}
            </button>
            {!listName.trim() && !uploading && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                ↑ Enter a list name first, then choose your file
              </p>
            )}
          </div>
        </div>

        <label className="flex items-start gap-2.5 mt-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consentConfirmed}
            onChange={(e) => setConsentConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            I confirm that all contacts in this list have given prior consent to receive WhatsApp messages from us.
            {consentConfirmed && (
              <span className="ml-1 font-medium text-emerald-600">Contacts will be marked Opted-In immediately.</span>
            )}
          </span>
        </label>

        {uploadResult && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p className="font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4 inline mr-1" />
              {uploadResult.imported} imported, {uploadResult.skipped} skipped
            </p>
            {uploadResult.errors.length > 0 && (
              <ul className="mt-2 text-xs text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
                {uploadResult.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Required column: <code className="bg-muted px-1 rounded">phone</code> (E.164 or local format).
          Optional: <code className="bg-muted px-1 rounded">name</code>,{" "}
          <code className="bg-muted px-1 rounded">business</code>,{" "}
          <code className="bg-muted px-1 rounded">tags</code>
        </p>
      </div>

      {/* ── Contact Lists ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Contact Lists
          </h2>
          <Link to="/portal/whatsapp/campaigns" className="text-xs text-primary hover:underline flex items-center gap-1">
            Go to Campaigns <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : !lists?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center px-6">
            <BarChart3 className="h-8 w-8 mb-3 opacity-40" />
            <p className="font-medium text-sm">No contact lists yet</p>
            <p className="text-xs mt-2 max-w-sm leading-relaxed">
              Contacts appear here automatically when a VoCallM campaign call ends with outcome{" "}
              <strong>BOOKED</strong> — those leads are instantly marked{" "}
              <span className="text-emerald-600 font-medium">OPTED_IN</span> and added to the{" "}
              <strong>VoCallM Opted-In</strong> list.
            </p>
            <p className="text-xs mt-2 text-muted-foreground opacity-70">
              You can also upload a CSV or XLSX file above to add contacts manually.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {lists.map((list) => {
              const isAutoList = list.name === "VoCallM Opted-In";
              return (
                <div key={list.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{list.name}</p>
                      {isAutoList && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-medium border border-emerald-200">
                          <Zap className="h-3 w-3" /> Auto
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {list.totalContacts.toLocaleString()} contacts ·{" "}
                      {new Date(list.uploadedAt).toLocaleDateString()}
                      {list.sourceFilename && (
                        <span className="ml-1 opacity-60">({list.sourceFilename})</span>
                      )}
                    </p>
                    {isAutoList && (
                      <p className="text-xs text-muted-foreground opacity-70 mt-0.5">
                        Automatically populated when VoCallM call outcome = BOOKED
                      </p>
                    )}
                    <div className="mt-1">
                      <ListStatsRow listId={list.id} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isAutoList && (
                      <button
                        onClick={() => {
                          if (!confirm(`Place opt-in calls for all NOT_CONTACTED contacts in "${list.name}"?`)) return;
                          setTriggeringId(list.id);
                          triggerMutation.mutate(list.id);
                        }}
                        disabled={triggeringId === list.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        {triggeringId === list.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <PhoneCall className="h-3.5 w-3.5" />
                        )}
                        Trigger Opt-In Calls
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
