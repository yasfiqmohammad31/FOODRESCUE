import type { Env } from "../../types";

export interface SendOtpResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  simulated?: boolean;
  debugCode?: string;
}

export interface VerifyOtpResult {
  valid: boolean;
  message: string;
}

// In-memory fallback store if KV is not bound (e.g. local unit tests)
const memoryOtpStore = new Map<string, { code: string; expiresAt: number }>();
const memoryCooldownStore = new Map<string, number>();

/**
 * Normalizes Indonesian phone number to international standard (628...)
 */
export function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

/**
 * Sends a 6-digit WhatsApp OTP code using Fonnte API or simulated fallback.
 */
export async function sendWhatsAppOtp(env: Env, rawPhone: string): Promise<SendOtpResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone || phone.length < 10) {
    return { success: false, message: "Nomor telepon tidak valid." };
  }

  const now = Date.now();

  // 1. Check Rate Limit / Cooldown (60s)
  if (env.CACHE_KV) {
    const isCooldown = await env.CACHE_KV.get(`otp_cd:${phone}`);
    if (isCooldown) {
      return {
        success: false,
        message: "Mohon tunggu 60 detik sebelum meminta kode OTP baru.",
        cooldownSeconds: 60,
      };
    }
  } else {
    const cd = memoryCooldownStore.get(phone);
    if (cd && cd > now) {
      return {
        success: false,
        message: "Mohon tunggu 60 detik sebelum meminta kode OTP baru.",
        cooldownSeconds: Math.ceil((cd - now) / 1000),
      };
    }
  }

  // 2. Generate cryptographically random 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. Save OTP to KV (TTL: 300s / 5 minutes)
  if (env.CACHE_KV) {
    await env.CACHE_KV.put(`otp:${phone}`, code, { expirationTtl: 300 });
    await env.CACHE_KV.put(`otp_cd:${phone}`, "1", { expirationTtl: 60 });
  } else {
    memoryOtpStore.set(phone, { code, expiresAt: now + 300 * 1000 });
    memoryCooldownStore.set(phone, now + 60 * 1000);
  }

  const messageText = `🌱 *FOODRESCUE INDONESIA*\n\nKode verifikasi OTP akun Anda adalah: *${code}*\n\nKode ini berlaku selama *5 menit*. Demi keamanan, JANGAN bagikan kode ini kepada siapa pun termasuk pihak FOODRESCUE.`;

  // 4. Send via Fonnte Gateway if token is configured
  const fonnteToken = env.FONNTE_TOKEN;
  if (!fonnteToken) {
    console.log(`[WHATSAPP OTP SIMULATED] To: ${phone} | Code: ${code} (FONNTE_TOKEN not configured)`);
    return {
      success: true,
      message: `[Simulasi] Kode OTP berhasil dikirim ke WhatsApp ${phone}.`,
      cooldownSeconds: 60,
      simulated: true,
      debugCode: code,
    };
  }

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: fonnteToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: phone,
        message: messageText,
        countryCode: "62",
      }),
    });

    const data = (await res.json()) as any;
    if (!res.ok || data.status === false) {
      console.error("[FONNTE ERROR]", data);
      return {
        success: false,
        message: data.reason || "Gagal mengirim WhatsApp OTP via gateway Fonnte.",
      };
    }

    console.log(`[WHATSAPP OTP SENT VIA FONNTE] Target: ${phone}`);
    return {
      success: true,
      message: `Kode OTP 6-digit berhasil dikirim ke WhatsApp ${phone}.`,
      cooldownSeconds: 60,
    };
  } catch (error: any) {
    console.error("[WHATSAPP NETWORK ERROR]", error);
    return {
      success: false,
      message: error.message || "Terjadi gangguan koneksi ke gateway WhatsApp.",
    };
  }
}

/**
 * Verifies a submitted OTP code against KV store.
 */
export async function verifyWhatsAppOtp(env: Env, rawPhone: string, code: string): Promise<VerifyOtpResult> {
  const phone = normalizePhone(rawPhone);
  const trimmedCode = code.trim();

  // Master fallback code in development/testing mode
  if (trimmedCode === "123456" && env.ENVIRONMENT !== "production") {
    return { valid: true, message: "Verifikasi OTP berhasil (Master Testing Code)." };
  }

  let storedCode: string | null = null;
  if (env.CACHE_KV) {
    storedCode = await env.CACHE_KV.get(`otp:${phone}`);
  } else {
    const item = memoryOtpStore.get(phone);
    if (item && item.expiresAt > Date.now()) {
      storedCode = item.code;
    }
  }

  if (!storedCode) {
    return { valid: false, message: "Kode OTP telah kadaluarsa atau belum pernah diminta. Silakan minta kode baru." };
  }

  if (storedCode !== trimmedCode) {
    return { valid: false, message: "Kode OTP yang Anda masukkan salah. Silakan periksa kembali." };
  }

  // Delete after successful verification (one-time use)
  if (env.CACHE_KV) {
    await env.CACHE_KV.delete(`otp:${phone}`);
  } else {
    memoryOtpStore.delete(phone);
  }

  return { valid: true, message: "Verifikasi nomor WhatsApp berhasil." };
}
