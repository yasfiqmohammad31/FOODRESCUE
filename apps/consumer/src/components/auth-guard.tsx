"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Routes that ONLY unauthenticated / guest users should see
const GUEST_ONLY_ROUTES = ["/login", "/register", "/forgot-password"];

// Routes that are publicly accessible for discovery without logging in
const PUBLIC_DISCOVERY_ROUTES = ["/", "/feed", "/map"];

export function ConsumerAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("fr_token") : null;
      const isGuestRoute = GUEST_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
      const isPublicDiscovery =
        PUBLIC_DISCOVERY_ROUTES.some((route) => pathname === route) ||
        pathname.startsWith("/listing/");

      if (isGuestRoute) {
        // If consumer is already authenticated and visits /login or /register, redirect to feed
        if (token) {
          router.replace("/feed");
          return;
        }
        setIsAuthorized(true);
      } else if (isPublicDiscovery) {
        // Public browsing is always allowed
        setIsAuthorized(true);
      } else {
        // Protected routes (/orders, /wallet, /checkout, /voucher, /undo, /impact, etc.)
        if (!token) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        setIsAuthorized(true);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <span className="text-xs font-bold text-muted-foreground tracking-wide">
            Memuat FOODRESCUE...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
