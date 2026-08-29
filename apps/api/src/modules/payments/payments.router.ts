import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/mock-db";
import type { Env } from "../../types";

export const paymentsRouter = new Hono<{ Bindings: Env }>();

const createInvoiceSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["QRIS", "EWALLET", "RESCUE_CREDIT"]),
});

// POST /payments/create-invoice
paymentsRouter.post("/create-invoice", zValidator("json", createInvoiceSchema), (c) => {
  const { orderId, amount, paymentMethod } = c.req.valid("json");
  const invoiceId = `inv_xnd_${Date.now().toString().slice(-8)}`;

  return c.json({
    success: true,
    invoiceId,
    orderId,
    amount,
    paymentMethod,
    qrisString: paymentMethod === "QRIS" ? "00020101021226580016ID.CO.XENDIT.WWW0118936009110000000000" : null,
    paymentUrl: paymentMethod === "EWALLET" ? `https://checkout.xendit.co/web/${invoiceId}` : null,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });
});

// POST /payments/webhook (Xendit Callback Signature Verification)
paymentsRouter.post("/webhook", async (c) => {
  const callbackToken = c.req.header("x-callback-token");
  const expectedToken = c.env.XENDIT_CALLBACK_TOKEN || "xnd_dev_callback_token_secret";

  if (callbackToken !== expectedToken && c.env.ENVIRONMENT === "production") {
    return c.json({ success: false, message: "Unauthorized webhook token signature" }, 401);
  }

  const payload = await c.req.json().catch(() => ({}));
  const externalId = payload.external_id || payload.id;

  return c.json({
    success: true,
    message: "Webhook payment received and processed",
    externalId,
  });
});
