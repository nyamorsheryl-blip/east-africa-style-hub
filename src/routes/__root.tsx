import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { SplashScreen } from "@/components/splash-screen";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/ml/cookie-banner";
import { CurrencyProvider } from "@/components/currency-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Back to MaeLove
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MaeLove" },
      { name: "description", content: "Discover and shop boutique fashion from East Africa. Handcrafted clothing, jewellery, accessories & more from independent designers." },
      { property: "og:title", content: "MaeLove" },
      { property: "og:description", content: "Discover boutique fashion, handmade goods and local designer brands from across East Africa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" },
      { rel: "icon", href: "/favicon.ico?v=2", sizes: "any" },
      { rel: "icon", href: "/favicon-32.png?v=2", type: "image/png", sizes: "32x32" },
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
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function useFirstVisitRedirect() {
  const router = useRouter();
  useEffect(() => {
    try {
      const path = window.location.pathname;
      const skip = path.startsWith("/auth") || path.startsWith("/admin") || path.startsWith("/privacy") || path.startsWith("/.");
      if (skip || localStorage.getItem("maelove:seen-welcome")) return;
      supabase.auth.getSession().then(({ data }) => {
        localStorage.setItem("maelove:seen-welcome", "1");
        if (!data.session) router.navigate({ to: "/auth" });
      });
    } catch {
      /* storage blocked: do nothing */
    }
  }, [router]);
}

function RootComponent() {
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    // Show the splash on every visit: at least 1.8s, and only once the page has finished loading.
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      timer = setTimeout(() => setShowSplash(false), Math.max(0, 1800 - (Date.now() - started)));
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("load", finish);
    };
  }, []);
  useFirstVisitRedirect();
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
            <CurrencyProvider>
        <Outlet />
      </CurrencyProvider>
      <Toaster position="top-center" />
      <CookieBanner />
      {showSplash && <SplashScreen />}
    </QueryClientProvider>
  );
}