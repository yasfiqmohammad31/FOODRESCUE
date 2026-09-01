// test/security.test.ts
// Security test suite for FOODRESCUE API

import { describe, test, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { secureCors } from '../src/middleware/cors';
import { securityHeaders } from '../src/middleware/security-headers';
import { rateLimit } from '../src/middleware/rate-limiter';
import { authenticate } from '../src/middleware/auth.middleware';
import { validateEnv } from '../src/utils/env.validation';

describe('Security Implementation Tests', () => {
  
  describe('Environment Validation', () => {
    test('should detect insecure JWT secret', () => {
      const env = {
        JWT_ACCESS_SECRET: 'foodrescue_jwt_secret',
        ENVIRONMENT: 'production'
      } as any;
      
      const result = validateEnv(env);
      expect(result.errors).toContain('JWT_ACCESS_SECRET menggunakan nilai default yang tidak aman');
      expect(result.isValid).toBe(false);
    });
    
    test('should detect short JWT secret', () => {
      const env = {
        JWT_ACCESS_SECRET: 'short',
        ENVIRONMENT: 'production'
      } as any;
      
      const result = validateEnv(env);
      expect(result.warnings).toContain('JWT_ACCESS_SECRET terlalu pendek (minimal 32 karakter)');
    });
    
    test('should validate secure environment', () => {
      const env = {
        JWT_ACCESS_SECRET: 'a_very_long_secure_secret_that_is_more_than_32_chars_long',
        ENVIRONMENT: 'production',
        XENDIT_SECRET_KEY: 'live_secure_key',
        XENDIT_CALLBACK_TOKEN: 'unique_token'
      } as any;
      
      const result = validateEnv(env);
      expect(result.errors).toHaveLength(0);
      expect(result.isValid).toBe(true);
    });
  });
  
  describe('Security Headers', () => {
    test('should add security headers', async () => {
      const app = new Hono();
      
      app.use('*', securityHeaders());
      
      app.get('/test', (c) => c.json({ message: 'test' }));
      
      const res = await app.request('/test');
      
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(res.headers.get('Content-Security-Policy')).toBeTruthy();
    });
  });
  
  describe('CORS Configuration', () => {
    test('should allow allowed origins', async () => {
      const app = new Hono();
      
      app.use('*', secureCors());
      app.get('/test', (c) => c.json({ message: 'test' }));
      
      // Test with allowed origin
      const headers = new Headers();
      headers.set('Origin', 'https://foodrescue-consumer.vercel.app');
      
      const res = await app.request('/test', { headers });
      
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://foodrescue-consumer.vercel.app');
    });
    
    test('should block disallowed origins', async () => {
      const app = new Hono();
      
      app.use('*', secureCors());
      app.get('/test', (c) => c.json({ message: 'test' }));
      
      // Test with disallowed origin
      const headers = new Headers();
      headers.set('Origin', 'https://malicious-site.com');
      
      const res = await app.request('/test', { headers });
      
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });
  
  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      const app = new Hono();
      const testKey = 'test-ip';
      
      app.use('/test', rateLimit({
        windowMs: 1000, // 1 second for testing
        max: 2,
        keyGenerator: () => testKey
      }));
      
      app.get('/test', (c) => c.json({ message: 'test' }));
      
      // First request
      const res1 = await app.request('/test');
      expect(res1.status).toBe(200);
      expect(res1.headers.get('X-RateLimit-Remaining')).toBe('1');
      
      // Second request
      const res2 = await app.request('/test');
      expect(res2.status).toBe(200);
      expect(res2.headers.get('X-RateLimit-Remaining')).toBe('0');
      
      // Third request should be rate limited
      const res3 = await app.request('/test');
      expect(res3.status).toBe(429);
      expect(res3.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });
  
  describe('Authentication Middleware', () => {
    test('should reject requests without token', async () => {
      const app = new Hono();
      
      app.use('/protected', authenticate());
      app.get('/protected', (c) => c.json({ message: 'protected' }));
      
      const res = await app.request('/protected');
      
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({
        success: false,
        message: 'Token autentikasi tidak ditemukan'
      });
    });
    
    test('should reject invalid tokens', async () => {
      const app = new Hono();
      
      app.use('/protected', authenticate());
      app.get('/protected', (c) => c.json({ message: 'protected' }));
      
      const headers = new Headers();
      headers.set('Authorization', 'Bearer invalid.token.here');
      
      const res = await app.request('/protected', { headers });
      
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({
        success: false,
        message: expect.stringContaining('Token tidak valid')
      });
    });
  });
});

describe('Security Scenarios', () => {
  test('XSS protection should be enabled', async () => {
    const app = new Hono();
    
    app.use('*', securityHeaders());
    app.get('/', (c) => c.text('<script>alert("xss")</script>'));
    
    const res = await app.request('/');
    const csp = res.headers.get('Content-Security-Policy');
    
    expect(csp).toBeTruthy();
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("'unsafe-inline'");
  });
  
  test('should prevent MIME sniffing', async () => {
    const app = new Hono();
    
    app.use('*', securityHeaders());
    app.get('/', (c) => c.text('test'));
    
    const res = await app.request('/');
    
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});

describe('Production Security Checks', () => {
  test('production should have strict validation', () => {
    const productionEnv = {
      JWT_ACCESS_SECRET: 'foodrescue_jwt_secret', // insecure default
      ENVIRONMENT: 'production'
    } as any;
    
    const result = validateEnv(productionEnv);
    expect(result.errors).toContain('JWT_ACCESS_SECRET tidak aman untuk environment production');
    expect(result.isValid).toBe(false);
  });
  
  test('development can have less strict validation', () => {
    const devEnv = {
      JWT_ACCESS_SECRET: 'foodrescue_jwt_secret', // insecure default
      ENVIRONMENT: 'development'
    } as any;
    
    const result = validateEnv(devEnv);
    expect(result.errors).toContain('JWT_ACCESS_SECRET menggunakan nilai default yang tidak aman');
    // Development might allow this with warning
  });
});