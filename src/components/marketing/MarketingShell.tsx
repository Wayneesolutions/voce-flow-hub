import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PhoneCall, Menu, X, Mail, MapPin } from "lucide-react";
import { useState } from "react";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingNav />
      <main className="flex-1 flex flex-col">{children}</main>
      <MarketingFooter />
    </div>
  );
}

function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <PhoneCall className="h-4 w-4" />
          </span>
          <span className="text-base">Quor</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link
            to="/how-it-works"
            activeProps={{ className: "text-foreground font-medium" }}
            className="hover:text-foreground transition-colors"
          >
            How it works
          </Link>
          <Link
            to={"/services" as "/"}
            activeProps={{ className: "text-foreground font-medium" }}
            className="hover:text-foreground transition-colors"
          >
            Services
          </Link>
          <Link
            to="/pricing"
            activeProps={{ className: "text-foreground font-medium" }}
            className="hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/contact"
            activeProps={{ className: "text-foreground font-medium" }}
            className="hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            to="/login"
            activeProps={{ className: "bg-secondary" }}
            className="h-9 inline-flex items-center rounded-lg px-4 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Sign in
          </Link>
          <Link
            to={"/register" as "/"}
            className="h-9 inline-flex items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-5 pt-3 space-y-1">
          {(
            [
              ["How it works", "/how-it-works"],
              ["Services", "/services"],
              ["Pricing", "/pricing"],
              ["Contact", "/contact"],
            ] as [string, "/how-it-works" | "/pricing" | "/contact" | "/services"][]
          ).map(([label, href]) => (
            <Link
              key={href}
              to={href}
              className="flex py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-border mt-2">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="h-10 inline-flex items-center justify-center rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              Sign in
            </Link>
            <Link
              to={"/register" as "/"}
              onClick={() => setOpen(false)}
              className="h-10 inline-flex items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container-page py-14 grid gap-10 md:grid-cols-5 text-sm">
        {/* Brand column — wider */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 font-bold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PhoneCall className="h-3.5 w-3.5" />
            </span>
            Quor
          </div>
          <p className="mt-3.5 text-muted-foreground leading-relaxed max-w-xs">
            AI sales agents that book qualified meetings on autopilot. Built for businesses across
            USA, Canada and Dubai.
          </p>
          <ul className="mt-5 space-y-2.5">
            <li>
              <a
                href="mailto:hr@wayneesolutions.com"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                hr@wayneesolutions.com
              </a>
            </li>
            <li className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              India · USA · Canada · Dubai
            </li>
          </ul>
        </div>

        <FooterCol
          title="Product"
          items={[
            ["How it works", "/how-it-works"],
            ["Services", "/services"],
            ["Pricing", "/pricing"],
            ["Book a demo", "/contact"],
            ["Get started", "/register"],
          ]}
        />
        <FooterCol
          title="Company"
          items={[
            ["Contact", "/contact"],
          ]}
        />
        <FooterCol
          title="Account"
          items={[
            ["Client login", "/login"],
            ["Request access", "/register"],
          ]}
        />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border bg-muted/30">
        <div className="container-page py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {year} Wayne E Solutions · Quor. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              All systems operational
            </span>
            <span>USA · Canada · Dubai</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <div className="font-semibold text-foreground text-xs uppercase tracking-wider">{title}</div>
      <ul className="mt-4 space-y-2.5 text-muted-foreground">
        {items.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="hover:text-foreground transition-colors">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
