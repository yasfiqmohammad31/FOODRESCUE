"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  QrCode,
  Settings,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Pesanan",
    href: "/orders",
    icon: ShoppingBag,
    badge: "1",
  },
  {
    label: "Listing",
    href: "/listings",
    icon: UtensilsCrossed,
  },
  {
    label: "Scan QR",
    href: "/scanner",
    icon: QrCode,
  },
  {
    label: "Pengaturan",
    href: "/settings",
    icon: Settings,
  },
];

export function MerchantMobileNav() {
  const pathname = usePathname();

  // Hide nav on auth and onboarding pages
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/onboarding" ||
    pathname === "/forgot-password"
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi Utama Merchant"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-border/80 bg-card/95 backdrop-blur-md pb-[max(0.375rem,env(safe-area-inset-bottom,0.375rem))]"
    >
      <div className="flex h-14 items-center justify-around px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-[44px] flex-1 flex-col items-center justify-center p-1 text-[10px] font-medium transition",
                isActive
                  ? "font-black text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E85D04] px-1 text-[9px] font-black text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
