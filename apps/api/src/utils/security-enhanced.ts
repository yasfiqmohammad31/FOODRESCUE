// src/utils/security-enhanced.ts
// Enhanced security utilities with JWT improvements

import { signJwt as baseSignJwt, verifyJwt as baseVerifyJwt } from './security';

export interface JwtToken {
  token: string;
  expiresAt: Date;
  payload: {
    sub: string;
    role: string;
    email?: string;
    iat: number;
    exp: number;
    jti?: string;
    [key: string]: any;
  };
}

export async function verifyJwtWithEnv<T = Record<string, any>>(
  token: string,
  env: any
): Promise<{ valid: boolean; payload?: T; error?: string }> {
  if (!token) {
    return { valid: false, error: 'Token tidak ditemukan' };
  }
  
  // Check token format (must have 3 parts)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Format token tidak valid' };
  }
  
  // Get secret from environment with fallback
  const secret = env.JWT_ACCESS_SECRET || 'foodrescue_jwt_secret';
  
  // Use existing verification
  const result = await baseVerifyJwt<T>(token, secret);
  
  if (!result.valid) {
    return { 
      valid: false, 
      error: 'Token tidak valid atau telah kedaluwarsa' 
    };
  }
  
  // Additional security checks
  const payload = result.payload as any;
  if (!payload.sub || !payload.role) {
    return { valid: false, error: 'Token payload tidak lengkap' };
  }
  
  // Check token age (max 24 hours)
  if (payload.exp) {
    const now = Date.now() / 1000;
    const tokenExpiry = payload.exp;
    
    if (now > tokenExpiry) {
      return { valid: false, error: 'Token telah kedaluwarsa' };
    }
    
    // Warn if token is about to expire (within 1 hour)
    const timeToExpiry = tokenExpiry - now;
    if (timeToExpiry < 3600 && timeToExpiry > 0) {
      console.warn(`[JWT Warning] Token akan kedaluwarsa dalam ${Math.round(timeToExpiry / 60)} menit`);
    }
  }
  
  return { valid: true, payload: result.payload };
}

export async function signJwtWithEnv(
  payload: Record<string, any>,
  env: any,
  options?: { expiresInSeconds?: number }
): Promise<JwtToken> {
  const secret = env.JWT_ACCESS_SECRET || 'foodrescue_jwt_secret';
  
  // Ensure standard claims
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = options?.expiresInSeconds ?? 24 * 60 * 60;
  
  const enhancedPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    jti: `jwt_${now}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  const token = await baseSignJwt(enhancedPayload, secret);
  
  return {
    token,
    expiresAt: new Date((now + expiresInSeconds) * 1000),
    payload: enhancedPayload as any
  };
}

// Token refresh with sliding expiry
export async function refreshJwt(
  token: string,
  env: any
): Promise<{ success: boolean; token?: string; error?: string }> {
  const result = await verifyJwtWithEnv(token, env);
  
  if (!result.valid || !result.payload) {
    return { success: false, error: result.error };
  }
  
  const payload = result.payload as any;
  
  // Only allow refresh if token has more than 30 minutes remaining
  const now = Date.now() / 1000;
  const timeToExpiry = payload.exp - now;
  
  if (timeToExpiry < 30 * 60) {
    return { 
      success: false, 
      error: 'Token terlalu dekat dengan expiry, login ulang diperlukan' 
    };
  }
  
  // Generate new token with extended expiry
  const newPayload = {
    sub: payload.sub,
    role: payload.role,
    email: payload.email,
    iat: now,
    exp: now + 24 * 60 * 60,
    jti: `jwt_refresh_${now}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  const newToken = await baseSignJwt(newPayload, env.JWT_ACCESS_SECRET || 'foodrescue_jwt_secret');
  
  return {
    success: true,
    token: newToken
  };
}

// Token revocation (requires KV storage)
export async function isTokenRevoked(tokenId: string, env: any): Promise<boolean> {
  if (!env.CACHE_KV) return false;
  
  try {
    const revoked = await env.CACHE_KV.get(`revoked:${tokenId}`);
    return !!revoked;
  } catch {
    return false;
  }
}

export async function revokeToken(tokenId: string, env: any, durationHours: number = 24): Promise<void> {
  if (!env.CACHE_KV) return;
  
  try {
    await env.CACHE_KV.put(`revoked:${tokenId}`, '1', { expirationTtl: durationHours * 60 * 60 });
  } catch {
    // Silently fail if KV is unavailable
  }
}