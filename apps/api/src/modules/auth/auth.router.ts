import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/mock-db";
import { signJwt, sanitizeText } from "../../utils/security";
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
});

const googleAuthSchema = z.object({
  idToken: z.string().min(10),
  role: z.enum(["CONSUMER", "MERCHANT"]).default("CONSUMER"),
});

const otpSchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6),
});

// POST /auth/login
authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { identifier, role } = c.req.valid("json");
  const cleanIdentifier = identifier.trim().toLowerCase();

  const user = db.users.find(
    (u) =>
      (u.email.toLowerCase() === cleanIdentifier || u.phone === cleanIdentifier) &&
      u.role === role
  ) || {
    id: role === "MERCHANT" ? "usr-mer-001" : "usr-cns-001",
    email: cleanIdentifier.includes("@") ? cleanIdentifier : `${cleanIdentifier}@foodrescue.id`,
    name: role === "MERCHANT" ? "Mitra Merchant" : "Food Hero",
    phone: cleanIdentifier.includes("@") ? "+6281234567890" : cleanIdentifier,
    role,
    createdAt: new Date().toISOString(),
  };

  const secret = c.env.JWT_ACCESS_SECRET || "foodrescue_jwt_secret";
  const token = await signJwt(
    { sub: user.id, role: user.role, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
    secret
  );

  return c.json({
    success: true,
    message: "Login berhasil",
    token,
    user,
  });
});

// POST /auth/register
authRouter.post("/register", zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json");

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
  }

  const secret = c.env.JWT_ACCESS_SECRET || "foodrescue_jwt_secret";
  const token = await signJwt(
    { sub: newUser.id, role: newUser.role, email: newUser.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
    secret
  );

  return c.json({
    success: true,
    message: "Registrasi akun berhasil",
    token,
    user: newUser,
  });
});

// POST /auth/google
authRouter.post("/google", zValidator("json", googleAuthSchema), async (c) => {
  const { role } = c.req.valid("json");

  const user: User = {
    id: role === "MERCHANT" ? "usr-mer-001" : "usr-cns-001",
    email: role === "MERCHANT" ? "owner@artisanbakery.com" : "alex@kampus.ac.id",
    name: role === "MERCHANT" ? "Budi Santoso" : "Alex Pratama",
    phone: "+6281234567890",
    role,
    createdAt: new Date().toISOString(),
  };

  const secret = c.env.JWT_ACCESS_SECRET || "foodrescue_jwt_secret";
  const token = await signJwt(
    { sub: user.id, role: user.role, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
    secret
  );

  return c.json({
    success: true,
    message: "Autentikasi Google berhasil",
    token,
    user,
  });
});

// POST /auth/otp/send
authRouter.post("/otp/send", async (c) => {
  return c.json({
    success: true,
    message: "Kode OTP 6-digit berhasil dikirim via WhatsApp.",
    cooldownSeconds: 60,
  });
});

// POST /auth/otp/verify
authRouter.post("/otp/verify", zValidator("json", otpSchema), async (c) => {
  const { code } = c.req.valid("json");
  if (code.length !== 6) {
    return c.json({ success: false, message: "Kode OTP harus 6 digit angka." }, 400);
  }
  return c.json({
    success: true,
    message: "Verifikasi OTP berhasil.",
  });
});
