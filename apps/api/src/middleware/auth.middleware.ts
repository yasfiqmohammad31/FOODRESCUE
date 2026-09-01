// src/middleware/auth.middleware.ts
// Centralized authentication and authorization middleware

import type { Context, Next } from 'hono';
import { verifyJwtWithEnv } from '../utils/security-enhanced';

export interface AuthUser {
  sub: string;
  role: string;
  email?: string;
  [key: string]: any;
}

// Extend Context to include user
declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

/**
 * Authentication middleware - verifies JWT token from Authorization header
 * Attaches user data to context if valid
 */
export const authenticate = () => {
  return async (c: Context, next: Next) => {
    try {
      // Check for token in Authorization header
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ 
          success: false, 
          message: 'Token autentikasi tidak ditemukan',
          code: 'AUTH_TOKEN_MISSING'
        }, 401);
      }
      
      const token = authHeader.slice(7);
      const result = await verifyJwtWithEnv<AuthUser>(token, c.env);
      
      if (!result.valid) {
        return c.json({ 
          success: false, 
          message: result.error || 'Token tidak valid',
          code: 'AUTH_TOKEN_INVALID'
        }, 401);
      }
      
      // Set user context
      c.set('user', result.payload!);
      
      await next();
      
    } catch (error) {
      console.error('[Auth Middleware] Error:', error);
      return c.json({ 
        success: false, 
        message: 'Terjadi kesalahan autentikasi',
        code: 'AUTH_ERROR'
      }, 500);
    }
  };
};

/**
 * Role-based access control middleware
 * Must be used after authenticate() middleware
 */
export const requireRole = (...roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Autentikasi diperlukan',
        code: 'AUTH_REQUIRED'
      }, 401);
    }
    
    if (!roles.includes(user.role)) {
      return c.json({ 
        success: false, 
        message: 'Akses ditolak: peran tidak diizinkan',
        code: 'FORBIDDEN',
        requiredRoles: roles,
        currentRole: user.role
      }, 403);
    }
    
    await next();
  };
};

/**
 * Optional authentication - attaches user if token present, continues if not
 * Useful for endpoints that behave differently for authenticated users
 */
export const optionalAuth = () => {
  return async (c: Context, next: Next) => {
    try {
      const authHeader = c.req.header('Authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const result = await verifyJwtWithEnv<AuthUser>(token, c.env);
        
        if (result.valid && result.payload) {
          c.set('user', result.payload);
        }
      }
      
      await next();
      
    } catch (error) {
      // Silently continue if token verification fails
      await next();
    }
  };
};

/**
 * Consumer-only access - restricts to CONSUMER role
 */
export const consumerOnly = () => {
  return requireRole('CONSUMER');
};

/**
 * Merchant-only access - restricts to MERCHANT role
 */
export const merchantOnly = () => {
  return requireRole('MERCHANT');
};

/**
 * Admin-only access - restricts to ADMIN role
 */
export const adminOnly = () => {
  return requireRole('ADMIN');
};

/**
 * Owner or admin access - user can access their own resources or admin can access any
 */
export const ownerOrAdmin = (getResourceOwnerId: (c: Context) => string | null) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Autentikasi diperlukan',
        code: 'AUTH_REQUIRED'
      }, 401);
    }
    
    // Admin can access everything
    if (user.role === 'ADMIN') {
      return next();
    }
    
    // Check ownership
    const ownerId = getResourceOwnerId(c);
    
    if (!ownerId || user.sub !== ownerId) {
      return c.json({ 
        success: false, 
        message: 'Akses ditolak: bukan pemilik resource',
        code: 'NOT_OWNER'
      }, 403);
    }
    
    await next();
  };
};