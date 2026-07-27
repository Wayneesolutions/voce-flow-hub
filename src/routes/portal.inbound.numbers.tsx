import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  inboundPhoneApi,
  type InboundPhoneNumber,
  type AvailableInboundNumber,
  type OutboundNumberCandidate,
} from "@/lib/api";
import { Hash, Plus, Search, Trash2, Loader2, AlertTriangle, CheckCircle2, X, Link2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/inbound/numbers")({
  head: () => ({ meta: [{ title: "Inbound Phone Numbers · Portal" }] }),
  component: NumbersPage,
});

function NumbersPage() {
  const qc = useQueryClient();
  const [showSearch, setShowSearch]     = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [showLink, setShowLink]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Search state
  const [searchCountry, setSearchCountry]   = useState("CA");
  const [searchArea, setSearchArea]         = useState("");
  const [searchContains, setSearchContains] = useState("");
  const [searchResults, setSearchResults]   = useState<AvailableInboundNumber[]>([]);
  const [searching, setSearching]           = useState(false);

  // Import state
  const [importProvider, setImportProvider] = useState<"twilio" | "plivo">("twilio");
  const [importPhone, setImportPhone] = useState("");
  const [importSid, setImportSid]     = useState("");
  const [importPlivoUuid, setImportPlivoUuid] = useState("");
  const [importCountry, setImportCountry] = useState("CA");

  // Link-existing-outbound-number state
  const [linkTenantPhoneId, setLinkTenantPhoneId] = useState("");

  const { data: numbers = [], isLoading } = useQuery({
    queryKey: ["inbound-numbers"],
    queryFn: inboundPhoneApi.list,
  });

  const { data: outboundCandidates = [] } = useQuery<OutboundNumberCandidate[]>({
    queryKey: ["outbound-candidates"],
    queryFn: inboundPhoneApi.outboundCandidates,
    enabled: showLink,
  });

  const buyMutation = useMutation({
    mutationFn: (phoneNumber: string) => inboundPhoneApi.buy({ phoneNumber, country: searchCountry }),
    onSuccess: () => {
      toast.success("Number purchased and registered with Vapi");
      qc.invalidateQueries({ queryKey: ["inbound-numbers"] });
      setShowSearch(false);
      setSearchResults([]);
    },
    onError: () => toast.error("Failed to purchase number"),
  });

  const importMutation = useMutation({
    mutationFn: () => inboundPhoneApi.import({
      phoneNumber: importPhone,
      provider: importProvider,
      twilioSid: importProvider === "twilio" ? importSid : undefined,
      plivoUuid: importProvider === "plivo" ? importPlivoUuid : undefined,
      country: importCountry,
    }),
    onSuccess: () => {
      toast.success("Number imported");
      qc.invalidateQueries({ queryKey: ["inbound-numbers"] });
      setShowImport(false);
      setImportPhone(""); setImportSid(""); setImportPlivoUuid(""); setImportCountry("CA");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to import number"),
  });

  const linkMutation = useMutation({
    mutationFn: () => inboundPhoneApi.linkOutbound(linkTenantPhoneId),
    onSuccess: () => {
      toast.success("Outbound number connected for inbound too");
      qc.invalidateQueries({ queryKey: ["inbound-numbers"] });
      qc.invalidateQueries({ queryKey: ["outbound-candidates"] });
      setShowLink(false);
      setLinkTenantPhoneId("");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Failed to connect number"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inboundPhoneApi.remove(id),
    onSuccess: () => {
      toast.success("Number released");
      qc.invalidateQueries({ queryKey: ["inbound-numbers"] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error("Failed to release number"),
  });

  const handleSearch = async () => {
    setSearching(true);
    try {
      const results = await inboundPhoneApi.search({
        country: searchCountry,
        areaCode: searchArea || undefined,
        contains: searchContains || undefined,
      });
      setSearchResults(results);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const activeAssistant = (num: InboundPhoneNumber) =>
    num.assistants?.find((a) => a.status === "active");

  return (
    <DashboardShell title="Phone Numbers" subtitle="Manage inbound phone numbers for your AI receptionist." sidebar={null}>
      <div className="space-y-4">
        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setShowSearch(true); setShowImport(false); setShowLink(false); }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Search className="h-4 w-4" /> Search Available Numbers
          </button>
          <button
            onClick={() => { setShowImport(true); setShowSearch(false); setShowLink(false); }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-secondary"
          >
            <Plus className="h-4 w-4" /> Import Existing Number
          </button>
          <button
            onClick={() => { setShowLink(true); setShowSearch(false); setShowImport(false); }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-secondary"
          >
            <Link2 className="h-4 w-4" /> Use an Outbound Number for Inbound
          </button>
        </div>

        {/* Search panel */}
        {showSearch && (
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Search Available Numbers</h3>
              <button onClick={() => { setShowSearch(false); setSearchResults([]); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Country</label>
                <select value={searchCountry} onChange={(e) => setSearchCountry(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm">
                  <option value="CA">Canada</option>
                  <option value="US">United States</option>
                  <option value="IN">India</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Area Code (optional)</label>
                <input value={searchArea} onChange={(e) => setSearchArea(e.target.value)} placeholder="e.g. 416" className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Pattern (optional)</label>
                <input value={searchContains} onChange={(e) => setSearchContains(e.target.value)} placeholder="e.g. 555" className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm" />
              </div>
            </div>
            <button onClick={handleSearch} disabled={searching} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 flex items-center gap-2">
              {searching ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching…</> : <><Search className="h-4 w-4" /> Search</>}
            </button>
            {searchResults.length > 0 && (
              <div className="border border-border rounded-md divide-y divide-border">
                {searchResults.map((n) => (
                  <div key={n.phoneNumber} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="font-mono text-sm font-medium">{n.phoneNumber}</div>
                      <div className="text-xs text-muted-foreground">{[n.locality, n.region].filter(Boolean).join(", ")}</div>
                    </div>
                    <button
                      onClick={() => buyMutation.mutate(n.phoneNumber)}
                      disabled={buyMutation.isPending}
                      className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-60"
                    >
                      {buyMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Buy"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import panel */}
        {showImport && (
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Import Existing Number</h3>
              <button onClick={() => setShowImport(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Provider</label>
              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => setImportProvider("twilio")}
                  className={`h-9 px-4 rounded-md text-sm font-medium border ${importProvider === "twilio" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary"}`}
                >
                  Twilio
                </button>
                <button
                  onClick={() => setImportProvider("plivo")}
                  className={`h-9 px-4 rounded-md text-sm font-medium border ${importProvider === "plivo" ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary"}`}
                >
                  Plivo
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone Number (E.164)</label>
                <input value={importPhone} onChange={(e) => setImportPhone(e.target.value)} placeholder="+14161234567" className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm" />
              </div>
              {importProvider === "twilio" ? (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Twilio SID</label>
                  <input value={importSid} onChange={(e) => setImportSid(e.target.value)} placeholder="PN..." className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm" />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Plivo Number UUID</label>
                  <input value={importPlivoUuid} onChange={(e) => setImportPlivoUuid(e.target.value)} placeholder="e.g. +919820000000" className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Country</label>
                <select value={importCountry} onChange={(e) => setImportCountry(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm">
                  <option value="CA">Canada</option>
                  <option value="US">United States</option>
                  <option value="IN">India</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => importMutation.mutate()}
              disabled={!importPhone || (importProvider === "twilio" ? !importSid : !importPlivoUuid) || importMutation.isPending}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 flex items-center gap-2"
            >
              {importMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : "Import Number"}
            </button>
          </div>
        )}

        {/* Link an existing outbound number panel */}
        {showLink && (
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Use an Outbound Number for Inbound Too</h3>
              <button onClick={() => setShowLink(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground">
              Reuses a number already set up for outbound calling (e.g. the callback business number) so people
              calling it back reach your AI receptionist. This does not create a new number — it connects the same
              one Vapi already knows about.
            </p>
            {outboundCandidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No eligible outbound numbers found — all of your outbound numbers are either already connected for
                inbound, or not yet registered with Vapi.
              </p>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Outbound number</label>
                  <select
                    value={linkTenantPhoneId}
                    onChange={(e) => setLinkTenantPhoneId(e.target.value)}
                    className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">— Select a number —</option>
                    {outboundCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.number} — {c.friendlyName} ({c.country} · {c.provider})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => linkMutation.mutate()}
                  disabled={!linkTenantPhoneId || linkMutation.isPending}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 flex items-center gap-2"
                >
                  {linkMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</> : <><Link2 className="h-4 w-4" /> Connect for Inbound</>}
                </button>
              </>
            )}
          </div>
        )}

        {/* Numbers list */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : numbers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Hash className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No phone numbers yet</p>
            <p className="text-sm mt-1">Search and buy a number, or import an existing one.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {numbers.map((num) => {
              const linked = activeAssistant(num);
              return (
                <div key={num.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-medium">{num.phoneNumber}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {num.country} · {num.provider}
                        {num.linkedTenantPhone && (
                          <span className="inline-flex items-center gap-1 text-accent">
                            <Link2 className="h-3 w-3" /> also used for outbound
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {linked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Active — {linked.agentName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        Not assigned
                      </span>
                    )}
                    {deleteConfirm === num.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-destructive">Release from Twilio & Vapi?</span>
                        <button
                          onClick={() => deleteMutation.mutate(num.id)}
                          disabled={deleteMutation.isPending}
                          className="h-7 px-2 rounded bg-destructive text-destructive-foreground text-xs"
                        >
                          {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="h-7 px-2 rounded border border-border text-xs">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(num.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
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
