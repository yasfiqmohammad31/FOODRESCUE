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

/**
 * Ekstraksi koordinat Latitude dan Longitude dari berbagai format link/URL Google Maps
 * Mendukung format:
 * - URL lengkap: https://www.google.com/maps/place/.../@-7.285612,112.695412,17z/...
 * - Query URL: https://maps.google.com/?q=-7.285612,112.695412
 * - Embed Data URL: ...!3d-7.285612!4d112.695412...
 * - String koordinat mentah: "-7.285612, 112.695412"
 */
export function extractCoordinatesFromMapsUrl(urlOrText: string): { lat: number; lng: number } | null {
  if (!urlOrText || typeof urlOrText !== "string") return null;
  const text = urlOrText.trim();

  // 1. Format @lat,lng e.g. /@ -7.285612,112.695412,17z
  const atMatch = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 2. Format query parameter q=lat,lng / query=lat,lng / ll=lat,lng / destination=lat,lng
  const paramMatch = text.match(/[?&](?:q|query|ll|destination|daddr)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (paramMatch) {
    const lat = parseFloat(paramMatch[1]);
    const lng = parseFloat(paramMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 3. Format string koordinat mentah e.g. "-7.285612, 112.695412"
  const rawMatch = text.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 4. Format data parameter !3dlat!4dlng
  const dataMatch = text.match(/!3d(-?\d+(?:\.\d+)?)[^!]*!4d(-?\d+(?:\.\d+)?)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lng = parseFloat(dataMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  return null;
}
