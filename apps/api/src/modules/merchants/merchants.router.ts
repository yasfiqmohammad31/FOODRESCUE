import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/mock-db";
import { sanitizeText } from "../../utils/security";
import type { Env, MerchantProfile } from "../../types";

export const merchantsRouter = new Hono<{ Bindings: Env }>();

const step1Schema = z.object({
  storeName: z.string().min(3),
  category: z.string().min(2),
  businessPhone: z.string().min(10).max(15),
  address: z.string().min(8),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const step2Schema = z.object({
  bankName: z.enum(["BCA", "Mandiri", "BRI", "BNI", "BSI"]),
  accountNumber: z.string().min(8).max(18),
  accountHolder: z.string().min(3),
});

const step3Schema = z.object({
  agreedTerms: z.literal(true),
  picName: z.string().min(3),
});

function getOrCreateMerchant(): MerchantProfile {
  if (!db.merchants[0]) {
    const defaultMerchant: MerchantProfile = {
      id: "mer-01",
      userId: db.users.find((u) => u.role === "MERCHANT")?.id || "usr-mer-001",
      storeName: "Artisan Bakery & Cafe",
      category: "Bakery & Pastry",
      businessPhone: "+6281987654321",
      address: "Jl. Raya Darmo Permai No. 45, Surabaya",
      location: { lat: -7.2856, lng: 112.6954 },
      openTime: "08:00",
      closeTime: "22:00",
      bankName: "BCA",
      accountNumber: "8271928401",
      accountHolder: "Artisan Bakery Official",
      isStoreOpen: true,
      agreedSlaAt: new Date().toISOString(),
      picName: "Budi Santoso",
      avgRating: 5.0,
      totalReviews: 0,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };
    db.merchants.push(defaultMerchant);
    return defaultMerchant;
  }
  return db.merchants[0];
}

// GET /merchants/profile
merchantsRouter.get("/profile", (c) => {
  const merchant = getOrCreateMerchant();
  return c.json({ success: true, merchant });
});

// GET /merchants/stats
merchantsRouter.get("/stats", (c) => {
  const merchant = getOrCreateMerchant();
  const merchantOrders = db.orders.filter((o) => o.merchantId === merchant.id);
  const todayOrders = merchantOrders.filter(
    (o) => o.status === "PICKED_UP" || o.status === "READY" || o.status === "CONFIRMED"
  );

  const todayRevenue = todayOrders.reduce((sum, o) => sum + Math.round(o.totalPrice * 0.85), 0);
  const todayPortionsSaved = todayOrders.reduce((sum, o) => sum + o.quantity, 0);
  const activeListingsCount = db.listings.filter(
    (l) => l.merchantId === merchant.id && l.status === "ACTIVE" && l.quantityRemaining > 0
  ).length;

  return c.json({
    success: true,
    stats: {
      todayRevenue,
      todayPortionsSaved,
      availableBalance: todayRevenue || 1485000,
      activeListingsCount,
      pendingOrdersCount: todayOrders.length,
      storeRating: merchant.avgRating,
      totalReviews: merchant.totalReviews,
      isStoreOpen: merchant.isStoreOpen,
    },
  });
});

// PATCH /merchants/toggle-status
merchantsRouter.patch("/toggle-status", (c) => {
  const merchant = getOrCreateMerchant();
  merchant.isStoreOpen = !merchant.isStoreOpen;

  return c.json({
    success: true,
    message: merchant.isStoreOpen
      ? "Gerai berhasil DIBUKA. Listing aktif kini dapat direservasi pembeli."
      : "Gerai DITUTUP sementara. Listing disembunyikan dari feed pencarian.",
    isStoreOpen: merchant.isStoreOpen,
  });
});

// POST /merchants/onboarding/step-1
merchantsRouter.post("/onboarding/step-1", zValidator("json", step1Schema), (c) => {
  const body = c.req.valid("json");
  if (body.openTime >= body.closeTime) {
    return c.json({ success: false, message: "Jam tutup harus lebih akhir dari jam buka." }, 400);
  }

  const merchant = getOrCreateMerchant();
  merchant.storeName = sanitizeText(body.storeName);
  merchant.category = body.category;
  merchant.businessPhone = body.businessPhone;
  merchant.address = sanitizeText(body.address);
  merchant.openTime = body.openTime;
  merchant.closeTime = body.closeTime;

  return c.json({ success: true, message: "Identitas gerai tersimpan." });
});

// POST /merchants/onboarding/step-2
merchantsRouter.post("/onboarding/step-2", zValidator("json", step2Schema), (c) => {
  const body = c.req.valid("json");
  const cleanAcc = body.accountNumber.replace(/\D/g, "");
  if (cleanAcc.length < 8 || cleanAcc.length > 18) {
    return c.json({ success: false, message: "Nomor rekening harus 8-18 digit angka." }, 400);
  }

  const merchant = getOrCreateMerchant();
  merchant.bankName = body.bankName;
  merchant.accountNumber = cleanAcc;
  merchant.accountHolder = sanitizeText(body.accountHolder);

  return c.json({ success: true, message: "Rekening penyaluran dana tersimpan." });
});

// POST /merchants/onboarding/step-3
merchantsRouter.post("/onboarding/step-3", zValidator("json", step3Schema), (c) => {
  const body = c.req.valid("json");

  const merchant = getOrCreateMerchant();
  merchant.agreedSlaAt = new Date().toISOString();
  merchant.picName = sanitizeText(body.picName);
  merchant.isVerified = true;
  merchant.isStoreOpen = true;

  return c.json({
    success: true,
    message: "Verifikasi SLA berhasil. Gerai Anda resmi terdaftar dan aktif!",
    merchant,
  });
});
