import axios from "axios";
import type {
  Lead,
  Call,
  Script,
  Campaign,
  Meeting,
  UsageLog,
  Tenant,
  TenantPhone,
  AdminStats,
  AdminBillingSummary,
  BillingSummary,
  CallStats,
  LeadStatus,
} from "./types";

// ── Client HTTP instance (uses client JWT from localStorage) ─────────────────
const http = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("vfh_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Admin HTTP instance (uses admin JWT from localStorage) ───────────────────
const adminHttp = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

adminHttp.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("vfh_admin_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  // Client (tenant user) login — backend: POST /api/auth/tenant/login
  tenantLogin: async (
    email: string,
    password: string,
  ): Promise<{ token: string; user: { id: string; name: string; email: string; role: string }; tenant: { id: string; name: string; slug: string; logoUrl?: string; primaryColor: string; plan?: { id: string; name: string; price: number; minutesIncluded: number } | null } }> => {
    const res = await http.post("/auth/tenant/login", { email, password });
    return res.data;
  },

  // Admin login — backend: POST /api/auth/admin/login
  adminLogin: async (
    email: string,
    password: string,
  ): Promise<{ token: string; user: { id: string; name: string; email: string; role: string } }> => {
    try {
      const res = await adminHttp.post("/auth/admin/login", { email, password });
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  forgotPassword: (email: string): Promise<{ message: string }> =>
    publicHttp.post("/auth/admin/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, password: string): Promise<{ message: string }> =>
    publicHttp.post("/auth/admin/reset-password", { token, password }).then((r) => r.data),

  tenantForgotPassword: (email: string): Promise<{ message: string }> =>
    publicHttp.post("/auth/tenant/forgot-password", { email }).then((r) => r.data),

  tenantResetPassword: (token: string, password: string): Promise<{ message: string }> =>
    publicHttp.post("/auth/tenant/reset-password", { token, password }).then((r) => r.data),
};

export const adminProfileApi = {
  get: (): Promise<{ id: string; name: string; email: string; createdAt: string }> =>
    adminHttp.get("/auth/admin/profile").then((r) => r.data),

  update: (data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ id: string; name: string; email: string; createdAt: string }> =>
    adminHttp.patch("/auth/admin/profile", data).then((r) => r.data),
};

// ── Admin: Stats ──────────────────────────────────────────────────────────────

export const adminStatsApi = {
  get: (): Promise<AdminStats> =>
    adminHttp.get("/admin/stats").then((r) => r.data),
};

// ── Admin: Tenants ────────────────────────────────────────────────────────────

export const adminTenantsApi = {
  list: (): Promise<Tenant[]> =>
    adminHttp.get("/admin/tenants").then((r) => r.data),

  get: (id: string): Promise<Tenant> =>
    adminHttp.get(`/admin/tenants/${id}`).then((r) => r.data),

  create: (data: {
    name: string;
    slug: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
    ratePerMinute: number;
    primaryColor?: string;
    domain?: string;
  }): Promise<Tenant> =>
    adminHttp.post("/admin/tenants", data).then((r) => r.data),

  update: (
    id: string,
    data: Partial<Pick<Tenant, "name" | "status" | "ratePerMinute" | "primaryColor" | "domain" | "logoUrl"> & { planId?: string | null; clonedVoiceId?: string | null; clonedVoiceName?: string | null }>,
  ): Promise<Tenant> =>
    adminHttp.patch(`/admin/tenants/${id}`, data).then((r) => r.data),

  uploadLogo: (tenantId: string, file: File): Promise<Tenant> => {
    const form = new FormData();
    form.append("logo", file);
    return adminHttp
      .post(`/admin/tenants/${tenantId}/logo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

// ── Admin: Scripts review ─────────────────────────────────────────────────────

export const adminScriptsApi = {
  pending: (): Promise<Script[]> =>
    adminHttp.get("/admin/scripts/pending").then((r) => r.data),

  reviewed: (): Promise<Script[]> =>
    adminHttp.get("/admin/scripts/reviewed").then((r) => r.data),

  approve: (scriptId: string): Promise<Script> =>
    adminHttp.post(`/admin/scripts/${scriptId}/approve`).then((r) => r.data),

  reject: (scriptId: string, note: string): Promise<Script> =>
    adminHttp.post(`/admin/scripts/${scriptId}/reject`, { note }).then((r) => r.data),

  resync: (scriptId: string): Promise<Script> =>
    adminHttp.post(`/admin/scripts/${scriptId}/resync`).then((r) => r.data),
};

// ── Admin: Billing ────────────────────────────────────────────────────────────

export const adminBillingApi = {
  summary: (month?: string): Promise<AdminBillingSummary[]> =>
    adminHttp.get("/admin/billing/summary", { params: { month } }).then((r) => r.data),

  sendInvoice: (tenantId: string, month: string): Promise<{
    invoiceId: string; amount: number; status: string;
    hostedUrl: string; pdfUrl: string; description: string;
  }> => adminHttp.post("/admin/billing/invoice", { tenantId, month }).then((r) => r.data),
};

export const adminNotificationsApi = {
  get: (): Promise<import("./types").AdminNotificationsResponse> =>
    adminHttp.get("/admin/notifications").then((r) => r.data),
};

// ── Admin: Global search ──────────────────────────────────────────────────────
export interface AdminSearchResult {
  clients: { id: string; name: string; ownerEmail: string; status: string }[];
  scripts: { id: string; title: string; status: string; tenant: { id: string; name: string } }[];
  leads:   { id: string; name: string; phone: string; status: string; campaign: { tenant: { id: string; name: string } } | null }[];
}
export const adminSearchApi = {
  search: (q: string): Promise<AdminSearchResult> =>
    adminHttp.get(`/admin/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
};

// ── Admin: Plans ──────────────────────────────────────────────────────────────

export const adminPlansApi = {
  list: (): Promise<import("./types").Plan[]> =>
    adminHttp.get("/admin/plans").then((r) => r.data),

  create: (data: {
    name: string;
    blurb?: string;
    price: number;
    minutesIncluded?: number;
    features: string[];
    isActive?: boolean;
    isPopular?: boolean;
    displayOrder?: number;
  }): Promise<import("./types").Plan> =>
    adminHttp.post("/admin/plans", data).then((r) => r.data),

  update: (id: string, data: Partial<import("./types").Plan>): Promise<import("./types").Plan> =>
    adminHttp.patch(`/admin/plans/${id}`, data).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    adminHttp.delete(`/admin/plans/${id}`).then((r) => r.data),
};

// ── Admin: Phone Numbers ──────────────────────────────────────────────────────

export type { TenantPhone } from "./types";

export interface AvailableNumber {
  number: string;
  friendlyName: string;
  country: string;
  provider: string;
  locality: string;
  region: string;
  monthlyPrice: string | null;
}

export const adminNumbersApi = {
  listAll: (): Promise<TenantPhone[]> =>
    adminHttp.get("/admin/numbers").then((r) => r.data),

  search: (params: {
    provider: string;
    country: string;
    areaCode?: string;
    contains?: string;
    pattern?: string;
  }): Promise<AvailableNumber[]> => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") q.set(k, String(v)); });
    return adminHttp.get(`/admin/numbers/search?${q}`).then((r) => r.data);
  },

  buy: (data: {
    number: string;
    provider: string;
    country: string;
    tenantId: string;
    isDefault?: boolean;
  }): Promise<TenantPhone> =>
    adminHttp.post("/admin/numbers/buy", data).then((r) => r.data),

  remove: (numberId: string): Promise<void> =>
    adminHttp.delete(`/admin/numbers/${numberId}`).then((r) => r.data),
};

// ── Public: Plans (no auth) ────────────────────────────────────────────────────

// Plain axios instance — no auth token needed
const publicHttp = axios.create({ baseURL: "/api", headers: { "Content-Type": "application/json" }, timeout: 10000 });

export const publicPlansApi = {
  list: (): Promise<import("./types").Plan[]> =>
    publicHttp.get("/public/plans").then((r) => r.data),
};

// ── Public: Contact / demo request ───────────────────────────────────────────

export const contactApi = {
  submit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    phone?: string;
    callVolume?: string;
    message?: string;
  }): Promise<{ message: string }> =>
    publicHttp.post("/public/contact", data).then((r) => r.data),
};

// ── Self-service registration ────────────────────────────────────────────────

export const registerApi = {
  signup: (data: {
    name: string;
    company: string;
    email: string;
    password: string;
    planId?: string;
  }): Promise<{
    token: string;
    user: { id: string; name: string; email: string; role: string };
    tenant: { id: string; name: string; slug: string; logoUrl?: string; primaryColor: string };
  }> => publicHttp.post("/auth/register", data).then((r) => r.data),
};

// ── Client portal: Call stats ─────────────────────────────────────────────────

export const callStatsApi = {
  get: (params?: { from?: string; to?: string }): Promise<CallStats> =>
    http.get("/calls/stats", { params }).then((r) => r.data),
};

// ── Client portal: Leads ──────────────────────────────────────────────────────

export interface LeadBatch {
  id:         string;
  filename:   string;
  totalCount: number;
  available:  number;
  used:       number;
  createdAt:  string;
}

export const leadsApi = {
  list: (params: {
    page?: number;
    limit?: number;
    status?: LeadStatus;
    campaignId?: string;
    unassigned?: boolean;
  }): Promise<{ leads: Lead[]; total: number; page: number; pages: number }> =>
    http.get("/leads", { params }).then((r) => r.data),

  uploadCsv: (
    file: File,
    campaignId?: string,
    onProgress?: (pct: number) => void,
  ): Promise<{ imported: number; skipped: number; errors: string[]; batchId?: string }> => {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      if (campaignId) form.append("campaignId", campaignId);
      const token = typeof window !== "undefined" ? localStorage.getItem("vfh_token") : null;

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/leads/upload");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error("Invalid response")); }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || "Upload failed"));
          } catch { reject(new Error("Upload failed")); }
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(form);
    });
  },

  listBatches: (): Promise<LeadBatch[]> =>
    http.get("/leads/batches").then((r) => r.data),

  optOut: (leadId: string): Promise<void> =>
    http.delete(`/leads/${leadId}`).then((r) => r.data),

  reset: (leadId: string): Promise<void> =>
    http.patch(`/leads/${leadId}/reset`).then((r) => r.data),

  redial: (leadId: string): Promise<{ lead: Lead; queued: boolean; campaignStatus: string | null }> =>
    http.post(`/leads/${leadId}/redial`).then((r) => r.data),

  unassignedCount: (): Promise<{ count: number }> =>
    http.get("/leads/unassigned-count").then((r) => r.data),
};

// ── Client portal: Calls ──────────────────────────────────────────────────────

export const callsApi = {
  list: (params: {
    page?: number;
    limit?: number;
    outcome?: string;
    campaignId?: string;
  } = {}): Promise<{ calls: Call[]; total: number }> =>
    http.get("/calls", { params }).then((r) => r.data),

  get: (callId: string): Promise<Call> =>
    http.get(`/calls/${callId}`).then((r) => r.data),
};

// ── Client portal: Voices ─────────────────────────────────────────────────────

export interface ElevenLabsVoice {
  id: string;
  name: string;
  category: "premade" | "cloned" | "generated";
  gender: string | null;
  accent: string | null;
  language: string | null;
  description: string | null;
  previewUrl: string | null;
}

export const voicesApi = {
  list: (): Promise<ElevenLabsVoice[]> =>
    http.get("/scripts/voices").then((r) => r.data),
};

// ── Client portal: Scripts ────────────────────────────────────────────────────

export const scriptsApi = {
  list: (): Promise<Script[]> =>
    http.get("/scripts").then((r) => r.data),

  create: (data: {
    name?: string;
    companyInfo: string;
    servicesInfo: string;
    goalText: string;
    objections?: string;
    agentName?: string;
    agentGender?: string;
    voiceId?: string;
    language?: string;
  }): Promise<Script> =>
    http.post("/scripts", data).then((r) => r.data),

  update: (scriptId: string, data: {
    name?: string;
    agentName?: string;
    agentGender?: string;
    companyInfo?: string;
    servicesInfo?: string;
    goalText?: string;
    objections?: string;
    voiceId?: string;
    language?: string;
  }): Promise<Script> =>
    http.patch(`/scripts/${scriptId}`, data).then((r) => r.data),

  remove: (scriptId: string): Promise<{ message: string }> =>
    http.delete(`/scripts/${scriptId}`).then((r) => r.data),

  uploadFaq: (scriptId: string, file: File): Promise<{ message: string }> => {
    const form = new FormData();
    form.append("file", file);
    return http
      .post(`/scripts/${scriptId}/faq`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

// ── Client portal: Campaigns ──────────────────────────────────────────────────

export const campaignsApi = {
  list: (): Promise<Campaign[]> =>
    http.get("/campaigns").then((r) => r.data),

  create: (data: {
    name: string;
    scriptId: string;
    callFromHour?: number;
    callToHour?: number;
    timezone?: string;
    callDays?: string;
    maxAttempts?: number;
    retryAfterHours?: number;
    includeAllLeads?: boolean;
    leadIds?: string[];
    batchId?: string;
    batchLimit?: number;
  }): Promise<Campaign> =>
    http.post("/campaigns", data).then((r) => r.data),

  update: (campaignId: string, data: {
    callFromHour?: number;
    callToHour?: number;
    timezone?: string;
    callDays?: string;
    maxAttempts?: number;
    retryAfterHours?: number;
  }): Promise<Campaign> =>
    http.patch(`/campaigns/${campaignId}`, data).then((r) => r.data),

  start: (campaignId: string): Promise<{ message: string }> =>
    http.post(`/campaigns/${campaignId}/start`).then((r) => r.data),

  pause: (campaignId: string): Promise<{ message: string }> =>
    http.post(`/campaigns/${campaignId}/pause`).then((r) => r.data),

  noAnswers: (campaignId: string): Promise<{
    leads: { id: string; name: string; phone: string; company?: string | null; callAttempts: number; lastCalledAt: string | null; status: string }[];
    maxAttempts: number;
    retryableCount: number;
    exhaustedCount: number;
    total: number;
  }> => http.get(`/campaigns/${campaignId}/no-answers`).then((r) => r.data),

  retryNoAnswers: (campaignId: string, includeExhausted: boolean): Promise<{
    reset: number;
    queued: boolean;
    campaignStatus: string;
  }> => http.post(`/campaigns/${campaignId}/retry-no-answers`, { includeExhausted }).then((r) => r.data),
};

// ── Client portal: Meetings ───────────────────────────────────────────────────

export const meetingsApi = {
  list: (): Promise<Meeting[]> =>
    http.get("/calls", { params: { outcome: "BOOKED", limit: 100 } }).then((r) =>
      (r.data.calls as Call[])
        .filter((c) => c.meetingAt || (c as any).scheduledAt)
        .map((c) => ({
          id: c.id,
          leadId: c.leadId,
          callId: c.id,
          leadName: c.lead?.name ?? "Unknown",
          leadCompany: c.lead?.company,
          leadPhone: c.lead?.phone ?? "",
          leadEmail: (c.lead as any)?.email ?? undefined,
          calledAt: (c as any).startedAt ?? c.createdAt,
          bookedAt: c.meetingAt ?? undefined,
          scheduledAt: (c as any).scheduledAt ?? undefined,
          meetingAt: c.meetingAt!,
          meetingLink: c.meetingLink,
          summary: (c as any).summary ?? undefined,
          duration: c.duration ?? undefined,
          createdAt: c.createdAt,
        })),
    ),
};

// ── Client portal: Billing ────────────────────────────────────────────────────

export const billingApi = {
  summary: (params?: { from?: string; to?: string }): Promise<BillingSummary> =>
    http.get("/billing/summary", { params }).then((r) => r.data),

  history: (): Promise<UsageLog[]> =>
    http.get("/billing/history").then((r) => r.data),
};

// ── Tenant: current account info + integrations ───────────────────────────────

export interface TenantMe {
  id: string;
  name: string;
  slug: string;
  ownerName: string | null;
  ownerEmail: string | null;
  domain?: string;
  logoUrl?: string;
  primaryColor: string;
  status: string;
  ratePerMinute: number;
  totalMinutes: number;
  hasCalcom: boolean;
  hasHubspot: boolean;
  hasGcal: boolean;
  clonedVoiceId: string | null;
  clonedVoiceName: string | null;
  planExpiresAt: string | null;
  hasSubscription: boolean;
  plan: { id: string; name: string; price: number; minutesIncluded: number; features: string[] } | null;
}

export interface IntegrationUpdate {
  calcomApiKey?: string;
  calcomEventTypeId?: string;
  hubspotAccessToken?: string;
  googleCalendarToken?: string;
}

export const tenantApi = {
  me: (): Promise<TenantMe> =>
    http.get("/tenant/me").then((r) => r.data),

  selectPlan: (planId: string): Promise<{ plan: { id: string; name: string; price: number; minutesIncluded: number } }> =>
    http.post("/tenant/plan", { planId }).then((r) => r.data),

  startPlanCheckout: (planId: string): Promise<{ url?: string; upgraded?: boolean; alreadyActive?: boolean }> =>
    http.post("/stripe/checkout", { planId }, { timeout: 30_000 }).then((r) => r.data),

  updateIntegrations: (data: IntegrationUpdate): Promise<{ message: string }> =>
    http.patch("/tenant/integrations", data).then((r) => r.data),

  updateProfile: (data: { name?: string; ownerName?: string; primaryColor?: string }): Promise<{ name: string; ownerName: string; primaryColor: string }> =>
    http.patch("/tenant/profile", data).then((r) => r.data),

  uploadLogo: (file: File): Promise<{ logoUrl: string }> => {
    const form = new FormData();
    form.append("logo", file);
    return http.post("/tenant/logo", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },

  changePassword: (currentPassword: string, newPassword: string): Promise<{ message: string }> =>
    http.patch("/tenant/password", { currentPassword, newPassword }).then((r) => r.data),
};

// ── Client portal: Sentiment / Live calls ────────────────────────────────────

export interface ActiveCall {
  callId:          string
  status:          string
  startedAt:       string | null
  lead:            { id: string; name: string; company: string | null }
  campaign:        string | null
  sentiment:       'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_NEGATIVE' | 'UNKNOWN'
  intent:          'HOT' | 'WARM' | 'COLD' | 'UNKNOWN'
  suggestedAction: 'KEEP_GOING' | 'PUSH_FOR_MEETING' | 'SLOW_DOWN' | 'END_CALL' | null
}

export const sentimentApi = {
  active: (): Promise<{ activeCalls: ActiveCall[]; total: number }> =>
    http.get('/sentiment/active').then((r) => r.data),

  call: (callId: string): Promise<{
    callId: string; status: string; lead: ActiveCall['lead'];
    startedAt: string | null; durationSeconds: number;
    overallScore: string; latestSentiment: string | null;
    latestIntent: string | null; suggestedAction: string | null;
    buyingSignals: string[]; log: object[];
  }> => http.get(`/sentiment/call/${callId}`).then((r) => r.data),
}

// ── Inbound: Phone Numbers ────────────────────────────────────────────────────

export interface InboundPhoneNumber {
  id:          string;
  tenantId:    string;
  phoneNumber: string;
  country:     string;
  twilioSid:   string | null;
  vapiPhoneId: string | null;
  provider:    string;
  isActive:    boolean;
  createdAt:   string;
  assistants?: { id: string; agentName: string; status: string }[];
}

export interface AvailableInboundNumber {
  phoneNumber:  string;
  friendlyName: string;
  locality:     string;
  region:       string;
  postalCode:   string | null;
}

export const inboundPhoneApi = {
  list: (): Promise<InboundPhoneNumber[]> =>
    http.get('/inbound/phone-numbers').then((r) => r.data),

  search: (params: { country?: string; areaCode?: string; contains?: string }): Promise<AvailableInboundNumber[]> =>
    http.post('/inbound/phone-numbers/search', params).then((r) => r.data),

  buy: (params: { phoneNumber: string; country?: string }): Promise<InboundPhoneNumber> =>
    http.post('/inbound/phone-numbers/buy', params).then((r) => r.data),

  import: (params: { phoneNumber: string; twilioSid: string; country?: string }): Promise<InboundPhoneNumber> =>
    http.post('/inbound/phone-numbers/import', params).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    http.delete(`/inbound/phone-numbers/${id}`).then((r) => r.data),
};

// ── Inbound: Assistants ───────────────────────────────────────────────────────

export interface InboundAssistant {
  id:              string;
  tenantId:        string;
  phoneNumberId:   string | null;
  phoneNumber?:    { id: string; phoneNumber: string; country: string } | null;
  agentName:       string;
  language:        string;
  voiceId:         string | null;
  agentGender:     string;
  businessName:    string;
  businessType:    string | null;
  servicesInfo:    string | null;
  faqText:         string | null;
  businessHours:   Record<string, string> | null;
  transferNumber:  string | null;
  transferMessage: string | null;
  bookingUrl:      string | null;
  maxCallDuration: number;
  firstMessage:    string | null;
  systemPrompt:    string | null;
  vapiAssistantId: string | null;
  status:          'draft' | 'active' | 'paused';
  createdAt:       string;
  updatedAt:       string;
}

export interface InboundAssistantInput {
  agentName:       string;
  language:        string;
  voiceId?:        string;
  agentGender:     string;
  businessName:    string;
  businessType?:   string;
  servicesInfo?:   string;
  faqText?:        string;
  businessHours?:  Record<string, string>;
  transferNumber?: string;
  transferMessage?: string;
  bookingUrl?:     string;
  maxCallDuration?: number;
}

export const inboundAssistantApi = {
  list: (): Promise<InboundAssistant[]> =>
    http.get('/inbound/assistants').then((r) => r.data),

  get: (id: string): Promise<InboundAssistant> =>
    http.get(`/inbound/assistants/${id}`).then((r) => r.data),

  create: (data: InboundAssistantInput): Promise<InboundAssistant> =>
    http.post('/inbound/assistants', data).then((r) => r.data),

  update: (id: string, data: Partial<InboundAssistantInput>): Promise<InboundAssistant> =>
    http.patch(`/inbound/assistants/${id}`, data).then((r) => r.data),

  activate: (id: string, phoneNumberId: string): Promise<{ assistant: InboundAssistant; vapiAssistantId: string; message: string }> =>
    http.post(`/inbound/assistants/${id}/activate`, { phoneNumberId }).then((r) => r.data),

  deactivate: (id: string): Promise<InboundAssistant> =>
    http.post(`/inbound/assistants/${id}/deactivate`).then((r) => r.data),
};

// ── Inbound: Calls ────────────────────────────────────────────────────────────

export interface InboundCall {
  id:              string;
  tenantId:        string;
  assistantId:     string | null;
  assistant?:      { agentName: string; businessName: string } | null;
  phoneNumberId:   string | null;
  vapiCallId:      string | null;
  callerNumber:    string | null;
  calledNumber:    string | null;
  durationSeconds: number | null;
  outcome:         string | null;
  summary:         string | null;
  transcript:      { role: string; content: string }[] | null;
  recordingUrl:    string | null;
  costUsd:         number | null;
  startedAt:       string | null;
  endedAt:         string | null;
  createdAt:       string;
}

export const inboundCallsApi = {
  list: (params?: { limit?: number; offset?: number; outcome?: string; assistantId?: string }): Promise<{ calls: InboundCall[]; total: number }> =>
    http.get('/inbound/calls', { params }).then((r) => r.data),

  live: (): Promise<{ calls: InboundCall[]; total: number }> =>
    http.get('/inbound/calls/live').then((r) => r.data),

  get: (id: string): Promise<InboundCall> =>
    http.get(`/inbound/calls/${id}`).then((r) => r.data),
};

// ── Inbound: Analytics ────────────────────────────────────────────────────────

export interface InboundAnalytics {
  summary: {
    totalCalls:  number;
    avgDuration: number;
    transferRate: number;
    liveNow:     number;
    transferred: number;
    completed:   number;
    voicemail:   number;
    noAnswer:    number;
    failed:      number;
  };
  byOutcome: { outcome: string; count: number }[];
  daily:     { date: string; count: number }[];
  byHour:    { hour: number; count: number }[];
}

export const inboundAnalyticsApi = {
  get: (params?: { days?: number }): Promise<InboundAnalytics> =>
    http.get('/inbound/analytics', { params }).then((r) => r.data),
};

// ── Client portal: Voice cloning ─────────────────────────────────────────────

export const portalVoiceApi = {
  upload: (file: File, name: string): Promise<{ voiceId: string; voiceName: string }> => {
    const form = new FormData();
    form.append("file", file);
    form.append("name", name);
    return http.post("/tenant/voice", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    }).then((r) => r.data);
  },

  remove: (): Promise<{ message: string }> =>
    http.delete("/tenant/voice").then((r) => r.data),
};

// ── WhatsApp Outreach ────────────────────────────────────────────────────────

import type {
  WaContactList,
  WaContact,
  WaCampaign,
  WaMessage,
  WaListStats,
  WaUploadResult,
  WaSendResult,
  WaMessageDirection,
  WaOptInStatus,
} from "./types";

export const waApi = {
  // ── Contact Lists ──────────────────────────────────────────────────────────

  getLists: (): Promise<WaContactList[]> =>
    http.get("/whatsapp/contacts").then((r) => r.data),

  uploadContacts: (
    file: File,
    name: string,
    onProgress?: (pct: number) => void,
    consentConfirmed?: boolean,
  ): Promise<WaUploadResult> =>
    new Promise((resolve, reject) => {
      const form  = new FormData();
      form.append("file", file);
      form.append("name", name);
      if (consentConfirmed) form.append("consentConfirmed", "true");
      const token = typeof window !== "undefined" ? localStorage.getItem("vfh_token") : null;

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/whatsapp/contacts/upload");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error("Invalid response")); }
        } else {
          try { reject(new Error(JSON.parse(xhr.responseText).error || "Upload failed")); }
          catch { reject(new Error("Upload failed")); }
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(form);
    }),

  getContacts: (
    listId: string,
    params?: { page?: number; limit?: number; optInStatus?: WaOptInStatus },
  ): Promise<{ list: WaContactList; contacts: WaContact[]; total: number; page: number; pages: number }> =>
    http.get(`/whatsapp/contacts/${listId}`, { params }).then((r) => r.data),

  getListStats: (listId: string): Promise<WaListStats> =>
    http.get(`/whatsapp/contacts/${listId}/stats`).then((r) => r.data),

  triggerOptIn: (
    listId: string,
  ): Promise<{ message: string; listId: string }> =>
    http.post(`/whatsapp/contacts/${listId}/trigger-optin`).then((r) => r.data),

  // ── Campaigns ─────────────────────────────────────────────────────────────

  getCampaigns: (): Promise<WaCampaign[]> =>
    http.get("/whatsapp/campaigns").then((r) => r.data),

  createCampaign: (data: {
    name: string;
    templateName: string;
    languageCode?: string;
  }): Promise<WaCampaign> =>
    http.post("/whatsapp/campaigns", data).then((r) => r.data),

  sendCampaign: (
    campaignId: string,
    contactListId: string,
  ): Promise<WaSendResult> =>
    http.post(`/whatsapp/campaigns/${campaignId}/send`, { contactListId }).then((r) => r.data),

  // ── Messages ──────────────────────────────────────────────────────────────

  getMessages: (params?: {
    contactId?: string;
    campaignId?: string;
    direction?: WaMessageDirection;
    page?: number;
    limit?: number;
  }): Promise<{ messages: WaMessage[]; total: number; page: number; pages: number }> =>
    http.get("/whatsapp/messages", { params }).then((r) => r.data),
};
