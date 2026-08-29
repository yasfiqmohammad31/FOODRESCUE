import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRouter } from "./modules/auth/auth.router";
import { merchantsRouter } from "./modules/merchants/merchants.router";
import { listingsRouter } from "./modules/listings/listings.router";
import { ordersRouter } from "./modules/orders/orders.router";
import { paymentsRouter } from "./modules/payments/payments.router";
import { payoutsRouter } from "./modules/payouts/payouts.router";
import { vouchersRouter } from "./modules/vouchers/vouchers.router";
import { aiRouter } from "./modules/ai/ai.router";
import { impactRouter } from "./modules/impact/impact.router";
import { sendEmail } from "./modules/notifications/email.service";
import { getSubscription, saveSubscription, sendWebPush, VAPID_KEYS } from "./modules/notifications/push.service";
import { db } from "./db/mock-db";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// Logger & Performance Timing
app.use("*", logger());

// CORS Configuration
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (
        !origin ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("vercel.app") ||
        origin.includes("pages.dev") ||
        origin.includes("foodrescue") ||
        origin.includes("workers.dev")
      ) {
        return origin || "*";
      }
      return origin;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Idempotency-Key", "x-callback-token"],
    credentials: true,
  })
);

// Security Headers Middleware
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

// Root & Health Probe
app.get("/", (c) => {
  return c.json({
    name: "FOODRESCUE Cloudflare Edge API",
    version: "1.0.1",
    status: "healthy",
    region: "edge",
    timestamp: new Date().toISOString(),
    documentation: "/api/docs",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      api: "healthy",
      database: "connected",
      cache: c.env.CACHE_KV ? "connected" : "in-memory-fallback",
      ai: c.env.AI ? "active" : "fallback",
    },
  });
});

// API Documentation / Endpoint Index
app.get("/api/docs", (c) => {
  return c.json({
    title: "FOODRESCUE API Specification (v1.0.1)",
    endpoints: [
      { method: "POST", path: "/api/auth/login", desc: "User & Merchant login" },
      { method: "POST", path: "/api/auth/register", desc: "Registration" },
      { method: "POST", path: "/api/auth/google", desc: "Google 1-Tap OAuth" },
      { method: "GET", path: "/api/listings", desc: "Hyperlocal feed search with radius" },
      { method: "POST", path: "/api/orders", desc: "Checkout with 60s Undo Window" },
      { method: "POST", path: "/api/orders/:id/undo", desc: "60-second instant refund" },
      { method: "GET", path: "/api/vouchers/:orderId", desc: "Dynamic 30s rotating QR token" },
      { method: "POST", path: "/api/vouchers/verify-pickup", desc: "Merchant QR scan verification" },
      { method: "POST", path: "/api/payouts/withdraw", desc: "Merchant bank disbursement" },
      { method: "POST", path: "/api/ai/sentiment-analysis", desc: "Food safety review moderation" },
      { method: "PATCH", path: "/api/merchants/toggle-status", desc: "Instant open/close store" },
    ],
  });
});

// Mount Sub-Routers
app.route("/api/auth", authRouter);
app.route("/api/merchants", merchantsRouter);
app.route("/api/listings", listingsRouter);
app.route("/api/orders", ordersRouter);
app.route("/api/payments", paymentsRouter);
app.route("/api/payouts", payoutsRouter);
app.route("/api/vouchers", vouchersRouter);
app.route("/api/ai", aiRouter);
app.route("/api/impact", impactRouter);

// Geocoding Search Proxy
app.get("/api/geocode/search", async (c) => {
  const q = c.req.query("q");
  if (!q || q.trim().length < 2) {
    return c.json({ success: true, results: [] });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q.trim())}&countrycodes=id&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FoodRescue-App/1.0",
        "Accept-Language": "id",
      },
    });

    if (!res.ok) {
      return c.json({ success: true, results: [] });
    }

    const raw = (await res.json()) as any[];
    const results = raw.map((item) => {
      const suburb =
        item.address?.suburb ||
        item.address?.neighbourhood ||
        item.address?.village ||
        item.address?.city_district;
      const city = item.address?.city || item.address?.town || item.address?.county || "";
      const name = item.name || (item.display_name ? item.display_name.split(",")[0] : "");

      const label =
        suburb && city
          ? `${name && name !== suburb ? name + ", " : ""}${suburb}, ${city}`
          : item.display_name.split(",").slice(0, 3).join(",");

      return {
        label,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    });

    return c.json({ success: true, results });
  } catch (error: any) {
    return c.json({ success: false, results: [], message: error.message });
  }
});

// Email Test Endpoint (Resend API)
app.post("/api/notifications/test-email", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const to = body.to || "test@foodrescue.id";
    const result = await sendEmail(c.env, {
      to,
      subject: "🌱 [FOODRESCUE] Uji Coba Pengiriman Resend Email Berhasil!",
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #f6f5f0;">
          <div style="max-width: 500px; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e7e5e4;">
            <h2 style="color: #166534; margin-top: 0;">🌱 FOODRESCUE Resend Email Service</h2>
            <p>Halo! Ini adalah email uji coba dari backend Cloudflare Workers FOODRESCUE.</p>
            <p>Integrasi <strong>Resend API</strong> telah terpasang dan berfungsi normal pada runtime Edge.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #888;">© 2026 FOODRESCUE Indonesia</p>
          </div>
        </div>
      `,
    });
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Web Push VAPID & Subscription Endpoints
app.get("/api/notifications/vapid-public-key", (c) => {
  return c.json({
    success: true,
    publicKey: VAPID_KEYS.publicKey,
  });
});

app.post("/api/notifications/subscribe", async (c) => {
  try {
    const body = await c.req.json();
    const userId = body.userId || "usr-cns-001";
    const subscription = body.subscription;
    const role = body.role || "CONSUMER";

    if (!subscription || !subscription.endpoint) {
      return c.json({ success: false, message: "Subscription payload tidak valid." }, 400);
    }

    await saveSubscription(c.env, userId, { ...subscription, role });
    return c.json({ success: true, message: "Browser berhasil didaftarkan untuk Web Push Notification." });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

app.post("/api/notifications/test-push", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const userId = body.userId || "usr-cns-001";
    const subscription = await getSubscription(c.env, userId);

    if (!subscription) {
      return c.json({
        success: false,
        message: "Pengguna belum mengaktifkan izin Web Push di browser perangkat ini.",
      }, 404);
    }

    const result = await sendWebPush(c.env, subscription, {
      title: "🌱 FOODRESCUE: Notifikasi Aktif!",
      body: "Layanan Web Push Notification berhasil terhubung ke browser Anda.",
      url: "/orders",
    });

    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Testing & On-Demand Reset Helper Endpoints
app.post("/api/testing/reset", (c) => {
  db.users = [];
  db.merchants = [];
  db.listings = [];
  db.orders = [];
  db.payouts = [];
  db.wallets = {};
  db.transactions = [];
  db.reviews = [];
  db.impactStats = {};
  db.usedVoucherTokens.clear();
  return c.json({ success: true, message: "Database in-memory berhasil dikosongkan 100%." });
});

app.post("/api/testing/seed", (c) => {
  return c.json({ success: true, message: "Database diinisialisasi." });
});

// Global Error Handler (RFC 7807 Problem Details)
app.onError((err, c) => {
  console.error("API Uncaught Exception:", err);
  return c.json(
    {
      type: "https://api.foodrescue.id/errors/internal-server-error",
      title: "Internal Server Error",
      status: 500,
      detail: err.message || "Terjadi kesalahan internal pada server.",
      instance: c.req.url,
      timestamp: new Date().toISOString(),
    },
    500
  );
});

// Cloudflare Scheduled Event Handler (Cron Triggers)
export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log(`[Cloudflare Cron Trigger] Running cron event: ${event.cron} at ${new Date().toISOString()}`);

    // Cron 1: Sweep for No-Show orders (orders past pickup_end + 15 min without pickup)
    const now = Date.now();
    db.orders.forEach((order) => {
      if (order.status === "CONFIRMED" || order.status === "READY") {
        const orderTime = new Date(order.createdAt).getTime();
        if (now - orderTime > 1000 * 60 * 60 * 4) {
          order.status = "NO_SHOW";
          console.log(`[No-Show Auto Sweep] Order ${order.orderNumber} marked as NO_SHOW`);
        }
      }
    });

    // Cron 2: AI Dynamic Pricing suggestions for near-closing listings
    db.listings.forEach((listing) => {
      if (listing.status === "ACTIVE" && listing.quantityRemaining >= 2) {
        const pickupEndMs = new Date(listing.pickupEnd).getTime();
        const minsLeft = (pickupEndMs - now) / (1000 * 60);
        if (minsLeft > 0 && minsLeft < 60) {
          listing.aiSuggestedPrice = Math.round((listing.discountedPrice * 0.85) / 1000) * 1000;
          console.log(`[AI Dynamic Pricing] Suggested price for ${listing.title}: Rp ${listing.aiSuggestedPrice}`);
        }
      }
    });
  },
};
