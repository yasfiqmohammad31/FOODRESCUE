import type { Env } from "../../types";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  role?: string;
  subscribedAt: string;
}

export interface SendPushPayload {
  title: string;
  body: string;
  url?: string;
  orderId?: string;
}

export interface SendPushResult {
  success: boolean;
  statusCode?: number;
  message?: string;
  simulated?: boolean;
}

export const VAPID_KEYS = {
  publicKey: "BOaB1otOoygs2RMUMMqwOX2BG21iTRv1U0-wGl4z3RZJO1PwTLez0uVAjcL8z1y4MYkUzS7MaeTm42MYIe1kg3Q",
  privateKey: "gFmYqaE6VW0Gy0XyDIrjf4-fysZ8S9PjxZQWHViCJj0",
  subject: "mailto:support@foodrescue.id",
};

// In-memory fallback subscriptions for tests
const memorySubscriptions = new Map<string, PushSubscriptionData>();

/**
 * Saves a browser PushSubscription to Cloudflare KV or memory.
 */
export async function saveSubscription(
  env: Env,
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string }; role?: string }
): Promise<void> {
  const data: PushSubscriptionData = {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    userId,
    role: subscription.role || "CONSUMER",
    subscribedAt: new Date().toISOString(),
  };

  if (env.CACHE_KV) {
    await env.CACHE_KV.put(`push_sub:${userId}`, JSON.stringify(data), {
      expirationTtl: 86400 * 30, // 30 days
    });
  } else {
    memorySubscriptions.set(userId, data);
  }

  console.log(`[PUSH SUBSCRIPTION SAVED] User: ${userId} | Endpoint: ${subscription.endpoint.slice(0, 45)}...`);
}

/**
 * Retrieves a stored PushSubscription for a user.
 */
export async function getSubscription(env: Env, userId: string): Promise<PushSubscriptionData | null> {
  if (env.CACHE_KV) {
    const raw = await env.CACHE_KV.get(`push_sub:${userId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
  } else {
    return memorySubscriptions.get(userId) || null;
  }
  return null;
}

/**
 * Sends a Web Push Notification to a subscription endpoint.
 */
export async function sendWebPush(
  env: Env,
  subscription: PushSubscriptionData,
  payload: SendPushPayload
): Promise<SendPushResult> {
  if (!subscription || !subscription.endpoint) {
    return { success: false, message: "Subscription endpoint tidak ditemukan." };
  }

  try {
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

    // Dispatch Web Push HTTP POST
    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        TTL: "86400",
        Urgency: "high",
      },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/orders",
      }),
    });

    console.log(`[WEB PUSH DISPATCHED] Status: ${res.status} to ${subscription.endpoint.slice(0, 40)}...`);

    return {
      success: res.status < 400 || res.status === 201 || res.status === 200,
      statusCode: res.status,
      message: res.ok ? "Web Push terkirim ke browser." : `Push provider return status ${res.status}`,
    };
  } catch (error: any) {
    console.error("[WEB PUSH ERROR]", error);
    return {
      success: false,
      message: error.message || "Gagal mengirim Web Push ke browser.",
    };
  }
}
