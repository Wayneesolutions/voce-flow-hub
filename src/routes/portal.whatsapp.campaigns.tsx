import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { waApi } from "@/lib/api";
import type { WaCampaign, WaContactList } from "@/lib/types";
import {
  Megaphone,
  Send,
  Plus,
  Loader2,
  CheckCircle2,
  X,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/portal/whatsapp/campaigns")({
  head: () => ({ meta: [{ title: "WhatsApp Campaigns · Client Portal" }] }),
  component: WhatsAppCampaigns,
});

function WhatsAppCampaigns() {
  const qc = useQueryClient();

  // Create campaign form state
  const [showCreate, setShowCreate]       = useState(false);
  const [name, setName]                   = useState("");
  const [templateName, setTemplateName]   = useState("");
  const [languageCode, setLanguageCode]   = useState("en");

  // Send campaign state
  const [sendCampaignId, setSendCampaignId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [sendResult, setSendResult]         = useState<{ sent: number; failed: number; attempted: number } | null>(null);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<WaCampaign[]>({
    queryKey: ["wa-campaigns"],
    queryFn:  waApi.getCampaigns,
    staleTime: 15_000,
  });

  const { data: lists } = useQuery<WaContactList[]>({
    queryKey: ["wa-lists"],
    queryFn:  waApi.getLists,
    staleTime: 15_000,
  });

  const createMutation = useMutation({
    mutationFn: () => waApi.createCampaign({ name: name.trim(), templateName: templateName.trim(), languageCode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wa-campaigns"] });
      setShowCreate(false);
      setName(""); setTemplateName(""); setLanguageCode("en");
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ campaignId, listId }: { campaignId: string; listId: string }) =>
      waApi.sendCampaign(campaignId, listId),
    onSuccess: (data) => {
      setSendResult({ sent: data.sent, failed: data.failed, attempted: data.attempted });
      qc.invalidateQueries({ queryKey: ["wa-campaigns"] });
    },
  });

  function openSendModal(campaignId: string) {
    setSendCampaignId(campaignId);
    setSelectedListId(lists?.[0]?.id ?? "");
    setSendResult(null);
  }

  return (
    <DashboardShell
      title="WhatsApp Campaigns"
      description="Create campaigns using Meta-approved templates and send to opted-in contacts."
    >
      {/* ── Create Campaign Panel ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            New Campaign
          </h2>
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Create
            </button>
          )}
        </div>

        {showCreate && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Campaign Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. June Promo 2026"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Meta Template Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. promo_summer_v1"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Language Code
              </label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="en">English (en)</option>
                <option value="en_US">English US (en_US)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="ar">Arabic (ar)</option>
                <option value="pt_BR">Portuguese BR (pt_BR)</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex items-center gap-2">
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !name.trim() || !templateName.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Campaign
              </button>
              <button
                onClick={() => { setShowCreate(false); setName(""); setTemplateName(""); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>

            <p className="sm:col-span-3 text-xs text-muted-foreground">
              The template name must exactly match an <strong>approved</strong> template in your Meta WhatsApp Business account.
              Only approved templates can be used for business-initiated messages.
            </p>

            {createMutation.isError && (
              <p className="sm:col-span-3 text-xs text-destructive">
                {(createMutation.error as Error).message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Campaign List ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-muted-foreground" />
            All Campaigns
          </h2>
        </div>

        {campaignsLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : !campaigns?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
            <MessageSquare className="h-8 w-8 mb-3 opacity-40" />
            <p className="font-medium text-sm">No campaigns yet</p>
            <p className="text-xs mt-1">Create your first campaign above.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {campaigns.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Template: <code className="bg-muted px-1 rounded">{c.templateName}</code>
                    {" · "}lang: <code className="bg-muted px-1 rounded">{c.languageCode}</code>
                    {" · "}created {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                  {c._count && (
                    <p className="text-xs text-muted-foreground">
                      {c._count.messages.toLocaleString()} messages sent
                    </p>
                  )}
                </div>

                <button
                  onClick={() => openSendModal(c.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Send Modal ────────────────────────────────────────────────────── */}
      {sendCampaignId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
        >
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Send Campaign</h3>
                <button onClick={() => { setSendCampaignId(null); setSendResult(null); }}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {sendResult ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold">Campaign sent</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {sendResult.sent} sent · {sendResult.failed} failed · {sendResult.attempted} attempted
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Only opted-in contacts with consent received messages.
                  </p>
                  <button
                    onClick={() => { setSendCampaignId(null); setSendResult(null); }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Select Contact List
                    </label>
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— choose a list —</option>
                      {lists?.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.totalContacts} contacts)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 mb-4">
                    Only contacts with <strong>OPTED_IN</strong> status and <strong>optedOut = false</strong> will
                    receive messages. This is enforced in the backend and cannot be bypassed.
                  </div>

                  {sendMutation.isError && (
                    <p className="text-xs text-destructive mb-3">
                      {(sendMutation.error as Error).message}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!selectedListId) return;
                        sendMutation.mutate({ campaignId: sendCampaignId, listId: selectedListId });
                      }}
                      disabled={sendMutation.isPending || !selectedListId}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {sendMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                      ) : (
                        <><Send className="h-4 w-4" /> Send Now</>
                      )}
                    </button>
                    <button
                      onClick={() => { setSendCampaignId(null); setSendResult(null); }}
                      className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
