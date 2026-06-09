import type {
  DashboardStats,
  Lead,
  Call,
  CampaignSettings,
  AgentSettings,
  PaginatedResponse,
} from "../types";

export const mockStats: DashboardStats = {
  callsToday: 148,
  connectsToday: 61,
  meetingsBooked: 9,
  conversionRate: 6.1,
  avgCallDuration: 187,
  callsByDay: [
    { date: "Jun 2", calls: 102, booked: 5 },
    { date: "Jun 3", calls: 134, booked: 7 },
    { date: "Jun 4", calls: 89, booked: 4 },
    { date: "Jun 5", calls: 156, booked: 11 },
    { date: "Jun 6", calls: 121, booked: 6 },
    { date: "Jun 7", calls: 143, booked: 8 },
    { date: "Jun 8", calls: 148, booked: 9 },
  ],
  outcomeBreakdown: [
    { outcome: "not_interested", count: 47 },
    { outcome: "no_answer", count: 38 },
    { outcome: "voicemail", count: 31 },
    { outcome: "booked", count: 9 },
    { outcome: "callback", count: 23 },
  ],
};

export const mockLeads: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    phone: "+12125559801",
    email: "john@acmecorp.com",
    company: "Acme Corp",
    country: "US",
    title: "CTO",
    status: "BOOKED",
    callAttempts: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Sarah Johnson",
    phone: "+14165559234",
    email: "sarah@techco.ca",
    company: "TechCo",
    country: "CA",
    title: "IT Manager",
    status: "CALLBACK",
    callAttempts: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Ahmed Al Rashid",
    phone: "+97155512345",
    company: "Gulf Tech",
    country: "UAE",
    title: "Operations Director",
    status: "NOT_INTERESTED",
    callAttempts: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Mike Davis",
    phone: "+13125558821",
    email: "mike@startupxyz.com",
    company: "Startup XYZ",
    country: "US",
    title: "CEO",
    status: "PENDING",
    callAttempts: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Emily Chen",
    phone: "+16045557712",
    company: "Pacific Tech",
    country: "CA",
    title: "VP Engineering",
    status: "VOICEMAIL",
    callAttempts: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Robert Martinez",
    phone: "+14155553391",
    email: "r.martinez@baytech.io",
    company: "Bay Tech",
    country: "US",
    title: "IT Director",
    status: "CALLING",
    callAttempts: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Fatima Al Zaabi",
    phone: "+97150987654",
    company: "Emirates Digital",
    country: "UAE",
    title: "Head of IT",
    status: "PENDING",
    callAttempts: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "David Kim",
    phone: "+12125551102",
    email: "d.kim@fintech.com",
    company: "FinTech Solutions",
    country: "US",
    title: "CTO",
    status: "BOOKED",
    callAttempts: 3,
    createdAt: new Date().toISOString(),
  },
];

const sampleTranscript = `Agent: Hi, this is Alex from Wayne Solutions. Am I speaking with John Smith?
Prospect: Yes, that's me. Who is this?
Agent: Hi John, I'm Alex from Wayne Solutions — we help companies like yours with IT development and staff augmentation. Do you have 60 seconds?
Prospect: Sure, go ahead.
Agent: Great. We work with CTOs in the US to build custom software and provide dedicated developers. Are you currently facing any challenges with your tech team capacity?
Prospect: Actually yes, we're looking to scale our dev team but hiring is slow.
Agent: That's exactly what we solve — we can embed dedicated developers into your team within a week. Would you be open to a quick 15-minute call to see if we'd be a fit?
Prospect: Yeah, that sounds reasonable. When are you available?
Agent: I have Tuesday at 2 PM or Wednesday at 10 AM EST. Which works better for you?
Prospect: Wednesday at 10 works.
Agent: Perfect, I'll send a calendar invite to your email. Thanks, John — talk soon!`;

export const mockCalls: Call[] = [
  {
    id: "c1",
    leadId: "1",
    lead: {
      id: "1",
      name: "John Smith",
      phone: "+12125559801",
      company: "Acme Corp",
      country: "US",
    },
    duration: 214,
    outcome: "BOOKED",
    transcript: sampleTranscript,
    meetingAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "c2",
    leadId: "2",
    lead: {
      id: "2",
      name: "Sarah Johnson",
      phone: "+14165559234",
      company: "TechCo",
      country: "CA",
    },
    duration: 87,
    outcome: "CALLBACK",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "c3",
    leadId: "3",
    lead: {
      id: "3",
      name: "Ahmed Al Rashid",
      phone: "+97155512345",
      company: "Gulf Tech",
      country: "UAE",
    },
    duration: 43,
    outcome: "NOT_INTERESTED",
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "c4",
    leadId: "5",
    lead: {
      id: "5",
      name: "Emily Chen",
      phone: "+16045557712",
      company: "Pacific Tech",
      country: "CA",
    },
    duration: 0,
    outcome: "VOICEMAIL",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "c5",
    leadId: "8",
    lead: {
      id: "8",
      name: "David Kim",
      phone: "+12125551102",
      company: "FinTech Solutions",
      country: "US",
    },
    duration: 302,
    outcome: "BOOKED",
    transcript: sampleTranscript,
    meetingAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
];

export const mockCampaignSettings: CampaignSettings = {
  callingHoursStart: "09:00",
  callingHoursEnd: "18:00",
  timezone: "America/New_York",
  maxAttemptsPerLead: 3,
  retryIntervalMinutes: 120,
  usNumber: "+12125550000",
  caNumber: "+14165550000",
  uaeNumber: "+97145550000",
};

export const mockAgentSettings: AgentSettings = {
  systemPrompt: `You are Alex, a professional sales representative for Wayne Solutions, an IT services company based in India serving clients in the USA, Canada, and Dubai. You are making a friendly, professional cold call.

YOUR GOAL: Qualify the prospect and book a 15-minute discovery call.

SERVICES YOU OFFER:
- Custom web and mobile app development
- IT staff augmentation (dedicated developers)
- Cloud migration and DevOps
- UI/UX design
- SEO and digital marketing

CALL STRUCTURE:
1. Introduce yourself and ask if they have 60 seconds
2. Qualify: ask about their current tech challenges
3. Pitch: connect their pain to one of your services
4. Handle objection if any
5. Ask for a 15-min discovery call and offer 2 time slots

RULES:
- Keep responses under 3 sentences.
- Never say you are an AI unless directly asked.
- Always sound warm, confident, not pushy.`,
  voiceId: "21m00Tcm4TlvDq8ikWAM",
  voiceProvider: "11labs",
  firstMessage: "Hi, this is Alex from Wayne Solutions. Am I speaking with the right person?",
  llmModel: "gpt-4o-mini",
  maxTokens: 150,
  temperature: 0.7,
};

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

export const mockApi = {
  getStats: async (): Promise<DashboardStats> => mockStats,
  listLeads: async (page = 1, pageSize = 20): Promise<PaginatedResponse<Lead>> =>
    paginate(mockLeads, page, pageSize),
  listCalls: async (page = 1, pageSize = 25): Promise<PaginatedResponse<Call>> =>
    paginate(mockCalls, page, pageSize),
  getCall: async (id: string): Promise<Call> => {
    const call = mockCalls.find((c) => c.id === id);
    if (!call) throw new Error("Not found");
    return call;
  },
  getCampaign: async (): Promise<CampaignSettings> => mockCampaignSettings,
  getAgent: async (): Promise<AgentSettings> => mockAgentSettings,
};
