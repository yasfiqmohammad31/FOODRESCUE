import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Rupiah.
 * `formatRupiah(25000)` → "Rp25.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Hitung persentase diskon.
 * `discountPercent(50000, 25000)` → 50
 */
export function discountPercent(original: number, discounted: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - discounted) / original) * 100);
}

/**
 * Format jarak dalam meter ke teks yang mudah dibaca.
 * `formatDistance(350)` → "350 m"
 * `formatDistance(1500)` → "1,5 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

/**
 * Format waktu relatif ke teks pendek.
 * `formatTimeRemaining(new Date(Date.now() + 3600000))` → "1 jam lagi"
 */
export function formatTimeRemaining(deadline: Date): string {
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) return "Sudah lewat";

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (diffHours > 0 && remainingMinutes > 0) {
    return `${diffHours} jam ${remainingMinutes} menit lagi`;
  }
  if (diffHours > 0) {
    return `${diffHours} jam lagi`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes} menit lagi`;
  }
  return "Kurang dari 1 menit";
}

/**
 * Format tanggal ke format Indonesia: "29 Agu 2026, 14:30"
 */
export function formatDatetime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

/**
 * Format waktu saja: "14:30"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

/**
 * Buat inisial dari nama.
 * `getInitials("Nasi Goreng Spesial")` → "NG"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * Pluralisasi sederhana untuk bahasa Indonesia.
 */
export function pluralize(count: number, singular: string): string {
  return `${count} ${singular}`;
}
