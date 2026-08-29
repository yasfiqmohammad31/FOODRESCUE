# 📏 FOODRESCUE — Business Rules

> Dokumen ini mendefinisikan seluruh **business rules** yang mengatur logika bisnis,
> validasi, kebijakan, dan batasan dalam sistem FOODRESCUE. Rules dikelompokkan per domain
> dan setiap rule memiliki ID unik untuk referensi dalam kode.

---

## Daftar Domain

| Domain | Kode Prefix | Jumlah Rules |
|:-------|:------------|:-------------|
| [User & Authentication](#1-user--authentication-rules) | `AUTH-` | 9 |
| [Merchant & Listing](#2-merchant--listing-rules) | `LST-` | 14 |
| [Order & Transaction](#3-order--transaction-rules) | `ORD-` | 16 |
| [Payment & Rescue Credit](#4-payment--rescue-credit-rules) | `PAY-` | 11 |
| [Pickup & Voucher](#5-pickup--voucher-rules) | `PKP-` | 9 |
| [Review & Moderation](#6-review--moderation-rules) | `REV-` | 10 |
| [AI & Intelligence](#7-ai--intelligence-rules) | `AI-` | 9 |
| [Gamification & Impact](#8-gamification--impact-rules) | `GAM-` | 8 |
| [Notification](#9-notification-rules) | `NTF-` | 8 |
| [Platform & Operational](#10-platform--operational-rules) | `PLT-` | 8 |

---

## 1. User & Authentication Rules

| ID | Rule | Enforcement | Layer |
|:---|:-----|:------------|:------|
| `AUTH-001` | Email harus unik di seluruh sistem. Satu email = satu akun. | Database UNIQUE constraint + service validation | Backend |
| `AUTH-002` | Password minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka. | Zod schema validation | Frontend + Backend |
| `AUTH-003` | Password di-hash menggunakan bcrypt dengan salt rounds = 12. | bcrypt library | Backend |
| `AUTH-004` | Access token berlaku 15 menit. Refresh token berlaku 7 hari. | JWT exp claim | Backend |
| `AUTH-005` | Refresh token di-rotate setiap kali digunakan. Token lama langsung invalid. | Database token versioning | Backend |
| `AUTH-006` | User memiliki tepat 1 role: `CONSUMER`, `MERCHANT`, atau `ADMIN`. Satu akun TIDAK bisa memiliki multiple roles. | Database enum + guard | Backend |
| `AUTH-007` | Google OAuth login: jika email sudah terdaftar via email/password, akun di-link otomatis (bukan buat baru). | Service logic | Backend |
| `AUTH-008` | Setelah 5x login gagal berturut-turut, akun di-lock selama 15 menit. | Redis counter + TTL | Backend |
| `AUTH-009` | Merchant harus melengkapi profil toko (nama, alamat, lokasi GPS) sebelum bisa membuat listing. | Guard / middleware check | Backend |

---

## 2. Merchant & Listing Rules

| ID | Rule | Enforcement | Layer |
|:---|:-----|:------------|:------|
| `LST-001` | Diskon listing minimum **50%** dan maksimum **85%** dari harga asli. | Validation pipe + form validation | Frontend + Backend |
| `LST-002` | `discounted_price` harus lebih kecil dari `original_price`. | Validation pipe | Backend |
| `LST-003` | `pickup_start` harus >= waktu sekarang (tidak boleh backdate). | Validation pipe | Backend |
| `LST-004` | `pickup_end` harus >= `pickup_start` + 30 menit (minimum pickup window). | Validation pipe | Backend |
| `LST-005` | Pickup window maksimal 8 jam (`pickup_end - pickup_start <= 8 jam`). | Validation pipe | Backend |
| `LST-006` | Quantity listing minimal 1, maksimal 100 porsi per listing. | Validation pipe | Frontend + Backend |
| `LST-007` | Foto listing **wajib**. Format yang diterima: JPG, JPEG, PNG, WebP. Ukuran maks 5MB. | File validation middleware | Frontend + Backend |
| `LST-008` | Listing otomatis berubah status ke `EXPIRED` ketika `pickup_end` terlewati DAN masih ada sisa stok. | Cron job (setiap 1 menit) | Backend |
| `LST-009` | Listing otomatis berubah status ke `SOLD_OUT` ketika `quantity_remaining` = 0. | Service logic (post-order) | Backend |
| `LST-010` | Listing yang sudah `EXPIRED`, `SOLD_OUT`, atau `CANCELLED` tidak bisa diedit, hanya bisa dilihat. | Guard / service check | Backend |
| `LST-011` | Merchant hanya bisa mengedit/menghapus listing miliknya sendiri (ownership check). | Guard + service validation | Backend |
| `LST-012` | Category listing: `REGULAR` (item spesifik) atau `MYSTERY_BOX` (isi acak). | Database enum | Backend |
| `LST-013` | Label alergen bersifat opsional, dipilih dari daftar standar: Gluten, Dairy, Nuts, Eggs, Soy, Seafood, Sesame. | Enum array validation | Frontend + Backend |
| `LST-014` | Listing template disimpan per-merchant. Maks 10 template per merchant. | Service validation | Backend |

---

## 3. Order & Transaction Rules

| ID | Rule | Enforcement | Layer |
|:---|:-----|:------------|:------|
| `ORD-001` | Satu checkout hanya boleh berisi **1 listing** (single item cart). Quantity per item bisa > 1. | Service validation | Backend |
| `ORD-002` | Sebelum membuat order, **stock harus di-re-check** di backend (bukan dari cache). | `SELECT FOR UPDATE` lock | Backend |
| `ORD-003` | Stock di-decrement saat **payment berhasil** (bukan saat order dibuat). | Payment webhook handler | Backend |
| `ORD-004` | Jika stock habis saat re-check, order ditolak dengan error `STOCK_EXHAUSTED` (HTTP 409). | Service validation | Backend |
| `ORD-005` | Setelah payment berhasil, order masuk status `UNDO_WINDOW` selama **60 detik**. | Order service + Redis timer | Backend |
| `ORD-006` | Consumer bisa membatalkan order (undo) **hanya dalam 60 detik** setelah pembayaran. Backend adalah sumber kebenaran untuk timing. | Server-side `undo_deadline` check | Backend |
| `ORD-007` | Maksimal **3 undo per consumer per hari**. Setelah limit, tombol undo di-disable. | Redis counter per user per day | Backend |
| `ORD-008` | Undo request harus **idempotent**. Double-click / retry tidak boleh menyebabkan double refund. | Idempotency key | Backend |
| `ORD-009` | Setelah undo window berakhir (60s), order otomatis ter-confirm. Notifikasi dikirim ke merchant. | BullMQ delayed job + cron safety net | Backend |
| `ORD-010` | Consumer **tidak bisa memesan** dari listing yang `pickup_end` nya sudah terlewati. | Service validation | Backend |
| `ORD-011` | Consumer **tidak bisa memesan** quantity melebihi `quantity_remaining`. | Service validation | Backend |
| `ORD-012` | `order_number` adalah identifier publik yang mudah dibaca (format: `FR-YYYYMMDD-XXXX`). | Service generation | Backend |
| `ORD-013` | Merchant bisa melakukan **Emergency Cancel** kapan saja selama order belum `PICKED_UP`. | Service validation | Backend |
| `ORD-014` | Emergency Cancel oleh merchant memicu **100% refund ke Rescue Credit** consumer. | Refund Orchestrator Agent | Backend |
| `ORD-015` | Order yang dibatalkan (undo/merchant cancel) mengembalikan stock ke listing (`quantity_remaining += quantity`). | Atomic database transaction | Backend |
| `ORD-016` | Harga yang dibayar consumer = harga saat **masuk halaman checkout**. Perubahan harga AI mid-checkout tidak berlaku. | Price snapshot in order creation | Backend |

---

## 4. Payment & Rescue Credit Rules

| ID | Rule | Enforcement | Layer |
|:---|:-----|:------------|:------|
| `PAY-001` | Metode pembayaran yang didukung: **QRIS**, **E-Wallet** (GoPay, OVO, DANA, ShopeePay), dan **Rescue Credit**. | Xendit API + internal wallet | Backend |
| `PAY-002` | Semua harga disimpan dalam **satuan terkecil** (tanpa desimal) untuk menghindari floating point error. | Database integer type | Backend |
| `PAY-003` | Payment timeout: jika QRIS/E-Wallet tidak dibayar dalam **5 menit**, order otomatis cancel tanpa dampak ke stock. | Xendit expiry + cron cleanup | Backend |
| `PAY-004` | Xendit webhook **harus diverifikasi** menggunakan HMAC signature sebelum diproses. | Middleware verification | Backend |
| `PAY-005` | Setiap payment memiliki **idempotency key** untuk mencegah duplicate charge. | Xendit idempotency header | Backend |
| `PAY-006` | Rescue Credit balance tidak boleh negatif. Transaksi yang membuat balance < 0 ditolak. | Database CHECK constraint + service validation | Backend |
| `PAY-007` | Refund **selalu** masuk ke Rescue Credit (bukan kembali ke payment method asal). | Refund Orchestrator rule | Backend |
| `PAY-008` | Rescue Credit bisa digunakan untuk **seluruh** atau **sebagian** pembayaran. Jika partial, sisanya dibayar via QRIS/E-Wallet. | Service logic (future, MVP: full only) | Backend |
| `PAY-009` | Setiap mutasi Rescue Credit tercatat di `credit_transactions` dengan referensi ke `order_id`. | Audit logging | Backend |
| `PAY-010` | Platform commission: **15–20%** dari `discounted_price`, dipotong dari payout merchant (bukan dari pembayaran consumer). | Commission calculation service | Backend |
| `PAY-011` | Rescue Credit **tidak bisa dicairkan** (withdraw) ke rekening bank. Hanya bisa digunakan untuk pembelian di platform. | No disbursement endpoint for consumer | Backend |

---

## 5. Pickup & Voucher Rules

| ID | Rule | Enforcement | Layer |
|:---|:-----|:------------|:------|
| `PKP-001` | Voucher QR code di-generate setelah undo window berakhir (order status `CONFIRMED`). | Service logic | Backend |
| `PKP-002` | Token voucher berupa **JWT yang ditandatangani server** dengan expiry 30 detik (auto-refresh). | JWT signing + rotation | Backend |
| `PKP-003` | QR payload di-refresh **setiap 30 detik** di consumer app untuk mencegah fraud screenshot. | Polling endpoint | Frontend |
| `PKP-004` | Voucher berstatus **one-time-use**. Setelah di-scan dan terverifikasi, tidak bisa digunakan lagi. | Database `status = USED` flag | Backend |
| `PKP-005` | Voucher tetap bisa di-generate hingga `pickup_end + 15 menit` (grace period). Setelah itu, expired. | Service validation | Backend |
| `PKP-006` | Merchant hanya bisa verify pickup untuk **order miliknya** (ownership check). | Guard + service validation | Backend |
| `PKP-007` | Jika consumer **No-Show** (tidak datang hingga `pickup_end`), order ditandai `NO_SHOW` **tanpa refund**. | Cron job (setiap 5 menit) | Backend |
| `PKP-008` | Tidak ada grace period untuk no-show. Tepat saat `pickup_end` terlewati, order hangus. | Strict time comparison | Backend |
| `PKP-009` | Jika merchant camera tidak tersedia (permission denied), sediakan fallback **input manual order number**. | UI fallback | Frontend |

---

## 6. Review & Moderation Rules

| ID | Rule | Enforcement | Layer |
|:---|:-----|:------------|:------|
| `REV-001` | Consumer hanya bisa submit review setelah order berstatus `PICKED_UP`. | Service validation | Backend |
| `REV-002` | Review harus di-submit dalam waktu **48 jam** setelah pickup. Setelah itu, window tertutup. | Service validation | Backend |
| `REV-003` | Satu order hanya boleh memiliki **1 review**. Tidak bisa edit setelah submit. | Database unique constraint (order_id) | Backend |
| `REV-004` | Rating wajib (1–5 bintang). Komentar teks opsional. | Validation pipe | Backend |
| `REV-005` | Review dengan rating **≤ 2** otomatis di-flag untuk review oleh admin. | AI Sentiment Agent | Backend |
| `REV-006` | Jika review mengandung **keyword keamanan pangan** (basi, keracunan, expired, dll.) dengan rating ≤ 2, sistem otomatis membuat **Support Ticket** tipe `FOOD_QUALITY`. | AI Sentiment Agent | Backend |
| `REV-007` | Kata-kata kasar (profanity) di-sensor otomatis dengan `***`. Review tetap publish kecuali >50% konten adalah profanity. | Content moderation | Backend |
| `REV-008` | `avg_rating` merchant di-update secara agregat setiap kali review baru masuk. | Trigger / service calculation | Backend |
| `REV-009` | Review visible ke publik setelah melewati pipeline moderasi (< 5 detik biasanya). | Async queue processing | Backend |
| `REV-010` | Jika merchant mendapat **3 critical reviews** (rating ≤ 2 + food safety keyword) dalam **7 hari**, admin otomatis di-notifikasi untuk investigasi. | Scheduled aggregation check | Backend |

---

## 7. AI & Intelligence Rules

| ID | Rule | Enforcement | Layer |
|:---|:-----|:------------|:------|
| `AI-001` | AI Dynamic Pricing hanya boleh **menyarankan** harga. Merchant harus **approve manual** di MVP. | UI confirmation + API separation | Frontend + Backend |
| `AI-002` | AI-suggested price tidak boleh membuat diskon di **bawah 50%** atau **di atas 85%**. | Clamp function in pricing engine | Backend |
| `AI-003` | AI tidak boleh **menaikkan** harga — hanya boleh menurunkan dari harga yang sudah di-set merchant. | One-directional rule | Backend |
| `AI-004` | Harga minimum yang di-set merchant (floor price / harga bahan pokok) tidak boleh dilanggar oleh AI. | Merchant setting check | Backend |
| `AI-005` | Dynamic pricing re-calculate setiap **15 menit** ATAU saat stock berubah. | Cron + event trigger | Backend |
| `AI-006` | Surplus Prediction membutuhkan minimal **14 hari data historis** sebelum aktif. Sebelum itu, fitur di-disable. | Data count check | Backend |
| `AI-007` | Jika OpenAI API down, sentiment analysis fallback ke **rule-based keyword matching**. Review tetap diproses. | Try-catch + fallback service | Backend |
| `AI-008` | AI processing bersifat **asynchronous** (via BullMQ queue). Tidak boleh memblokir request utama. | Queue architecture | Backend |
| `AI-009` | Hasil AI (sentiment, pricing) harus disimpan di database untuk **audit trail** dan model improvement. | Database logging | Backend |

---

## 8. Gamification & Impact Rules

| ID | Rule | Enforcement | Layer |
|:---|:-----|:------------|:------|
| `GAM-001` | Impact stats (porsi terselamatkan, CO₂ dicegah) hanya di-update saat order berstatus **`PICKED_UP`** (berhasil diambil). | Event-driven update | Backend |
| `GAM-002` | Estimasi CO₂ per porsi makanan terselamatkan: **2.5 kg CO₂e** (rata-rata). | Constant multiplier | Backend |
| `GAM-003` | Estimasi uang yang dihemat consumer: `original_price - discounted_price` per porsi. | Calculation from order data | Backend |
| `GAM-004` | Badge diperoleh secara otomatis saat threshold tercapai. Tidak ada mekanisme manual awarding (kecuali admin). | Automated badge check | Backend |
| `GAM-005` | Badge bersifat **permanent** — sekali diperoleh, tidak bisa dicabut. | No revoke logic | Backend |
| `GAM-006` | Badge check dilakukan setiap kali impact stats di-update (`GAM-001`). | Triggered after stats update | Backend |
| `GAM-007` | Badge tier bersifat **kumulatif**: mendapat "Food Hero (50 porsi)" tidak menghapus "First Rescue (1 porsi)". | Additive badge system | Backend |
| `GAM-008` | Badge yang baru diperoleh ditampilkan sebagai **push notification** dan **in-app celebration modal**. | Notification + UI modal | Full Stack |

### Badge Definitions

| Badge | Kriteria | Icon Theme |
|:------|:---------|:-----------|
| 🌱 First Rescue | 1 porsi terselamatkan | Sprout |
| 🥗 Rescue Regular | 10 porsi terselamatkan | Salad bowl |
| 🦸 Food Hero | 50 porsi terselamatkan | Hero cape |
| 🌍 Carbon Warrior | 50 kg CO₂ dicegah | Earth globe |
| 🔥 Weekly Warrior | 4 minggu berturut-turut aktif | Flame streak |
| ⭐ Community Star | 20 reviews diberikan | Star |
| 💎 Eco Champion | 100 porsi + 250 kg CO₂ | Diamond |

---

## 9. Notification Rules

| ID | Rule | Enforcement | Layer |
|:---|:-----|:------------|:------|
| `NTF-001` | Notifikasi order baru ke merchant **wajib delay 60 detik** (menunggu undo window selesai). Jika consumer undo dalam 60s, notifikasi **dibatalkan**. | BullMQ delayed job + cancel | Backend |
| `NTF-002` | Push notification **tidak dikirim** antara 22:00–07:00 (quiet hours), kecuali priority = `URGENT`. | Service time check | Backend |
| `NTF-003` | Maksimal **10 push notification per user per jam** untuk mencegah spam. Notifikasi berlebih di-batch. | Redis rate counter | Backend |
| `NTF-004` | Jika push notification gagal (token expired/invalid), fallback ke **in-app notification**. | Channel fallback logic | Backend |
| `NTF-005` | Pickup reminder dikirim **15 menit** sebelum `pickup_end`. | Scheduled job | Backend |
| `NTF-006` | Notifikasi emergency cancel (merchant) bersifat **URGENT** dan dikirim **immediately** tanpa delay dan tanpa quiet hours restriction. | Priority override | Backend |
| `NTF-007` | Setiap notifikasi push memiliki **unique key** untuk deduplication. Duplicate dispatch di-ignore. | Idempotency check | Backend |
| `NTF-008` | User bisa opt-out dari notifikasi non-essential (promo, daily summary) via settings. Notifikasi transaksional (order status, refund) **tidak bisa** di-disable. | User preference + service filter | Full Stack |

---

## 10. Platform & Operational Rules

| ID | Rule | Enforcement | Layer |
|:---|:-----|:------------|:------|
| `PLT-001` | PWA harus ter-load dalam **< 2 detik** pada jaringan 4G. | Performance budget (Lighthouse CI) | Frontend |
| `PLT-002` | API rate limit: **100 request/menit** untuk endpoint umum, **10 request/menit** untuk payment endpoints. | NestJS Throttler guard | Backend |
| `PLT-003` | Order Cancellation Rate target: **< 2%** dari total order. Jika melebihi, review UX checkout flow. | Analytics monitoring | Operational |
| `PLT-004` | Pickup Success Rate target: **> 95%**. Jika di bawah, perkuat reminder notification. | Analytics monitoring | Operational |
| `PLT-005` | Merchant Rating target: **> 4.3/5.0** rata-rata platform. Merchant di bawah 3.0 setelah 20 reviews mendapat warning. | Automated check | Backend |
| `PLT-006` | Data user (PII) harus di-encrypt at rest (AES-256). Opsi delete account harus tersedia. | Encryption module + delete endpoint | Backend |
| `PLT-007` | Semua API errors menggunakan format **RFC 7807 Problem Details**. Error message tidak boleh expose internal details (stack trace, query, etc). | Exception filter | Backend |
| `PLT-008` | Database migration harus backward-compatible. Tidak boleh ada breaking migration tanpa zero-downtime strategy. | Migration review process | Operational |

---

## Quick Reference: Rule Constants

```typescript
// Copy-paste reference untuk implementasi
export const RULES = {
  // Auth
  PASSWORD_MIN_LENGTH: 8,
  BCRYPT_SALT_ROUNDS: 12,
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 15,

  // Listing
  MIN_DISCOUNT_PERCENT: 50,
  MAX_DISCOUNT_PERCENT: 85,
  MIN_PICKUP_WINDOW_MINUTES: 30,
  MAX_PICKUP_WINDOW_HOURS: 8,
  MAX_QUANTITY_PER_LISTING: 100,
  PHOTO_MAX_SIZE_BYTES: 5_000_000,
  PHOTO_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
  MAX_TEMPLATES_PER_MERCHANT: 10,

  // Order
  UNDO_WINDOW_SECONDS: 60,
  MAX_UNDO_PER_USER_PER_DAY: 3,
  PAYMENT_TIMEOUT_MINUTES: 5,
  ORDER_NUMBER_PREFIX: 'FR',

  // Pickup
  QR_TOKEN_EXPIRY_SECONDS: 30,
  QR_REFRESH_INTERVAL_SECONDS: 30,
  PICKUP_GRACE_PERIOD_MINUTES: 15,  // Voucher generation grace
  NO_SHOW_GRACE_PERIOD_MINUTES: 0,  // No grace for no-show

  // Review
  REVIEW_WINDOW_HOURS: 48,
  AUTO_FLAG_RATING_THRESHOLD: 2,
  CRITICAL_REVIEWS_THRESHOLD: 3,    // Reviews in 7 days → investigation
  MERCHANT_WARNING_RATING: 3.0,

  // Payment
  PLATFORM_COMMISSION_PERCENT_MIN: 15,
  PLATFORM_COMMISSION_PERCENT_MAX: 20,

  // AI
  AI_PRICE_RECALC_INTERVAL_MINUTES: 15,
  SURPLUS_PREDICTION_MIN_DAYS: 14,
  CO2_PER_PORTION_KG: 2.5,

  // Notification
  MERCHANT_NOTIFICATION_DELAY_MS: 60_000,
  QUIET_HOURS_START: 22,  // 10 PM
  QUIET_HOURS_END: 7,     // 7 AM
  MAX_PUSH_PER_HOUR: 10,
  PICKUP_REMINDER_MINUTES_BEFORE: 15,

  // Platform
  RATE_LIMIT_GENERAL: 100,         // per minute
  RATE_LIMIT_PAYMENT: 10,          // per minute
  PWA_LOAD_TARGET_SECONDS: 2,
} as const;
```
