import axios from "axios";
import { mockApi } from "./mocks/data";
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
  DashboardStats,
  CampaignSettings,
  AgentSettings,
  PaginatedResponse,
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

// In dev, fall back to mock data when backend is unreachable
function isMock(err: unknown) {
  if (import.meta.env.PROD) return false;
  if (!axios.isAxiosError(err)) return false;
  const status = err.response?.status;
  return !status || status >= 500;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  // Client (tenant user) login — backend: POST /api/auth/tenant/login
  tenantLogin: async (
    email: string,
    password: string,
  ): Promise<{ token: string; user: { id: string; name: string; email: string; role: string }; tenant: { id: string; name: string; slug: string; logoUrl?: string; primaryColor: string } }> => {
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
      if (import.meta.env.PROD) throw new Error("Invalid admin credentials");
      if (!axios.isAxiosError(e) || (e.response?.status && e.response.status < 500)) throw e;
      if (!email.includes("admin") || password.length < 8)
        throw new Error("Invalid admin credentials");
      return {
        token: "mock-admin-token",
        user: { id: "mock", name: "Admin", email, role: "ADMIN" },
      };
    }
  },
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
    data: Partial<Pick<Tenant, "name" | "status" | "ratePerMinute" | "primaryColor" | "domain" | "logoUrl">>,
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

// ── Admin: Phone Numbers ──────────────────────────────────────────────────────

export const adminNumbersApi = {
  listByTenant: (tenantId: string): Promise<TenantPhone[]> =>
    adminHttp.get(`/admin/tenants/${tenantId}/numbers`).then((r) => r.data),

  assign: (
    tenantId: string,
    data: {
      number: string;
      friendlyName?: string;
      country: string;
      twilioSid?: string;
      vapiNumberId?: string;
      isDefault?: boolean;
    },
  ): Promise<TenantPhone> =>
    adminHttp.post(`/admin/tenants/${tenantId}/numbers`, data).then((r) => r.data),

  remove: (tenantId: string, numberId: string): Promise<void> =>
    adminHttp.delete(`/admin/tenants/${tenantId}/numbers/${numberId}`).then((r) => r.data),
};

// ── Admin: Scripts review ─────────────────────────────────────────────────────

export const adminScriptsApi = {
  pending: (): Promise<Script[]> =>
    adminHttp.get("/admin/scripts/pending").then((r) => r.data),

  approve: (scriptId: string): Promise<Script> =>
    adminHttp.post(`/admin/scripts/${scriptId}/approve`).then((r) => r.data),

  reject: (scriptId: string, note: string): Promise<Script> =>
    adminHttp.post(`/admin/scripts/${scriptId}/reject`, { note }).then((r) => r.data),
};

// ── Admin: Billing ────────────────────────────────────────────────────────────

export const adminBillingApi = {
  summary: (month?: string): Promise<AdminBillingSummary[]> =>
    adminHttp.get("/admin/billing/summary", { params: { month } }).then((r) => r.data),
};

// ── Client portal: Dashboard stats ───────────────────────────────────────────

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      return (await http.get("/dashboard/stats")).data;
    } catch (e) {
      if (isMock(e)) return mockApi.getStats();
      throw e;
    }
  },
};

// ── Client portal: Call stats ─────────────────────────────────────────────────

export const callStatsApi = {
  get: (params?: { from?: string; to?: string }): Promise<CallStats> =>
    http.get("/calls/stats", { params }).then((r) => r.data),
};

// ── Client portal: Leads ──────────────────────────────────────────────────────

export const leadsApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    status?: LeadStatus;
    campaignId?: string;
  }): Promise<{ leads: Lead[]; total: number; page: number; pages: number }> => {
    try {
      return (await http.get("/leads", { params })).data;
    } catch (e) {
      if (isMock(e)) {
        const mock = await mockApi.listLeads(params.page, params.limit);
        return { leads: mock.data, total: mock.total, page: mock.page, pages: 1 };
      }
      throw e;
    }
  },

  uploadCsv: (
    file: File,
    campaignId?: string,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> => {
    const form = new FormData();
    form.append("file", file);
    if (campaignId) form.append("campaignId", campaignId);
    return http
      .post("/leads/upload", form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },

  optOut: (leadId: string): Promise<void> =>
    http.delete(`/leads/${leadId}`).then((r) => r.data),
};

// ── Client portal: Calls ──────────────────────────────────────────────────────

export const callsApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    outcome?: string;
    campaignId?: string;
  } = {}): Promise<{ calls: Call[]; total: number }> => {
    try {
      return (await http.get("/calls", { params })).data;
    } catch (e) {
      if (isMock(e)) {
        const mock = await mockApi.listCalls(params.page, params.limit);
        return { calls: mock.data as unknown as Call[], total: mock.total };
      }
      throw e;
    }
  },

  get: async (callId: string): Promise<Call> => {
    try {
      return (await http.get(`/calls/${callId}`)).data;
    } catch (e) {
      if (isMock(e)) return mockApi.getCall(callId) as unknown as Call;
      throw e;
    }
  },
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
    voiceId?: string;
  }): Promise<Script> =>
    http.post("/scripts", data).then((r) => r.data),

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
  }): Promise<Campaign> =>
    http.post("/campaigns", data).then((r) => r.data),

  start: (campaignId: string): Promise<{ message: string }> =>
    http.post(`/campaigns/${campaignId}/start`).then((r) => r.data),

  pause: (campaignId: string): Promise<{ message: string }> =>
    http.post(`/campaigns/${campaignId}/pause`).then((r) => r.data),
};

// ── Client portal: Meetings ───────────────────────────────────────────────────

export const meetingsApi = {
  list: (): Promise<Meeting[]> =>
    http.get("/calls", { params: { outcome: "BOOKED", limit: 100 } }).then((r) =>
      (r.data.calls as Call[])
        .filter((c) => c.meetingAt)
        .map((c) => ({
          id: c.id,
          leadId: c.leadId,
          callId: c.id,
          leadName: c.lead?.name ?? "Unknown",
          leadCompany: c.lead?.company,
          leadPhone: c.lead?.phone ?? "",
          meetingAt: c.meetingAt!,
          meetingLink: c.meetingLink,
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

// ── Legacy — kept for settings pages that haven't been wired yet ──────────────

export const campaignApi = {
  get: async (): Promise<CampaignSettings> => {
    try {
      return (await http.get("/settings/campaign")).data;
    } catch (e) {
      if (isMock(e)) return mockApi.getCampaign();
      throw e;
    }
  },
  update: (data: Partial<CampaignSettings>): Promise<CampaignSettings> =>
    http.put("/settings/campaign", data).then((r) => r.data),
};

export const agentApi = {
  get: async (): Promise<AgentSettings> => {
    try {
      return (await http.get("/settings/agent")).data;
    } catch (e) {
      if (isMock(e)) return mockApi.getAgent();
      throw e;
    }
  },
  update: (data: Partial<AgentSettings>): Promise<AgentSettings> =>
    http.put("/settings/agent", data).then((r) => r.data),
  testCall: (toNumber: string): Promise<{ callSid: string }> =>
    http.post("/settings/agent/test-call", { toNumber }).then((r) => r.data),
};
