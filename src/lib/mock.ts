export const clients = [
  { id: "acme", name: "Acme Plumbing", owner: "John Doe", email: "john@acmeplumbing.com", rate: 1.5, minutes: 1200, revenue: 1800, cost: 720, profit: 1080, status: "active" },
  { id: "techbase", name: "TechBase Solutions", owner: "Priya Patel", email: "priya@techbase.io", rate: 1.6, minutes: 1500, revenue: 2400, cost: 960, profit: 1440, status: "active" },
  { id: "gulf", name: "Gulf Digital", owner: "Omar Khan", email: "omar@gulfdigital.ae", rate: 1.5, minutes: 800, revenue: 1200, cost: 480, profit: 720, status: "active" },
  { id: "northstar", name: "Northstar Realty", owner: "Sarah Mills", email: "sarah@northstar.com", rate: 1.4, minutes: 640, revenue: 896, cost: 384, profit: 512, status: "trial" },
];

export const billingTotals = {
  minutes: 4140,
  revenue: 6296,
  cost: 2544,
  profit: 3752,
};

export const recentCalls = [
  { id: "c1", contact: "Sarah Mills", company: "Northstar Realty", duration: "3:42", outcome: "Meeting booked", time: "2 min ago" },
  { id: "c2", contact: "Maria Costa", company: "Retail Co", duration: "1:18", outcome: "Callback", time: "8 min ago" },
  { id: "c3", contact: "Tom Walsh", company: "BuildCo", duration: "0:24", outcome: "Voicemail", time: "14 min ago" },
  { id: "c4", contact: "Lina Park", company: "Park Dental", duration: "2:55", outcome: "Meeting booked", time: "22 min ago" },
  { id: "c5", contact: "Daniel Reed", company: "Reed & Co", duration: "0:48", outcome: "Not interested", time: "35 min ago" },
  { id: "c6", contact: "Aisha Khan", company: "Khan Logistics", duration: "4:11", outcome: "Meeting booked", time: "47 min ago" },
];

export const upcomingMeetings = [
  { id: "m1", contact: "Sarah Mills", company: "Northstar Realty", when: "Tue, 10 Jun · 2:00 PM" },
  { id: "m2", contact: "Maria Costa", company: "Retail Co", when: "Wed, 11 Jun · 10:00 AM" },
  { id: "m3", contact: "Tom Walsh", company: "BuildCo", when: "Fri, 13 Jun · 3:30 PM" },
  { id: "m4", contact: "Lina Park", company: "Park Dental", when: "Mon, 16 Jun · 11:15 AM" },
];

export const callsByHour = [
  { h: "8a", calls: 12 }, { h: "9a", calls: 38 }, { h: "10a", calls: 64 },
  { h: "11a", calls: 71 }, { h: "12p", calls: 42 }, { h: "1p", calls: 35 },
  { h: "2p", calls: 68 }, { h: "3p", calls: 82 }, { h: "4p", calls: 59 }, { h: "5p", calls: 31 },
];

export const revenueByMonth = [
  { m: "Jan", revenue: 3200, profit: 1900 }, { m: "Feb", revenue: 3900, profit: 2300 },
  { m: "Mar", revenue: 4400, profit: 2600 }, { m: "Apr", revenue: 5100, profit: 3000 },
  { m: "May", revenue: 5800, profit: 3450 }, { m: "Jun", revenue: 6296, profit: 3752 },
];

export const callOutcomes = [
  { name: "Meeting booked", value: 84, color: "#10B981" },
  { name: "Callback", value: 56, color: "#2E86DE" },
  { name: "Not interested", value: 72, color: "#F59E0B" },
  { name: "Voicemail", value: 98, color: "#94A3B8" },
  { name: "No answer", value: 132, color: "#CBD5E1" },
];

export const pendingScripts = [
  { id: "s1", client: "Acme Plumbing", title: "Spring promo · plumbing leads", submitted: "2h ago" },
  { id: "s2", client: "Gulf Digital", title: "B2B SaaS demo bookings", submitted: "5h ago" },
  { id: "s3", client: "Northstar Realty", title: "Investor outreach v2", submitted: "Yesterday" },
];

export const adminKpis = {
  activeClients: 14,
  callsToday: 342,
  minutesUsed: 4140,
  meetingsBooked: 84,
  revenue: 6296,
  profit: 3752,
};

export const portalKpis = {
  totalCalls: 342,
  meetings: 28,
  minutes: 1200,
  callbacks: 14,
};
