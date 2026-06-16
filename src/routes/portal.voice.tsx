import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { tenantApi, portalVoiceApi } from "@/lib/api";
import type { TenantMe } from "@/lib/api";
import {
  Mic,
  Upload,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertTriangle,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/voice")({
  head: () => ({ meta: [{ title: "My Voice · Client Portal" }] }),
  component: VoicePage,
});

const TIPS = [
  "Record in a quiet room — no fan, music, or background chatter",
  "Speak naturally at your normal pace and tone",
  "30 seconds minimum; 1–3 minutes gives a much better clone",
  "Any content works — read from a book, describe your service, tell a story",
  "Avoid long pauses, coughing, or loud breath sounds",
];

const ACCEPTED = ".mp3,.wav,.m4a,.ogg,.webm,audio/*";

function VoicePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: me, isLoading } = useQuery<TenantMe>({
    queryKey: ["tenant-me"],
    queryFn: tenantApi.me,
  });

  const hasVoice = !!me?.clonedVoiceId;

  const handleUpload = async () => {
    if (!file || !name.trim()) return;
    setUploading(true);
    try {
      await portalVoiceApi.upload(file, name.trim());
      qc.invalidateQueries({ queryKey: ["tenant-me"] });
      toast.success("Voice cloned! All new calls will use your voice.");
      setFile(null);
      setName("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Cloning failed. Check your ElevenLabs plan allows voice cloning.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await portalVoiceApi.remove();
      qc.invalidateQueries({ queryKey: ["tenant-me"] });
      toast.success("Voice removed");
      setConfirmDelete(false);
    } catch {
      toast.error("Failed to remove voice");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardShell
      sidebar={null}
      title="My Voice"
      subtitle="Upload a recording — your AI agent will sound exactly like you on every call."
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Current voice status */}
          {hasVoice && (
            <div className="rounded-lg border border-success/30 bg-success/5 p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-success">Voice active</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground">{me?.clonedVoiceName}</span>
                    {" "}· ID: <span className="font-mono text-xs">{me?.clonedVoiceId}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    All outbound calls use this voice automatically — no extra setup needed.
                  </div>
                </div>
              </div>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="h-8 px-3 rounded-md border border-destructive/30 text-destructive text-xs hover:bg-destructive/5 shrink-0"
                >
                  Remove
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">Sure?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs disabled:opacity-60"
                  >
                    {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="h-8 px-3 rounded-md border border-border text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Recording tips */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 font-semibold mb-3">
              <Volume2 className="h-4 w-4 text-accent" />
              Recording tips for the best clone
            </div>
            <ul className="space-y-1.5">
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent/60 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Upload form */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="font-semibold">
              {hasVoice ? "Replace voice" : "Upload your voice recording"}
            </div>

            <div>
              <label className="text-sm font-medium">Voice name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah · Sales"
                className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                A label so you can identify it later in your ElevenLabs dashboard
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Audio file</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`mt-1.5 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                  file
                    ? "border-accent/40 bg-accent/5"
                    : "border-border hover:border-accent/40 hover:bg-muted/20"
                }`}
              >
                {file ? (
                  <div className="space-y-1">
                    <Mic className="h-8 w-8 mx-auto text-accent" />
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB · click to change
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div className="text-sm font-medium">Click to select audio file</div>
                    <div className="text-xs text-muted-foreground">
                      MP3, WAV, M4A, OGG, WebM · max 50 MB
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            {hasVoice && (
              <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/20 px-3 py-2.5 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                This will replace your current voice. Active campaigns will use the new voice on the next call.
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || !name.trim() || uploading}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cloning voice… this takes ~30 seconds
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  {hasVoice ? "Replace voice" : "Clone my voice"}
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Voice cloning requires an ElevenLabs account with Instant Voice Cloning enabled
            (Starter plan or above). Your audio is processed by ElevenLabs and not stored on our servers.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
