import axios from "axios";
import { mockApi } from "./mocks/data";
import type {
  Lead,
  Call,
  DashboardStats,
  CampaignSettings,
  AgentSettings,
  PaginatedResponse,
  LeadStatus,
} from "./types";

const http = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
});

// Attach JWT token from localStorage to every request (client-only)
http.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("vfh_token");
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

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; name: string }> => {
    const res = await http.post("/auth/login", { email, password });
    return res.data;
  },
  register: async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ token: string; name: string }> => {
    const res = await http.post("/auth/register", { name, email, password });
    return res.data;
  },
};

// ── Dashboard ────────────────────────────────────────────────
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

// ── Leads ────────────────────────────────────────────────────
export const leadsApi = {
  list: async (params: {
    page?: number;
    pageSize?: number;
    status?: LeadStatus;
    country?: string;
    search?: string;
  }): Promise<PaginatedResponse<Lead>> => {
    try {
      return (await http.get("/leads", { params })).data;
    } catch (e) {
      if (isMock(e)) return mockApi.listLeads(params.page, params.pageSize);
      throw e;
    }
  },

  uploadCsv: (file: File): Promise<{ imported: number; errors: string[] }> => {
    const form = new FormData();
    form.append("file", file);
    return http
      .post("/leads/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  triggerCall: (leadId: string): Promise<{ callSid: string }> =>
    http.post(`/leads/${leadId}/call`).then((r) => r.data),

  delete: (leadId: string): Promise<void> => http.delete(`/leads/${leadId}`).then((r) => r.data),
};

// ── Calls ────────────────────────────────────────────────────
export const callsApi = {
  list: async (
    params: {
      page?: number;
      pageSize?: number;
      outcome?: string;
      leadId?: string;
    } = {},
  ): Promise<PaginatedResponse<Call>> => {
    try {
      return (await http.get("/calls", { params })).data;
    } catch (e) {
      if (isMock(e)) return mockApi.listCalls(params.page, params.pageSize);
      throw e;
    }
  },

  getTranscript: async (callId: string): Promise<Call> => {
    try {
      return (await http.get(`/calls/${callId}`)).data;
    } catch (e) {
      if (isMock(e)) return mockApi.getCall(callId);
      throw e;
    }
  },
};

// ── Campaign Settings ────────────────────────────────────────
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

// ── Agent Settings ───────────────────────────────────────────
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
