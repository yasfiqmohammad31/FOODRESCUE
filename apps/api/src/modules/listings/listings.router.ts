import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/mock-db";
import { calculateDistanceKm, encodeGeohash } from "../../utils/geo";
import { sanitizeText } from "../../utils/security";
import type { Env, Listing, ListingCategory, MerchantProfile } from "../../types";

export const listingsRouter = new Hono<{ Bindings: Env }>();

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).default(-7.2856),
  lng: z.coerce.number().min(-180).max(180).default(112.6954),
  radius: z.coerce.number().min(1).max(50).default(25),
  category: z.enum(["ALL", "MYSTERY_BOX", "REGULAR"]).default("ALL"),
  sortBy: z.enum(["distance", "price", "pickup_deadline", "rating"]).default("distance"),
});

const createListingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.enum(["MYSTERY_BOX", "REGULAR"]),
  originalPrice: z.number().positive(),
  discountedPrice: z.number().positive(),
  quantityTotal: z.number().int().min(1),
  pickupStart: z.string(),
  pickupEnd: z.string(),
  allergens: z.array(z.string()).default([]),
});

const editListingSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  category: z.enum(["MYSTERY_BOX", "REGULAR"]).optional(),
  originalPrice: z.number().positive().optional(),
  discountedPrice: z.number().positive().optional(),
  quantityTotal: z.number().int().min(1).optional(),
  pickupStart: z.string().optional(),
  pickupEnd: z.string().optional(),
  allergens: z.array(z.string()).optional(),
});

const updateStockSchema = z.object({
  quantity: z.number().int().min(0),
});

function resolveMerchantContext(c: any): MerchantProfile {
  const authHeader = c.req.header("authorization") || "";
  const xUserId = c.req.header("x-user-id") || c.req.header("x-merchant-id") || c.req.query("userId") || c.req.query("merchantId");

  if (xUserId) {
    const found = db.merchants.find((m) => m.userId === xUserId || m.id === xUserId);
    if (found) return found;

    const user = db.users.find((u) => u.id === xUserId);
    if (user) {
      const newM: MerchantProfile = {
        id: `mer-${user.id}`,
        userId: user.id,
        storeName: (user as any).storeName || user.name || "",
        category: (user as any).category || "",
        businessPhone: user.phone || "",
        address: "",
        mapsUrl: "",
        location: { lat: -7.2856, lng: 112.6954 },
        openTime: "08:00",
        closeTime: "21:00",
        bankName: "",
        accountNumber: "",
        accountHolder: "",
        isStoreOpen: false,
        agreedSlaAt: new Date().toISOString(),
        picName: user.name || "",
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
      const parts = authHeader.slice(7).split(".");
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
              storeName: (user as any).storeName || user.name || "",
              category: (user as any).category || "",
              businessPhone: user.phone || "",
              address: "",
              mapsUrl: "",
              location: { lat: -7.2856, lng: 112.6954 },
              openTime: "08:00",
              closeTime: "21:00",
              bankName: "",
              accountNumber: "",
              accountHolder: "",
              isStoreOpen: false,
              agreedSlaAt: new Date().toISOString(),
              picName: user.name || "",
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

  // No fallback data - return error or empty merchant profile
  throw new Error("Merchant context tidak ditemukan. Silakan login atau kirim user ID yang valid.");
}

// GET /listings/merchant/my-listings (Merchant List Management - No Store Open Restriction)
listingsRouter.get("/merchant/my-listings", (c) => {
  const merchant = resolveMerchantContext(c);
  const myListings = db.listings.filter(
    (l) => l.merchantId === merchant.id || l.merchantId === merchant.userId
  );
  return c.json({
    success: true,
    count: myListings.length,
    data: myListings,
  });
});

// GET /listings (Hyperlocal Radius Discovery with Geohash Cache for Consumers)
listingsRouter.get("/", zValidator("query", querySchema), async (c) => {
  const { lat, lng, radius, category, sortBy } = c.req.valid("query");

  const geohash = encodeGeohash(lat, lng, 6);
  const cacheKey = `feed:geo:${geohash}:${category}:${sortBy}`;

  if (c.env?.CACHE_KV) {
    const cached = await c.env.CACHE_KV.get(cacheKey, "json");
    if (cached) {
      return c.json({ success: true, fromCache: true, data: cached });
    }
  }

  // Filter listings by active status and store open status
  let results = db.listings
    .filter((l) => {
      const merchant = db.merchants.find((m) => m.id === l.merchantId || m.userId === l.merchantId);
      if (!merchant || !merchant.isStoreOpen) return false;
      if (category !== "ALL" && l.category !== category) return false;
      return true;
    })
    .map((l) => {
      const distance = calculateDistanceKm(lat, lng, l.merchant.location.lat, l.merchant.location.lng);
      return {
        ...l,
        distanceKm: distance,
      };
    })
    .filter((l) => l.distanceKm <= radius);

  // Sorting
  if (sortBy === "distance") {
    results.sort((a, b) => a.distanceKm - b.distanceKm);
  } else if (sortBy === "price") {
    results.sort((a, b) => a.discountedPrice - b.discountedPrice);
  } else if (sortBy === "pickup_deadline") {
    results.sort((a, b) => new Date(a.pickupEnd).getTime() - new Date(b.pickupEnd).getTime());
  } else if (sortBy === "rating") {
    results.sort((a, b) => (b.merchant.avgRating || 5.0) - (a.merchant.avgRating || 5.0));
  }

  if (c.env?.CACHE_KV) {
    c.executionCtx?.waitUntil(
      c.env.CACHE_KV.put(cacheKey, JSON.stringify(results), { expirationTtl: 60 })
    );
  }

  return c.json({
    success: true,
    count: results.length,
    data: results,
  });
});

// GET /listings/:id
listingsRouter.get("/:id", (c) => {
  const id = c.req.param("id");
  const listing = db.listings.find((l) => l.id === id);
  if (!listing) {
    return c.json({ success: false, message: "Listing makanan tidak ditemukan" }, 404);
  }
  return c.json({ success: true, listing });
});

// POST /listings (Create Surplus Package)
listingsRouter.post("/", zValidator("json", createListingSchema), (c) => {
  const body = c.req.valid("json");

  if (body.discountedPrice >= body.originalPrice) {
    return c.json({
      success: false,
      message: "Harga diskon harus lebih rendah dari harga normal.",
    }, 400);
  }

  const merchant = resolveMerchantContext(c);
  const newListing: Listing = {
    id: `lst-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    merchantId: merchant.id,
    title: sanitizeText(body.title),
    description: sanitizeText(body.description),
    category: body.category,
    originalPrice: body.originalPrice,
    discountedPrice: body.discountedPrice,
    quantityTotal: body.quantityTotal,
    quantityRemaining: body.quantityTotal,
    pickupStart: body.pickupStart,
    pickupEnd: body.pickupEnd,
    status: "ACTIVE",
    aiSuggestedPrice: null,
    allergens: body.allergens,
    photoUrl:
      body.category === "MYSTERY_BOX"
        ? "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800"
        : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
    merchant: {
      storeName: merchant.storeName,
      address: merchant.address,
      location: merchant.location,
      avgRating: merchant.avgRating,
      isVerified: merchant.isVerified,
    },
    createdAt: new Date().toISOString(),
  };

  db.listings.unshift(newListing);

  return c.json({
    success: true,
    message: "Paket surplus berhasil dipublikasikan",
    listing: newListing,
  }, 201);
});

// PATCH /listings/:id (Full Edit Listing Details)
listingsRouter.patch("/:id", zValidator("json", editListingSchema), (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const listing = db.listings.find((l) => l.id === id);

  if (!listing) {
    return c.json({ success: false, message: "Listing tidak ditemukan" }, 404);
  }

  const origPrice = body.originalPrice ?? listing.originalPrice;
  const discPrice = body.discountedPrice ?? listing.discountedPrice;

  if (discPrice >= origPrice) {
    return c.json({
      success: false,
      message: "Harga diskon harus lebih rendah dari harga normal.",
    }, 400);
  }

  if (body.title) listing.title = sanitizeText(body.title);
  if (body.description) listing.description = sanitizeText(body.description);
  if (body.category) listing.category = body.category;
  if (body.originalPrice !== undefined) listing.originalPrice = body.originalPrice;
  if (body.discountedPrice !== undefined) listing.discountedPrice = body.discountedPrice;
  if (body.pickupStart) listing.pickupStart = body.pickupStart;
  if (body.pickupEnd) listing.pickupEnd = body.pickupEnd;
  if (body.allergens) listing.allergens = body.allergens;
  if (body.quantityTotal !== undefined) {
    const diff = body.quantityTotal - listing.quantityTotal;
    listing.quantityTotal = body.quantityTotal;
    listing.quantityRemaining = Math.max(0, listing.quantityRemaining + diff);
    if (listing.quantityRemaining > 0 && listing.status === "SOLD_OUT") {
      listing.status = "ACTIVE";
    }
  }

  return c.json({
    success: true,
    message: "Detail paket surplus berhasil diperbarui.",
    listing,
  });
});

// PATCH /listings/:id/stock (Quick Stock Update)
listingsRouter.patch("/:id/stock", zValidator("json", updateStockSchema), (c) => {
  const id = c.req.param("id");
  const { quantity } = c.req.valid("json");

  const listing = db.listings.find((l) => l.id === id);
  if (!listing) {
    return c.json({ success: false, message: "Listing tidak ditemukan" }, 404);
  }

  listing.quantityRemaining = quantity;
  listing.status = quantity <= 0 ? "SOLD_OUT" : "ACTIVE";

  return c.json({
    success: true,
    message: `Stok berhasil diubah menjadi ${quantity} porsi.`,
    listing,
  });
});

// DELETE /listings/:id
listingsRouter.delete("/:id", (c) => {
  const id = c.req.param("id");
  const index = db.listings.findIndex((l) => l.id === id);
  if (index === -1) {
    return c.json({ success: false, message: "Listing tidak ditemukan" }, 404);
  }

  db.listings.splice(index, 1);
  return c.json({ success: true, message: "Listing berhasil dihapus." });
});

// POST /listings/:id/apply-ai-price
listingsRouter.post("/:id/apply-ai-price", (c) => {
  const id = c.req.param("id");
  const listing = db.listings.find((l) => l.id === id);
  if (!listing) {
    return c.json({ success: false, message: "Listing tidak ditemukan." }, 404);
  }

  const newPrice = listing.aiSuggestedPrice || Math.round((listing.discountedPrice * 0.85) / 1000) * 1000;
  listing.discountedPrice = newPrice;
  listing.aiSuggestedPrice = null;

  return c.json({
    success: true,
    message: "Harga saran AI berhasil diterapkan.",
    listing,
  });
});
