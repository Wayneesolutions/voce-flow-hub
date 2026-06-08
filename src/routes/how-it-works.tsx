import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  FileCheck2,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Upload,
  Mic,
} from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How VoCallM works — from lead to booked meeting" },
      {
        name: "description",
        content:
          "Step-by-step: upload leads, write a script, get human review, AI dials, qualifies, handles objections and books meetings.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    icon: <Upload className="h-5 w-5" />,
    title: "1. Upload your leads",
    body: "Drop a CSV — name, phone, country, company. We validate, dedupe and normalize numbers to E.164.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "2. Write your script",
    body: "Tell the AI about your company, services, the goal, common objections and an FAQ doc. Pick a voice.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "3. Wayne reviews",
    body: "Your account manager reviews the script for compliance and pitch quality. Approved within hours.",
  },
  {
    icon: <PhoneCall className="h-5 w-5" />,
    title: "4. AI starts calling",
    body: "Campaign goes live in your timezone and calling hours. Smart retries, local presence, do-not-call respected.",
  },
  {
    icon: <Mic className="h-5 w-5" />,
    title: "5. AI talks to prospects",
    body: "GPT-4o + ElevenLabs. Natural speech, real-time interruption handling, multilingual.",
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    title: "6. Books meetings",
    body: "Checks your calendar, picks the right slot, sends a confirmation by SMS and email.",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "7. Everything logged",
    body: "Recording, transcript, AI summary, outcome, and CRM update — visible in your dashboard.",
  },
];

function HowItWorks() {
  return (
    <MarketingShell>
      <section className="border-b border-border">
        <div className="container-page py-20 max-w-3xl">
          <p className="text-sm font-medium text-accent uppercase tracking-widest">How it works</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
            From a CSV to a booked meeting — without lifting a finger.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Here's the full VoCallM flow. Seven steps, fully managed, live in 48 hours.
          </p>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="relative space-y-8">
          {steps.map((s, i) => (
            <div key={s.title} className="grid md:grid-cols-[140px_1fr] gap-6 items-start">
              <div className="text-xs uppercase tracking-widest text-muted-foreground md:text-right md:pt-3">
                Step {i + 1}
              </div>
              <div className="rounded-lg border border-border bg-card p-6 flex gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                  {s.icon}
                </span>
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="container-page py-16">
          <h2 className="text-2xl font-semibold tracking-tight">The tech stack under the hood</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Best-in-class providers, wired together so you never have to think about them.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Twilio / Vapi", "Telephony & dialing"],
              ["Deepgram", "Real-time transcription"],
              ["GPT-4o", "Conversation brain"],
              ["ElevenLabs", "Natural voice synthesis"],
            ].map(([n, d]) => (
              <div key={n} className="rounded-lg border border-border bg-card p-5">
                <div className="font-semibold">{n}</div>
                <div className="text-sm text-muted-foreground mt-1">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container-page py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
              <FileCheck2 className="h-7 w-7" />
              Ready to see it call a real lead?
            </h3>
            <p className="mt-2 text-primary-foreground/80 max-w-xl">
              Book a 20-minute demo. We'll dial your test number live.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex h-11 px-6 items-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90"
          >
            Book a demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
