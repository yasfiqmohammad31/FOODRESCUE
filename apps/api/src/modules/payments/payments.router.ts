import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/mock-db";
import { authenticate, requireRole } from "../../middleware/auth.middleware";
import { webhookRateLimiter } from "../../middleware/rate-limiter";
import { logWebhookEvent } from "../../utils/audit-log";
import type { Env, Payment } from "../../types";

export const paymentsRouter = new Hono<{ Bindings: Env }>();

// Apply authentication to payment routes (except webhook)
paymentsRouter.use("/create-invoice", authenticate());
paymentsRouter.use("/create-invoice", requireRole("CONSUMER", "ADMIN"));

const createInvoiceSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["QRIS", "EWALLET", "RESCUE_CREDIT"]),
  customerEmail: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

// POST /payments/create-invoice (Real Xendit API Integration with Fallback)
paymentsRouter.post("/create-invoice", zValidator("json", createInvoiceSchema), async (c) => {
  const { orderId, amount, paymentMethod, customerEmail, customerName, customerPhone } = c.req.valid("json");
  const secretKey = c.env?.XENDIT_SECRET_KEY;

  if (secretKey && (paymentMethod === "QRIS" || paymentMethod === "EWALLET")) {
    try {
      const basicAuth = btoa(`${secretKey.trim()}:`);
      const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_id: orderId,
          amount: Math.round(amount),
          description: `Pembayaran Makanan Surplus FOODRESCUE #${orderId}`,
          invoice_duration: 900, // 15 minutes
          customer: {
            given_names: customerName || "Food Hero",
            email: customerEmail || "consumer@foodrescue.id",
            mobile_number: customerPhone || "+6281234567890",
          },
          payment_methods: [
            "QRIS",
            "OVO",
            "DANA",
            "SHOPEEPAY",
            "LINKAJA",
            "BCA",
            "BNI",
            "BRI",
            "MANDIRI",
            "BSI",
          ],
          currency: "IDR",
          success_redirect_url: "https://foodrescue-consumer.vercel.app/orders",
          failure_redirect_url: "https://foodrescue-consumer.vercel.app/feed",
        }),
      });

      if (xenditRes.ok) {
        const xenditData: any = await xenditRes.json();
        return c.json({
          success: true,
          isLiveXendit: true,
          invoiceId: xenditData.id,
          orderId,
          amount: xenditData.amount,
          paymentMethod,
          paymentUrl: xenditData.invoice_url,
          qrisString: xenditData.payment_details?.find((p: any) => p.payment_method === "QRIS")?.qr_string || null,
          expiresAt: xenditData.expiry_date,
        });
      } else {
        const errBody = await xenditRes.text();
        console.warn("[Xendit API Error]", xenditRes.status, errBody);
      }
    } catch (err: any) {
      console.warn("[Xendit Fetch Exception]", err.message);
    }
  }

  // Fallback Simulation (Sandbox / Local Dev)
  const invoiceId = `inv_xnd_${Date.now().toString().slice(-8)}`;
  return c.json({
    success: true,
    isLiveXendit: false,
    invoiceId,
    orderId,
    amount,
    paymentMethod,
    qrisString: paymentMethod === "QRIS" ? "00020101021226580016ID.CO.XENDIT.WWW0118936009110000000000" : null,
    paymentUrl: paymentMethod === "EWALLET" ? `https://checkout.xendit.co/web/${invoiceId}` : null,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });
});

// POST /payments/webhook (Xendit Callback Signature Verification & Order Confirmation)
paymentsRouter.post("/webhook", webhookRateLimiter, async (c) => {
  const callbackToken = c.req.header("x-callback-token");
  const signature = c.req.header("x-xendit-signature");
  const expectedToken = c.env.XENDIT_CALLBACK_TOKEN;
  const webhookSecret = c.env.XENDIT_WEBHOOK_SECRET;
  
  // Get raw body for signature verification
  const rawBody = await c.req.text();
  const payload: any = await c.req.json().catch(() => ({}));
  const externalId = payload.external_id || payload.id;
  const rawStatus = (payload.status || "").toUpperCase();

  // Enhanced webhook security
  let isValid = false;
  
  if (webhookSecret && signature) {
    // Verify signature with HMAC
    try {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );
      
      const signatureBytes = Uint8Array.from(
        atob(signature.replace(/-/g, "+").replace(/_/g, "/")),
        c => c.charCodeAt(0)
      );
      
      const data = new TextEncoder().encode(rawBody);
      isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        signatureBytes,
        data
      );
      
      if (!isValid) {
        logWebhookEvent("invalid", c, { reason: "invalid_signature", externalId });
        return c.json({ 
          success: false, 
          message: "Invalid webhook signature" 
        }, 401);
      }
    } catch (error) {
      console.error("[Webhook] Signature verification error:", error);
    }
  }
  
  // Fallback to callback token verification
  if (!isValid && expectedToken && callbackToken && callbackToken !== expectedToken) {
    logWebhookEvent("invalid", c, { reason: "invalid_token", externalId });
    return c.json({ 
      success: false, 
      message: "Unauthorized webhook token" 
    }, 401);
  }
  
  logWebhookEvent("received", c, { externalId, status: rawStatus });

  if (externalId) {
    const order = db.orders.find((o) => o.id === externalId || o.orderNumber === externalId);
    
    if (order) {
      if (rawStatus === "PAID" || rawStatus === "SETTLED") {
        order.status = "UNDO_WINDOW";
        order.paidAt = new Date().toISOString();
        order.undoDeadline = new Date(Date.now() + 60 * 1000).toISOString();

        // Record in db.payments
        const paymentRecord: Payment = {
          id: payload.id || `pay-${Date.now()}`,
          orderId: order.id,
          xenditPaymentId: payload.id || `xnd-${Date.now()}`,
          type: "CHARGE",
          amount: payload.amount || order.totalPrice,
          status: "SUCCESS",
          createdAt: new Date().toISOString(),
        };
        db.payments.push(paymentRecord);
      } else if (rawStatus === "EXPIRED") {
        // Auto-restore stock when payment expired without being paid
        if (order.status === "UNDO_WINDOW" || (order.status as string) === "PENDING_PAYMENT") {
          order.status = "CANCELLED_TIMEOUT";
          order.cancelledAt = new Date().toISOString();
          order.cancelReason = "Batas waktu pembayaran Xendit (15 menit) telah kedaluwarsa.";

          const listing = db.listings.find((l) => l.id === order.listingId);
          if (listing) {
            listing.quantityRemaining += order.quantity;
            if (listing.status === "SOLD_OUT") {
              listing.status = "ACTIVE";
            }
          }
        }
      }
    }
  }

  return c.json({
    success: true,
    message: "Webhook payment received and processed",
    status: rawStatus,
    externalId,
  });
});
