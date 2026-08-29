# FOODRESCUE — Product Context (v1.0.1)

## Mission & Purpose
FOODRESCUE is an Indonesian hyperlocal surplus food rescue marketplace connecting consumers (students, young professionals, cost-conscious foodies) with local food merchants (bakeries, cafes, restaurants, warungs) to rescue high-quality surplus meals at 50–70% discount before closing time.

## Target Audience & Personas
- **Alex (Power User / College Student)**: Seeks affordable, quality meals between classes; highly sensitive to speed, price clarity, and frictionless 1-tap checkout.
- **Jordan (First-Timer / Cautious Student)**: Seeks reassurance regarding hygiene, food safety, and transparent pickup instructions.
- **Casey (Mobile Thumb User on the Go)**: Operates one-handed while walking near campus corridors; relies on clear typography and prominent touch targets.
- **Pak Budi / Bu Rina (Merchant Partner)**: Bakery/cafe owner managing surplus inventory, monitoring 85% revenue splits, withdrawing funds to registered bank accounts, and executing instant store status control.

## Core Architectural Pillars (v1.0.1)
1. **Hyperlocal Discovery**: Radius-based feed and map view with dynamic distance, pickup windows, and remaining stock.
2. **Instant Undo Window (60 Detik)**: A 60-second grace period immediately post-payment where consumers can cancel for a 100% instant refund to Rescue Credit.
3. **Dynamic Anti-Fraud QR Voucher**: Rotating token refreshed every 30 seconds with animated live indicator to prevent screenshot fraud at the merchant counter.
4. **Merchant KYC Onboarding & 85/15 SLA**: 3-step verification wizard (physical store details, verified bank account, signed SLA commitment to food safety).
5. **Bank Disbursement (Payout)**: Zero-fee payout flow to Indonesian banks (BCA, Mandiri, BRI, BNI, BSI) with clear transaction logs.
6. **Instant Store Operational Control**: 1-tap toggle to temporarily close or reopen merchant stores.
7. **Mystery Box & Menu Pilihan**: Gamified surplus box unboxing with instant feedback and savings metrics.
8. **Measurable Ecological & Financial Impact**: Tangible metrics (Portions Saved, CO2e Avoided in kg, and Rupiah Saved) with achievement badges.
9. **Polished Impeccable UX**: Complete Skeleton shimmer loading states across all API-connected components and tooltip overflow protection.
