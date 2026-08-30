// API Client for FOODRESCUE Merchant Partner Portal
import type { Listing, Order } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export async function fetchMerchantApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; [key: string]: any }> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("fr_merchant_token") : null;
    const userRaw = typeof window !== "undefined" ? localStorage.getItem("fr_merchant") : null;
    const user = userRaw ? JSON.parse(userRaw) : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (user?.id) {
      headers["x-user-id"] = user.id;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.warn(`[Merchant API Client] Network fallback for ${endpoint}:`, error.message);
    return { success: false, message: error.message };
  }
}

// -------------------------------------------------------------
// Merchant API Services
// -------------------------------------------------------------
export const merchantApi = {
  // Store & Stats
  async getStats() {
    const res = await fetchMerchantApi("/api/merchants/stats");
    if (res.success && res.stats) {
      return res.stats;
    }
    return {
      todayRevenue: 0,
      todayPortionsSaved: 0,
      availableBalance: 0,
      activeListingsCount: 0,
      pendingOrdersCount: 0,
      storeRating: 5.0,
      totalReviews: 0,
      isStoreOpen: false,
    };
  },

  async toggleStoreStatus() {
    return fetchMerchantApi("/api/merchants/toggle-status", {
      method: "PATCH",
    });
  },

  async getProfile() {
    return fetchMerchantApi("/api/merchants/profile");
  },

  async getCategories(): Promise<string[]> {
    const res = await fetchMerchantApi<{ success: boolean; categories: string[] }>("/api/merchants/categories");
    if (res.success && Array.isArray(res.categories)) {
      return res.categories;
    }
    return [
      "Bakery & Pastry",
      "Cafe & Minuman",
      "Restoran & Rumah Makan",
      "Warung & Kuliner Lokal",
      "Supermarket & Buah Segar",
      "Hotel & Buffet",
      "Fast Food & Cemilan",
    ];
  },

  async updateProfile(data: {
    storeName?: string;
    category?: string;
    address?: string;
    location?: { lat: number; lng: number };
    businessPhone?: string;
    openTime?: string;
    closeTime?: string;
    operatingDays?: string[];
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    isStoreOpen?: boolean;
  }) {
    return fetchMerchantApi("/api/merchants/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Onboarding
  async submitStep1(data: {
    storeName: string;
    category: string;
    businessPhone: string;
    address: string;
    location?: { lat: number; lng: number };
    openTime: string;
    closeTime: string;
    operatingDays?: string[];
  }) {
    return fetchMerchantApi("/api/merchants/onboarding/step-1", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async submitStep2(data: { bankName: string; accountNumber: string; accountHolder: string }) {
    return fetchMerchantApi("/api/merchants/onboarding/step-2", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async submitStep3(data: { agreedTerms: boolean; picName: string }) {
    return fetchMerchantApi("/api/merchants/onboarding/step-3", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Listings Management
  async getListings() {
    const res = await fetchMerchantApi<Listing[]>("/api/listings?radius=25");
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  async createListing(payload: {
    title: string;
    description: string;
    category: string;
    originalPrice: number;
    discountedPrice: number;
    quantityTotal: number;
    pickupStart: string;
    pickupEnd: string;
    allergens?: string[];
  }) {
    return fetchMerchantApi("/api/listings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateStock(listingId: string, quantity: number) {
    return fetchMerchantApi(`/api/listings/${listingId}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  },

  async deleteListing(listingId: string) {
    return fetchMerchantApi(`/api/listings/${listingId}`, {
      method: "DELETE",
    });
  },

  async applyAiPrice(listingId: string) {
    return fetchMerchantApi(`/api/listings/${listingId}/apply-ai-price`, {
      method: "POST",
    });
  },

  // Orders Management
  async getOrdersQueue() {
    const res = await fetchMerchantApi<{ orders: Order[] }>("/api/orders/merchant/queue");
    if (res.success && Array.isArray(res.orders)) {
      return res.orders;
    }
    return [];
  },

  async updateOrderStatus(orderId: string, status: "PREPARING" | "READY" | "PICKED_UP") {
    return fetchMerchantApi(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async emergencyCancelOrder(orderId: string, reason: string) {
    return fetchMerchantApi(`/api/orders/${orderId}/cancel-merchant`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // Scanner Verification
  async verifyPickup(params: { token?: string; orderNumber?: string; merchantId?: string }) {
    return fetchMerchantApi("/api/vouchers/verify-pickup", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // Payouts & Disbursement
  async getPayoutHistory() {
    return fetchMerchantApi("/api/payouts/history");
  },

  async withdrawFunds(amount: number) {
    return fetchMerchantApi("/api/payouts/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },

  // AI Insights
  async getSurplusPrediction() {
    return fetchMerchantApi("/api/ai/surplus-prediction");
  },

  // Auth & OTP
  async sendOtp(phone: string) {
    return fetchMerchantApi<{ success: boolean; message: string; cooldownSeconds?: number; simulated?: boolean; debugCode?: string }>("/api/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  async verifyOtp(phone: string, code: string, newPassword?: string) {
    return fetchMerchantApi<{ success: boolean; message: string }>("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code, newPassword }),
    });
  },
};
