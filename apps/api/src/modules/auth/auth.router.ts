import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/mock-db";
import { signJwt, sanitizeText } from "../../utils/security";
import { signJwtWithEnv } from "../../utils/security-enhanced";
import { authRateLimiter } from "../../middleware/rate-limiter";
import { logAuthSuccess, logAuthFailure } from "../../utils/audit-log";
import { sendWhatsAppOtp, verifyWhatsAppOtp } from "./whatsapp-otp.service";
import type { Env, User } from "../../types";

export const authRouter = new Hono<{ Bindings: Env }>();

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["CONSUMER", "MERCHANT"]).default("CONSUMER"),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
  role: z.enum(["CONSUMER", "MERCHANT"]).default("CONSUMER"),
  storeName: z.string().optional(),
  category: z.string().optional(),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(10),
  role: z.enum(["CONSUMER", "MERCHANT"]).default("CONSUMER"),
  mode: z.enum(["login", "register", "auto"]).default("auto"),
});

const sendOtpSchema = z.object({
  phone: z.string().min(10),
});

const otpSchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6),
});

const updateProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

// POST /auth/login with rate limiting
authRouter.post("/login", authRateLimiter, zValidator("json", loginSchema), async (c) => {
  const { identifier, role } = c.req.valid("json");
  const cleanIdentifier = identifier.trim().toLowerCase();

  const user = db.users.find(
    (u) =>
      (u.email.toLowerCase() === cleanIdentifier || u.phone === cleanIdentifier) &&
      u.role === role
  );

  if (!user) {
    logAuthFailure("ACCOUNT_NOT_FOUND", cleanIdentifier, c);
    return c.json(
      {
        success: false,
        message:
          role === "MERCHANT"
            ? "Akun mitra merchant belum terdaftar. Silakan daftar terlebih dahulu di halaman Registrasi."
            : "Akun konsumen belum terdaftar. Silakan registrasi terlebih dahulu.",
        reason: "ACCOUNT_NOT_FOUND",
      },
      404
    );
  }

  let storeName: string | undefined = undefined;
  if (user.role === "MERCHANT") {
    const merchant = db.merchants.find((m) => m.userId === user.id || m.id === user.id);
    storeName = merchant?.storeName || (user as any).storeName || user.name;
  }

  // Use enhanced JWT signing with environment configuration
  const { token, expiresAt } = await signJwtWithEnv(
    { sub: user.id, role: user.role, email: user.email },
    c.env,
    { expiresInSeconds: 24 * 60 * 60 } // 24 hours
  );

  logAuthSuccess(user.id, user.role, c);

  return c.json({
    success: true,
    message: "Login berhasil",
    token,
    expiresAt: expiresAt.toISOString(),
    user: { ...user, ...(storeName ? { storeName } : {}) },
  });
});

// POST /auth/register with rate limiting
authRouter.post("/register", authRateLimiter, zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json");

  const chosenStoreName = sanitizeText(body.storeName || body.name || "");

  const newUser: User = {
    id: `usr-${Date.now().toString().slice(-6)}`,
    name: sanitizeText(body.name),
    email: body.email.trim().toLowerCase(),
    phone: body.phone.trim(),
    role: body.role,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Initialize rescue credit wallet
  if (body.role === "CONSUMER") {
    db.wallets[newUser.id] = {
      userId: newUser.id,
      balance: 0,
      updatedAt: new Date().toISOString(),
    };
    db.impactStats[newUser.id] = {
      userId: newUser.id,
      portionsSaved: 0,
      co2eSavedKg: 0,
      treesEquivalent: 0,
      moneySavedRp: 0,
      updatedAt: new Date().toISOString(),
    };
  } else if (body.role === "MERCHANT") {
    db.merchants.push({
      id: `mer-${newUser.id}`,
      userId: newUser.id,
      storeName: chosenStoreName,
      category: sanitizeText(body.category || "Bakery & Pastry"),
      businessPhone: newUser.phone,
      address: "",
      location: { lat: -7.2856, lng: 112.6954 },
      openTime: "08:00",
      closeTime: "21:00",
      bankName: "BCA",
      accountNumber: "",
      accountHolder: "",
      isStoreOpen: false, // Default is closed for newly registered stores!
      agreedSlaAt: new Date().toISOString(),
      picName: newUser.name,
      avgRating: null as any,
      totalReviews: 0,
      isVerified: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Use enhanced JWT signing with environment configuration
  const { token, expiresAt } = await signJwtWithEnv(
    { sub: newUser.id, role: newUser.role, email: newUser.email },
    c.env,
    { expiresInSeconds: 24 * 60 * 60 } // 24 hours
  );

  logAuthSuccess(newUser.id, newUser.role, c);

  return c.json({
    success: true,
    message: "Registrasi akun berhasil",
    token,
    expiresAt: expiresAt.toISOString(),
    user: {
      ...newUser,
      ...(body.role === "MERCHANT" ? { storeName: chosenStoreName } : {}),
    },
  });
});

// POST /auth/google
authRouter.post("/google", zValidator("json", googleAuthSchema), async (c) => {
  const { idToken, role, mode } = c.req.valid("json");

  let googleEmail = "";
  let googleName = "";

  // Parse Google JWT ID Token payload (Base64Url)
  try {
    const parts = idToken.split(".");
    if (parts.length >= 2) {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(base64);
      const payload = JSON.parse(decoded);
      if (payload.email) {
        googleEmail = payload.email.trim().toLowerCase();
        googleName = payload.name || payload.email.split("@")[0];
      }
    }
  } catch {
    // Fallback if raw mock string was passed
  }

  if (!googleEmail) {
    if (idToken.includes("@")) {
      googleEmail = idToken.trim().toLowerCase();
      googleName = idToken.split("@")[0];
    } else {
      googleEmail = role === "MERCHANT" ? "merchant.google@foodrescue.id" : "user.google@foodrescue.id";
      googleName = role === "MERCHANT" ? "Mitra Merchant Google" : "Pengguna Google";
    }
  }

  // Find user by email and role
  let user = db.users.find((u) => u.email.toLowerCase() === googleEmail.toLowerCase() && u.role === role);

  // If in 'login' mode (logging in) and account is NOT registered yet:
  if (!user && mode === "login") {
    logAuthFailure("GOOGLE_ACCOUNT_NOT_FOUND", googleEmail, c);
    return c.json(
      {
        success: false,
        message:
          role === "MERCHANT"
            ? `Akun Google (${googleEmail}) belum terdaftar sebagai mitra gerai. Silakan lakukan pendaftaran di menu Registrasi terlebih dahulu.`
            : `Akun Google (${googleEmail}) belum terdaftar. Silakan lakukan registrasi terlebih dahulu.`,
        reason: "ACCOUNT_NOT_FOUND",
      },
      404
    );
  }

  // If user does not exist (in 'register' or 'auto' mode), create new user
  if (!user) {
    user = {
      id: `usr-g-${Date.now()}`,
      email: googleEmail,
      name: googleName,
      phone: "",
      role,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);

    if (role === "CONSUMER") {
      db.wallets[user.id] = {
        userId: user.id,
        balance: 0,
        updatedAt: new Date().toISOString(),
      };
      db.impactStats[user.id] = {
        userId: user.id,
        portionsSaved: 0,
        co2eSavedKg: 0,
        treesEquivalent: 0,
        moneySavedRp: 0,
        updatedAt: new Date().toISOString(),
      };
    } else if (role === "MERCHANT") {
      db.merchants.push({
        id: `mer-${user.id}`,
        userId: user.id,
        storeName: googleName,
        category: "Bakery & Pastry",
        businessPhone: "",
        address: "",
        location: { lat: -7.2856, lng: 112.6954 },
        openTime: "08:00",
        closeTime: "21:00",
        bankName: "BCA",
        accountNumber: "",
        accountHolder: "",
        isStoreOpen: false,
        agreedSlaAt: new Date().toISOString(),
        picName: googleName,
        avgRating: null as any,
        totalReviews: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  let storeName: string | undefined = undefined;
  if (user.role === "MERCHANT") {
    const merchant = db.merchants.find((m) => m.userId === user.id || m.id === user.id);
    storeName = merchant?.storeName || (user as any).storeName || user.name;
  }

  // Use enhanced JWT signing with environment configuration
  const { token, expiresAt } = await signJwtWithEnv(
    { sub: user.id, role: user.role, email: user.email },
    c.env,
    { expiresInSeconds: 24 * 60 * 60 } // 24 hours
  );

  logAuthSuccess(user.id, user.role, c);

  return c.json({
    success: true,
    message: "Autentikasi Google berhasil",
    token,
    expiresAt: expiresAt.toISOString(),
    user: { ...user, ...(storeName ? { storeName } : {}) },
  });
});

// POST /auth/otp/send with rate limiting
authRouter.post("/otp/send", authRateLimiter, zValidator("json", sendOtpSchema), async (c) => {
  const { phone } = c.req.valid("json");
  const result = await sendWhatsAppOtp(c.env, phone);
  if (!result.success) {
    return c.json(result, 400);
  }
  return c.json(result);
});

// POST /auth/otp/verify
authRouter.post("/otp/verify", zValidator("json", otpSchema), async (c) => {
  const { phone, code } = c.req.valid("json");
  const result = await verifyWhatsAppOtp(c.env, phone, code);
  if (!result.valid) {
    return c.json({ success: false, message: result.message }, 400);
  }
  return c.json({
    success: true,
    message: result.message,
  });
});

// PATCH /auth/profile
authRouter.patch("/profile", zValidator("json", updateProfileSchema), async (c) => {
  const { id, name, phone } = c.req.valid("json");

  let targetUser = id ? db.users.find((u) => u.id === id) : null;
  if (!targetUser) {
    targetUser = db.users[0];
  }

  if (!targetUser) {
    return c.json({ success: false, message: "Pengguna tidak ditemukan." }, 404);
  }

  if (name) {
    targetUser.name = sanitizeText(name);
  }
  if (phone !== undefined) {
    targetUser.phone = sanitizeText(phone).trim();
  }

  return c.json({
    success: true,
    message: "Profil pengguna berhasil diperbarui.",
    user: targetUser,
  });
});
