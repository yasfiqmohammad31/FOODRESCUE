// src/middleware/rate-limiter.ts
// Rate limiting middleware for API protection

import type { Context, Next } from 'hono';

export interface RateLimitOptions {
  windowMs: number;         // Time window in milliseconds
  max: number;              // Maximum requests per window
  message?: string;         // Error message when rate limited
  keyGenerator?: (c: Context) => string | Promise<string>;  // Custom key for rate limiting
  skip?: (c: Context) => boolean;          // Condition to skip rate limiting
  useKV?: boolean;          // Use Cloudflare KV for distributed rate limiting
}

interface RateLimitStoreEntry {
  count: number;
  resetTime: number;
  firstRequest?: number;
}

interface RateLimitStore {
  [key: string]: RateLimitStoreEntry;
}

// In-memory store (fallback when KV not available)
// Note: In-memory store is single-instance only. Use KV for distributed deployments.
const memoryStore: RateLimitStore = {};

// Special rate limits per endpoint type
const SPECIAL_LIMITS: Record<string, { windowMs: number; max: number }> = {
  'auth': { windowMs: 15 * 60 * 1000, max: 10 },     // 10 auth attempts per 15 min
  'otp': { windowMs: 5 * 60 * 1000, max: 5 },        // 5 OTP requests per 5 min
  'payment': { windowMs: 60 * 1000, max: 20 },       // 20 payment requests per minute
  'webhook': { windowMs: 1000, max: 30 },            // 30 webhook requests per second
};

/**
 * Creates a rate limiter middleware with specified options
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
    keyGenerator,
    skip,
    useKV = false,
  } = options;
  
  return async (c: Context, next: Next) => {
    // Skip rate limiting if condition matches
    if (skip && skip(c)) {
      return next();
    }
    
    // Generate rate limit key
    const key = keyGenerator 
      ? keyGenerator(c) 
      : c.req.header('cf-connecting-ip') || 
        c.req.header('x-forwarded-for') || 
        c.req.header('x-real-ip') || 
        'global';
    
    // Prefix key with endpoint type if applicable
    const path = c.req.path.replace(/^\/api/, '');
    let endpointType = '';
    if (path.startsWith('/auth') || path.includes('login') || path.includes('register')) {
      endpointType = 'auth';
    } else if (path.includes('otp') || path.includes('send')) {
      endpointType = 'otp';
    } else if (path.includes('payment') || path.includes('payments')) {
      endpointType = 'payment';
    } else if (path.includes('webhook')) {
      endpointType = 'webhook';
    }
    
    // Apply special limits if applicable
    const specialLimit = endpointType ? SPECIAL_LIMITS[endpointType] : null;
    const effectiveWindow = specialLimit ? specialLimit.windowMs : windowMs;
    const effectiveMax = specialLimit ? specialLimit.max : max;
    
    // Create composite key
    const compositeKey = endpointType ? `${key}:${endpointType}` : key;
    
    // Check if using KV (distributed rate limiting)
    if (useKV && c.env?.CACHE_KV) {
      try {
        const now = Date.now();
        const windowKey = `${compositeKey}:${Math.floor(now / effectiveWindow)}`;
        
        // Try to get current count from KV
        let current = await c.env.CACHE_KV.get(windowKey);
        const count = current ? parseInt(current, 10) : 0;
        
        if (count >= effectiveMax) {
          const resetTime = (Math.floor(now / effectiveWindow) + 1) * effectiveWindow;
          c.header('X-RateLimit-Limit', effectiveMax.toString());
          c.header('X-RateLimit-Remaining', '0');
          c.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
          
          return c.json({
            success: false,
            message: (specialLimit as any)?.message || message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((resetTime - now) / 1000)
          }, 429);
        }
        
        // Increment counter
        await c.env.CACHE_KV.put(windowKey, (count + 1).toString(), {
          expirationTtl: Math.ceil(effectiveWindow / 1000) + 10
        });
        
        c.header('X-RateLimit-Limit', effectiveMax.toString());
        c.header('X-RateLimit-Remaining', (effectiveMax - count - 1).toString());
        c.header('X-RateLimit-Reset', Math.ceil((Math.floor(now / effectiveWindow) + 1) * effectiveWindow / 1000).toString());
        
        return next();
        
      } catch (error) {
        console.error('[RateLimit] KV error, falling back to memory:', error);
        // Fall through to memory-based rate limiting
      }
    }
    
    // Memory-based rate limiting (fallback)
    const now = Date.now();
    const windowKey = `${compositeKey}:${Math.floor(now / effectiveWindow)}`;
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [k, entry] of Object.entries(memoryStore)) {
        if (entry.resetTime < now) {
          delete memoryStore[k];
        }
      }
    }
    
    // Initialize or get counter
    if (!memoryStore[windowKey] || now > memoryStore[windowKey].resetTime) {
      memoryStore[windowKey] = {
        count: 0,
        resetTime: now + effectiveWindow,
        firstRequest: now
      };
    }
    
    // Check limit
    if (memoryStore[windowKey].count >= effectiveMax) {
      const resetTime = memoryStore[windowKey].resetTime;
      c.header('X-RateLimit-Limit', effectiveMax.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
      
      return c.json({
        success: false,
        message: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((resetTime - now) / 1000)
      }, 429);
    }
    
    // Increment counter
    memoryStore[windowKey].count++;
    
    // Add headers
    c.header('X-RateLimit-Limit', effectiveMax.toString());
    c.header('X-RateLimit-Remaining', (effectiveMax - memoryStore[windowKey].count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(memoryStore[windowKey].resetTime / 1000).toString());
    
    await next();
  };
}

// Pre-configured rate limiters for common use cases
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts
  message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
  keyGenerator: async (c) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    try {
      const body = await c.req.json();
      const email = (body as any)?.email || (body as any)?.identifier || 'auth';
      return `${ip}:${email}`;
    } catch {
      return `${ip}:auth`;
    }
  }
});

export const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,                 // 5 OTP requests
  message: 'Terlalu banyak permintaan OTP. Silakan coba lagi dalam 5 menit.',
  keyGenerator: async (c) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    try {
      const body = await c.req.json();
      const phone = (body as any)?.phone || 'unknown';
      return `${ip}:${phone}`;
    } catch {
      return `${ip}:unknown`;
    }
  }
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute
  message: 'Terlalu banyak permintaan.',
});

export const webhookRateLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 30,        // 30 requests per second
  message: 'Rate limit untuk webhook tercapai.',
  skip: (c) => {
    // Skip rate limiting for known webhook IPs (if configured)
    return false;
  }
});