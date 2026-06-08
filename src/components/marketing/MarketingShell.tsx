import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PhoneCall } from "lucide-react";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}

function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PhoneCall className="h-4 w-4" />
          </span>
          <span>VoCallM</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <Link
            to="/how-it-works"
            activeProps={{ className: "text-foreground" }}
            className="hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            to="/pricing"
            activeProps={{ className: "text-foreground" }}
            className="hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            to="/contact"
            activeProps={{ className: "text-foreground" }}
            className="hover:text-foreground"
          >
            Contact
          </Link>
          <a href="/admin" className="hover:text-foreground">
            Admin
          </a>
          <a href="/portal" className="hover:text-foreground">
            Client portal
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/contact"
            className="hidden sm:inline-flex h-9 items-center rounded-md px-3 text-sm text-foreground hover:bg-secondary"
          >
            Sign in
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container-page py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PhoneCall className="h-3.5 w-3.5" />
            </span>
            VoCallM
          </div>
          <p className="mt-3 text-muted-foreground max-w-xs">
            AI sales agents that book qualified meetings on autopilot. Built for businesses in the
            USA, Canada and Dubai.
          </p>
        </div>
        <FooterCol
          title="Product"
          items={[
            ["How it works", "/how-it-works"],
            ["Pricing", "/pricing"],
            ["Book demo", "/contact"],
          ]}
        />
        <FooterCol
          title="Company"
          items={[
            ["About", "/"],
            ["Contact", "/contact"],
            ["Privacy", "/"],
            ["Terms", "/"],
          ]}
        />
        <FooterCol
          title="For teams"
          items={[
            ["Admin portal", "/admin"],
            ["Client portal", "/portal"],
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="container-page py-5 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Wayne Solutions · VoCallM</span>
          <span>Built for USA · Canada · Dubai</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <div className="font-medium text-foreground">{title}</div>
      <ul className="mt-3 space-y-2 text-muted-foreground">
        {items.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="hover:text-foreground">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
