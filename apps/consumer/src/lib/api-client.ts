// API Client for FOODRESCUE Consumer PWA
import type { Listing, Order } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; [key: string]: any }> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("fr_token") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.warn(`[API Client] Network fallback for ${endpoint}:`, error.message);
    return { success: false, message: error.message };
  }
}

// -------------------------------------------------------------
// Consumer API Services
// -------------------------------------------------------------
export const consumerApi = {
  // Feed & Listings
  async getListings(params: { lat?: number; lng?: number; radius?: number; category?: string; sortBy?: string } = {}) {
    const search = new URLSearchParams();
    if (params.lat) search.set("lat", params.lat.toString());
    if (params.lng) search.set("lng", params.lng.toString());
    if (params.radius) search.set("radius", params.radius.toString());
    if (params.category && params.category !== "ALL") search.set("category", params.category);
    if (params.sortBy) search.set("sortBy", params.sortBy);

    const res = await fetchApi<Listing[]>(`/api/listings?${search.toString()}`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  async getListingById(id: string) {
    const res = await fetchApi<{ listing: Listing }>(`/api/listings/${id}`);
    if (res.success && res.listing) {
      return res.listing;
    }
    return null;
  },

  async searchLocations(query: string): Promise<Array<{ label: string; displayName: string; lat: number; lng: number }>> {
    if (!query || query.trim().length < 2) return [];
    try {
      const res = await fetchApi<{
        success: boolean;
        results: Array<{ label: string; displayName: string; lat: number; lng: number }>;
      }>(`/api/geocode/search?q=${encodeURIComponent(query.trim())}`);
      if (res.success && Array.isArray(res.results)) {
        return res.results;
      }
      return [];
    } catch {
      return [];
    }
  },

  // Checkout & Orders
  async createOrder(payload: {
    listingId: string;
    quantity: number;
    paymentMethod: string;
    useRescueCredit?: boolean;
    consumerId?: string;
  }) {
    const res = await fetchApi<{ order: Order }>("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  },

  async getOrderById(id: string) {
    const res = await fetchApi<{ order: Order }>(`/api/orders/${id}`);
    if (res.success && res.order) {
      return res.order;
    }
    return null;
  },

  async getActiveOrders() {
    const res = await fetchApi<{ orders: Order[] }>("/api/orders/consumer/active");
    if (res.success && Array.isArray(res.orders)) {
      return res.orders;
    }
    return [];
  },

  // Payments & Invoices
  async createInvoice(payload: {
    orderId: string;
    amount: number;
    paymentMethod: string;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
  }) {
    return fetchApi<{
      success: boolean;
      isLiveXendit?: boolean;
      invoiceId: string;
      orderId: string;
      amount: number;
      paymentMethod: string;
      paymentUrl: string | null;
      qrisString: string | null;
      expiresAt: string;
    }>("/api/payments/create-invoice", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 60s Undo Window
  async undoOrder(orderId: string) {
    const res = await fetchApi(`/api/orders/${orderId}/undo`, {
      method: "POST",
    });
    return res;
  },

  // Voucher
  async getVoucherToken(orderId: string) {
    const res = await fetchApi<{ token: string; order: Order; rotationIntervalSeconds: number }>(
      `/api/vouchers/${orderId}`
    );
    return res;
  },

  async refreshVoucherToken(orderId: string) {
    const res = await fetchApi<{ token: string; expiresAt: string }>(`/api/vouchers/${orderId}/refresh`);
    return res;
  },

  // Impact & Badges
  async getImpact(userId: string = "usr-cns-001") {
    const res = await fetchApi(`/api/impact/me?userId=${userId}`);
    return res;
  },

  // Wallet
  async getWallet(userId: string = "usr-cns-001") {
    const res = await fetchApi<{ success: boolean; balance: number }>(`/api/impact/me?userId=${userId}`);
    return res;
  },

  // Reviews & Sentiment Moderation
  async submitReview(payload: {
    orderId: string;
    rating: number;
    comment: string;
    consumerId?: string;
  }) {
    return fetchApi<{
      success: boolean;
      message: string;
      sentiment?: string;
      criticalFlag?: boolean;
      review?: any;
    }>("/api/ai/sentiment-analysis", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getReviews(params?: { orderId?: string; merchantId?: string }) {
    const query = new URLSearchParams();
    if (params?.orderId) query.set("orderId", params.orderId);
    if (params?.merchantId) query.set("merchantId", params.merchantId);
    const qs = query.toString();
    return fetchApi<{ success: boolean; reviews: any[] }>(`/api/ai/reviews${qs ? `?${qs}` : ""}`);
  },

  // Auth
  async login(identifier: string, password: string, role: string = "CONSUMER") {
    return fetchApi("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password, role }),
    });
  },

  async register(data: { name: string; email: string; phone: string; password: string; role?: string }) {
    return fetchApi("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...data, role: data.role || "CONSUMER" }),
    });
  },

  async googleAuth(idToken: string, role: string = "CONSUMER", mode: "login" | "register" | "auto" = "auto") {
    return fetchApi("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken, role, mode }),
    });
  },

  async sendOtp(phone: string) {
    return fetchApi<{ success: boolean; message: string; cooldownSeconds?: number; simulated?: boolean; debugCode?: string }>("/api/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  async verifyOtp(phone: string, code: string, newPassword?: string) {
    return fetchApi<{ success: boolean; message: string }>("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code, newPassword }),
    });
  },

  async updateProfile(data: { id?: string; name?: string; phone?: string }) {
    return fetchApi<{ success: boolean; message: string; user?: any }>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
