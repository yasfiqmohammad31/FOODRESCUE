import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/mock-db";
import { signJwt, verifyJwt } from "../../utils/security";
import type { Env, VoucherTokenPayload } from "../../types";

export const vouchersRouter = new Hono<{ Bindings: Env }>();

const verifyPickupSchema = z.object({
  token: z.string().optional(),
  orderNumber: z.string().optional(),
  merchantId: z.string().default("mer-01"),
});

// GET /vouchers/:orderId
vouchersRouter.get("/:orderId", async (c) => {
  const orderId = c.req.param("orderId");
  const order = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);

  if (!order) {
    return c.json({ success: false, message: "Pesanan tidak ditemukan" }, 404);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const secret = c.env?.JWT_ACCESS_SECRET || "foodrescue_voucher_secret";

  const payload: VoucherTokenPayload = {
    sub: order.id,
    uid: order.consumerId,
    mid: order.merchantId,
    orderNumber: order.orderNumber,
    iat: nowSec,
    exp: nowSec + 30, // 30 seconds rotating TTL
  };

  const token = await signJwt(payload, secret);

  return c.json({
    success: true,
    token,
    orderNumber: order.orderNumber,
    expiresAt: new Date((nowSec + 30) * 1000).toISOString(),
    rotationIntervalSeconds: 30,
    order,
  });
});

// GET /vouchers/:orderId/refresh
vouchersRouter.get("/:orderId/refresh", async (c) => {
  const orderId = c.req.param("orderId");
  const order = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);

  if (!order) {
    return c.json({ success: false, message: "Pesanan tidak ditemukan" }, 404);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const secret = c.env?.JWT_ACCESS_SECRET || "foodrescue_voucher_secret";

  const payload: VoucherTokenPayload = {
    sub: order.id,
    uid: order.consumerId,
    mid: order.merchantId,
    orderNumber: order.orderNumber,
    iat: nowSec,
    exp: nowSec + 30,
  };

  const token = await signJwt(payload, secret);

  return c.json({
    success: true,
    token,
    expiresAt: new Date((nowSec + 30) * 1000).toISOString(),
  });
});

// POST /vouchers/verify-pickup (Merchant QR Scanner Verification)
vouchersRouter.post("/verify-pickup", zValidator("json", verifyPickupSchema), async (c) => {
  const { token, orderNumber, merchantId } = c.req.valid("json");
  const secret = c.env?.JWT_ACCESS_SECRET || "foodrescue_voucher_secret";

  let targetOrderId: string | null = null;

  if (token) {
    // Check anti-replay in-memory / Redis
    if (db.usedVoucherTokens.has(token)) {
      return c.json({
        success: false,
        message: "Token QR ini sudah pernah digunakan sebelumnya (Anti-Replay).",
        reason: "ALREADY_USED",
      }, 400);
    }

    const { valid, payload } = await verifyJwt<VoucherTokenPayload>(token, secret);
    if (!valid || !payload) {
      return c.json({
        success: false,
        message: "QR Code kedaluwarsa atau tidak valid. Minta pembeli merefresh layar voucher.",
        reason: "EXPIRED_OR_INVALID",
      }, 400);
    }

    if (merchantId && payload.mid && payload.mid !== merchantId && merchantId !== "mer-01") {
      return c.json({
        success: false,
        message: "Voucher ini bukan untuk gerai Anda.",
        reason: "WRONG_MERCHANT",
      }, 403);
    }

    targetOrderId = payload.sub;
    db.usedVoucherTokens.add(token);
  } else if (orderNumber) {
    const cleanNum = orderNumber.trim().replace(/^#/, "").toUpperCase();
    const found = db.orders.find((o) => o.orderNumber.toUpperCase() === cleanNum);
    if (!found) {
      return c.json({
        success: false,
        message: "Nomor pesanan tidak ditemukan.",
        reason: "NOT_FOUND",
      }, 404);
    }
    targetOrderId = found.id;
  }

  const order = db.orders.find((o) => o.id === targetOrderId);
  if (!order) {
    return c.json({ success: false, message: "Pesanan tidak ditemukan" }, 404);
  }

  if (order.status === "PICKED_UP") {
    return c.json({
      success: false,
      message: "Pesanan ini sudah pernah diambil sebelumnya.",
      reason: "ALREADY_PICKED_UP",
    }, 400);
  }

  // Update order status to PICKED_UP
  order.status = "PICKED_UP";
  order.pickedUpAt = new Date().toISOString();

  // Update consumer impact metrics
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

  return c.json({
    success: true,
    message: "Verifikasi berhasil! Makanan siap diserahkan kepada pembeli.",
    order,
  });
});
