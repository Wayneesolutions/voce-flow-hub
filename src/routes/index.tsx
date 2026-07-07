import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Calendar,
  FileAudio,
  Headphones,
  MessageSquare,
  PhoneCall,
  Quote,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container-page py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              New · GPT-4o powered voice agent
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              AI sales agents that <span className="text-accent">book meetings</span> while you
              sleep.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Upload your leads. Approve a script. Quor dials, qualifies, handles objections and
              books meetings on your calendar — at $0.30 per minute.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Book a free demo <ArrowRight className="h-4 w-4" />
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
                <BadgeCheck className="h-4 w-4 text-success" /> USA · Canada · Dubai
              </span>
            </div>
          </div>
          <DemoCard />
        </div>
      </section>

      {/* Logos / trust */}
      <section className="border-b border-border bg-muted/40">
        <div className="container-page py-10 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Trusted by growth teams powering
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 items-center text-sm text-muted-foreground font-semibold">
            {[
              "Acme Plumbing",
              "TechBase",
              "Gulf Digital",
              "Northstar",
              "Park Dental",
              "Reed & Co",
            ].map((n) => (
              <div key={n} className="opacity-70 hover:opacity-100 transition-opacity">
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border">
        <div className="container-page py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent mb-3">
                  {s.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold tracking-tight">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border">
        <div className="container-page py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Everything you need to run an outbound team — minus the team.
            </h2>
            <p className="mt-3 text-muted-foreground">
              From CSV upload to booked meeting, Quor owns the whole motion. You only show up to
              the call.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border border-border bg-card p-6 hover:shadow-md transition-shadow">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">
                  {f.icon}
                </span>
                <div className="mt-4 font-semibold">{f.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-border bg-muted/40">
        <div className="container-page py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              What our clients say
            </h2>
            <p className="mt-3 text-muted-foreground">
              Real results from businesses using Quor across USA, Canada and Dubai.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
                <Quote className="h-5 w-5 text-accent opacity-60" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div
                    className="h-9 w-9 rounded-full inline-flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-b border-border">
        <div className="container-page py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Pay per minute. No retainers. No SDRs to manage.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg">
              A single rate per talk minute covers dialing, voice, transcription, AI and calendar
              booking. Compare it against the cost of even one junior SDR.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/pricing"
                className="inline-flex h-10 px-5 items-center rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                See full pricing
              </Link>
              <Link
                to="/contact"
                className="inline-flex h-10 px-5 items-center rounded-md border border-border bg-background text-sm font-medium hover:bg-secondary transition-colors"
              >
                Talk to sales
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="text-sm text-muted-foreground">Starting at</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight">$0.30</span>
              <span className="text-muted-foreground">/ talk minute</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Unlimited contacts",
                "White-label client portal",
                "Calendar + CRM integrations",
                "Real-time transcripts & recordings",
                "Human-in-the-loop script review",
              ].map((i) => (
                <li key={i} className="flex gap-2">
                  <BadgeCheck className="h-4 w-4 text-success shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border bg-muted/40">
        <div className="container-page py-20 grid lg:grid-cols-3 gap-10">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
            <p className="mt-3 text-muted-foreground">
              Can't find what you need?{" "}
              <Link to="/contact" className="text-accent hover:underline">
                Talk to us.
              </Link>
            </p>
          </div>
          <div className="lg:col-span-2 divide-y divide-border border-y border-border">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {f.q}
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform text-xl leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="container-page py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Book a 20-minute demo
            </h3>
            <p className="mt-2 text-primary-foreground/80 max-w-xl">
              See Quor call a real lead live. We'll show you the dashboard, the call flow, and
              exactly what it would cost for your team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/contact"
              className="inline-flex h-11 px-6 items-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Book a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-11 px-6 items-center rounded-md border border-primary-foreground/30 text-sm font-medium hover:bg-primary-foreground/10 transition-colors"
            >
              Client login
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

function DemoCard() {
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-10 border-b border-border bg-muted/50">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-3 text-xs text-muted-foreground">live call · quor</span>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/10 text-accent inline-flex items-center justify-center">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Calling Sarah Mills</div>
              <div className="text-xs text-muted-foreground">Northstar Realty · Toronto</div>
            </div>
          </div>
          <span className="text-xs text-success font-medium inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live · 01:42
          </span>
        </div>
        <div className="space-y-3 text-sm">
          <Bubble who="ai">
            Hi Sarah, this is Alex from Northstar. Do you have a quick moment?
          </Bubble>
          <Bubble who="lead">Sure, what's this regarding?</Bubble>
          <Bubble who="ai">
            We're helping realtors in Toronto book 8–12 extra listings a month. Could I show you how
            on a 15-minute call this week?
          </Bubble>
          <Bubble who="lead">Yeah, Wednesday works.</Bubble>
        </div>
        <div className="rounded-md bg-success/10 border border-success/20 px-3 py-2.5 text-xs text-success font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Meeting booked · Wed 11 Jun, 2:00 PM
        </div>
      </div>
    </div>
  );
}

function Bubble({ who, children }: { who: "ai" | "lead"; children: React.ReactNode }) {
  const isAi = who === "ai";
  return (
    <div className={isAi ? "flex justify-start" : "flex justify-end"}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${isAi ? "bg-secondary text-foreground rounded-bl-sm" : "bg-accent text-accent-foreground rounded-br-sm"}`}
      >
        {children}
      </div>
    </div>
  );
}

const stats = [
  {
    value: "12,400+",
    label: "Meetings booked",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    value: "98%",
    label: "Call answer accuracy",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    value: "340+",
    label: "Active clients",
    icon: <Users className="h-5 w-5" />,
  },
  {
    value: "$0.30",
    label: "Per talk minute",
    icon: <Zap className="h-5 w-5" />,
  },
];

const testimonials = [
  {
    quote:
      "We went from 3 booked demos a week to 14 within the first month. The AI handles objections better than half my SDR team.",
    name: "Marcus Reid",
    title: "Head of Sales · TechBase Inc.",
    initials: "MR",
    color: "#0EA5E9",
  },
  {
    quote:
      "Setup was painless. We uploaded our leads on Monday, approved the script Tuesday, and had our first booked meeting by Wednesday afternoon.",
    name: "Aisha Al-Farsi",
    title: "CEO · Gulf Digital Agency",
    initials: "AA",
    color: "#8B5CF6",
  },
  {
    quote:
      "The transcripts alone are worth it. I can coach my team on exactly where prospects dropped off and what objections we need to address.",
    name: "Jordan Park",
    title: "VP Revenue · Northstar Realty",
    initials: "JP",
    color: "#10B981",
  },
];

const features = [
  {
    icon: <Upload className="h-5 w-5" />,
    title: "CSV lead upload",
    body: "Drag in a list. We dedupe, validate phone numbers and normalize timezones.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Script + objections",
    body: "Write the pitch once. AI handles objections, FAQs and tone in every call.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Human-reviewed",
    body: "Wayne E Solutions reviews and approves every script before it goes live.",
  },
  {
    icon: <PhoneCall className="h-5 w-5" />,
    title: "AI talks like a human",
    body: "ElevenLabs voice + GPT-4o brain. Real-time, natural, multilingual.",
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    title: "Books meetings",
    body: "Checks your calendar, picks the best slot and confirms by SMS/email.",
  },
  {
    icon: <FileAudio className="h-5 w-5" />,
    title: "Recordings + transcripts",
    body: "Every call is logged with summary, full transcript and audio playback.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Live analytics",
    body: "Track calls, outcomes, meetings booked and minutes used in real time.",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "White-label portal",
    body: "Spin up a branded portal per client — custom logo, colors, domain.",
  },
  {
    icon: <Headphones className="h-5 w-5" />,
    title: "Always-on support",
    body: "Account managers on WhatsApp, email and weekly performance reviews.",
  },
];

const faqs = [
  {
    q: "How fast can I go live?",
    a: "Most clients are live within 48 hours: lead upload, script approval, then we route your first numbers.",
  },
  {
    q: "Do prospects know it's AI?",
    a: "We follow disclosure laws in each region (USA, Canada, Dubai). The agent is upfront when asked.",
  },
  {
    q: "What if the AI gets a hard question?",
    a: "It handles common objections instantly, can request a callback, and escalates anything off-script.",
  },
  {
    q: "Can I use my own phone numbers?",
    a: "Yes. Bring your own Twilio / SIP trunk or use ours. We support local presence dialing.",
  },
  {
    q: "What integrations do you support?",
    a: "HubSpot, Salesforce, GoHighLevel, Pipedrive, Google Calendar, Outlook, and webhooks for custom CRMs.",
  },
  {
    q: "Is there a minimum commitment?",
    a: "No minimums, no lock-in. Pay only for the minutes your agent actually talks. Scale up or down any time.",
  },
];
