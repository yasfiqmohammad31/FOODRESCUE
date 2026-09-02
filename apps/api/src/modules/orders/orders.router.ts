import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/mock-db";
import { sanitizeText } from "../../utils/security";
import { authenticate, requireRole } from "../../middleware/auth.middleware";
import { buildOrderConfirmationEmail, buildUndoRefundEmail, safeDispatch, sendEmail } from "../notifications/email.service";
import { logAuthSuccess } from "../../utils/audit-log";
import type { Env, Order, OrderStatus, PaymentMethod } from "../../types";

export const ordersRouter = new Hono<{ Bindings: Env }>();

// Apply authentication to all order routes
ordersRouter.use("/*", authenticate());

// Consumer-only routes
const consumerRoutes = ["/", "/consumer/active"];
consumerRoutes.forEach(route => {
  ordersRouter.use(route, requireRole("CONSUMER"));
});

// Merchant-only routes
const merchantRoutes = ["/merchant/queue"];
merchantRoutes.forEach(route => {
  ordersRouter.use(route, requireRole("MERCHANT", "ADMIN"));
});

const createOrderSchema = z.object({
  consumerId: z.string().default("usr-cns-001"),
  listingId: z.string(),
  quantity: z.number().int().min(1),
  paymentMethod: z.enum(["QRIS", "EWALLET", "RESCUE_CREDIT"]),
  useRescueCredit: z.boolean().default(false),
});

const updateStatusSchema = z.object({
  status: z.enum(["PREPARING", "READY", "PICKED_UP"]),
});

const merchantCancelSchema = z.object({
  reason: z.string().min(3),
});

// POST /orders (Checkout & Atomic Stock Reservation with 60s Undo Window)
ordersRouter.post("/", zValidator("json", createOrderSchema), (c) => {
  const { consumerId, listingId, quantity, paymentMethod, useRescueCredit } = c.req.valid("json");

  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) {
    return c.json({ success: false, message: "Listing makanan tidak ditemukan" }, 404);
  }

  // Stock check
  if (listing.quantityRemaining < quantity) {
    return c.json({
      success: false,
      message: `Maaf, sisa stok porsi tidak mencukupi (sisa ${listing.quantityRemaining} porsi).`,
    }, 400);
  }

  const rawTotal = listing.originalPrice * quantity;
  const itemTotal = listing.discountedPrice * quantity;

  // Handle Rescue Credit deduction
  let appliedCredit = 0;
  if (useRescueCredit) {
    const userWallet = db.wallets[consumerId] || { userId: consumerId, balance: 0, updatedAt: new Date().toISOString() };
    appliedCredit = Math.min(userWallet.balance, itemTotal);
    userWallet.balance -= appliedCredit;
    db.wallets[consumerId] = userWallet;

    if (appliedCredit > 0) {
      db.transactions.unshift({
        id: `tx-${Date.now().toString().slice(-6)}`,
        userId: consumerId,
        amount: -appliedCredit,
        type: "PURCHASE_PAYMENT",
        description: `Pembayaran pesanan ${listing.title} (${quantity}x)`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const finalPayable = itemTotal - appliedCredit;

  // Reserve stock atomik
  listing.quantityRemaining -= quantity;
  if (listing.quantityRemaining <= 0) {
    listing.status = "SOLD_OUT";
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `FR-${dateStr}-${randomSuffix}`;
  const undoDeadline = new Date(now.getTime() + 60 * 1000).toISOString();

  const newOrder: Order = {
    id: `ord-${Date.now().toString().slice(-6)}`,
    orderNumber,
    consumerId,
    listingId: listing.id,
    merchantId: listing.merchantId,
    quantity,
    totalPrice: finalPayable,
    paymentMethod,
    status: "UNDO_WINDOW",
    undoDeadline,
    paidAt: now.toISOString(),
    confirmedAt: null,
    pickedUpAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: now.toISOString(),
    listing: {
      title: listing.title,
      photoUrl: listing.photoUrl,
      category: listing.category,
    },
    merchant: {
      storeName: listing.merchant.storeName,
      address: listing.merchant.address,
      location: listing.merchant.location,
    },
  };

  db.orders.unshift(newOrder);

  // Dispatch Order Confirmation Email via Resend
  const consumerUser = db.users.find((u) => u.id === consumerId);
  const merchantProfile = db.merchants.find((m) => m.id === listing.merchantId);
  const targetEmail = consumerUser?.email || "alex@kampus.ac.id";
  const { subject, html } = buildOrderConfirmationEmail(newOrder, listing, merchantProfile, consumerUser?.name);
  safeDispatch(c, sendEmail(c.env, { to: targetEmail, subject, html }));

  return c.json({
    success: true,
    message: "Pembayaran berhasil. Jeda 60s Instant Undo aktif.",
    order: newOrder,
  }, 201);
});

// GET /orders/:id
ordersRouter.get("/:id", (c) => {
  const id = c.req.param("id");
  const order = db.orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) {
    return c.json({ success: false, message: "Pesanan tidak ditemukan" }, 404);
  }
  return c.json({ success: true, order });
});

// POST /orders/consumer/active
ordersRouter.get("/consumer/active", requireRole("CONSUMER"), (c) => {
  const activeOrders = db.orders.filter(
    (o) => o.status === "UNDO_WINDOW" || o.status === "CONFIRMED" || o.status === "PREPARING" || o.status === "READY"
  );
  return c.json({ success: true, orders: activeOrders });
});

// GET /orders/merchant/queue
ordersRouter.get("/merchant/queue", requireRole("MERCHANT", "ADMIN"), (c) => {
  const user = c.get('user');
  
  let targetMerchantId = user?.sub;
  if (user?.role === 'ADMIN') {
    // Admin can see all orders - return empty if no merchant context
    const allOrders = db.orders;
    return c.json({ success: true, orders: allOrders });
  } else if (!targetMerchantId) {
    return c.json({ success: false, message: 'Merchant ID tidak ditemukan', code: 'MERCHANT_NOT_FOUND' }, 404);
  } else {
    const found = db.merchants.find((m) => m.userId === targetMerchantId || m.id === targetMerchantId);
    if (found) targetMerchantId = found.id;
  }

  if (targetMerchantId) {
    const queue = db.orders.filter((o) => o.merchantId === targetMerchantId);
    return c.json({ success: true, orders: queue });
  }

  return c.json({ success: true, orders: [] });
});

// POST /orders/:id/undo (Server Authority 60s Cancellation)
ordersRouter.post("/:id/undo", (c) => {
  const id = c.req.param("id");
  const order = db.orders.find((o) => o.id === id || o.orderNumber === id);

  if (!order) {
    return c.json({ success: false, message: "Pesanan tidak ditemukan" }, 404);
  }

  if (order.status !== "UNDO_WINDOW") {
    return c.json({
      success: false,
      message: "Periode Instant Undo 60 detik sudah berakhir.",
      reason: "WINDOW_EXPIRED",
    }, 400);
  }

  // Strict server authority timestamp check
  const now = Date.now();
  const deadline = Date.parse(order.undoDeadline);
  if (now > deadline) {
    order.status = "CONFIRMED";
    order.confirmedAt = new Date().toISOString();
    return c.json({
      success: false,
      message: "Jendela waktu 60 detik telah lewat. Pesanan telah dikonfirmasi ke toko.",
      reason: "WINDOW_EXPIRED",
    }, 400);
  }

  // Restore listing stock
  const listing = db.listings.find((l) => l.id === order.listingId);
  if (listing) {
    listing.quantityRemaining += order.quantity;
    if (listing.status === "SOLD_OUT") {
      listing.status = "ACTIVE";
    }
  }

  // Issue 100% refund to Rescue Credit
  const userWallet = db.wallets[order.consumerId] || {
    userId: order.consumerId,
    balance: 0,
    updatedAt: new Date().toISOString(),
  };
  userWallet.balance += order.totalPrice;
  db.wallets[order.consumerId] = userWallet;

  // Log refund transaction
  db.transactions.unshift({
    id: `tx-${Date.now().toString().slice(-6)}`,
    userId: order.consumerId,
    orderId: order.id,
    amount: order.totalPrice,
    type: "REFUND_UNDO",
    description: `Refund 100% Instant Undo pesanan ${order.orderNumber}`,
    createdAt: new Date().toISOString(),
  });

  order.status = "CANCELLED_CONSUMER_UNDO";
  order.cancelledAt = new Date().toISOString();
  order.cancelReason = "Dibatalkan oleh pembeli dalam jeda waktu 60s";

  // Dispatch Undo Refund Confirmation Email via Resend
  const consumerUser = db.users.find((u) => u.id === order.consumerId);
  const targetEmail = consumerUser?.email || "alex@kampus.ac.id";
  const { subject, html } = buildUndoRefundEmail(order, order.totalPrice, userWallet.balance, consumerUser?.name);
  safeDispatch(c, sendEmail(c.env, { to: targetEmail, subject, html }));

  return c.json({
    success: true,
    message: "Pesanan berhasil dibatalkan. Dana 100% telah dikembalikan ke saldo Rescue Credit Anda.",
    refundAmount: order.totalPrice,
    newBalance: userWallet.balance,
    order,
  });
});

// PATCH /orders/:id/status
ordersRouter.patch("/:id/status", zValidator("json", updateStatusSchema), (c) => {
  const id = c.req.param("id");
  const { status } = c.req.valid("json");
  const order = db.orders.find((o) => o.id === id || o.orderNumber === id);

  if (!order) {
    return c.json({ success: false, message: "Pesanan tidak ditemukan" }, 404);
  }

  order.status = status;
  if (status === "PICKED_UP") {
    order.pickedUpAt = new Date().toISOString();

    // Update impact stats
    const impact = db.impactStats[order.consumerId] || {
      userId: order.consumerId,
      portionsSaved: 0,
      co2eSavedKg: 0,
      treesEquivalent: 0,
      moneySavedRp: 0,
      updatedAt: new Date().toISOString(),
    };
    impact.portionsSaved += order.quantity;
    impact.co2eSavedKg += order.quantity * 2.5;
    impact.treesEquivalent = Math.round((impact.co2eSavedKg / 16.6) * 10) / 10;
    impact.moneySavedRp += order.totalPrice * 1.5;
    impact.updatedAt = new Date().toISOString();
    db.impactStats[order.consumerId] = impact;
  }

  return c.json({
    success: true,
    message: `Status pesanan diubah menjadi ${status}`,
    order,
  });
});

// POST /orders/:id/cancel-merchant
ordersRouter.post("/:id/cancel-merchant", zValidator("json", merchantCancelSchema), (c) => {
  const id = c.req.param("id");
  const { reason } = c.req.valid("json");
  const order = db.orders.find((o) => o.id === id || o.orderNumber === id);

  if (!order) {
    return c.json({ success: false, message: "Pesanan tidak ditemukan" }, 404);
  }

  // 100% auto refund to consumer Rescue Credit
  const userWallet = db.wallets[order.consumerId] || {
    userId: order.consumerId,
    balance: 0,
    updatedAt: new Date().toISOString(),
  };
  userWallet.balance += order.totalPrice;
  db.wallets[order.consumerId] = userWallet;

  db.transactions.unshift({
    id: `tx-${Date.now().toString().slice(-6)}`,
    userId: order.consumerId,
    orderId: order.id,
    amount: order.totalPrice,
    type: "REFUND_MERCHANT_CANCEL",
    description: `Auto-refund pembatalan darurat oleh gerai (${reason})`,
    createdAt: new Date().toISOString(),
  });

  order.status = "CANCELLED_MERCHANT";
  order.cancelledAt = new Date().toISOString();
  order.cancelReason = sanitizeText(reason);

  return c.json({
    success: true,
    message: "Pesanan dibatalkan darurat. Dana pembeli telah dikembalikan 100% ke Rescue Credit.",
    order,
  });
});
