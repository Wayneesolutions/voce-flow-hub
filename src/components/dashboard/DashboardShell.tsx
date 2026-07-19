import { type ReactNode, useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, Search, LogOut, User, ChevronDown, FileCheck2, UserPlus, X, UserCog, Users, Phone } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAdmin } from "@/store/adminAuthSlice";
import { clearUser } from "@/store/userAuthSlice";
import { adminNotificationsApi, adminSearchApi, type AdminSearchResult } from "@/lib/api";
import type { AdminNotification } from "@/lib/types";

interface Props {
  sidebar: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

// ── Global search ─────────────────────────────────────────────────────────────
function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useClickOutside(wrapRef, () => setOpen(false));

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const data = await adminSearchApi.search(q);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const totalResults = results
    ? results.clients.length + results.scripts.length + results.leads.length
    : 0;

  const hasResults = totalResults > 0;

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  }

  function go(path: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    navigate({ to: path as any });
  }

  const statusColor = (s: string) =>
    s === "ACTIVE" || s === "APPROVED" ? "text-success" :
    s === "SUSPENDED" || s === "REJECTED" ? "text-destructive" : "text-warning";

  return (
    <div ref={wrapRef} className="relative flex items-center gap-2">
      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder="Search clients, scripts, leads…"
        className="bg-transparent outline-none text-sm w-72 placeholder:text-muted-foreground"
      />
      {query && (
        <button onClick={() => { setQuery(""); setResults(null); }} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && query.length >= 2 && (
        <div className="absolute left-0 top-8 w-[420px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Searching…</div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No results for "{query}"</div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
              {results!.clients.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/40">
                    Clients
                  </div>
                  {results!.clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => go("/admin/clients")}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                    >
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.ownerEmail}</div>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase ${statusColor(c.status)}`}>{c.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {results!.scripts.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/40">
                    Scripts
                  </div>
                  {results!.scripts.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => go("/admin/scripts")}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                    >
                      <div className="h-7 w-7 rounded-full bg-warning/10 text-warning inline-flex items-center justify-center shrink-0">
                        <FileCheck2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{s.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{s.tenant.name}</div>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase ${statusColor(s.status)}`}>{s.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {results!.leads.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/40">
                    Leads
                  </div>
                  {results!.leads.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => go("/admin/clients")}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                    >
                      <div className="h-7 w-7 rounded-full bg-primary/5 text-primary inline-flex items-center justify-center shrink-0">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{l.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {l.phone} {l.campaign?.tenant.name ? `· ${l.campaign.tenant.name}` : ""}
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase ${statusColor(l.status)}`}>{l.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Logout confirmation modal ─────────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
    >
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon header */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
          <div className="h-14 w-14 rounded-full bg-destructive/10 inline-flex items-center justify-center mb-4">
            <LogOut className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="font-semibold text-base">Sign out?</h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            You'll be returned to the login page. Any unsaved changes will be lost.
          </p>
        </div>

        {/* Actions */}
        <div className="flex border-t border-border">
          <button
            onClick={onCancel}
            className="flex-1 h-12 text-sm font-medium text-foreground hover:bg-secondary transition-colors border-r border-border"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Admin header ──────────────────────────────────────────────────────────────
function AdminHeader() {
  const admin = useAppSelector((s) => s.adminAuth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(bellRef, () => setBellOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const { data: notifs } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: adminNotificationsApi.get,
    refetchInterval: 60_000,
    enabled: !!admin,
  });

  const unread = notifs?.unreadCount ?? 0;

  const handleLogout = () => {
    dispatch(clearAdmin());
    navigate({ to: "/admin/login" });
  };

  const initials = admin?.name
    ?.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2) ?? "AD";

  const iconClass = (type: AdminNotification["type"]) =>
    type === "SCRIPT_REVIEW"
      ? "bg-warning/10 text-warning"
      : type === "NEW_CLIENT"
      ? "bg-success/10 text-success"
      : "bg-destructive/10 text-destructive";

  const IconEl = ({ type }: { type: AdminNotification["type"] }) =>
    type === "SCRIPT_REVIEW" ? <FileCheck2 className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />;

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Bell */}
      <div ref={bellRef} className="relative">
        <button
          onClick={() => { setBellOpen((v) => !v); setProfileOpen(false); }}
          className="relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-secondary transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white inline-flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {bellOpen && (
          <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">Notifications</span>
              {notifs && notifs.recentBookings > 0 && (
                <span className="text-xs text-success font-medium">
                  {notifs.recentBookings} meeting{notifs.recentBookings !== 1 ? "s" : ""} booked today
                </span>
              )}
            </div>

            {!notifs || notifs.items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                All caught up!
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifs.items.map((n) => (
                  <Link
                    key={n.id}
                    to={n.link as any}
                    onClick={() => setBellOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
                  >
                    <span className={`mt-0.5 h-6 w-6 rounded-full inline-flex items-center justify-center shrink-0 ${iconClass(n.type)}`}>
                      <IconEl type={n.type} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{n.body}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 mt-1">{timeAgo(n.at)}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="border-t border-border px-4 py-2.5 text-center">
              <Link
                to="/admin/scripts"
                onClick={() => setBellOpen(false)}
                className="text-xs text-primary font-medium hover:underline"
              >
                View all pending scripts →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => { setProfileOpen((v) => !v); setBellOpen(false); }}
          className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-secondary transition-colors"
        >
          <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">{admin?.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-11 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            {/* Admin info */}
            <div className="px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold truncate">{admin?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{admin?.email}</div>
              <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Admin
              </span>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                to="/admin/profile"
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <UserCog className="h-4 w-4 text-muted-foreground" />
                My profile
              </Link>
              <button
                onClick={() => { setProfileOpen(false); setLogoutModal(true); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {logoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setLogoutModal(false)}
        />
      )}
    </div>
  );
}

// ── Client portal header ──────────────────────────────────────────────────────
function ClientHeader() {
  const client = useAppSelector((s) => s.userAuth.user);
  const tenant = useAppSelector((s) => s.userAuth.tenant);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(profileRef, () => setProfileOpen(false));

  const handleLogout = () => {
    dispatch(clearUser());
    navigate({ to: "/login" });
  };

  const initials = client?.name
    ?.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2) ?? "ME";

  const accent = tenant?.primaryColor ?? "#7c3aed";

  return (
    <div className="flex items-center gap-2">
      <div ref={profileRef} className="relative">
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-secondary transition-colors"
        >
          <div
            className="h-7 w-7 rounded-full inline-flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: accent }}
          >
            {initials}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-11 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold truncate">{client?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{client?.email}</div>
              {tenant && (
                <div className="text-xs text-muted-foreground truncate mt-0.5">{tenant.name}</div>
              )}
            </div>
            <div className="py-1">
              <Link
                to="/portal/settings"
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                Account settings
              </Link>
              <button
                onClick={() => { setProfileOpen(false); setLogoutModal(true); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {logoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setLogoutModal(false)}
        />
      )}
    </div>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────
export function DashboardShell({ sidebar, title, subtitle, actions, children }: Props) {
  const isAdmin = useAppSelector((s) => !!s.adminAuth.user);

  return (
    <div className="min-h-screen bg-muted/40">
      {sidebar}
      <div className="lg:pl-60">
        <header className="hidden lg:flex sticky top-0 z-10 h-16 items-center justify-between border-b border-border bg-background/90 backdrop-blur px-8">
          <div />
          {isAdmin ? <AdminHeader /> : <ClientHeader />}
        </header>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
