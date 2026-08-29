# FOODRESCUE — Design System Specification

## 1. Visual World: "Fresh Harvest & Warm Table"
Inspired by the vibrant, handcrafted FOOD RESCUE mascot artwork (*"Kasih kita kesempatan kedua, Kita masih enak kok! Selamatkan makanan. Kurangi sampah."*), this visual system pairs organic, earthy botanical greens with warm baked-toast ambers and energizing tangerine citrus tones over a warm, comforting rice-paper canvas.

---

## 2. Color Palette (OKLCH & Hex Equivalence)

### Core Brand Colors (Extracted from Brand Artwork)
- **Primary (Botanical Leaf Green)**:
  - Token: `--primary`
  - Values: `oklch(0.46 0.14 142)` / `#2D6A4F`
  - Role: Primary buttons, active navigation, verified badges, brand anchors.
- **Secondary / Rescue Accent (Warm Tangerine Orange)**:
  - Token: `--accent-rescue` / `--terracotta`
  - Values: `oklch(0.60 0.21 44)` / `#E85D04`
  - Role: Discount percentage tags, urgent countdowns, unboxing accents, hero badges.
- **Warm Toast Amber (Food & Golden Glow)**:
  - Token: `--amber-toast`
  - Values: `oklch(0.78 0.17 78)` / `#F59E0B`
  - Role: Mystery box highlights, star ratings, pickup urgency badges.
- **Fresh Sprout Lime (Foliage & Growth)**:
  - Token: `--lime-sprout`
  - Values: `oklch(0.72 0.18 135)` / `#65A30D`
  - Role: Environmental savings indicators, CO2 reduction pills.

### Neutrals & Canvas
- **Background (Warm Cream Canvas)**:
  - Token: `--background`
  - Values: `oklch(0.98 0.008 90)` / `#FBF9F5`
- **Surface / Card (Pure Crisp White)**:
  - Token: `--card` / `--surface`
  - Values: `#FFFFFF`
- **Subtle Surface Container**:
  - Token: `--surface-container`
  - Values: `oklch(0.95 0.01 90)` / `#F3EFE6`
- **Borders & Dividers**:
  - Token: `--border`
  - Values: `oklch(0.90 0.012 90)` / `#E7E0D3`
- **Foreground / Primary Text**:
  - Token: `--foreground`
  - Values: `oklch(0.18 0.01 60)` / `#1C1917`
- **Muted Text**:
  - Token: `--muted-foreground`
  - Values: `oklch(0.50 0.015 60)` / `#78716C`

---

## 3. Typography & Spacing
- **Font Family**: `Geist Sans` (primary display & UI), `Geist Mono` (numeric codes & timers).
- **Scale**:
  - Display / Hero: `text-2xl` to `text-3xl font-black` (`tracking-tight`)
  - Section Titles: `text-base` to `text-lg font-bold`
  - Body Copy: `text-xs` to `text-sm font-normal`
  - Microcopy & Labels: `text-[10px]` to `text-[11px] font-bold uppercase tracking-wider`
- **Numerals**: Always formatted with `tabular-nums` for prices, timers, and distance.

---

## 4. Layout & Component Architecture (From Reference)

### A. Discovery Feed (`/feed`)
- **Bento Hero**: Welcoming header card highlighting today's surplus opportunity.
- **Category Roundels**: Circular pill buttons with bold icons (Semua, Mystery Box, Bakery, Cafe, Rating 4.7+).
- **Listing Cards**:
  - Aspect ratio 16:10 with smooth image zoom on hover.
  - Floating badges for category & discount percentage.
  - Merchant distance & pickup schedule chips.
  - Price strike-through with prominent bold rescue price and action button.

### B. Listing Details (`/listing/[id]`)
- Sticky top navigation with back & share actions.
- Large hero visual with category & discount overlays.
- Merchant profile card with rating, address, and Google Maps direction link.
- Bento grid cards for Pickup Window, Allergen Information, and Hygiene Guarantee.
- Sticky bottom action bar with quantity stepper and CTA.

### C. 60-Second Instant Undo Window (`/undo/[id]`)
- Central radial progress ring (`<svg>`) with SVG stroke countdown and bold digital display.
- Clear cancellation policy note and instant 100% Rescue Credit refund reassurance.
- Two distinct actions: "Batalkan Pesanan" (Destructive) and "Buka Tiket QR Sekarang" (Outline).

### D. Active Rescue Voucher (`/voucher/[id]`)
- Live 4-step progress tracker (Dibayar -> Dikonfirmasi -> Siap Ambil -> Selesai).
- Dynamic rotating QR matrix with 30s token refresh progress indicator.
- 1-click copy button for order number.
- Merchant location card with direct Google Maps route link.
- Clear, concise pickup deadline guidance.

### E. Impact & Achievement Dashboard (`/impact`)
- Food Hero level header with user avatar and share action.
- Bento KPI grid (Portions Saved, CO2e Avoided in kg, Rupiah Saved).
- Environmental conversion cards (Tree absorption equivalent, landfill methane prevention).
- Earned Badges carousel and milestone progress indicators.
