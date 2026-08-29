// Service Worker for FOODRESCUE Merchant Partner Portal
const CACHE_NAME = "foodrescue-merchant-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Web Push Event Handler
self.addEventListener("push", (event) => {
  let data = {
    title: "🏪 FOODRESCUE Merchant",
    body: "Pemberitahuan pesanan baru dari pelanggan.",
    url: "/orders",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    vibrate: [300, 100, 300],
    data: {
      url: data.url || "/orders",
      timestamp: Date.now(),
    },
    actions: [
      { action: "open", title: "Lihat Pesanan" },
      { action: "close", title: "Tutup" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Push Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const targetUrl = event.notification.data?.url || "/orders";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
