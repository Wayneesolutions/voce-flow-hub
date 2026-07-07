import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "../store";
import { AuthProvider } from "../context/auth";
import { PhoneCall, Home, ArrowLeft } from "lucide-react";

function NotFoundComponent() {
  const isAdmin = !!store.getState().adminAuth.user;
  const isClient = !!store.getState().userAuth?.user;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-8 shadow-lg">
        <PhoneCall className="h-6 w-6" />
      </div>

      <div className="relative mb-6 select-none">
        <span className="text-[120px] font-black leading-none text-muted/30 tracking-tighter">
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-[120px] font-black leading-none text-foreground/5 tracking-tighter blur-sm">
          404
        </span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm text-center leading-relaxed">
        The page you're looking for doesn't exist, was moved, or you don't have permission to view it.
      </p>

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

      <p className="mt-10 text-xs text-muted-foreground">
        Quor · Wayne E Solutions
      </p>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
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
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

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
