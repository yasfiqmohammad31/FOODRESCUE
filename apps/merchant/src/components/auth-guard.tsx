"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const GUEST_ONLY_ROUTES = ["/login", "/register", "/forgot-password"];

export function MerchantAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("fr_merchant_token") : null;
      const isGuestRoute = GUEST_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

      if (isGuestRoute) {
        // If merchant is already authenticated and tries to visit /login or /register, redirect to dashboard
        if (token) {
          router.replace("/");
          return;
        }
        setIsAuthorized(true);
      } else {
        // If route is protected and merchant is not authenticated, redirect to /login
        if (!token) {
          router.replace("/login");
          return;
        }
        setIsAuthorized(true);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // While determining authorization, render a smooth minimal loading screen to prevent FOUC
  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <span className="text-xs font-bold text-muted-foreground tracking-wide">
            Memuat Portal Mitra...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
