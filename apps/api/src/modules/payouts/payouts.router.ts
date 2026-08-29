import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/mock-db";
import { buildMerchantPayoutEmail, safeDispatch, sendEmail } from "../notifications/email.service";
import type { Env, PayoutItem } from "../../types";

export const payoutsRouter = new Hono<{ Bindings: Env }>();

const withdrawSchema = z.object({
  amount: z.number().int().min(10000),
});

// GET /payouts/history
payoutsRouter.get("/history", (c) => {
  return c.json({ success: true, history: db.payouts });
});

// POST /payouts/withdraw
payoutsRouter.post("/withdraw", zValidator("json", withdrawSchema), (c) => {
  const { amount } = c.req.valid("json");
  const merchant = db.merchants[0];

  const availableBalance = 1485000;
  if (amount > availableBalance) {
    return c.json({
      success: false,
      message: "Nominal penarikan melebihi saldo tersedia.",
    }, 400);
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const payoutNumber = `WD-${dateStr}-${randomSuffix}`;
  const netAmount = Math.round(amount * 0.85);

  const newPayout: PayoutItem = {
    id: `po-${Date.now().toString().slice(-6)}`,
    payoutNumber,
    merchantId: merchant.id,
    amount,
    netAmount,
    platformFee: amount - netAmount,
    bankName: merchant.bankName,
    accountNumber: merchant.accountNumber,
    accountHolder: merchant.accountHolder,
    status: "PROCESSING",
    createdAt: now.toISOString(),
  };

  db.payouts.unshift(newPayout);

  // Dispatch Merchant Payout Email via Resend
  const merchantUser = db.users.find((u) => u.id === merchant.userId);
  const targetEmail = merchantUser?.email || "owner@artisanbakery.com";
  const { subject, html } = buildMerchantPayoutEmail(newPayout, merchant);
  safeDispatch(c, sendEmail(c.env, { to: targetEmail, subject, html }));

  return c.json({
    success: true,
    message: `Permintaan transfer sebesar Rp ${amount.toLocaleString("id-ID")} berhasil diajukan.`,
    payout: newPayout,
  }, 201);
});
