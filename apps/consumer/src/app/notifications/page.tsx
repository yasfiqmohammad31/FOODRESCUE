"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCheck, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDatetime } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  actionUrl?: string | null;
  sentAt: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-01",
    title: "Pesanan Dikonfirmasi!",
    body: "Artisan Bakery & Cafe telah menerima pesananmu dan sedang menyiapkannya.",
    type: "ORDER_CONFIRMED",
    isRead: false,
    actionUrl: "/orders",
    sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "notif-02",
    title: "Surplus Sore Hari Tersedia!",
    body: "3 toko bakery di sekitarmu baru saja menambahkan Mystery Box hari ini.",
    type: "SURPLUS_ALERT",
    isRead: true,
    actionUrl: "/feed",
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [readConfirmed, setReadConfirmed] = useState(false);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setReadConfirmed(true);
    setTimeout(() => {
      setReadConfirmed(false);
    }, 2500);
  };

  return (
    <div className="flex flex-col flex-1 p-4 pb-28 gap-3 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-muted transition"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-black text-foreground">Notifikasi</h1>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          <span>Tandai Dibaca</span>
        </button>
      </div>

      {/* Confirmation Feedback */}
      {readConfirmed && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 p-2 text-xs font-semibold text-foreground animate-in fade-in duration-150">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Semua notifikasi telah ditandai sebagai dibaca.</span>
        </div>
      )}

      {/* Compact List */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <NotificationItemSkeleton />
            <NotificationItemSkeleton />
            <NotificationItemSkeleton />
          </>
        ) : (
          notifications.map((notif) => (
            <Link key={notif.id} href={notif.actionUrl || "#"} className="block group">
              <Card
                className={`p-2.5 bg-card border rounded-xl transition hover:border-primary/50 shadow-2xs ${
                  !notif.isRead ? "border-primary/40 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      !notif.isRead
                        ? "bg-primary text-white"
                        : "bg-[#F3EFE6] text-muted-foreground"
                    }`}
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h2
                        className="text-xs font-bold text-foreground truncate"
                        title={notif.title}
                      >
                        {notif.title}
                      </h2>
                      {!notif.isRead && (
                        <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-[#E85D04]" />
                      )}
                    </div>
                    <p
                      className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2"
                      title={notif.body}
                    >
                      {notif.body}
                    </p>
                    <span className="text-[9px] text-muted-foreground mt-1 block font-medium" suppressHydrationWarning>
                      {formatDatetime(new Date(notif.sentAt))}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function NotificationItemSkeleton() {
  return (
    <Card className="p-2.5 bg-card border border-border rounded-xl shadow-2xs">
      <div className="flex items-start gap-2.5">
        <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-3.5 w-2/3 rounded-md" />
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-2.5 w-20 rounded-md" />
        </div>
      </div>
    </Card>
  );
}
