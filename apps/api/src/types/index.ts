// Cloudflare Worker Environment Bindings
export interface Env {
  ENVIRONMENT: string;
  APP_NAME: string;
  JWT_ACCESS_SECRET: string;
  XENDIT_CALLBACK_TOKEN: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  FONNTE_TOKEN?: string;
  CACHE_KV?: KVNamespace;
  FOOD_STORAGE_R2?: R2Bucket;
  AI?: any; // Cloudflare Workers AI binding
  DATABASE_URL?: string;
}

export type UserRole = "CONSUMER" | "MERCHANT" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  googleId?: string;
  createdAt: string;
}

export interface MerchantProfile {
  id: string;
  userId: string;
  storeName: string;
  category: string;
  businessPhone: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  openTime: string;
  closeTime: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isStoreOpen: boolean;
  agreedSlaAt?: string;
  picName?: string;
  avgRating: number;
  totalReviews: number;
  isVerified: boolean;
  createdAt: string;
}

export type ListingCategory = "MYSTERY_BOX" | "REGULAR";
export type ListingStatus = "ACTIVE" | "SOLD_OUT" | "EXPIRED";

export interface Listing {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  category: ListingCategory;
  originalPrice: number;
  discountedPrice: number;
  quantityTotal: number;
  quantityRemaining: number;
  pickupStart: string;
  pickupEnd: string;
  status: ListingStatus;
  aiSuggestedPrice?: number | null;
  allergens: string[];
  photoUrl: string;
  merchant: {
    storeName: string;
    address: string;
    location: { lat: number; lng: number };
    avgRating: number;
    isVerified: boolean;
  };
  createdAt: string;
}

export type OrderStatus =
  | "UNDO_WINDOW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "CANCELLED_CONSUMER_UNDO"
  | "CANCELLED_MERCHANT"
  | "NO_SHOW";

export type PaymentMethod = "QRIS" | "EWALLET" | "RESCUE_CREDIT";

export interface Order {
  id: string;
  orderNumber: string; // e.g. FR-20260829-8821
  consumerId: string;
  listingId: string;
  merchantId: string;
  quantity: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  undoDeadline: string; // ISO string: paidAt + 60s
  paidAt: string;
  confirmedAt: string | null;
  pickedUpAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  listing: {
    title: string;
    photoUrl: string;
    category: ListingCategory;
  };
  merchant: {
    storeName: string;
    address: string;
    location: { lat: number; lng: number };
  };
}

export interface PayoutItem {
  id: string;
  payoutNumber: string; // e.g. WD-20260829-8821
  merchantId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

export interface RescueCreditWallet {
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  orderId?: string;
  amount: number;
  type: "REFUND_UNDO" | "REFUND_MERCHANT_CANCEL" | "PURCHASE_PAYMENT" | "BANK_WITHDRAWAL";
  description: string;
  createdAt: string;
}

export interface VoucherTokenPayload {
  sub: string; // orderId
  uid: string; // consumerId
  mid: string; // merchantId
  orderNumber: string;
  iat: number;
  exp: number; // iat + 30s
}

export interface Review {
  id: string;
  orderId: string;
  consumerId: string;
  merchantId: string;
  rating: number; // 1-5
  comment: string;
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "CRITICAL_FOOD_SAFETY";
  moderationFlag?: boolean;
  createdAt: string;
}

export interface ImpactStats {
  userId: string;
  portionsSaved: number;
  co2eSavedKg: number;
  treesEquivalent: number;
  moneySavedRp: number;
  updatedAt: string;
}
