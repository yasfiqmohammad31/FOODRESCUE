// src/utils/merchant-context.ts
// Helper function to get merchant context from authenticated user

import { db } from '../db/mock-db';
import type { MerchantProfile } from '../types';

export function getMerchantForContext(c: any): MerchantProfile {
  // Get authenticated user from context
  const user = c.get('user');
  
  if (user && user.role === 'ADMIN') {
    if (db.merchants.length > 0) {
      return db.merchants[db.merchants.length - 1];
    }
    return createFallbackMerchant();
  }

  if (user) {
    const found = db.merchants.find(
      (m) => m.userId === user.sub || m.id === user.sub
    );
    if (found) return found;

    // Create merchant profile for authenticated user if not exists
    const userRecord = db.users.find((u) => u.id === user.sub);
    if (userRecord) {
      const newM: MerchantProfile = {
        id: `mer-${userRecord.id}`,
        userId: userRecord.id,
        storeName: (userRecord as any).storeName || userRecord.name || "Mitra Gerai",
        category: (userRecord as any).category || "Bakery & Pastry",
        businessPhone: userRecord.phone || "",
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
        picName: userRecord.name || "Pemilik Gerai",
        avgRating: null as any,
        totalReviews: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };
      db.merchants.push(newM);
      return newM;
    }
  }

  if (db.merchants.length > 0) {
    return db.merchants[db.merchants.length - 1];
  }

  return createFallbackMerchant();
}

function createFallbackMerchant(): MerchantProfile {
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
