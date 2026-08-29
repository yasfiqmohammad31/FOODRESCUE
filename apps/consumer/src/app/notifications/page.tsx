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

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export default function NotificationsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [readConfirmed, setReadConfirmed] = useState(false);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setReadConfirmed(true);
    setTimeout(() => setReadConfirmed(false), 2500);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col flex-1 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-black tracking-tight text-foreground">
              Notifikasi
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium">
              Update pesanan dan alert surplus
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-primary hover:text-primary/80 hover:bg-primary/5 flex items-center gap-1.5 h-8 px-2.5"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Tandai dibaca</span>
          </Button>
        )}
      </header>

      {/* Confirmation Banner */}
      {readConfirmed && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-xs text-primary font-medium">
          <CheckCheck className="h-4 w-4 shrink-0" />
          <span>Semua notifikasi telah ditandai sebagai dibaca.</span>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-3 flex-1">
        {/* Compact List */}
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <>
              <NotificationItemSkeleton />
              <NotificationItemSkeleton />
              <NotificationItemSkeleton />
            </>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <Bell className="h-6 w-6" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Belum Ada Notifikasi</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                Notifikasi pesanan dan penawaran surplus terdekat akan muncul di sini.
              </p>
            </div>
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
