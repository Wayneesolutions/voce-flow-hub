import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  Calendar,
  CalendarCheck2,
  FileAudio,
  Globe,
  Headphones,
  Home,
  Layers,
  MessageSquare,
  PhoneCall,
  Plug,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Upload,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services · VoCallM — AI voice calling platform" },
      {
        name: "description",
        content:
          "Full-stack AI outbound calling — lead management, script review, campaign scheduling, meeting booking, live analytics and white-label portals.",
      },
    ],
  }),
  component: Services,
});

// ── Data ────────────────────────────────────────────────────────────────────

const CORE_SERVICES = [
  {
    icon: PhoneCall,
    title: "AI Voice Calling",
    body: "GPT-4o brain + ElevenLabs voice. Your AI agent makes real phone calls, speaks naturally, handles interruptions and never gets tired.",
    highlights: ["Human-sounding voices", "Real-time objection handling", "Multilingual support"],
  },
  {
    icon: Upload,
    title: "Lead Upload & Management",
    body: "Drop a CSV and we handle the rest — deduplication, phone number validation, E.164 formatting, and status tracking across every attempt.",
    highlights: ["Up to 10,000 leads per upload", "Automatic dedup & validation", "Status: booked, callback, opted-out"],
  },
  {
    icon: ShieldCheck,
    title: "Human Script Review",
    body: "Every script goes through a Wayne Solutions account manager before going live — checking compliance, pitch quality and tone.",
    highlights: ["FTC / TCPA compliant review", "Approved within hours", "Feedback loop if changes needed"],
  },
  {
    icon: Calendar,
    title: "Campaign Scheduling",
    body: "Create multiple campaigns with custom calling hours, timezones, days of week, max attempts and retry intervals — all configurable.",
    highlights: ["Timezone-aware dialing", "Do-not-call hours enforced", "Retry logic with cooldown"],
  },
  {
    icon: CalendarCheck2,
    title: "Automated Meeting Booking",
    body: "When a prospect says yes, the agent checks your live calendar, picks an open slot and sends a confirmation by SMS and email instantly.",
    highlights: ["Cal.com & Google Calendar", "SMS + email confirmation", "Reschedule & cancel handling"],
  },
  {
    icon: FileAudio,
    title: "Recordings & Transcripts",
    body: "Every call is stored with a full recording, Deepgram transcript, AI-generated summary and outcome label — searchable from your dashboard.",
    highlights: ["Deepgram real-time STT", "AI call summaries", "Downloadable MP3 recordings"],
  },
  {
    icon: BarChart3,
    title: "Live Analytics Dashboard",
    body: "Track calls made, meetings booked, conversion rate, call outcomes and minutes used — all updating in real time.",
    highlights: ["Real-time KPI cards", "Outcome breakdown charts", "Billed minutes tracking"],
  },
  {
    icon: Layers,
    title: "White-Label Client Portal",
    body: "Each client gets their own branded portal — custom logo, colors and domain. Fully isolated tenant data. Looks like your software.",
    highlights: ["Custom domain support", "Per-tenant branding", "Isolated data per client"],
  },
  {
    icon: Plug,
    title: "CRM & Tool Integrations",
    body: "Push meeting data, outcomes and transcripts directly into your CRM or project tools via native integrations and webhooks.",
    highlights: ["HubSpot & Salesforce", "GoHighLevel & Pipedrive", "Webhooks for custom CRMs"],
  },
];

const INDUSTRIES = [
  { icon: Building2, name: "SaaS & Technology", body: "Book product demos with decision-makers at SMBs and mid-market companies." },
  { icon: Home, name: "Real Estate", body: "Generate listing appointments and buyer consultations across US and Canada." },
  { icon: Stethoscope, name: "Healthcare & Dental", body: "Reach out to qualified patients for consultations and appointment reminders." },
  { icon: TrendingUp, name: "Financial Services", body: "Connect advisors with prospects interested in wealth management or insurance." },
  { icon: Users, name: "Recruitment & HR", body: "Screen candidates and schedule first-round interviews at scale." },
  { icon: Globe, name: "Agencies (White-label)", body: "Offer AI calling as a managed service under your own brand and domain." },
];

const TECH_STACK = [
  { name: "Twilio / Vapi", role: "Telephony & call routing" },
  { name: "Deepgram", role: "Real-time speech-to-text" },
  { name: "GPT-4o", role: "Conversation intelligence" },
  { name: "ElevenLabs", role: "Natural voice synthesis" },
  { name: "Cal.com", role: "Calendar & meeting booking" },
  { name: "HubSpot", role: "CRM integration" },
  { name: "Twilio SMS", role: "Meeting confirmations" },
  { name: "AWS S3", role: "Recording & file storage" },
];

const REGIONS = [
  { flag: "🇺🇸", region: "United States", detail: "Local presence dialing, TCPA compliant, EST/CST/MST/PST aware" },
  { flag: "🇨🇦", region: "Canada", detail: "CASL compliant, English & French capable, Ontario to BC coverage" },
  { flag: "🇦🇪", region: "Dubai & UAE", detail: "Arabic-aware scripts, UAE calling hours, GST-inclusive billing" },
];

// ── Component ────────────────────────────────────────────────────────────────

function Services() {
  return (
    <MarketingShell>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="container-page py-20 md:py-24 max-w-3xl">
          <p className="text-sm font-medium text-accent uppercase tracking-widest">Our services</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Everything your outbound motion needs — built in.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            VoCallM isn't just a dialer. It's a complete AI-powered outbound stack — from lead
            upload and script review to live calling, meeting booking and CRM sync.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Book a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center h-11 px-5 rounded-md border border-border bg-background text-sm font-medium hover:bg-secondary transition-colors"
            >
              See how it works
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-success" /> No setup fees
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-success" /> Live in 48 hours
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-success" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* ── Core Services Grid ───────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="container-page py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Nine services. One platform.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every tool you need to run a high-volume outbound operation — without stitching
              together a dozen point solutions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CORE_SERVICES.map(({ icon: Icon, title, body, highlights }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 flex flex-col hover:shadow-md hover:border-accent/30 transition-all"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="mt-4 font-semibold text-base">{title}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{body}</p>
                <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <BadgeCheck className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Regional Coverage ────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/40">
        <div className="container-page py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-medium text-accent uppercase tracking-widest">Coverage</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
                Built for USA, Canada and Dubai.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Each region has its own compliance rules, calling hours and cultural nuances. VoCallM
                handles all of it — so your agent sounds local and stays legal.
              </p>
              <Link
                to="/contact"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                Ask about your region <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-4">
              {REGIONS.map(({ flag, region, detail }) => (
                <div
                  key={region}
                  className="rounded-xl border border-border bg-card p-5 flex items-start gap-4"
                >
                  <span className="text-3xl leading-none shrink-0">{flag}</span>
                  <div>
                    <div className="font-semibold">{region}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Industries ───────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="container-page py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-medium text-accent uppercase tracking-widest">Industries</p>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Who we work with
            </h2>
            <p className="mt-3 text-muted-foreground">
              VoCallM fits any business that relies on outbound calls to book qualified
              conversations.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {INDUSTRIES.map(({ icon: Icon, name, body }) => (
              <div
                key={name}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-md hover:border-accent/30 transition-all"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="mt-4 font-semibold">{name}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technology Stack ─────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/40">
        <div className="container-page py-20">
          <div className="grid lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-1">
              <p className="text-sm font-medium text-accent uppercase tracking-widest">
                Tech stack
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Best-in-class providers. Pre-integrated.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We've wired together the most reliable AI, telephony and data providers so you never
                have to manage API keys, rate limits or billing with vendors.
              </p>
              <Link
                to="/how-it-works"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                See the full flow <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
              {TECH_STACK.map(({ name, role }) => (
                <div
                  key={name}
                  className="rounded-lg border border-border bg-card px-5 py-4 flex items-center gap-4"
                >
                  <span className="h-9 w-9 shrink-0 rounded-md bg-accent/10 text-accent inline-flex items-center justify-center">
                    <Workflow className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why VoCallM ──────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="container-page py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-medium text-accent uppercase tracking-widest">Why us</p>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              More than software — a managed service.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Unlike raw AI dialers, VoCallM includes hands-on account management, script review,
              and ongoing performance coaching.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Bot,
                title: "AI that sounds human",
                body: "GPT-4o reasoning + ElevenLabs voice. Prospects routinely don't know it's AI.",
              },
              {
                icon: ShieldCheck,
                title: "Fully compliant",
                body: "Scripts reviewed for TCPA, CASL and UAE regulations before every campaign goes live.",
              },
              {
                icon: Headphones,
                title: "Dedicated support",
                body: "Every account gets a manager on WhatsApp plus weekly performance review calls.",
              },
              {
                icon: Zap,
                title: "Live in 48 hours",
                body: "From signed agreement to AI making calls in 48 hours. No months-long implementation.",
              },
              {
                icon: BookOpen,
                title: "Full transparency",
                body: "Every transcript, recording and outcome is visible in your dashboard — nothing hidden.",
              },
              {
                icon: MessageSquare,
                title: "Script coaching",
                body: "We analyse call transcripts and suggest improvements to maximise your conversion rate.",
              },
              {
                icon: Globe,
                title: "Multi-region dialing",
                body: "Local presence numbers in US, Canada and UAE. Prospects see a local caller ID.",
              },
              {
                icon: TrendingUp,
                title: "Pay per result",
                body: "No seat licences, no minimums. You pay only for the minutes your agent actually talks.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-accent/30 transition-all"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="mt-3 font-semibold text-sm">{title}</div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground">
        <div className="container-page py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Ready to put your outbound on autopilot?
            </h3>
            <p className="mt-2 text-primary-foreground/80 max-w-xl">
              Book a 20-minute demo. We'll walk through every service live and show you exactly what
              it would cost for your team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/contact"
              className="inline-flex h-11 px-6 items-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              Book a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-11 px-6 items-center rounded-md border border-primary-foreground/30 text-sm font-medium hover:bg-primary-foreground/10 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
