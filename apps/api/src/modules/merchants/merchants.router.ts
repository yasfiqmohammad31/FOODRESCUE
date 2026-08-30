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
  operatingDays: z.array(z.string()).optional(),
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

const updateProfileSchema = z.object({
  storeName: z.string().min(3).optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  businessPhone: z.string().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  operatingDays: z.array(z.string()).optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolder: z.string().optional(),
  isStoreOpen: z.boolean().optional(),
});

export function getMerchantForContext(c: any): MerchantProfile {
  const authHeader = c.req.header("authorization") || "";
  const xUserId = c.req.header("x-user-id") || c.req.query("userId") || c.req.query("merchantId");

  if (xUserId) {
    const found = db.merchants.find((m) => m.userId === xUserId || m.id === xUserId);
    if (found) return found;
  }

  if (authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload.sub) {
          const found = db.merchants.find((m) => m.userId === payload.sub || m.id === payload.sub);
          if (found) return found;

          // If user exists with role MERCHANT, create clean profile
          const user = db.users.find((u) => u.id === payload.sub);
          if (user) {
            const newM: MerchantProfile = {
              id: `mer-${user.id}`,
              userId: user.id,
              storeName: (user as any).storeName || user.name || "Mitra Gerai",
              category: (user as any).category || "Bakery & Pastry",
              businessPhone: user.phone || "",
              address: "",
              location: { lat: -7.2856, lng: 112.6954 },
              openTime: "08:00",
              closeTime: "21:00",
              bankName: "BCA",
              accountNumber: "",
              accountHolder: "",
              isStoreOpen: false,
              agreedSlaAt: new Date().toISOString(),
              picName: user.name || "Pemilik Gerai",
              avgRating: null as any,
              totalReviews: 0,
              isVerified: false,
              createdAt: new Date().toISOString(),
            };
            db.merchants.push(newM);
            return newM;
          }
        }
      }
    } catch {}
  }

  if (db.merchants.length > 0) {
    return db.merchants[db.merchants.length - 1];
  }

  const defaultMerchant: MerchantProfile = {
    id: "mer-01",
    userId: "usr-mer-001",
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
    isStoreOpen: false,
    agreedSlaAt: new Date().toISOString(),
    picName: "Budi Santoso",
    avgRating: 5.0,
    totalReviews: 0,
    isVerified: true,
    createdAt: new Date().toISOString(),
  };
  db.merchants.push(defaultMerchant);
  return defaultMerchant;
}

// GET /merchants/profile
merchantsRouter.get("/profile", (c) => {
  const merchant = getMerchantForContext(c);
  return c.json({ success: true, merchant });
});

// PATCH /merchants/profile
merchantsRouter.patch("/profile", zValidator("json", updateProfileSchema), (c) => {
  const body = c.req.valid("json");
  const merchant = getMerchantForContext(c);

  // Validate active listing if merchant wants to open store
  if (body.isStoreOpen === true && !merchant.isStoreOpen) {
    const activeListings = db.listings.filter(
      (l) =>
        (l.merchantId === merchant.id || l.merchantId === merchant.userId) &&
        l.status === "ACTIVE" &&
        l.quantityRemaining > 0
    );
    if (activeListings.length === 0) {
      return c.json(
        {
          success: false,
          message:
            "Tidak dapat membuka gerai: Harap buat minimal 1 paket listing makanan surplus aktif terlebih dahulu.",
          reason: "NO_ACTIVE_LISTINGS",
        },
        400
      );
    }
  }

  if (body.storeName) merchant.storeName = sanitizeText(body.storeName);
  if (body.category) merchant.category = sanitizeText(body.category);
  if (body.address !== undefined) merchant.address = sanitizeText(body.address);
  if (body.businessPhone) merchant.businessPhone = body.businessPhone;
  if (body.openTime) merchant.openTime = body.openTime;
  if (body.closeTime) merchant.closeTime = body.closeTime;
  if (body.operatingDays) merchant.operatingDays = body.operatingDays;
  if (body.bankName) merchant.bankName = body.bankName;
  if (body.accountNumber !== undefined) merchant.accountNumber = body.accountNumber.replace(/\D/g, "");
  if (body.accountHolder !== undefined) merchant.accountHolder = sanitizeText(body.accountHolder);
  if (body.isStoreOpen !== undefined) merchant.isStoreOpen = body.isStoreOpen;

  return c.json({
    success: true,
    message: "Pengaturan profil gerai berhasil diperbarui.",
    merchant,
  });
});

// GET /merchants/stats
merchantsRouter.get("/stats", (c) => {
  const merchant = getMerchantForContext(c);
  const merchantOrders = db.orders.filter((o) => o.merchantId === merchant.id || o.merchantId === merchant.userId);
  const completedOrders = merchantOrders.filter(
    (o) => o.status === "PICKED_UP" || o.status === "READY" || o.status === "CONFIRMED"
  );
  const pendingOrders = merchantOrders.filter(
    (o) => o.status === "CONFIRMED" || o.status === "PREPARING"
  );

  const todayRevenue = completedOrders.reduce((sum, o) => sum + Math.round(o.totalPrice * 0.85), 0);
  const todayPortionsSaved = completedOrders.reduce((sum, o) => sum + o.quantity, 0);
  const activeListingsCount = db.listings.filter(
    (l) =>
      (l.merchantId === merchant.id || l.merchantId === merchant.userId) &&
      l.status === "ACTIVE" &&
      l.quantityRemaining > 0
  ).length;

  return c.json({
    success: true,
    stats: {
      todayRevenue,
      todayPortionsSaved,
      availableBalance: todayRevenue,
      activeListingsCount,
      pendingOrdersCount: pendingOrders.length,
      storeRating: (merchant.totalReviews && merchant.totalReviews > 0) ? (merchant.avgRating || 5.0) : null,
      totalReviews: merchant.totalReviews || 0,
      isStoreOpen: merchant.isStoreOpen ?? false,
    },
  });
});

// PATCH /merchants/toggle-status
merchantsRouter.patch("/toggle-status", (c) => {
  const merchant = getMerchantForContext(c);

  if (!merchant.isStoreOpen) {
    // Attempting to OPEN store: check if active listings exist
    const activeListings = db.listings.filter(
      (l) =>
        (l.merchantId === merchant.id || l.merchantId === merchant.userId) &&
        l.status === "ACTIVE" &&
        l.quantityRemaining > 0
    );
    if (activeListings.length === 0) {
      return c.json(
        {
          success: false,
          message:
            "Tidak dapat membuka gerai: Harap buat minimal 1 paket listing makanan surplus aktif terlebih dahulu.",
          reason: "NO_ACTIVE_LISTINGS",
          isStoreOpen: false,
        },
        400
      );
    }
  }

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

  const merchant = getMerchantForContext(c);
  merchant.storeName = sanitizeText(body.storeName);
  merchant.category = body.category;
  merchant.businessPhone = body.businessPhone;
  merchant.address = sanitizeText(body.address);
  merchant.openTime = body.openTime;
  merchant.closeTime = body.closeTime;
  if (body.operatingDays) merchant.operatingDays = body.operatingDays;

  return c.json({ success: true, message: "Identitas gerai tersimpan." });
});

// POST /merchants/onboarding/step-2
merchantsRouter.post("/onboarding/step-2", zValidator("json", step2Schema), (c) => {
  const body = c.req.valid("json");
  const cleanAcc = body.accountNumber.replace(/\D/g, "");
  if (cleanAcc.length < 8 || cleanAcc.length > 18) {
    return c.json({ success: false, message: "Nomor rekening harus 8-18 digit angka." }, 400);
  }

  const merchant = getMerchantForContext(c);
  merchant.bankName = body.bankName;
  merchant.accountNumber = cleanAcc;
  merchant.accountHolder = sanitizeText(body.accountHolder);

  return c.json({ success: true, message: "Rekening penyaluran dana tersimpan." });
});

// POST /merchants/onboarding/step-3
merchantsRouter.post("/onboarding/step-3", zValidator("json", step3Schema), (c) => {
  const body = c.req.valid("json");

  const merchant = getMerchantForContext(c);
  merchant.agreedSlaAt = new Date().toISOString();
  merchant.picName = sanitizeText(body.picName);
  merchant.isVerified = true;
  merchant.isStoreOpen = false; // Remains closed until merchant publishes first listing!

  return c.json({
    success: true,
    message: "Verifikasi SLA berhasil. Gerai Anda resmi terdaftar!",
    merchant,
  });
});
