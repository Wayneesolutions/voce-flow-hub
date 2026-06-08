import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { CheckCircle2, Mail, MapPin, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Book a VoCallM demo" },
      { name: "description", content: "Talk to the Wayne Solutions team. Book a 20-minute demo and see VoCallM call a real lead live." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <MarketingShell>
      <section className="container-page py-20 grid lg:grid-cols-2 gap-12">
        <div>
          <p className="text-sm font-medium text-accent uppercase tracking-widest">Book a demo</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">Let's show you AI calling, live.</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">
            Fill out the form and a member of the Wayne Solutions team will get back within one business day to schedule a 20-minute demo.
          </p>

          <ul className="mt-8 space-y-4">
            <Info icon={<Mail className="h-4 w-4"/>} label="Email" value="hello@vocallm.com" />
            <Info icon={<MessageCircle className="h-4 w-4"/>} label="WhatsApp" value="+91 99999 99999" />
            <Info icon={<MapPin className="h-4 w-4"/>} label="Headquartered in" value="India · Serving USA, Canada, Dubai" />
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-7 shadow-sm">
          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <h3 className="mt-4 text-xl font-semibold">Thanks — we'll be in touch.</h3>
              <p className="mt-2 text-muted-foreground">Expect a reply within one business day.</p>
            </div>
          ) : (
            <form onSubmit={(e)=>{e.preventDefault(); setSubmitted(true);}} className="space-y-4">
              <h3 className="text-lg font-semibold">Tell us about your team</h3>
              <Row><Field label="First name" /><Field label="Last name" /></Row>
              <Field label="Work email" type="email" />
              <Field label="Company" />
              <Row><Field label="Phone" /><Select label="Monthly call volume" options={["< 500", "500–2,000", "2,000–10,000", "10,000+"]} /></Row>
              <div>
                <label className="text-sm font-medium">What would you like to achieve?</label>
                <textarea rows={4} className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"/>
              </div>
              <button className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                Request a demo
              </button>
              <p className="text-xs text-muted-foreground text-center">By submitting you agree to our privacy policy.</p>
            </form>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent">{icon}</span>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </li>
  );
}
function Row({ children }: { children: React.ReactNode }) { return <div className="grid sm:grid-cols-2 gap-4">{children}</div>; }
function Field({ label, type="text" }: { label: string; type?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input type={type} className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"/>
    </div>
  );
}
function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40">
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
