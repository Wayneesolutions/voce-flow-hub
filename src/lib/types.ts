// ── Shared primitives ───────────────────────────────────────────────────────

export type LeadStatus =
  | "PENDING"
  | "CALLING"
  | "BOOKED"
  | "NOT_INTERESTED"
  | "CALLBACK"
  | "VOICEMAIL"
  | "NO_ANSWER"
  | "OPTED_OUT"
  | "EXHAUSTED";

export type CallOutcome =
  | "BOOKED"
  | "NOT_INTERESTED"
  | "VOICEMAIL"
  | "NO_ANSWER"
  | "CALLBACK"
  | "OPTED_OUT"
  | "ERROR";

export type Country = "US" | "CA" | "UAE";

export type ScriptStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "LIVE";

export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";

export type TenantStatus = "ACTIVE" | "PAUSED" | "SUSPENDED";

// ── Client portal types ─────────────────────────────────────────────────────

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  country: string;
  title?: string;
  status: LeadStatus;
  callAttempts: number;
  lastCalledAt?: string;
  callbackAt?: string;
  createdAt: string;
}

export interface Call {
  id: string;
  leadId: string;
  lead?: {
    id: string;
    name: string;
    phone: string;
    company?: string;
    country: string;
  };
  campaignId?: string;
  twilioCallSid?: string;
  vapiCallId?: string;
  duration?: number;
  billedMinutes?: number;
  billedAmount?: number;
  outcome?: CallOutcome;
  transcript?: string;
  summary?: string;
  meetingAt?: string;
  meetingLink?: string;
  recordingUrl?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export interface Script {
  id: string;
  tenantId: string;
  name: string;
  companyInfo: string;
  servicesInfo: string;
  goalText: string;
  objections?: string;
  faqDocument?: string;
  agentName: string;
  voiceId?: string;
  status: ScriptStatus;
  reviewNote?: string;
  isActive: boolean;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: { id: string; name: string };
}

export interface Campaign {
  id: string;
  tenantId: string;
  scriptId: string;
  name: string;
  status: CampaignStatus;
  callFromHour: number;
  callToHour: number;
  timezone: string;
  callDays: string;
  maxAttempts: number;
  retryAfterHours: number;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  createdAt: string;
  script?: { id: string; name: string; status: ScriptStatus; agentName: string };
  _count?: { leads: number; calls: number };
}

export interface Meeting {
  id: string;
  leadId: string;
  callId: string;
  leadName: string;
  leadCompany?: string;
  leadPhone: string;
  calledAt?: string;        // when the agent called
  bookedAt?: string;        // when the meeting was booked during the call
  scheduledAt?: string;     // actual scheduled meeting datetime
  meetingAt: string;
  meetingLink?: string;
  calEventId?: string;
  summary?: string;
  duration?: number;
  createdAt: string;
}

export interface UsageLog {
  id: string;
  tenantId: string;
  callId: string;
  minutes: number;
  rate: number;
  amount: number;
  createdAt: string;
}

// ── Dashboard / stats ───────────────────────────────────────────────────────

export interface DashboardStats {
  callsToday: number;
  connectsToday: number;
  meetingsBooked: number;
  conversionRate: number;
  avgCallDuration: number;
  callsByDay: { date: string; calls: number; booked: number }[];
  outcomeBreakdown: { outcome: string; count: number }[];
}

export interface CallStats {
  total: number;
  booked: number;
  notInterested: number;
  noAnswer: number;
  voicemail: number;
  callback: number;
  totalMinutes: number;
  totalBilled: number;
  conversionRate: number;
}

export interface BillingSummary {
  ratePerMinute: number;
  totalMinutes: number;
  totalAmount: number;
  period: { from: string; to: string };
}

// ── Admin types ─────────────────────────────────────────────────────────────

export interface TenantPhone {
  id: string;
  tenantId: string;
  number: string;
  friendlyName: string;
  country: string;
  twilioSid?: string;
  vapiNumberId?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  status: TenantStatus;
  ratePerMinute: number;
  totalMinutes: number;
  logoUrl?: string;
  primaryColor: string;
  domain?: string;
  createdAt: string;
  phoneNumbers?: TenantPhone[];
  _count?: { leads: number; calls: number; campaigns: number };
}

export interface AdminStats {
  activeClients: number;
  callsToday: number;
  minutesToday: number;
  meetingsToday: number;
  revenueToday: number;
}

export interface AdminBillingSummary {
  tenant: { id: string; name: string; ratePerMinute: number };
  totalMinutes: number;
  totalRevenue: number;
  platformCost: number;
  grossProfit: number;
}

// ── Legacy / settings (kept for mock compat) ────────────────────────────────

export interface CampaignSettings {
  callingHoursStart: string;
  callingHoursEnd: string;
  timezone: string;
  maxAttemptsPerLead: number;
  retryIntervalMinutes: number;
  usNumber: string;
  caNumber: string;
  uaeNumber: string;
}

export interface AgentSettings {
  systemPrompt: string;
  voiceId: string;
  voiceProvider: string;
  firstMessage: string;
  llmModel: string;
  maxTokens: number;
  temperature: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code?: string;
}
