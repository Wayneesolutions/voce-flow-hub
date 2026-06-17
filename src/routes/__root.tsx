import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "../store";
import { AuthProvider } from "../context/auth";
import { PhoneCall, Home, ArrowLeft } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  const isAdmin = !!store.getState().adminAuth.user;
  const isClient = !!store.getState().userAuth?.user;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Brand mark */}
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-8 shadow-lg">
        <PhoneCall className="h-6 w-6" />
      </div>

      {/* 404 number */}
      <div className="relative mb-6 select-none">
        <span className="text-[120px] font-black leading-none text-muted/30 tracking-tighter">
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-[120px] font-black leading-none text-foreground/5 tracking-tighter blur-sm">
          404
        </span>
      </div>

      {/* Text */}
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm text-center leading-relaxed">
        The page you're looking for doesn't exist, was moved, or you don't have permission to view it.
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-background text-sm font-medium hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
        <Link
          to={isAdmin ? "/admin" : isClient ? "/portal" : "/"}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          {isAdmin ? "Admin dashboard" : isClient ? "My dashboard" : "Go home"}
        </Link>
      </div>

      {/* Footer hint */}
      <p className="mt-10 text-xs text-muted-foreground">
        VoCallM · Wayne E Solutions
      </p>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VoCallM — AI sales agents that book qualified meetings" },
      {
        name: "description",
        content:
          "VoCallM is a white-label AI calling platform that turns lead lists into booked sales meetings — automatically.",
      },
      { name: "author", content: "Wayne E Solutions" },
      { property: "og:title", content: "VoCallM — AI sales agents that book qualified meetings" },
      {
        property: "og:description",
        content:
          "VoCallM is a white-label AI calling platform that turns lead lists into booked sales meetings — automatically.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "VoCallM — AI sales agents that book qualified meetings" },
      {
        name: "twitter:description",
        content:
          "VoCallM is a white-label AI calling platform that turns lead lists into booked sales meetings — automatically.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/729eb73b-68d5-47d5-a453-3941356284fc/id-preview-8b3b102c--9f7fcb1f-3af1-4ec6-8495-cd99478b78b7.lovable.app-1780912222823.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/729eb73b-68d5-47d5-a453-3941356284fc/id-preview-8b3b102c--9f7fcb1f-3af1-4ec6-8495-cd99478b78b7.lovable.app-1780912222823.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
