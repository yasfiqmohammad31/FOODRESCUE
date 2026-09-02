// src/utils/merchant-context.ts
// Helper function to get merchant context from authenticated user

import { db } from '../db/mock-db';
import type { MerchantProfile } from '../types';

export function getMerchantForContext(c: any): MerchantProfile {
  // Get authenticated user from context
  const user = c.get('user');
  
  if (user && user.role === 'ADMIN') {
    // Admin can access all data - don't require merchant context
    throw new Error('Admin tidak memerlukan merchant context. Gunakan API admin khusus.');
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
        storeName: (userRecord as any).storeName || userRecord.name || '',
        category: (userRecord as any).category || '',
        businessPhone: userRecord.phone || '',
        address: '',
        mapsUrl: '',
        location: { lat: -7.2856, lng: 112.6954 },
        openTime: '08:00',
        closeTime: '21:00',
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        isStoreOpen: false,
        agreedSlaAt: new Date().toISOString(),
        picName: userRecord.name || '',
        avgRating: null as any,
        totalReviews: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };
      db.merchants.push(newM);
      return newM;
    }
  }

  throw new Error('Merchant context tidak ditemukan. Silakan login terlebih dahulu.');
}
