import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { CheckCircle2, Mail, MapPin, MessageCircle, Loader2 } from "lucide-react";
import { contactApi } from "@/lib/api";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Book a VoCallM demo" },
      {
        name: "description",
        content:
          "Talk to the Wayne E Solutions team. Book a 20-minute demo and see VoCallM call a real lead live.",
      },
    ],
  }),
  component: Contact,
});

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  callVolume: string;
  message: string;
}

const EMPTY: FormState = {
  firstName: "", lastName: "", email: "", company: "",
  phone: "", callVolume: "", message: "",
};

function Contact() {
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await contactApi.submit({
        firstName:  form.firstName,
        lastName:   form.lastName,
        email:      form.email,
        company:    form.company,
        phone:      form.phone  || undefined,
        callVolume: form.callVolume || undefined,
        message:    form.message   || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
        "Something went wrong. Please try again or email us directly."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MarketingShell>
      <section className="container-page py-20 grid lg:grid-cols-2 gap-12">
        {/* Left — info */}
        <div>
          <p className="text-sm font-medium text-accent uppercase tracking-widest">Book a demo</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
            Let's show you AI calling, live.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">
            Fill out the form and a member of the Wayne E Solutions team will get back within one
            business day to schedule a 20-minute demo.
          </p>

          <ul className="mt-8 space-y-4">
            <Info
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value="hr@wayneesolutions.com"
              href="mailto:hr@wayneesolutions.com"
            />
            <Info
              icon={<MessageCircle className="h-4 w-4" />}
              label="WhatsApp"
              value="+91 99999 99999"
            />
            <Info
              icon={<MapPin className="h-4 w-4" />}
              label="Headquartered in"
              value="India · Serving USA, Canada, Dubai"
            />
          </ul>
        </div>

        {/* Right — form */}
        <div className="rounded-xl border border-border bg-card p-7 shadow-sm">
          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <h3 className="mt-4 text-xl font-semibold">Thanks — we'll be in touch.</h3>
              <p className="mt-2 text-muted-foreground">Expect a reply within one business day.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold">Tell us about your team</h3>

              <Row>
                <Field label="First name" value={form.firstName} onChange={set("firstName")} required />
                <Field label="Last name"  value={form.lastName}  onChange={set("lastName")}  required />
              </Row>
              <Field label="Work email" type="email" value={form.email}   onChange={set("email")}   required />
              <Field label="Company"                 value={form.company} onChange={set("company")} required />
              <Row>
                <Field label="Phone" value={form.phone} onChange={set("phone")} />
                <SelectField
                  label="Monthly call volume"
                  value={form.callVolume}
                  onChange={set("callVolume")}
                  options={["", "< 500", "500–2,000", "2,000–10,000", "10,000+"]}
                />
              </Row>
              <div>
                <label className="text-sm font-medium">What would you like to achieve?</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={set("message")}
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Sending…" : "Request a demo"}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                By submitting you agree to our privacy policy.
              </p>
            </form>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}

function Info({
  icon, label, value, href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
        {icon}
      </span>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        {href ? (
          <a href={href} className="text-sm font-medium hover:text-accent transition-colors">
            {value}
          </a>
        ) : (
          <div className="text-sm font-medium">{value}</div>
        )}
      </div>
    </li>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label, type = "text", value, onChange, required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
    </div>
  );
}

function SelectField({
  label, options, value, onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="mt-1.5 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "" ? "Select…" : o}
          </option>
        ))}
      </select>
    </div>
  );
}
