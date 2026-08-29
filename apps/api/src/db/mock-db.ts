import type {
  User,
  MerchantProfile,
  Listing,
  Order,
  PayoutItem,
  RescueCreditWallet,
  CreditTransaction,
  Review,
  ImpactStats,
} from "../types";

export interface DatabaseStore {
  users: User[];
  merchants: MerchantProfile[];
  listings: Listing[];
  orders: Order[];
  payouts: PayoutItem[];
  wallets: Record<string, RescueCreditWallet>;
  transactions: CreditTransaction[];
  reviews: Review[];
  impactStats: Record<string, ImpactStats>;
  usedVoucherTokens: Set<string>;
}

export const db: DatabaseStore = {
  users: [
    {
      id: "usr-cns-001",
      email: "alex@kampus.ac.id",
      name: "Alex Pratama",
      phone: "+6281234567890",
      role: "CONSUMER",
      createdAt: "2026-08-01T08:00:00Z",
    },
    {
      id: "usr-mer-001",
      email: "owner@artisanbakery.com",
      name: "Budi Santoso",
      phone: "+6281987654321",
      role: "MERCHANT",
      createdAt: "2026-08-01T08:00:00Z",
    },
  ],

  merchants: [
    {
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
      isStoreOpen: true,
      agreedSlaAt: "2026-08-01T08:30:00Z",
      picName: "Budi Santoso",
      avgRating: 4.9,
      totalReviews: 124,
      isVerified: true,
      createdAt: "2026-08-01T08:00:00Z",
    },
  ],

  listings: [
    {
      id: "lst-001",
      merchantId: "mer-01",
      title: "Mystery Box Pastry & Viennoiserie",
      description: "Paket misteri aneka croissant, pain au chocolat, dan danish pastry segar hasil panggangan hari ini.",
      category: "MYSTERY_BOX",
      originalPrice: 55000,
      discountedPrice: 22000,
      quantityTotal: 6,
      quantityRemaining: 4,
      pickupStart: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      pickupEnd: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
      status: "ACTIVE",
      aiSuggestedPrice: 19000,
      allergens: ["Gluten", "Dairy", "Eggs"],
      photoUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80",
      merchant: {
        storeName: "Artisan Bakery & Cafe",
        address: "Jl. Raya Darmo Permai No. 45, Surabaya",
        location: { lat: -7.2856, lng: 112.6954 },
        avgRating: 4.9,
        isVerified: true,
      },
      createdAt: "2026-08-29T10:00:00Z",
    },
    {
      id: "lst-002",
      merchantId: "mer-01",
      title: "Artisan Sourdough Loaf (Whole)",
      description: "Roti sourdough fermentasi 24 jam dengan kerak renyah dan bagian dalam lembut berongga.",
      category: "REGULAR",
      originalPrice: 45000,
      discountedPrice: 20000,
      quantityTotal: 4,
      quantityRemaining: 2,
      pickupStart: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      pickupEnd: new Date(Date.now() + 1000 * 60 * 150).toISOString(),
      status: "ACTIVE",
      aiSuggestedPrice: null,
      allergens: ["Gluten"],
      photoUrl: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&auto=format&fit=crop&q=80",
      merchant: {
        storeName: "Artisan Bakery & Cafe",
        address: "Jl. Raya Darmo Permai No. 45, Surabaya",
        location: { lat: -7.2856, lng: 112.6954 },
        avgRating: 4.9,
        isVerified: true,
      },
      createdAt: "2026-08-29T11:00:00Z",
    },
  ],

  orders: [
    {
      id: "ord-101",
      orderNumber: "FR-20260829-8821",
      consumerId: "usr-cns-001",
      listingId: "lst-001",
      merchantId: "mer-01",
      quantity: 1,
      totalPrice: 22000,
      paymentMethod: "QRIS",
      status: "CONFIRMED",
      undoDeadline: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      paidAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      confirmedAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
      pickedUpAt: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      listing: {
        title: "Mystery Box Pastry & Viennoiserie",
        photoUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80",
        category: "MYSTERY_BOX",
      },
      merchant: {
        storeName: "Artisan Bakery & Cafe",
        address: "Jl. Raya Darmo Permai No. 45, Surabaya",
        location: { lat: -7.2856, lng: 112.6954 },
      },
    },
  ],

  payouts: [
    {
      id: "po-001",
      payoutNumber: "WD-20260828-0912",
      merchantId: "mer-01",
      amount: 850000,
      bankName: "BCA",
      accountNumber: "8271928401",
      accountHolder: "Artisan Bakery Official",
      status: "COMPLETED",
      createdAt: "2026-08-28T16:30:00Z",
    },
  ],

  wallets: {
    "usr-cns-001": {
      userId: "usr-cns-001",
      balance: 45000,
      updatedAt: "2026-08-29T12:00:00Z",
    },
  },

  transactions: [
    {
      id: "tx-001",
      userId: "usr-cns-001",
      orderId: "ord-099",
      amount: 22000,
      type: "REFUND_UNDO",
      description: "Pengembalian dana 100% pembatalan pesanan 60s",
      createdAt: "2026-08-28T18:00:00Z",
    },
  ],

  reviews: [],

  impactStats: {
    "usr-cns-001": {
      userId: "usr-cns-001",
      portionsSaved: 14,
      co2eSavedKg: 35.0,
      treesEquivalent: 2.1,
      moneySavedRp: 320000,
      updatedAt: "2026-08-29T12:00:00Z",
    },
  },

  usedVoucherTokens: new Set<string>(),
};
