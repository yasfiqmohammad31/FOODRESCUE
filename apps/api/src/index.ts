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
        origin.endsWith(".pages.dev") ||
        origin.includes("foodrescue.id")
      ) {
        return origin || "*";
      }
      return "http://localhost:3000";
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
