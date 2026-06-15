import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { adminProfileApi } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAdmin } from "@/store/adminAuthSlice";
import { Lock, Eye, EyeOff, CheckCircle2, Calendar, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "My Profile · VoCallM Admin" }] }),
  component: ProfilePage,
});

const INPUT =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition placeholder:text-muted-foreground";

function ProfilePage() {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const adminStore = useAppSelector((s) => s.adminAuth);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin", "profile"],
    queryFn: adminProfileApi.get,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [infoReady, setInfoReady] = useState(false);

  if (profile && !infoReady) {
    setName(profile.name);
    setEmail(profile.email);
    setInfoReady(true);
  }

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const updateMut = useMutation({
    mutationFn: (data: Parameters<typeof adminProfileApi.update>[0]) =>
      adminProfileApi.update(data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin", "profile"] });
      if (adminStore.token) {
        dispatch(setAdmin({
          user: { name: updated.name, email: updated.email, role: "admin" },
          token: adminStore.token,
        }));
      }
      toast.success("Profile updated");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Update failed"),
  });

  const pwMut = useMutation({
    mutationFn: (data: Parameters<typeof adminProfileApi.update>[0]) =>
      adminProfileApi.update(data),
    onSuccess: () => {
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast.success("Password changed successfully");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Password change failed"),
  });

  const handleInfoSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data: Parameters<typeof adminProfileApi.update>[0] = {};
    if (name.trim() !== profile?.name) data.name = name.trim();
    if (email.trim() !== profile?.email) data.email = email.trim();
    if (!Object.keys(data).length) { toast("No changes to save"); return; }
    updateMut.mutate(data);
  };

  const handlePwSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    pwMut.mutate({ currentPassword: currentPw, newPassword: newPw });
  };

  const pwStrength =
    newPw.length >= 20 ? 4 : newPw.length >= 16 ? 3 : newPw.length >= 12 ? 2 : newPw.length >= 8 ? 1 : 0;
  const pwLabel = ["Too short", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const pwColor =
    pwStrength <= 1 ? "bg-destructive" : pwStrength === 2 ? "bg-warning" : "bg-success";

  const initials = profile?.name
    .split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2) ?? "AD";

  if (isLoading) {
    return (
      <DashboardShell sidebar={null} title="My Profile">
        <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell sidebar={null} title="My Profile" subtitle="Manage your account details and password">
      <div className="max-w-3xl space-y-6">

        {/* ── Profile hero card ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Gradient banner */}
          <div className="h-24 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
          <div className="px-6 pb-6">
            {/* Avatar overlapping banner */}
            <div className="-mt-10 mb-4 flex items-end justify-between">
              <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground inline-flex items-center justify-center text-2xl font-bold ring-4 ring-card shrink-0">
                {initials}
              </div>
              <button
                onClick={() => document.getElementById("name-input")?.focus()}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-xs font-medium hover:bg-secondary transition-colors"
              >
                <Pencil className="h-3 w-3" /> Edit profile
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold">{profile?.name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
                  Admin
                </span>
                {profile?.createdAt && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column grid for forms ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Account information */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Account information</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Update your name and email</p>
            </div>
            <form onSubmit={handleInfoSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full name</label>
                <input
                  id="name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className={INPUT}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className={INPUT}
                />
              </div>
              <button
                type="submit"
                disabled={updateMut.isPending}
                className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
              >
                {updateMut.isPending ? "Saving…" : <><CheckCircle2 className="h-4 w-4" /> Save changes</>}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Change password</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Minimum 8 characters</p>
            </div>
            <form onSubmit={handlePwSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className={`${INPUT} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New password</label>
                <input
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className={INPUT}
                />
                {newPw.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${i < pwStrength ? pwColor : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] ${pwStrength <= 1 ? "text-destructive" : pwStrength === 2 ? "text-warning" : "text-success"}`}>
                      {pwLabel}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm new password</label>
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  className={`${INPUT} ${confirmPw && confirmPw !== newPw ? "border-destructive focus:ring-destructive/25" : ""}`}
                />
                {confirmPw && confirmPw !== newPw && (
                  <p className="text-[11px] text-destructive">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={pwMut.isPending || (!!confirmPw && confirmPw !== newPw)}
                className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
              >
                {pwMut.isPending ? "Updating…" : <><Lock className="h-4 w-4" /> Update password</>}
              </button>
            </form>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
