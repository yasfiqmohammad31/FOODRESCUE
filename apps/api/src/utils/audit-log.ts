// src/utils/audit-log.ts
// Security event logging for audit and monitoring

export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'RATE_LIMIT'
  | 'UNAUTHORIZED_ACCESS'
  | 'FORBIDDEN'
  | 'WEBHOOK_RECEIVED'
  | 'WEBHOOK_INVALID'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILURE'
  | 'DATA_MODIFIED'
  | 'DATA_ACCESS'
  | 'SUSPICIOUS_ACTIVITY';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  userId?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

class AuditLogger {
  private static instance: AuditLogger;
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 5000;
  
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }
  
  log(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'severity'> & { severity?: 'low' | 'medium' | 'high' | 'critical' }): void {
    const severity = event.severity || this.calculateSeverity(event);
    
    const fullEvent: SecurityEvent = {
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      severity
    };
    
    this.events.push(fullEvent);
    
    // Console output in development
    if (typeof globalThis !== 'undefined') {
      const color = severity === 'critical' ? '\x1b[31m' 
                  : severity === 'high' ? '\x1b[33m'
                  : severity === 'medium' ? '\x1b[36m'
                  : '\x1b[32m';
      console.log(
        `${color}[AUDIT][${severity.toUpperCase()}]\x1b[0m`,
        fullEvent.type,
        fullEvent.userId || 'anonymous',
        fullEvent.endpoint || ''
      );
    }
    
    // Alert for critical events
    if (severity === 'critical' || severity === 'high') {
      console.warn(`[SECURITY ALERT] ${event.type} - ${JSON.stringify(event.metadata || {})}`);
    }
    
    // Trim to keep memory bounded
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }
  
  private calculateSeverity(event: { type: SecurityEventType }): 'low' | 'medium' | 'high' | 'critical' {
    if (event.type === 'WEBHOOK_INVALID' || event.type === 'UNAUTHORIZED_ACCESS') {
      return 'high';
    }
    
    if (event.type === 'AUTH_FAILURE' || event.type === 'TOKEN_INVALID' || event.type === 'FORBIDDEN') {
      return 'medium';
    }
    
    if (event.type === 'RATE_LIMIT' || event.type === 'TOKEN_EXPIRED') {
      return 'low';
    }
    
    if (event.type === 'PAYMENT_FAILURE' || event.type === 'SUSPICIOUS_ACTIVITY') {
      return 'high';
    }
    
    return 'low';
  }
  
  getEvents(filter?: {
    type?: SecurityEventType;
    userId?: string;
    severity?: SecurityEvent['severity'];
    sinceTimestamp?: number;
    limit?: number;
  }): SecurityEvent[] {
    let results = [...this.events];
    
    if (filter?.type) {
      results = results.filter(e => e.type === filter.type);
    }
    
    if (filter?.userId) {
      results = results.filter(e => e.userId === filter.userId);
    }
    
    if (filter?.severity) {
      results = results.filter(e => e.severity === filter.severity);
    }
    
    if (filter?.sinceTimestamp) {
      results = results.filter(e => {
        return new Date(e.timestamp).getTime() > filter.sinceTimestamp!;
      });
    }
    
    if (filter?.limit) {
      results = results.slice(-filter.limit);
    }
    
    return results;
  }
  
  getStats(timeWindowMs: number = 60 * 60 * 1000): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    timeWindow: string;
  } {
    const since = Date.now() - timeWindowMs;
    const recentEvents = this.getEvents({ sinceTimestamp: since });
    
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    recentEvents.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    });
    
    return {
      total: recentEvents.length,
      byType,
      bySeverity,
      timeWindow: `${timeWindowMs / 1000}s`
    };
  }
  
  clear(): void {
    this.events = [];
  }
}

// Convenience functions
export function logAuthSuccess(userId: string, role: string, c: any): void {
  AuditLogger.getInstance().log({
    type: 'AUTH_SUCCESS',
    userId,
    userRole: role,
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
    userAgent: c.req.header('user-agent'),
    endpoint: c.req.path,
    method: c.req.method
  });
}

export function logAuthFailure(reason: string, identifier: string, c: any): void {
  AuditLogger.getInstance().log({
    type: 'AUTH_FAILURE',
    metadata: { reason, identifier },
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
    userAgent: c.req.header('user-agent'),
    endpoint: c.req.path,
    method: c.req.method
  });
}

export function logUnauthorizedAccess(userId: string, endpoint: string, c: any): void {
  AuditLogger.getInstance().log({
    type: 'UNAUTHORIZED_ACCESS',
    userId,
    endpoint,
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
    userAgent: c.req.header('user-agent'),
    method: c.req.method
  });
}

export function logRateLimit(endpoint: string, c: any): void {
  AuditLogger.getInstance().log({
    type: 'RATE_LIMIT',
    endpoint,
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
    userAgent: c.req.header('user-agent'),
    method: c.req.method
  });
}

export function logPaymentEvent(type: 'success' | 'failure', amount: number, orderId: string, c: any): void {
  AuditLogger.getInstance().log({
    type: type === 'success' ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILURE',
    metadata: { amount, orderId },
    endpoint: c.req.path,
    method: c.req.method
  });
}

export function logWebhookEvent(type: 'received' | 'invalid', c: any, metadata?: any): void {
  AuditLogger.getInstance().log({
    type: type === 'received' ? 'WEBHOOK_RECEIVED' : 'WEBHOOK_INVALID',
    metadata,
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
    userAgent: c.req.header('user-agent'),
    endpoint: c.req.path,
    method: c.req.method
  });
}

export default AuditLogger;