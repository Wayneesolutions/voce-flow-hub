import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  inboundAssistantApi,
  inboundPhoneApi,
  tenantApi,
  voicesApi,
  type InboundAssistant,
  type InboundAssistantInput,
  type ElevenLabsVoice,
} from "@/lib/api";
import {
  Bot, Plus, ChevronRight, CheckCircle2, AlertCircle, Loader2,
  Pencil, Play, Pause, X, Phone,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/inbound/receptionist")({
  head: () => ({ meta: [{ title: "Inbound Receptionist · Portal" }] }),
  component: ReceptionistPage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "pa", label: "Punjabi" },
  { value: "hinglish", label: "Hinglish" },
  { value: "es", label: "Spanish" },
];
const BUSINESS_TYPES = [
  "Restaurant", "Salon / Beauty", "HVAC", "Law Firm", "Real Estate", "General",
];

function emptyForm(): InboundAssistantInput & { businessHours: Record<string, string> } {
  return {
    agentName: "Alex",
    language: "en",
    voiceId: "",
    agentGender: "female",
    businessName: "",
    businessType: "",
    servicesInfo: "",
    faqText: "",
    businessHours: Object.fromEntries(DAYS.map((d) => [d, "9am–6pm"])),
    transferNumber: "",
    transferMessage: "Please hold, connecting you now.",
    bookingUrl: "",
    maxCallDuration: 300,
  };
}

// ── Wizard Form ───────────────────────────────────────────────────────────────

function WizardModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: InboundAssistant;
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const { data: phones = [] }  = useQuery({ queryKey: ["inbound-numbers"],  queryFn: inboundPhoneApi.list });
  const { data: tenant }       = useQuery({ queryKey: ["tenant-me"],         queryFn: tenantApi.me });
  const { data: voices = [] }  = useQuery({ queryKey: ["voices"],            queryFn: voicesApi.list });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<InboundAssistantInput & { businessHours: Record<string, string> }>(
    initial
      ? {
          agentName:       initial.agentName,
          language:        initial.language,
          voiceId:         initial.voiceId || "",
          agentGender:     initial.agentGender,
          businessName:    initial.businessName,
          businessType:    initial.businessType || "",
          servicesInfo:    initial.servicesInfo || "",
          faqText:         initial.faqText || "",
          businessHours:   (initial.businessHours as Record<string, string>) || Object.fromEntries(DAYS.map((d) => [d, "9am–6pm"])),
          transferNumber:  initial.transferNumber || "",
          transferMessage: initial.transferMessage || "Please hold, connecting you now.",
          bookingUrl:      initial.bookingUrl || "",
          maxCallDuration: initial.maxCallDuration || 300,
        }
      : emptyForm()
  );
  const [phoneNumberId, setPhoneNumberId] = useState(initial?.phoneNumberId || "");
  const [activateNow, setActivateNow] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const setHours = (day: string, val: string) =>
    setForm((f) => ({ ...f, businessHours: { ...f.businessHours, [day]: val } }));

  const handleSave = async () => {
    if (!form.businessName.trim()) { toast.error("Business name is required"); return; }
    setSaving(true);
    try {
      let assistant: InboundAssistant;
      if (initial) {
        assistant = await inboundAssistantApi.update(initial.id, form);
      } else {
        assistant = await inboundAssistantApi.create(form);
      }
      if (activateNow && phoneNumberId) {
        await inboundAssistantApi.activate(assistant.id, phoneNumberId);
        toast.success("Receptionist is LIVE! Calls to that number will be answered.");
      } else {
        toast.success(initial ? "Receptionist updated" : "Receptionist saved as draft");
      }
      qc.invalidateQueries({ queryKey: ["inbound-assistants"] });
      onSaved();
    } catch {
      toast.error("Failed to save receptionist");
    } finally {
      setSaving(false);
    }
  };

  const TOTAL_STEPS = 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}>
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold text-base">{initial ? "Edit Receptionist" : "New AI Receptionist"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step {step} of {TOTAL_STEPS}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1 px-6 pt-3 shrink-0">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <h3 className="font-medium text-sm">Business Info</h3>
              <Field label="Business Name *">
                <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. Maple Plumbing Co." className={INPUT} />
              </Field>
              <Field label="Business Type">
                <select value={form.businessType || ""} onChange={(e) => set("businessType", e.target.value)} className={INPUT}>
                  <option value="">Select type…</option>
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Services / What you offer">
                <textarea value={form.servicesInfo || ""} onChange={(e) => set("servicesInfo", e.target.value)} rows={4} placeholder="Describe your services so the AI can answer questions…" className={TEXTAREA} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="font-medium text-sm">Agent Personality</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Agent Name">
                  <input value={form.agentName} onChange={(e) => set("agentName", e.target.value)} placeholder="Alex" className={INPUT} />
                </Field>
                <Field label="Language">
                  <select value={form.language} onChange={(e) => set("language", e.target.value)} className={INPUT}>
                    {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Agent Gender">
                <div className="flex gap-3 mt-1">
                  {["female", "male"].map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={form.agentGender === g} onChange={() => set("agentGender", g)} className="accent-primary" />
                      <span className="text-sm capitalize">{g}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <VoicePicker
                value={form.voiceId || ""}
                onChange={(id) => set("voiceId", id)}
                gender={form.agentGender}
                clonedVoice={
                  tenant?.clonedVoiceId
                    ? { id: tenant.clonedVoiceId, name: tenant.clonedVoiceName || "My Cloned Voice" }
                    : null
                }
                voices={voices}
              />
              <div className="rounded-md bg-muted/40 border border-border px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Preview greeting</p>
                <p className="text-sm italic">
                  {greetingPreview(form.agentName || "Alex", form.language, form.agentGender, form.businessName || "your business")}
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="font-medium text-sm">Call Handling</h3>
              <Field label="Business Hours">
                <div className="mt-1 space-y-2">
                  {DAYS.map((d) => (
                    <div key={d} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-8 text-muted-foreground">{d}</span>
                      <input
                        value={form.businessHours[d] || ""}
                        onChange={(e) => setHours(d, e.target.value)}
                        placeholder="9am–6pm or Closed"
                        className="flex-1 h-8 rounded-md border border-border bg-background px-3 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </Field>
              <Field label="FAQ / Knowledge Base">
                <textarea
                  value={form.faqText || ""}
                  onChange={(e) => set("faqText", e.target.value)}
                  rows={5}
                  placeholder="Q: Do you offer emergency services?\nA: Yes, we are available 24/7 for emergencies."
                  className={TEXTAREA}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Transfer to Human (E.164, optional)">
                  <input value={form.transferNumber || ""} onChange={(e) => set("transferNumber", e.target.value)} placeholder="+14161234567" className={INPUT} />
                </Field>
                <Field label="Booking URL (optional)">
                  <input value={form.bookingUrl || ""} onChange={(e) => set("bookingUrl", e.target.value)} placeholder="https://cal.com/your-link" className={INPUT} />
                </Field>
              </div>
              <Field label="Max Call Duration (seconds)">
                <input type="number" value={form.maxCallDuration || 300} onChange={(e) => set("maxCallDuration", parseInt(e.target.value) || 300)} className={INPUT} />
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="font-medium text-sm">Review & Activate</h3>
              <ReviewRow label="Business" value={form.businessName} />
              <ReviewRow label="Type" value={form.businessType || "—"} />
              <ReviewRow label="Agent" value={`${form.agentName} (${form.agentGender})`} />
              <ReviewRow label="Language" value={LANGUAGES.find((l) => l.value === form.language)?.label || form.language} />
              <ReviewRow label="Transfer" value={form.transferNumber || "Disabled"} />
              <ReviewRow label="Booking" value={form.bookingUrl || "Disabled"} />
              <ReviewRow label="Max duration" value={`${form.maxCallDuration}s`} />

              <Field label="Assign Phone Number">
                <select value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} className={INPUT}>
                  <option value="">Select a number…</option>
                  {phones.map((p) => (
                    <option key={p.id} value={p.id}>{p.phoneNumber} ({p.country})</option>
                  ))}
                </select>
                {phones.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">No phone numbers yet — go to Phone Numbers to add one.</p>
                )}
              </Field>

              <div className="flex gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={activateNow} onChange={(e) => setActivateNow(e.target.checked)} className="accent-primary" />
                  <span className="text-sm">Activate immediately (go live now)</span>
                </label>
              </div>
              {activateNow && !phoneNumberId && (
                <p className="text-xs text-warning">Select a phone number to activate.</p>
              )}
            </>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="h-9 px-4 rounded-md border border-border text-sm disabled:opacity-40"
          >
            Back
          </button>
          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !form.businessName.trim()}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-60"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || (activateNow && !phoneNumberId)}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : activateNow ? <><Play className="h-4 w-4" /> Activate Now</> : "Save as Draft"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Voice Picker ──────────────────────────────────────────────────────────────

const CUSTOM_ID = "__custom__";

function VoicePicker({
  value, onChange, gender, clonedVoice, voices,
}: {
  value: string;
  onChange: (id: string) => void;
  gender: string;
  clonedVoice: { id: string; name: string } | null;
  voices: ElevenLabsVoice[];
}) {
  // Decide whether current value is a "known" option or a custom typed ID
  const knownIds = new Set([
    "",
    ...(clonedVoice ? [clonedVoice.id] : []),
    ...voices.map((v) => v.id),
  ]);
  const isCustom = value !== "" && !knownIds.has(value);
  const selectValue = isCustom ? CUSTOM_ID : value;

  const presets = voices.filter(
    (v) => !v.gender || v.gender.toLowerCase().includes(gender.toLowerCase())
  );

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === CUSTOM_ID) {
      onChange(""); // will show text input; user types their own
    } else {
      onChange(val);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Voice</label>
      <select value={selectValue} onChange={handleSelect} className={INPUT}>
        <option value="">Default (AI picks best voice)</option>

        {clonedVoice && (
          <option value={clonedVoice.id}>
            ⭐ My Cloned Voice — {clonedVoice.name}
          </option>
        )}

        {presets.length > 0 && (
          <optgroup label={`Preset ${gender} voices`}>
            {presets.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}{v.accent ? ` · ${v.accent}` : ""}
              </option>
            ))}
          </optgroup>
        )}

        <option value={CUSTOM_ID}>Custom voice ID…</option>
      </select>

      {(selectValue === CUSTOM_ID || isCustom) && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste ElevenLabs voice ID"
          className={INPUT}
        />
      )}

      {value && value !== "" && !isCustom && voices.find((v) => v.id === value)?.previewUrl && (
        <audio
          key={value}
          src={voices.find((v) => v.id === value)!.previewUrl!}
          controls
          className="w-full h-8 mt-1"
        />
      )}
    </div>
  );
}

// ── Main list page ─────────────────────────────────────────────────────────────

function ReceptionistPage() {
  const qc = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);
  const [editing, setEditing] = useState<InboundAssistant | undefined>();

  const { data: assistants = [], isLoading } = useQuery({
    queryKey: ["inbound-assistants"],
    queryFn:  inboundAssistantApi.list,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => inboundAssistantApi.deactivate(id),
    onSuccess: () => {
      toast.success("Receptionist paused");
      qc.invalidateQueries({ queryKey: ["inbound-assistants"] });
    },
    onError: () => toast.error("Failed to pause"),
  });

  return (
    <DashboardShell
      title="Inbound Receptionist"
      subtitle="AI agents that answer your inbound calls automatically."
      sidebar={null}
    >
      <div className="space-y-4">
        <div>
          <button
            onClick={() => { setEditing(undefined); setShowWizard(true); }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New Receptionist
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : assistants.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No receptionists yet</p>
            <p className="text-sm mt-1">Create one to start answering inbound calls automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assistants.map((a) => (
              <AssistantCard
                key={a.id}
                assistant={a}
                onEdit={() => { setEditing(a); setShowWizard(true); }}
                onPause={() => deactivateMutation.mutate(a.id)}
                pausing={deactivateMutation.isPending && deactivateMutation.variables === a.id}
              />
            ))}
          </div>
        )}
      </div>

      {showWizard && (
        <WizardModal
          initial={editing}
          onClose={() => { setShowWizard(false); setEditing(undefined); }}
          onSaved={() => { setShowWizard(false); setEditing(undefined); }}
        />
      )}
    </DashboardShell>
  );
}

function AssistantCard({
  assistant, onEdit, onPause, pausing,
}: {
  assistant: InboundAssistant;
  onEdit: () => void;
  onPause: () => void;
  pausing: boolean;
}) {
  const statusColor = {
    active: "bg-green-500/10 text-green-600",
    draft:  "bg-muted text-muted-foreground",
    paused: "bg-amber-500/10 text-amber-600",
  }[assistant.status] || "bg-muted text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="h-10 w-10 rounded-full bg-primary/10 inline-flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{assistant.businessName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>{assistant.agentName}</span>
            <span>·</span>
            <span>{LANGUAGES.find((l) => l.value === assistant.language)?.label || assistant.language}</span>
            {assistant.phoneNumber && (
              <>
                <span>·</span>
                <Phone className="h-3 w-3" />
                <span className="font-mono">{assistant.phoneNumber.phoneNumber}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          {assistant.status === "active" && <CheckCircle2 className="h-3 w-3" />}
          {assistant.status === "draft"  && <AlertCircle  className="h-3 w-3" />}
          {assistant.status === "paused" && <Pause        className="h-3 w-3" />}
          {assistant.status.charAt(0).toUpperCase() + assistant.status.slice(1)}
        </span>
        <button onClick={onEdit} className="text-muted-foreground hover:text-foreground transition-colors" title="Edit">
          <Pencil className="h-4 w-4" />
        </button>
        {assistant.status === "active" && (
          <button onClick={onPause} disabled={pausing} className="text-muted-foreground hover:text-amber-600 transition-colors" title="Pause">
            {pausing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-xs truncate">{value}</span>
    </div>
  );
}

function greetingPreview(name: string, lang: string, _gender: string, business: string) {
  const openers: Record<string, string> = {
    en:       `"Thank you for calling ${business}, this is ${name}. How can I help you today?"`,
    hi:       `"Namaste! Aapka ${business} mein swagat hai. Main ${name} bol raha hoon."`,
    pa:       `"Sat Sri Akal! ${business} vich aapda swagat hai. Main ${name} haan."`,
    hinglish: `"Hello! Welcome to ${business}. Main ${name} bol raha hoon."`,
    es:       `"¡Gracias por llamar a ${business}! Soy ${name}. ¿En qué le puedo ayudar?"`,
  };
  return openers[lang] || openers.en;
}

const INPUT    = "w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
const TEXTAREA = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none";
