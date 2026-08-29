# 🏗️ FOODRESCUE — System Architecture

> Dokumen ini mendeskripsikan arsitektur teknis lengkap sistem FOODRESCUE mencakup
> frontend, backend, database, infrastruktur, dan integrasi layanan eksternal.

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        direction LR
        CONSUMER["Consumer PWA<br/>(Next.js)"]
        MERCHANT["Merchant PWA<br/>(Next.js)"]
    end

    subgraph "Edge / CDN"
        CF["Cloudflare<br/>(DNS, SSL, CDN, WAF)"]
    end

    subgraph "Application Layer"
        API["NestJS API Server<br/>(REST + WebSocket)"]
        WORKER["BullMQ Workers<br/>(Background Jobs)"]
        CRON["NestJS Schedule<br/>(Cron Jobs)"]
    end

    subgraph "Data Layer"
        PG["PostgreSQL 16<br/>+ PostGIS 3.4"]
        REDIS["Redis 7<br/>(Cache + Queue)"]
        S3["Cloudflare R2<br/>(Object Storage)"]
    end

    subgraph "AI Layer"
        PRICING["Dynamic Pricing<br/>(Rule Engine)"]
        SURPLUS["Surplus Prediction<br/>(Time Series)"]
        SENTIMENT["Sentiment Analysis<br/>(OpenAI GPT-4o-mini)"]
    end

    subgraph "External Services"
        XENDIT["Xendit<br/>(QRIS + E-Wallet)"]
        FCM["Firebase Cloud Messaging<br/>(Push Notifications)"]
        GMAPS["Google Maps API<br/>(Geocoding + Directions)"]
    end

    CONSUMER --> CF
    MERCHANT --> CF
    CF --> API

    API --> PG
    API --> REDIS
    API --> S3
    WORKER --> PG
    WORKER --> REDIS
    CRON --> PG

    API --> PRICING
    API --> SURPLUS
    API --> SENTIMENT

    API --> XENDIT
    API --> FCM
    API --> GMAPS

    XENDIT -->|"Webhook"| API
```

---

## 2. Frontend Architecture

### 2.1 Monorepo Structure

```mermaid
graph TD
    ROOT["food-rescue/ (Turborepo)"]

    ROOT --> APPS["apps/"]
    ROOT --> PACKAGES["packages/"]

    APPS --> CONSUMER_APP["consumer/<br/>Next.js 14+ (App Router)"]
    APPS --> MERCHANT_APP["merchant/<br/>Next.js 14+ (App Router)"]

    PACKAGES --> UI["@foodrescue/ui<br/>(shadcn/ui components)"]
    PACKAGES --> TYPES["@foodrescue/types<br/>(Shared TypeScript types)"]
    PACKAGES --> UTILS["@foodrescue/utils<br/>(Shared utilities)"]
    PACKAGES --> API_CLIENT["@foodrescue/api-client<br/>(OpenAPI generated client)"]
    PACKAGES --> CONFIG["@foodrescue/config<br/>(Tailwind, ESLint, TSConfig)"]

    CONSUMER_APP --> UI
    CONSUMER_APP --> TYPES
    CONSUMER_APP --> API_CLIENT
    MERCHANT_APP --> UI
    MERCHANT_APP --> TYPES
    MERCHANT_APP --> API_CLIENT
```

### 2.2 Consumer App — Route Map

```
app/
├── layout.tsx                  # Root layout (providers, fonts, PWA meta)
├── (auth)/
│   ├── login/page.tsx          # Email + Google OAuth login
│   ├── register/page.tsx       # Consumer registration
│   └── layout.tsx              # Auth layout (no navbar)
│
├── (main)/
│   ├── layout.tsx              # Main layout (navbar + bottom tab bar)
│   ├── feed/
│   │   └── page.tsx            # Geo-location feed (list view default)
│   ├── map/
│   │   └── page.tsx            # Map view (markers + radius)
│   ├── listing/
│   │   └── [id]/page.tsx       # Listing detail + countdown to pickup end
│   ├── checkout/
│   │   └── [listingId]/page.tsx # Cart review + payment method
│   ├── undo/
│   │   └── [orderId]/page.tsx  # 60-second countdown screen
│   ├── voucher/
│   │   └── [orderId]/page.tsx  # Digital pickup voucher + QR + directions
│   ├── wallet/
│   │   ├── page.tsx            # Rescue Credit balance
│   │   └── history/page.tsx    # Transaction history
│   ├── orders/
│   │   ├── page.tsx            # Order history list
│   │   └── [id]/page.tsx       # Order detail + status
│   ├── impact/
│   │   └── page.tsx            # Impact tracker + badges
│   └── profile/
│       ├── page.tsx            # User profile + settings
│       └── notifications/page.tsx # Notification preferences
│
├── manifest.json               # PWA manifest
└── sw.ts                       # Service Worker
```

### 2.3 Merchant App — Route Map

```
app/
├── layout.tsx
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx       # Merchant registration + store setup
│   └── layout.tsx
│
├── (dashboard)/
│   ├── layout.tsx              # Dashboard layout (sidebar navigation)
│   ├── page.tsx                # Dashboard home (today's overview)
│   ├── listings/
│   │   ├── page.tsx            # Active listings list
│   │   ├── new/page.tsx        # Quick listing form
│   │   ├── [id]/edit/page.tsx  # Edit listing
│   │   └── templates/page.tsx  # Saved templates
│   ├── orders/
│   │   ├── page.tsx            # Incoming orders queue (real-time)
│   │   └── [id]/page.tsx       # Order detail + status actions
│   ├── scanner/
│   │   └── page.tsx            # QR scanner for pickup verification
│   ├── analytics/
│   │   ├── page.tsx            # Sustainability dashboard
│   │   ├── sales/page.tsx      # Sales analytics
│   │   └── impact/page.tsx     # Environmental impact metrics
│   └── settings/
│       ├── page.tsx            # Store profile settings
│       ├── payment/page.tsx    # Payment & bank account config
│       └── notifications/page.tsx
│
├── manifest.json
└── sw.ts
```

### 2.4 PWA Configuration

```typescript
// next.config.ts
import withPWA from 'next-pwa';

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.foodrescue\.id\/listings/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'listings-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 },
      },
    },
    {
      urlPattern: /\.(png|jpg|jpeg|webp|svg)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
      },
    },
  ],
});
```

### 2.5 State Management Strategy

```mermaid
graph LR
    subgraph "Server State (TanStack Query)"
        LISTINGS["Listings Data"]
        ORDERS["Orders Data"]
        WALLET["Wallet Balance"]
        PROFILE["User Profile"]
    end

    subgraph "Client State (Zustand)"
        GEO["Geo Location"]
        CART["Cart State"]
        FILTERS["Feed Filters"]
        UI["UI State (modals, toasts)"]
    end

    subgraph "Form State (React Hook Form + Zod)"
        LOGIN["Login Form"]
        REGISTER["Register Form"]
        LISTING_FORM["Listing Form"]
        REVIEW_FORM["Review Form"]
    end

    subgraph "Persistent (localStorage)"
        AUTH_TOKEN["JWT Tokens"]
        PREFS["User Preferences"]
        CACHED_GEO["Last Known Location"]
    end
```

| Layer | Tool | Use Case |
|:------|:-----|:---------|
| **Server State** | TanStack Query v5 | API data fetching, caching, background refetch, optimistic updates |
| **Client State** | Zustand | Geo coordinates, cart, UI state, filters |
| **Form State** | React Hook Form + Zod | Login, register, listing creation, review submission |
| **Persistent** | localStorage (via Zustand persist middleware) | JWT, preferences, last GPS position |

---

## 3. Backend Architecture

### 3.1 NestJS Module Dependency Graph

```mermaid
graph TD
    APP["AppModule"]

    APP --> AUTH["AuthModule"]
    APP --> USERS["UsersModule"]
    APP --> MERCHANTS["MerchantsModule"]
    APP --> ORDERS["OrdersModule"]
    APP --> PAYMENTS["PaymentsModule"]
    APP --> GEO["GeoModule"]
    APP --> NOTIF["NotificationsModule"]
    APP --> REVIEWS["ReviewsModule"]
    APP --> IMPACT["ImpactModule"]
    APP --> AI["AIModule"]
    APP --> ADMIN["AdminModule"]
    APP --> HEALTH["HealthModule"]

    MERCHANTS --> AUTH
    MERCHANTS --> GEO
    MERCHANTS --> AI

    ORDERS --> AUTH
    ORDERS --> PAYMENTS
    ORDERS --> NOTIF
    ORDERS --> GEO

    PAYMENTS --> NOTIF

    REVIEWS --> AI
    REVIEWS --> ADMIN

    IMPACT --> ORDERS

    AI --> MERCHANTS
    AI --> ORDERS

    ADMIN --> NOTIF
    ADMIN --> REVIEWS

    style AUTH fill:#e74c3c,color:#fff
    style ORDERS fill:#3498db,color:#fff
    style PAYMENTS fill:#2ecc71,color:#fff
    style AI fill:#9b59b6,color:#fff
```

### 3.2 Request Lifecycle

```mermaid
sequenceDiagram
    participant Client
    participant Guard as Auth Guard
    participant Pipe as Validation Pipe
    participant Controller
    participant Service
    participant Repository as Prisma/DB
    participant Interceptor as Response Interceptor

    Client->>Guard: HTTP Request + JWT
    Guard->>Guard: Validate JWT, extract user
    Guard->>Pipe: Pass to validation
    Pipe->>Pipe: Validate DTO (class-validator / zod)
    Pipe->>Controller: Validated request
    Controller->>Service: Business logic call
    Service->>Repository: Database query
    Repository-->>Service: Data
    Service-->>Controller: Result
    Controller-->>Interceptor: Response
    Interceptor->>Interceptor: Transform, log, timing
    Interceptor-->>Client: JSON Response
```

### 3.3 WebSocket Architecture

```mermaid
sequenceDiagram
    participant Consumer as Consumer PWA
    participant Merchant as Merchant PWA
    participant WS as WebSocket Gateway
    participant Redis as Redis PubSub
    participant OrderService

    Consumer->>WS: Connect (JWT auth)
    Merchant->>WS: Connect (JWT auth)
    WS->>WS: Join room: user:{userId}

    Note over OrderService: Order confirmed after undo window
    OrderService->>Redis: Publish: order.confirmed
    Redis->>WS: Receive event
    WS->>Merchant: Emit: 'new-order' (to merchant room)

    Note over OrderService: Merchant updates order status
    OrderService->>Redis: Publish: order.status_changed
    Redis->>WS: Receive event
    WS->>Consumer: Emit: 'order-update' (to consumer room)
```

### 3.4 Background Job Architecture

```mermaid
graph TB
    subgraph "Job Producers"
        ORDER_SVC["OrderService"]
        REVIEW_SVC["ReviewService"]
        LISTING_SVC["ListingService"]
        CRON_SVC["CronService"]
    end

    subgraph "BullMQ Queues (Redis)"
        Q_NOTIF["notification-queue"]
        Q_AI["ai-processing-queue"]
        Q_REFUND["refund-queue"]
        Q_IMPACT["impact-queue"]
    end

    subgraph "Workers"
        W_NOTIF["NotificationWorker<br/>- Send FCM push<br/>- Send WebSocket<br/>- Send email"]
        W_AI["AIWorker<br/>- Sentiment analysis<br/>- Content moderation<br/>- Dynamic pricing"]
        W_REFUND["RefundWorker<br/>- Process refund<br/>- Update credit<br/>- Restore stock"]
        W_IMPACT["ImpactWorker<br/>- Update stats<br/>- Check badges<br/>- CO₂ calculation"]
    end

    ORDER_SVC -->|"delay: 60s"| Q_NOTIF
    ORDER_SVC --> Q_REFUND
    REVIEW_SVC --> Q_AI
    LISTING_SVC --> Q_AI
    CRON_SVC --> Q_IMPACT

    Q_NOTIF --> W_NOTIF
    Q_AI --> W_AI
    Q_REFUND --> W_REFUND
    Q_IMPACT --> W_IMPACT
```

---

## 4. Database Architecture

### 4.1 Schema Overview

```mermaid
erDiagram
    USERS ||--o| MERCHANT_PROFILES : "has profile"
    USERS ||--o| RESCUE_CREDITS : "has wallet"
    USERS ||--o| IMPACT_STATS : "has stats"
    USERS ||--o{ USER_BADGES : "earned"
    USERS ||--o{ ORDERS : "placed"
    USERS ||--o{ REVIEWS : "wrote"
    USERS ||--o{ NOTIFICATIONS : "received"

    MERCHANT_PROFILES ||--o{ LISTINGS : "created"
    MERCHANT_PROFILES ||--o{ LISTING_TEMPLATES : "saved"

    LISTINGS ||--o{ ORDERS : "ordered from"

    ORDERS ||--o{ PAYMENTS : "paid via"
    ORDERS ||--o| VOUCHERS : "generated"
    ORDERS ||--o| REVIEWS : "reviewed"
    ORDERS ||--o{ SUPPORT_TICKETS : "triggered"

    RESCUE_CREDITS ||--o{ CREDIT_TRANSACTIONS : "logged"
    BADGES ||--o{ USER_BADGES : "awarded"
    REVIEWS ||--o| SUPPORT_TICKETS : "flagged"

    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        enum role
        varchar name
        varchar phone
        varchar avatar_url
    }

    MERCHANT_PROFILES {
        uuid id PK
        uuid user_id FK
        varchar store_name
        geography location
        float avg_rating
        boolean is_verified
    }

    LISTINGS {
        uuid id PK
        uuid merchant_id FK
        varchar title
        enum category
        int original_price
        int discounted_price
        int quantity_remaining
        timestamp pickup_start
        timestamp pickup_end
        enum status
    }

    ORDERS {
        uuid id PK
        uuid consumer_id FK
        uuid listing_id FK
        uuid merchant_id FK
        int total_price
        enum status
        timestamp undo_deadline
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK
        varchar xendit_payment_id UK
        enum type
        int amount
        enum status
    }

    RESCUE_CREDITS {
        uuid id PK
        uuid user_id FK
        int balance
    }

    VOUCHERS {
        uuid id PK
        uuid order_id FK
        varchar token UK
        enum status
    }

    REVIEWS {
        uuid id PK
        uuid order_id FK
        int rating
        text comment
        enum sentiment
    }
```

### 4.2 PostGIS Geospatial Strategy

```sql
-- Tipe kolom lokasi merchant
ALTER TABLE merchant_profiles
  ADD COLUMN location geography(Point, 4326);

-- Index spasial untuk pencarian radius
CREATE INDEX idx_merchant_location
  ON merchant_profiles USING GIST (location);

-- Query: cari listing dalam radius
SELECT l.*, mp.store_name,
  ST_Distance(
    mp.location,
    ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography
  ) AS distance_m
FROM listings l
JOIN merchant_profiles mp ON l.merchant_id = mp.id
WHERE l.status = 'ACTIVE'
  AND l.quantity_remaining > 0
  AND l.pickup_end > NOW()
  AND ST_DWithin(
    mp.location,
    ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography,
    $radius_meters
  )
ORDER BY distance_m;
```

### 4.3 Connection & Pooling Strategy

| Environment | Strategy |
|:------------|:---------|
| **Development** | Direct connection, pool size 5 |
| **Staging** | Direct connection, pool size 10 |
| **Production** | PgBouncer (transaction mode), pool size 20 |

---

## 5. API Architecture

### 5.1 REST API Design Principles

| Principle | Implementation |
|:----------|:---------------|
| **Versioning** | URL prefix: `/api/v1/` |
| **Auth** | Bearer JWT in Authorization header |
| **Pagination** | Cursor-based (for feeds) + offset-based (for admin) |
| **Filtering** | Query params: `?category=REGULAR&sort=distance&maxPrice=30000` |
| **Error Format** | RFC 7807 Problem Details: `{ type, title, status, detail, instance }` |
| **Rate Limiting** | Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| **CORS** | Whitelist: `foodrescue.id`, `merchant.foodrescue.id`, `localhost:3000` (dev) |

### 5.2 Response Envelope

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "hasMore": true,
    "cursor": "eyJpZCI6IjEyMyJ9"
  }
}

// Error Response (RFC 7807)
{
  "success": false,
  "error": {
    "type": "https://api.foodrescue.id/errors/stock-exhausted",
    "title": "Stock Exhausted",
    "status": 409,
    "detail": "The listing you're trying to order is sold out.",
    "instance": "/api/v1/orders",
    "traceId": "abc-123-def"
  }
}
```

### 5.3 Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Google as Google OAuth
    participant DB

    alt Email/Password Login
        Client->>API: POST /auth/login { email, password }
        API->>DB: Find user, verify bcrypt hash
        DB-->>API: User found
        API-->>Client: { accessToken (15min), refreshToken (7d) }
    end

    alt Google OAuth
        Client->>Google: OAuth consent screen
        Google-->>Client: Authorization code
        Client->>API: POST /auth/google { code }
        API->>Google: Exchange code for profile
        Google-->>API: { email, name, avatar }
        API->>DB: Find or create user
        API-->>Client: { accessToken, refreshToken }
    end

    alt Token Refresh
        Client->>API: POST /auth/refresh { refreshToken }
        API->>DB: Validate refresh token (not revoked)
        API-->>Client: { newAccessToken, newRefreshToken }
        Note over API: Old refresh token rotated (invalidated)
    end
```

---

## 6. Integration Architecture

### 6.1 Xendit Payment Integration

```mermaid
sequenceDiagram
    participant Consumer
    participant API
    participant Xendit

    Consumer->>API: POST /orders { listingId, qty, paymentMethod: 'QRIS' }
    API->>API: Validate stock, lock row (SELECT FOR UPDATE)
    API->>API: Create order (status: PENDING_PAYMENT)
    API->>Xendit: POST /qr_codes { amount, externalId: orderId }
    Xendit-->>API: { qrString, expiresAt }
    API-->>Consumer: { orderId, qrString, expiresAt }
    Consumer->>Consumer: Display QRIS code

    Note over Consumer,Xendit: User scans QRIS with bank app
    Xendit->>API: POST /payments/webhook { status: 'COMPLETED' }
    API->>API: Verify HMAC signature
    API->>API: Update order status: PAID → UNDO_WINDOW
    API->>API: Set undo_deadline = now() + 60s
    API->>API: Decrement listing stock
    API->>API: Schedule merchant notification (delay 60s)
    API->>Consumer: WebSocket: 'payment-success'
    Consumer->>Consumer: Navigate to Undo screen
```

### 6.2 Firebase Cloud Messaging

```mermaid
sequenceDiagram
    participant PWA
    participant SW as Service Worker
    participant API
    participant FCM as Firebase Cloud Messaging

    PWA->>SW: Register service worker
    PWA->>FCM: Request notification permission
    FCM-->>PWA: FCM device token
    PWA->>API: POST /users/fcm-token { token }
    API->>API: Store token in users table

    Note over API: Event triggers notification
    API->>FCM: Send push { to: deviceToken, title, body }
    FCM->>SW: Deliver push message
    SW->>SW: Display native notification
    SW->>PWA: (if app in foreground) in-app notification
```

---

## 7. Security Architecture

### 7.1 Security Layers

```mermaid
graph TB
    subgraph "Edge Security"
        WAF["Cloudflare WAF<br/>(DDoS, bot protection)"]
        SSL["TLS 1.3<br/>(end-to-end encryption)"]
    end

    subgraph "Application Security"
        HELMET["Helmet.js<br/>(HTTP security headers)"]
        CORS["CORS<br/>(Whitelist origins)"]
        RATE["Rate Limiter<br/>(Throttler guard)"]
        CSRF["CSRF Protection<br/>(SameSite cookies)"]
    end

    subgraph "Auth Security"
        JWT["JWT Auth<br/>(access: 15min, refresh: 7d)"]
        RBAC["Role-Based Access<br/>(CONSUMER, MERCHANT, ADMIN)"]
        HASH["bcrypt Password Hashing<br/>(salt rounds: 12)"]
    end

    subgraph "Data Security"
        PARAM["Parameterized Queries<br/>(Prisma ORM)"]
        VALID["Input Validation<br/>(class-validator + Zod)"]
        ENCRYPT["PII Encryption<br/>(AES-256 at rest)"]
        AUDIT["Audit Log<br/>(credit_transactions)"]
    end

    subgraph "Payment Security"
        HMAC["Xendit Webhook HMAC<br/>(signature verification)"]
        IDEMP["Idempotency Keys<br/>(prevent double charge)"]
        PCI["No raw card data<br/>(Xendit handles PCI)"]
    end

    WAF --> HELMET --> JWT --> PARAM --> HMAC
```

### 7.2 Role-Based Access Control (RBAC)

| Resource | CONSUMER | MERCHANT | ADMIN |
|:---------|:---------|:---------|:------|
| Browse listings | ✅ Read | ✅ Read | ✅ Read |
| Create listing | ❌ | ✅ Own | ✅ Any |
| Place order | ✅ | ❌ | ❌ |
| Undo order | ✅ Own | ❌ | ✅ Any |
| Emergency cancel | ❌ | ✅ Own | ✅ Any |
| Verify pickup (QR) | ❌ | ✅ Own | ✅ Any |
| View wallet | ✅ Own | ❌ | ✅ Any |
| Submit review | ✅ | ❌ | ❌ |
| View dashboard | ❌ | ✅ Own | ✅ Any |
| Manage tickets | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ✅ |

---

## 8. Performance Architecture

### 8.1 Frontend Performance Budget

| Metric | Target | Measurement |
|:-------|:-------|:------------|
| **FCP** (First Contentful Paint) | < 1.5s | Lighthouse |
| **LCP** (Largest Contentful Paint) | < 2.5s | Lighthouse |
| **FID** (First Input Delay) | < 100ms | Lighthouse |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| **TTI** (Time to Interactive) | < 3.5s | Lighthouse |
| **Bundle Size** (initial JS) | < 150KB gzipped | webpack-bundle-analyzer |
| **PWA Load** (4G network) | < 2s | Real User Monitoring |

### 8.2 Backend Performance Targets

| Metric | Target |
|:-------|:-------|
| **API P50 latency** | < 100ms |
| **API P95 latency** | < 500ms |
| **API P99 latency** | < 2000ms |
| **Geo-search query** | < 200ms (PostGIS indexed) |
| **Webhook processing** | < 1000ms |
| **WebSocket message delivery** | < 100ms |

### 8.3 Caching Strategy

| Data | Cache | TTL | Invalidation |
|:-----|:------|:----|:-------------|
| Listing feed | TanStack Query (client) + Redis (server) | 30s / 60s | On stock change, price change |
| Listing detail | TanStack Query (client) | 15s | On order placed, stock change |
| User profile | TanStack Query (client) | 5min | On profile update |
| Wallet balance | TanStack Query (client) | 10s | On transaction |
| Impact stats | Redis (server) | 1hr | On order pickup |
| Merchant dashboard | Redis (server) | 5min | On order status change |
| Static assets (images) | Cloudflare CDN + SW cache | 24hr | Cache-busting via hash |
