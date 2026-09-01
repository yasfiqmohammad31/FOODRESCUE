# DEPLOYMENT CHECKLIST - SECURITY IMPLEMENTATIONS

## Before Deployment to Production

### ✅ CRITICAL CHECKS

#### 1. Environment Configuration
- [ ] Update JWT_ACCESS_SECRET to strong random value (min 32 chars)
  ```bash
  # Generate secure secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Update XENDIT_CALLBACK_TOKEN to unique secure value
- [ ] Ensure XENDIT_SECRET_KEY is production key (not test/mock)
- [ ] Set ENVIRONMENT=production
- [ ] Review all environment variables in .env.production

#### 2. CORS Configuration
- [ ] Update allowed origins in CORS middleware:
  - ✅ `https://foodrescue-consumer.vercel.app`
  - ✅ `https://foodrescue-merchant.vercel.app`
  - ✅ Add your production domain
  - ❌ Remove `*` wildcard

#### 3. Security Headers
- [ ] Verify CSP is appropriate for production
- [ ] Enable HSTS header
- [ ] Test security headers with online scanner

### 📋 FUNCTIONALITY TESTS

#### Authentication Tests
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials returns appropriate error
- [ ] Rate limiting on auth endpoints works
- [ ] JWT token expiry works correctly

#### Authorization Tests
- [ ] Consumer can access consumer routes
- [ ] Merchant can access merchant routes
- [ ] Admin can access all routes
- [ ] Unauthorized access returns 403
- [ ] Missing authentication returns 401

#### Payment Integration
- [ ] Payment webhook signature verification works
- [ ] Xendit integration functions correctly
- [ ] Webhook rate limiting active
- [ ] Callback token validation working

#### Rate Limiting
- [ ] General rate limiting working
- [ ] Auth rate limiting working
- [ ] Webhook rate limiting working
- [ ] Rate limit headers present in responses

### 🔍 SECURITY SCANS

#### Automated Scanning
- [ ] Run dependency vulnerability scan:
  ```bash
  npm audit
  ```
- [ ] Check for outdated packages:
  ```bash
  npm outdated
  ```

#### Manual Testing
- [ ] Test XSS protection with malicious input
- [ ] Verify CORS policy prevents unauthorized origins
- [ ] Test SQL injection protection (when using real DB)
- [ ] Verify audit logging is working
- [ ] Test environment validation warnings

### 📊 MONITORING SETUP

#### Cloudflare Workers Monitoring
- [ ] Enable logging for security events
- [ ] Set up alerts for:
  - Authentication failures (>10/min)
  - Rate limit hits (>50/min)
  - 5xx errors
  - Webhook failures

#### Application Monitoring
- [ ] Health check endpoint working
- [ ] Security metrics exposed
- [ ] Audit log accessible for review

### 🚀 DEPLOYMENT STEPS

#### 1. Development Environment
```bash
# Build and test locally
npm run dev
# Run security tests
npm run test:security
```

#### 2. Staging Environment
```bash
# Deploy to staging
wrangler publish --env staging
# Test in staging environment
# Run security scan against staging
```

#### 3. Production Deployment
```bash
# Final deployment
wrangler publish --env production
# Verify deployment health
curl https://api.foodrescue.id/health
```

### 🔄 ROLLBACK PLAN

#### Issues to Watch For
1. **Authentication failures** - Check JWT secret and token validation
2. **CORS issues** - Check allowed origins
3. **Rate limiting too aggressive** - Adjust rate limits
4. **Permission errors** - Check role-based access control

#### Rollback Steps
1. Revert to previous deployment:
   ```bash
   # If using Git
   git revert <deployment-commit>
   # Deploy previous version
   wrangler publish --env production
   ```

### 📞 POST-DEPLOYMENT

#### Monitoring
- [ ] Monitor error rates for 24 hours
- [ ] Check authentication success rates
- [ ] Monitor rate limit hits
- [ ] Review audit logs for suspicious activity

#### Documentation Updates
- [ ] Update API documentation with auth requirements
- [ ] Document rate limits for consumers
- [ ] Update developer guide with security requirements

---

## 🚨 EMERGENCY CONTACTS

### Security Issues
1. **High Severity**: Immediate service disruption or data breach
   - Contact: Security Team Lead
   - Action: Disable service if necessary

2. **Medium Severity**: Security vulnerability discovered
   - Contact: Development Lead
   - Action: Patch within 24 hours

3. **Low Severity**: Security enhancement recommended
   - Contact: Product Manager
   - Action: Schedule for next sprint

---

## 📈 PERFORMANCE BASELINE

Record baseline metrics before deployment:

### Response Times
- [ ] Auth endpoint: ______ ms
- [ ] API endpoint average: ______ ms
- [ ] Health check: ______ ms

### Resource Usage
- [ ] Memory usage: ______ MB
- [ ] CPU usage: ______ %
- [ ] KV operations: ______ ops/sec

---

## ✅ FINAL SIGN-OFF

### Deployment Approval
- [ ] Security Lead: ____________________
- [ ] Development Lead: ____________________
- [ ] Product Manager: ____________________

### Post-Deployment Verification
- [ ] All security tests pass
- [ ] Performance within acceptable range
- [ ] No security alerts triggered
- [ ] Audit logs populated correctly

Date: ______________
Deployment Version: ______________
