"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationBanner() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Register Service Worker
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("[SW Registration]", err);
      });

      // Check if already subscribed
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
          }
        });
      });
    }
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) return;
    setIsSubscribing(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === "granted") {
        const reg = await navigator.serviceWorker.ready;
        
        // Fetch VAPID key
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://foodrescue-api.foodrescue.workers.dev";
        const keyRes = await fetch(`${apiUrl}/api/notifications/vapid-public-key`);
        const keyData = await keyRes.json();
        const vapidPublicKey = keyData.publicKey || "BOaB1otOoygs2RMUMMqwOX2BG21iTRv1U0-wGl4z3RZJO1PwTLez0uVAjcL8z1y4MYkUzS7MaeTm42MYIe1kg3Q";

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });

        // Send to backend
        const userRaw = localStorage.getItem("fr_user");
        const user = userRaw ? JSON.parse(userRaw) : null;

        await fetch(`${apiUrl}/api/notifications/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id || "usr-cns-001",
            subscription: sub,
            role: "CONSUMER",
          }),
        });

        setIsSubscribed(true);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.info("[Push Service] Push subscription not available on this browser/network (e.g. Incognito mode or Google Push Service unavailable).");
      } else {
        console.warn("[Push Subscribe Warning]", err?.message || err);
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isSupported || isDismissed || isSubscribed || permission === "granted" || permission === "denied") {
    return null;
  }

  return (
    <div className="mx-4 mb-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 shadow-2xs animate-in fade-in duration-300">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-2xs">
          <BellRing className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-emerald-950">Aktifkan Notifikasi Pengambilan</p>
          <p className="text-[11px] text-emerald-800 line-clamp-2 mt-0.5 leading-snug">
            Dapatkan peringatan seketika saat paket makanan Anda siap diambil di gerai.
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSubscribe}
              loading={isSubscribing}
              className="h-7 px-3 text-[11px] font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs"
            >
              Aktifkan Sekarang
            </Button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-[11px] font-semibold text-emerald-800 hover:underline px-2 py-1"
            >
              Nanti Saja
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label="Tutup"
          className="text-emerald-700 hover:text-emerald-950 p-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
