// src/middleware/security-headers.ts
// Security headers middleware for enhanced protection

import type { Context, Next } from 'hono';

interface SecurityHeadersOptions {
  cspEnabled?: boolean;
  hstsEnabled?: boolean;
  reportingOnly?: boolean;
  customCsp?: string;
  allowedFrameAncestors?: string[];
}

const DEFAULT_OPTIONS: SecurityHeadersOptions = {
  cspEnabled: true,
  hstsEnabled: true,
  reportingOnly: false,
  allowedFrameAncestors: [],
};

export const securityHeaders = (options: SecurityHeadersOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return async (c: Context, next: Next) => {
    await next();
    
    const isDev = c.env?.ENVIRONMENT === 'development';
    
    // X-Content-Type-Options: Prevents MIME type sniffing
    c.header('X-Content-Type-Options', 'nosniff');
    
    // X-Frame-Options: Prevents clickjacking
    c.header('X-Frame-Options', 'DENY');
    
    // X-XSS-Protection: Enables browser XSS filtering
    c.header('X-XSS-Protection', '1; mode=block');
    
    // Referrer-Policy: Controls referrer information
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content-Security-Policy
    if (opts.cspEnabled) {
      const defaultCsp = `
        default-src 'self';
        script-src 'self'${isDev ? " 'unsafe-inline' 'unsafe-eval'" : ''};
        style-src 'self'${isDev ? " 'unsafe-inline'" : ''} https://fonts.googleapis.com;
        img-src 'self' data: https: http:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://api.xendit.co https://nominatim.openstreetmap.org https://api.openai.com;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
        frame-src 'self' https://accounts.google.com;
      `.replace(/\s+/g, ' ').trim();
      
      const csp = opts.customCsp || defaultCsp;
      const cspHeaderName = opts.reportingOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
      c.header(cspHeaderName, csp);
    }
    
    // HTTP Strict Transport Security (HSTS)
    if (opts.hstsEnabled && !isDev) {
      c.header(
        'Strict-Transport-Security', 
        'max-age=31536000; includeSubDomains; preload'
      );
    }
    
    // Permissions Policy
    c.header('Permissions-Policy', [
      'geolocation=()',
      'camera=()',
      'microphone=()',
      'payment=(self)',
      'usb=()',
      'interest-cohort=()',
    ].join(', '));
    
    // Cross-Origin policies
    c.header('Cross-Origin-Embedder-Policy', 'require-corp');
    c.header('Cross-Origin-Opener-Policy', 'same-origin');
    c.header('Cross-Origin-Resource-Policy', 'same-origin');
    
    // Cache Control for API responses
    const contentType = c.res.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      // Don't cache sensitive API responses
      c.header('Cache-Control', 'no-store, max-age=0, must-revalidate, proxy-revalidate');
      c.header('Pragma', 'no-cache');
      c.header('Expires', '0');
    }
  };
};

// Lightweight security headers for static assets
export const staticAssetHeaders = () => {
  return async (c: Context, next: Next) => {
    await next();
    
    const contentType = c.res.headers.get('Content-Type');
    
    if (contentType?.includes('text/html')) {
      c.header('X-Content-Type-Options', 'nosniff');
      c.header('X-Frame-Options', 'DENY');
      c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    
    // Cache control for static assets
    if (contentType?.includes('image/') || 
        contentType?.includes('font/') ||
        contentType?.includes('style/') ||
        contentType?.includes('javascript/')) {
      c.header('Cache-Control', 'public, max-age=31536000, immutable');
    }
  };
};