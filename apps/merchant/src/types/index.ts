/* ============================================================
   FOODRESCUE — Domain Types
   Tipe-tipe utama yang digunakan di seluruh aplikasi.
   ============================================================ */

// --- User & Auth ---

export type UserRole = "CONSUMER" | "MERCHANT" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
}

// --- Merchant ---

export interface MerchantProfile {
  id: string;
  userId: string;
  storeName: string;
  description: string | null;
  address: string;
  location: { lat: number; lng: number };
  operatingHours: string[];
  avgRating: number;
  totalReviews: number;
  isVerified: boolean;
  isFeatured: boolean;
}

// --- Listing ---

export type ListingCategory = "REGULAR" | "MYSTERY_BOX";
export type ListingStatus = "ACTIVE" | "SOLD_OUT" | "EXPIRED" | "CANCELLED";

export interface Listing {
  id: string;
  merchantId: string;
  merchant: Pick<MerchantProfile, "storeName" | "avgRating" | "address" | "location" | "isVerified">;
  title: string;
  description: string | null;
  category: ListingCategory;
  originalPrice: number;
  discountedPrice: number;
  quantityTotal: number;
  quantityRemaining: number;
  allergens: string[];
  photoUrl: string;
  pickupStart: string;  // ISO datetime
  pickupEnd: string;    // ISO datetime
  status: ListingStatus;
  aiSuggestedPrice: number | null;
  distanceMeters?: number;
  createdAt: string;
}

// --- Order ---

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "UNDO_WINDOW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "NO_SHOW"
  | "CANCELLED_CONSUMER"
  | "CANCELLED_MERCHANT"
  | "CANCELLED_TIMEOUT";

export type PaymentMethod = "QRIS" | "EWALLET" | "RESCUE_CREDIT";

export interface Order {
  id: string;
  orderNumber: string;
  consumerId: string;
  listingId: string;
  merchantId: string;
  listing: Pick<Listing, "title" | "photoUrl" | "category">;
  merchant: Pick<MerchantProfile, "storeName" | "address" | "location">;
  quantity: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  undoDeadline: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  pickedUpAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

// --- Payment ---

export interface Payment {
  id: string;
  orderId: string;
  xenditPaymentId: string;
  type: "CHARGE" | "REFUND" | "DISBURSEMENT";
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  createdAt: string;
}

// --- Rescue Credit ---

export interface RescueCredit {
  id: string;
  userId: string;
  balance: number;
}

export type CreditTransactionType = "REFUND_IN" | "PAYMENT_OUT" | "TOPUP" | "ADMIN_ADJUSTMENT";

export interface CreditTransaction {
  id: string;
  creditId: string;
  orderId: string | null;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

// --- Voucher ---

export type VoucherStatus = "ACTIVE" | "USED" | "EXPIRED" | "CANCELLED";

export interface Voucher {
  id: string;
  orderId: string;
  token: string;
  qrPayload: string;
  status: VoucherStatus;
  expiresAt: string;
  usedAt: string | null;
}

// --- Review ---

export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "CRITICAL";

export interface Review {
  id: string;
  orderId: string;
  consumerId: string;
  consumerName: string;
  merchantId: string;
  rating: number;
  comment: string | null;
  sentiment: Sentiment | null;
  isFlagged: boolean;
  createdAt: string;
}

// --- Impact ---

export interface ImpactStats {
  totalPortionsSaved: number;
  totalCo2PreventedKg: number;
  totalOrdersCompleted: number;
  totalMoneySaved: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  criteria: { type: string; threshold: number };
  earnedAt?: string;  // undefined jika belum diperoleh
  progress?: number;  // 0-100, undefined jika sudah earned
}

// --- Notification ---

export interface Notification {
  id: string;
  title: string;
  body: string;
  channel: "PUSH" | "IN_APP" | "EMAIL";
  isRead: boolean;
  metadata: Record<string, string> | null;
  actionUrl: string | null;
  sentAt: string;
}

// --- Geo ---

export interface Coordinates {
  lat: number;
  lng: number;
}

// --- Allergens ---

export const ALLERGEN_LIST = [
  "Gluten",
  "Dairy",
  "Nuts",
  "Eggs",
  "Soy",
  "Seafood",
  "Sesame",
] as const;

export type Allergen = (typeof ALLERGEN_LIST)[number];
