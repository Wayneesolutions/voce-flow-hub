import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { waApi } from "@/lib/api";
import type { WaTemplateRequest, WaTemplateButton } from "@/lib/types";
import {
  FileText, Plus, Trash2, Loader2, CheckCircle2, Clock, XCircle,
  AlertCircle, Send, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/whatsapp/templates")({
  head: () => ({ meta: [{ title: "WA Templates · Client Portal" }] }),
  component: WaTemplates,
});

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  DRAFT:             { label: "Draft",              color: "bg-muted text-muted-foreground",             Icon: FileText     },
  PENDING_ADMIN:     { label: "Pending Review",     color: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock        },
  ADMIN_REJECTED:    { label: "Needs Changes",      color: "bg-rose-50 text-rose-700 border-rose-200",   Icon: XCircle      },
  SUBMITTED_TO_META: { label: "In Review (Meta)",   color: "bg-blue-50 text-blue-700 border-blue-200",   Icon: Send         },
  APPROVED:          { label: "Approved ✓",         color: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  META_REJECTED:     { label: "Rejected by Meta",   color: "bg-rose-50 text-rose-700 border-rose-200",   Icon: AlertCircle  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      <cfg.Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Preview pane ─────────────────────────────────────────────────────────────

function TemplatePreview({
  header, body, footer, buttons,
}: { header?: string; body: string; footer?: string; buttons: WaTemplateButton[] }) {
  if (!body) return (
    <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
      Preview will appear as you type
    </div>
  );
  return (
    <div className="flex justify-end">
      <div className="rounded-2xl rounded-tr-sm bg-[#dcf8c6] p-3 max-w-[240px] shadow-sm text-sm space-y-1">
        {header && <p className="font-semibold text-[13px]">{header}</p>}
        <p className="whitespace-pre-wrap leading-snug text-[13px]">{body}</p>
        {footer && <p className="text-[11px] text-gray-500 mt-1">{footer}</p>}
        {buttons.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-[#b5e0a0] pt-2">
            {buttons.map((b, i) => (
              <div key={i} className="text-center text-xs font-medium text-[#00a884]">{b.text}</div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-gray-400 text-right">10:00 AM</p>
      </div>
    </div>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

function CreateForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName]             = useState("");
  const [category, setCategory]     = useState("MARKETING");
  const [lang, setLang]             = useState("en");
  const [header, setHeader]         = useState("");
  const [body, setBody]             = useState("");
  const [footer, setFooter]         = useState("Reply STOP to opt out");
  const [buttons, setButtons]       = useState<WaTemplateButton[]>([]);
  const [open, setOpen]             = useState(true);

  const mut = useMutation({
    mutationFn: () => waApi.createTemplate({
      name, category, languageCode: lang,
      headerText: header || undefined,
      bodyText: body,
      footerText: footer || undefined,
      buttons: buttons.length > 0 ? buttons : undefined,
    }),
    onSuccess: () => {
      toast.success("Template submitted for admin review");
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function addButton() {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { type: "QUICK_REPLY", text: "" }]);
  }

  function insertVar() {
    const next = (body.match(/\{\{(\d+)\}\}/g)?.length ?? 0) + 1;
    setBody(b => b + `{{${next}}}`);
  }

  return (
    <div className="rounded-xl border border-border bg-card mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          New Template Request
        </h2>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-border pt-4 grid lg:grid-cols-2 gap-6">
          {/* ── Left: form ── */}
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Template Name <span className="text-destructive">*</span>
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                  placeholder="my_template_name"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">lowercase, underscores only</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Language</label>
                <select
                  value={lang}
                  onChange={e => setLang(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Header <span className="opacity-60">(optional)</span></label>
              <input
                value={header}
                onChange={e => setHeader(e.target.value)}
                placeholder="Bold heading line"
                maxLength={60}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Body <span className="text-destructive">*</span>
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={`Hi {{1}}, this is Simran from Wayne E Solutions!\n\nWe help local businesses grow online.\n\nWould you be open to a quick 15-min chat?`}
                rows={5}
                maxLength={1024}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <button
                  type="button"
                  onClick={insertVar}
                  className="text-xs text-primary hover:underline"
                >
                  + Add variable (e.g. contact name)
                </button>
                <span className="text-xs text-muted-foreground">{body.length}/1024</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Footer <span className="opacity-60">(optional)</span></label>
              <input
                value={footer}
                onChange={e => setFooter(e.target.value)}
                placeholder="Reply STOP to opt out"
                maxLength={60}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground">Quick Reply Buttons <span className="opacity-60">(max 3)</span></label>
                {buttons.length < 3 && (
                  <button type="button" onClick={addButton} className="text-xs text-primary hover:underline">+ Add button</button>
                )}
              </div>
              {buttons.map((btn, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    value={btn.text}
                    onChange={e => {
                      const next = [...buttons];
                      next[i] = { ...next[i], text: e.target.value };
                      setButtons(next);
                    }}
                    placeholder={`Button ${i + 1} label`}
                    maxLength={25}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setButtons(buttons.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => mut.mutate()}
              disabled={mut.isPending || !name.trim() || !body.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit for Admin Review
            </button>
          </div>

          {/* ── Right: preview ── */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">Preview</p>
            <div className="rounded-xl border border-border bg-[#e5ddd5] p-4 min-h-[200px]">
              <TemplatePreview header={header} body={body} footer={footer} buttons={buttons} />
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Use <code className="bg-muted px-1 rounded">{"{{1}}"}</code>,{" "}
              <code className="bg-muted px-1 rounded">{"{{2}}"}</code> etc. for variables filled per-contact.
              Admin reviews your template, then submits to Meta for approval (usually minutes).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function WaTemplates() {
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<WaTemplateRequest[]>({
    queryKey: ["wa-templates"],
    queryFn:  waApi.getTemplates,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => waApi.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wa-templates"] });
      toast.success("Template deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell
      title="WhatsApp Templates"
      description="Submit message templates for admin review, then send them via campaigns once approved by Meta."
    >
      <CreateForm onSuccess={() => qc.invalidateQueries({ queryKey: ["wa-templates"] })} />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            My Templates
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center px-6">
            <FileText className="h-8 w-8 mb-3 opacity-40" />
            <p className="font-medium text-sm">No templates yet</p>
            <p className="text-xs mt-1 max-w-sm">Submit a template above — once approved by Meta, use its name in a campaign.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {templates.map(t => (
              <div key={t.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm font-mono">{t.name}</p>
                      <StatusBadge status={t.status} />
                      <span className="text-xs text-muted-foreground">{t.category} · {t.languageCode}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.bodyText}</p>
                    {t.adminNote && (
                      <p className="text-xs text-amber-600 mt-1">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Admin note: {t.adminNote}
                      </p>
                    )}
                    {t.metaRejectionReason && (
                      <p className="text-xs text-rose-600 mt-1">
                        <XCircle className="h-3 w-3 inline mr-1" />
                        Meta: {t.metaRejectionReason}
                      </p>
                    )}
                    {t.status === "APPROVED" && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Use <code className="bg-muted px-1 rounded">{t.name}</code> as the template name in your campaign.
      </p>
                    )}
                  </div>
                  {["ADMIN_REJECTED", "META_REJECTED"].includes(t.status) && (
                    <button
                      onClick={() => {
                        if (!confirm(`Delete template "${t.name}"?`)) return;
                        deleteMut.mutate(t.id);
                      }}
                      disabled={deleteMut.isPending}
                      className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
