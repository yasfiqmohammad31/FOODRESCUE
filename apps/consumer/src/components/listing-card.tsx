"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, MapPin, PackageOpen, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { discountPercent, formatDistance, formatRupiah, formatTime, formatTimeRemaining } from "@/lib/utils";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const discount = discountPercent(listing.originalPrice, listing.discountedPrice);
  const timeRemaining = formatTimeRemaining(new Date(listing.pickupEnd));
  const pickupStart = formatTime(new Date(listing.pickupStart));
  const pickupEnd = formatTime(new Date(listing.pickupEnd));
  const isSoldOut = listing.quantityRemaining <= 0 || listing.status === "SOLD_OUT";

  return (
    <article className="group block focus:outline-hidden">
      <Link href={`/listing/${listing.id}`} className="block focus:outline-hidden">
        <Card className="overflow-hidden border border-border bg-card p-2.5 shadow-2xs transition-all duration-200 hover:shadow-sm hover:border-primary/40 active:scale-[0.99] rounded-2xl flex gap-3 items-center">
          {/* Compact Left Photo Container */}
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-muted">
            <Image
              src={listing.photoUrl}
              alt={listing.title}
              fill
              sizes="112px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Discount Badge */}
            <div className="absolute top-1.5 left-1.5">
              <span className="inline-flex items-center rounded-md bg-[#E85D04] px-1.5 py-0.5 text-[10px] font-black text-white shadow-2xs tabular-nums">
                -{discount}%
              </span>
            </div>

            {/* Mystery Box Badge */}
            {listing.category === "MYSTERY_BOX" && (
              <div className="absolute bottom-1.5 left-1.5 right-1.5">
                <span className="flex items-center justify-center gap-0.5 rounded-md bg-[#F59E0B] px-1.5 py-0.5 text-[9px] font-black text-[#78350F] shadow-2xs">
                  <PackageOpen className="h-2.5 w-2.5 shrink-0" />
                  <span>Mystery Box</span>
                </span>
              </div>
            )}

            {/* Sold Out Overlay */}
            {isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-2xs z-20">
                <span className="rounded bg-destructive px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                  Habis
                </span>
              </div>
            )}
          </div>

          {/* Right Info Section */}
          <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0 gap-1">
            {/* Merchant & Distance Row */}
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span
                className="font-bold text-muted-foreground truncate max-w-[120px]"
                title={listing.merchant.storeName}
              >
                {listing.merchant.storeName}
              </span>
              <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                <span className="flex items-center gap-0.5 font-bold text-[#D97706]">
                  <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                  <span className="tabular-nums">{listing.merchant.avgRating.toFixed(1)}</span>
                </span>
                <span>•</span>
                <span className="font-semibold text-primary tabular-nums">
                  {listing.distanceMeters ? formatDistance(listing.distanceMeters) : "500 m"}
                </span>
              </div>
            </div>

            {/* Product Title with Tooltip for Ellipsis */}
            <div>
              <h3
                className="text-xs sm:text-sm font-black leading-snug text-foreground line-clamp-1 group-hover:text-primary transition-colors"
                title={listing.title}
              >
                {listing.title}
              </h3>
            </div>

            {/* Pickup Schedule */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Ambil {pickupStart} - {pickupEnd} WIB</span>
            </div>

            {/* Price & Action Row */}
            <div className="mt-0.5 flex items-end justify-between gap-2 border-t border-border/60 pt-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs sm:text-sm font-black text-foreground tabular-nums">
                  {formatRupiah(listing.discountedPrice)}
                </span>
                <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                  {formatRupiah(listing.originalPrice)}
                </span>
              </div>

              <span className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-black shadow-2xs group-hover:bg-primary/90 transition-all shrink-0">
                <span>Rescue</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border bg-card p-2.5 shadow-2xs rounded-2xl flex gap-3 items-center">
      {/* Left Skeleton Image */}
      <Skeleton className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl" />

      {/* Right Skeleton Details */}
      <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0 gap-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-3.5 w-12 rounded-md" />
        </div>

        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-3.5 w-32 rounded-md" />

        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}
