// src/utils/env.validation.ts
import type { Env } from '../types';

export interface EnvValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateEnv(env: Env): EnvValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check JWT secret
  if (!env.JWT_ACCESS_SECRET) {
    errors.push('JWT_ACCESS_SECRET tidak dikonfigurasi');
  } else if (env.JWT_ACCESS_SECRET === 'foodrescue_jwt_secret') {
    errors.push('JWT_ACCESS_SECRET menggunakan nilai default yang tidak aman');
  } else if (env.JWT_ACCESS_SECRET.length < 32) {
    warnings.push('JWT_ACCESS_SECRET terlalu pendek (minimal 32 karakter)');
  }
  
  // Check Xendit configuration
  if (!env.XENDIT_SECRET_KEY) {
    warnings.push('XENDIT_SECRET_KEY tidak dikonfigurasi - payment fallback akan digunakan');
  } else if (env.XENDIT_SECRET_KEY.includes('test') || env.XENDIT_SECRET_KEY.includes('mock')) {
    warnings.push('XENDIT_SECRET_KEY mungkin menggunakan nilai test/mock');
  }
  
  if (!env.XENDIT_CALLBACK_TOKEN && env.ENVIRONMENT === 'production') {
    warnings.push('XENDIT_CALLBACK_TOKEN tidak dikonfigurasi - webhook verification disabled');
  }
  
  // Check Resend API
  if (!env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY tidak dikonfigurasi - email notifications disabled');
  }
  
  // Check WhatsApp configuration
  if (!env.WHATSAPP_API_KEY) {
    warnings.push('WHATSAPP_API_KEY tidak dikonfigurasi - OTP via WhatsApp disabled');
  }
  
  // Environment-specific checks
  if (env.ENVIRONMENT === 'production') {
    // Production-specific validations
    if (!env.JWT_ACCESS_SECRET || env.JWT_ACCESS_SECRET === 'foodrescue_jwt_secret') {
      errors.push('JWT_ACCESS_SECRET tidak aman untuk environment production');
    }
    
    if (!env.XENDIT_CALLBACK_TOKEN) {
      warnings.push('Webhook security disabled karena XENDIT_CALLBACK_TOKEN tidak ada');
    }
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

export function generateSecureSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function maskSecret(secret: string): string {
  if (!secret || secret.length < 8) return '***';
  return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
}

export function getEnvSummary(env: Env): Record<string, string> {
  return {
    environment: env.ENVIRONMENT || 'development',
    jwtConfigured: env.JWT_ACCESS_SECRET ? 'yes' : 'no',
    jwtSecure: env.JWT_ACCESS_SECRET && env.JWT_ACCESS_SECRET !== 'foodrescue_jwt_secret' ? 'yes' : 'no',
    xenditConfigured: env.XENDIT_SECRET_KEY ? 'yes' : 'no',
    resendConfigured: env.RESEND_API_KEY ? 'yes' : 'no',
    whatsappConfigured: env.WHATSAPP_API_KEY ? 'yes' : 'no',
    cacheAvailable: env.CACHE_KV ? 'yes' : 'no',
    aiAvailable: env.AI ? 'yes' : 'no'
  };
}