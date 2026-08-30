import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/mock-db";
import { sanitizeText, sanitizeUrl } from "../../utils/security";
import type { Env, MerchantProfile } from "../../types";

export const MERCHANT_CATEGORIES = [
  "Bakery & Pastry",
  "Cafe & Minuman",
  "Restoran & Rumah Makan",
  "Warung & Kuliner Lokal",
  "Supermarket & Buah Segar",
  "Hotel & Buffet",
  "Fast Food & Cemilan",
] as const;

export const merchantsRouter = new Hono<{ Bindings: Env }>();

const step1Schema = z.object({
  storeName: z.string().min(3),
  category: z.string().min(2),
  businessPhone: z.string().min(8),
  address: z.string().min(8),
  mapsUrl: z.string().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
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
  mapsUrl: z.string().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  businessPhone: z.string().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  operatingDays: z.array(z.string()).optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolder: z.string().optional(),
  isStoreOpen: z.boolean().optional(),
});

// GET /merchants/categories
merchantsRouter.get("/categories", (c) => {
  return c.json({
    success: true,
    categories: MERCHANT_CATEGORIES,
  });
});

export function getMerchantForContext(c: any): MerchantProfile {
  const authHeader = c.req.header("authorization") || "";
  const xUserId = c.req.header("x-user-id") || c.req.header("x-merchant-id") || c.req.query("userId") || c.req.query("merchantId");

  if (xUserId) {
    const found = db.merchants.find((m) => m.userId === xUserId || m.id === xUserId);
    if (found) return found;

    // Check if user exists with this ID
    const user = db.users.find((u) => u.id === xUserId);
    if (user) {
      const newM: MerchantProfile = {
        id: `mer-${user.id}`,
        userId: user.id,
        storeName: (user as any).storeName || user.name || "Mitra Gerai",
        category: (user as any).category || "Bakery & Pastry",
        businessPhone: user.phone || "",
        address: "",
        mapsUrl: "",
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

  if (authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload.sub) {
          const found = db.merchants.find((m) => m.userId === payload.sub || m.id === payload.sub);
          if (found) return found;

          const user = db.users.find((u) => u.id === payload.sub);
          if (user) {
            const newM: MerchantProfile = {
              id: `mer-${user.id}`,
              userId: user.id,
              storeName: (user as any).storeName || user.name || "Mitra Gerai",
              category: (user as any).category || "Bakery & Pastry",
              businessPhone: user.phone || "",
              address: "",
              mapsUrl: "",
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

  const cleanFallback: MerchantProfile = {
    id: `mer-${Date.now().toString().slice(-6)}`,
    userId: `usr-${Date.now().toString().slice(-6)}`,
    storeName: "Mitra Gerai",
    category: "Bakery & Pastry",
    businessPhone: "",
    address: "",
    mapsUrl: "",
    location: { lat: -7.2856, lng: 112.6954 },
    openTime: "08:00",
    closeTime: "21:00",
    bankName: "BCA",
    accountNumber: "",
    accountHolder: "",
    isStoreOpen: false,
    agreedSlaAt: new Date().toISOString(),
    picName: "Mitra Gerai",
    avgRating: null as any,
    totalReviews: 0,
    isVerified: false,
    createdAt: new Date().toISOString(),
  };
  db.merchants.push(cleanFallback);
  return cleanFallback;
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
  if (body.mapsUrl !== undefined) merchant.mapsUrl = body.mapsUrl ? sanitizeUrl(body.mapsUrl) : "";
  if (body.location && typeof body.location.lat === "number" && typeof body.location.lng === "number") {
    merchant.location = {
      lat: body.location.lat,
      lng: body.location.lng,
    };
  }
  if (body.businessPhone) merchant.businessPhone = body.businessPhone;
  if (body.openTime) merchant.openTime = body.openTime;
  if (body.closeTime) merchant.closeTime = body.closeTime;
  if (body.operatingDays) merchant.operatingDays = body.operatingDays;
  if (body.bankName) merchant.bankName = body.bankName;
  if (body.accountNumber !== undefined) merchant.accountNumber = body.accountNumber.replace(/\D/g, "");
  if (body.accountHolder !== undefined) merchant.accountHolder = sanitizeText(body.accountHolder);
  if (body.isStoreOpen !== undefined) merchant.isStoreOpen = body.isStoreOpen;

  // Propagate updated merchant info (storeName, address, location, mapsUrl) to existing listings
  db.listings.forEach((l) => {
    if (l.merchantId === merchant.id || l.merchantId === merchant.userId) {
      l.merchant.storeName = merchant.storeName;
      l.merchant.address = merchant.address;
      l.merchant.location = { ...merchant.location };
      (l.merchant as any).mapsUrl = merchant.mapsUrl;
    }
  });

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
      storeName: merchant.storeName,
      category: merchant.category,
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
  if (body.mapsUrl !== undefined) merchant.mapsUrl = body.mapsUrl ? sanitizeUrl(body.mapsUrl) : "";
  if (body.location && typeof body.location.lat === "number" && typeof body.location.lng === "number") {
    merchant.location = {
      lat: body.location.lat,
      lng: body.location.lng,
    };
  }
  merchant.openTime = body.openTime;
  merchant.closeTime = body.closeTime;
  if (body.operatingDays) merchant.operatingDays = body.operatingDays;

  return c.json({ success: true, message: "Identitas gerai dan titik lokasi tersimpan." });
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
