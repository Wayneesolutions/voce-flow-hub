export type LeadStatus =
  | "pending"
  | "calling"
  | "booked"
  | "not_interested"
  | "callback"
  | "voicemail"
  | "no_answer";

export type CallOutcome = "booked" | "not_interested" | "voicemail" | "no_answer" | "callback";

export type Country = "US" | "CA" | "UAE";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  country: Country;
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
  lead?: Pick<Lead, "id" | "name" | "phone" | "company" | "country">;
  twilioCallSid?: string;
  duration?: number;
  outcome?: CallOutcome;
  transcript?: string;
  meetingAt?: string;
  recordingUrl?: string;
  createdAt: string;
}

export interface DashboardStats {
  callsToday: number;
  connectsToday: number;
  meetingsBooked: number;
  conversionRate: number;
  avgCallDuration: number;
  callsByDay: { date: string; calls: number; booked: number }[];
  outcomeBreakdown: { outcome: string; count: number }[];
}

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
