"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Heart,
  Info,
  MapPin,
  Minus,
  PackageOpen,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  discountPercent,
  formatDistance,
  formatRupiah,
  formatTime,
  formatTimeRemaining,
} from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";
import type { Listing } from "@/types";

const FALLBACK_LISTING: Listing = {
  id: "lst-001",
  merchantId: "mer-01",
  title: "Mystery Box Pastry & Viennoiserie",
  description: "Paket misteri aneka croissant, pain au chocolat, dan pastry segar hari ini.",
  category: "MYSTERY_BOX",
  originalPrice: 55000,
  discountedPrice: 22000,
  quantityTotal: 6,
  quantityRemaining: 4,
  pickupStart: new Date(Date.now() + 3600000).toISOString(),
  pickupEnd: new Date(Date.now() + 10800000).toISOString(),
  status: "ACTIVE",
  allergens: ["Gluten", "Dairy", "Eggs"],
  photoUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800",
  merchant: {
    storeName: "Artisan Bakery & Cafe",
    address: "Jl. Raya Darmo Permai No. 45, Surabaya",
    location: { lat: -7.2856, lng: 112.6954 },
    avgRating: 4.9,
    isVerified: true,
  },
  aiSuggestedPrice: null,
  createdAt: "2026-08-29T10:00:00Z",
};

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState<Listing>(FALLBACK_LISTING);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    let isMounted = true;
    consumerApi.getListingById(id).then((data) => {
      if (isMounted && data) {
        setListing(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const discount = discountPercent(listing.originalPrice, listing.discountedPrice);
  const timeRemaining = formatTimeRemaining(new Date(listing.pickupEnd));
  const pickupStartTime = formatTime(new Date(listing.pickupStart));
  const pickupEndTime = formatTime(new Date(listing.pickupEnd));
  const totalPrice = listing.discountedPrice * quantity;
  const isSoldOut = listing.quantityRemaining <= 0;

  const handleIncrement = () => {
    if (quantity < listing.quantityRemaining) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleCheckout = () => {
    router.push(`/checkout/${listing.id}?qty=${quantity}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      {/* Hero Visual Area with Floating Nav */}
      <div className="relative aspect-16/11 w-full bg-black/90">
        <Image
          src={listing.photoUrl}
          alt={listing.title}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 448px"
          className="object-cover"
        />

        {/* Floating Navigation Controls */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md shadow-xs hover:bg-black/70 transition"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLiked(!isLiked)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md shadow-xs hover:bg-black/70 transition"
              aria-label="Favoritkan"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isLiked ? "fill-destructive text-destructive" : "text-white"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: listing.title,
                    text: `${listing.title} diskon ${discount}% di FOODRESCUE!`,
                    url: window.location.href,
                  });
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md shadow-xs hover:bg-black/70 transition"
              aria-label="Bagikan"
            >
              <Share2 className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Badges on Image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
          {listing.category === "MYSTERY_BOX" ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#F59E0B] px-2.5 py-1 text-[11px] font-black text-[#78350F] shadow-xs">
              <PackageOpen className="h-3.5 w-3.5" />
              Mystery Box
            </span>
          ) : <div />}

          <span className="inline-flex items-center rounded-lg bg-[#E85D04] px-2.5 py-1 text-xs font-black text-white shadow-xs tabular-nums">
            Hemat {discount}%
          </span>
        </div>
      </div>

      {/* Main Details Canvas */}
      <div className="p-4 flex flex-col gap-3.5">
        {/* Title and Pricing */}
        <div>
          <h1 className="text-base sm:text-lg font-black leading-snug text-foreground">
            {listing.title}
          </h1>

          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-black text-foreground tabular-nums">
              {formatRupiah(listing.discountedPrice)}
            </span>
            <span className="text-xs font-bold text-muted-foreground line-through tabular-nums">
              {formatRupiah(listing.originalPrice)}
            </span>
            <span className="rounded-md bg-[#E85D04]/10 px-1.5 py-0.5 text-[10px] font-black text-[#E85D04]">
              -{discount}%
            </span>
          </div>
        </div>

        {/* Merchant Info Tile (from reference) */}
        <Card className="p-3.5 bg-card border-border shadow-2xs rounded-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h2 className="text-sm font-bold text-foreground">
                    {listing.merchant.storeName}
                  </h2>
                  {listing.merchant.isVerified && (
                    <ShieldCheck className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5 font-bold text-[#D97706]">
                    <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                    {listing.merchant.avgRating.toFixed(1)}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-700">
                    {listing.distanceMeters ? formatDistance(listing.distanceMeters) : "450 m"}
                  </span>
                </div>
              </div>
            </div>

            <a
              href={
                listing.merchant.mapsUrl
                  ? listing.merchant.mapsUrl
                  : listing.merchant.location?.lat && listing.merchant.location?.lng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${listing.merchant.location.lat},${listing.merchant.location.lng}`
                  : `https://maps.google.com/?q=${encodeURIComponent(listing.merchant.address)}`
              }
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-primary hover:underline shrink-0 flex items-center gap-1"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Petunjuk Arah</span>
            </a>
          </div>
        </Card>

        {/* Mystery Box Info Note (if applicable) */}
        {listing.category === "MYSTERY_BOX" && (
          <div className="rounded-2xl border border-[#FCD34D] bg-[#FEF3C7]/80 p-3.5 text-xs text-[#78350F] flex items-start gap-2.5">
            <Info className="h-4 w-4 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm">Apa itu Mystery Box?</p>
              <p className="mt-0.5 text-xs text-[#92400E] leading-relaxed">
                Menu kejutan dari batch harian gerai. Dijamin higienis dan bernilai lebih tinggi dari harga yang dibayar.
              </p>
            </div>
          </div>
        )}

        {/* Description Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Deskripsi Menu
          </h2>
          <p className="text-xs text-foreground/90 leading-relaxed">
            {listing.description}
          </p>
        </div>

        {/* Bento Grid: Pickup Window & Allergen Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pickup Window */}
          <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-1">
              <Clock className="h-4 w-4" />
              <span>Jadwal Pengambilan</span>
            </div>
            <p className="text-sm font-black text-foreground">
              {pickupStartTime} - {pickupEndTime} WIB
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block" suppressHydrationWarning>
              Sisa waktu {timeRemaining}
            </span>
          </div>

          {/* Allergen Info */}
          <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">
              <AlertTriangle className="h-4 w-4 text-[#D97706]" />
              <span>Informasi Alergen</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {listing.allergens && listing.allergens.length > 0 ? (
                listing.allergens.map((al) => (
                  <span
                    key={al}
                    className="rounded-md bg-[#F3EFE6] px-2 py-0.5 text-[11px] font-semibold text-foreground"
                  >
                    {al}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Bebas alergen umum</span>
              )}
            </div>
          </div>
        </div>

        {/* Hygiene Guarantee Banner */}
        <div className="rounded-2xl bg-[#F3EFE6] p-3 text-xs text-foreground flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium">Mitra terverifikasi standar higienitas FOODRESCUE. Dilindungi garansi Instant Undo 60 detik.</span>
        </div>
      </div>

      {/* Sticky Bottom Order Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-border bg-card/95 backdrop-blur-md p-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom,0.875rem))] shadow-xl">
        <div className="flex items-center justify-between gap-3">
          {/* Quantity Stepper */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-muted-foreground">
              Total ({quantity} porsi):
            </span>
            <span className="text-base font-black text-foreground tabular-nums">
              {formatRupiah(totalPrice)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Counter */}
            <div className="flex items-center rounded-xl border border-border bg-background p-1 shadow-2xs">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1 || isSoldOut}
                aria-label="Kurangi porsi"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-muted disabled:opacity-30 transition"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-foreground tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= listing.quantityRemaining || isSoldOut}
                aria-label="Tambah porsi"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-muted disabled:opacity-30 transition"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleCheckout}
              disabled={isSoldOut}
              className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-black shadow-md hover:bg-primary/90 text-sm"
            >
              {isSoldOut ? "Stok Habis" : "Pesan Sekarang"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
