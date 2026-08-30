"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Compass, MapPin, ReceiptText, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";

export function BottomNav() {
  const pathname = usePathname();
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    consumerApi
      .getActiveOrders()
      .then((orders) => {
        if (isMounted && Array.isArray(orders)) {
          const active = orders.filter(
            (o) =>
              o.status === "UNDO_WINDOW" ||
              o.status === "CONFIRMED" ||
              o.status === "PREPARING" ||
              o.status === "READY"
          );
          setActiveOrdersCount(active.length);
        } else if (isMounted) {
          setActiveOrdersCount(0);
        }
      })
      .catch(() => {
        if (isMounted) setActiveOrdersCount(0);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const navItems = [
    {
      label: "Jelajah",
      href: "/feed",
      icon: Compass,
    },
    {
      label: "Peta",
      href: "/map",
      icon: MapPin,
    },
    {
      label: "Pesanan",
      href: "/orders",
      icon: ReceiptText,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    {
      label: "Dampak",
      href: "/impact",
      icon: Award,
    },
    {
      label: "Profil",
      href: "/profile",
      icon: UserCircle,
    },
  ];

  // Hide bottom nav on immersive transaction, detail, and auth flows
  if (
    pathname.startsWith("/undo") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/listing") ||
    pathname.startsWith("/voucher") ||
    pathname.startsWith("/reveal") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi Utama"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-border/80 bg-card/95 backdrop-blur-md pb-[max(0.375rem,env(safe-area-inset-bottom,0.375rem))]"
    >
      <div className="flex h-14 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/feed" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-[44px] flex-1 flex-col items-center justify-center py-1 transition-all duration-200",
                isActive
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110 stroke-[2.5]"
                  )}
                />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-xs">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="mt-0.5 text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
