"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ChevronRight,
  Coffee,
  Compass,
  Flame,
  LayoutGrid,
  Leaf,
  Map as MapIcon,
  PackageOpen,
  Search,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  Wheat,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { ListingCard, ListingCardSkeleton } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";
import type { Listing, ListingCategory } from "@/types";

type SortOption = "distance" | "discount" | "deadline" | "price";

const CATEGORIES = [
  { id: "all", label: "Semua", icon: Compass },
  { id: "mystery", label: "Mystery Box", category: "MYSTERY_BOX" as ListingCategory, icon: PackageOpen, highlight: true },
  { id: "bakery", label: "Bakery", icon: Wheat },
  { id: "cafe", label: "Cafe & Kopi", icon: Coffee },
  { id: "regular", label: "Makanan Siap Santap", category: "REGULAR" as ListingCategory, icon: UtensilsCrossed },
];

export default function FeedPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Fetch real-time listings from API
  useEffect(() => {
    let isMounted = true;
    const fetchFeed = async () => {
      setIsLoading(true);
      try {
        const data = await consumerApi.getListings({
          lat: -7.2856,
          lng: 112.6954,
          radius: 10,
          category: selectedCategory === "mystery" ? "MYSTERY_BOX" : selectedCategory === "regular" ? "REGULAR" : undefined,
        });
        if (isMounted && data && Array.isArray(data)) {
          setListings(data);
        }
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchFeed();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  // Filtering logic
  const filteredListings = listings.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchMerchant = item.merchant.storeName.toLowerCase().includes(q);
      if (!matchTitle && !matchMerchant) return false;
    }

    if (selectedCategory === "mystery") return item.category === "MYSTERY_BOX";
    if (selectedCategory === "regular") return item.category === "REGULAR";
    if (selectedCategory === "bakery") return item.title.toLowerCase().includes("croissant") || item.title.toLowerCase().includes("pastry") || item.title.toLowerCase().includes("roti");
    if (selectedCategory === "cafe") return item.merchant.storeName.toLowerCase().includes("kopi") || item.merchant.storeName.toLowerCase().includes("cafe");

    return true;
  }).sort((a, b) => {
    if (sortBy === "distance") return (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0);
    if (sortBy === "discount") {
      const discA = (a.originalPrice - a.discountedPrice) / a.originalPrice;
      const discB = (b.originalPrice - b.discountedPrice) / b.originalPrice;
      return discB - discA;
    }
    if (sortBy === "price") return a.discountedPrice - b.discountedPrice;
    if (sortBy === "deadline") {
      return new Date(a.pickupEnd).getTime() - new Date(b.pickupEnd).getTime();
    }
    return 0;
  });

  return (
    <div className="flex flex-col flex-1 pb-8">
      {/* Top Header */}
      <TopHeader />

      {/* Rescue Credit Wallet Quick Strip (Above Hero) */}
      <div className="px-4 mt-3">
        <Link href="/wallet" className="block group focus:outline-hidden">
          <div className="flex items-center justify-between rounded-2xl bg-card border border-border px-3.5 py-2.5 shadow-2xs hover:border-primary/40 transition">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Rescue Credit
                </span>
                <span className="text-xs font-black text-foreground tabular-nums">
                  {formatRupiah(45000)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-primary group-hover:underline">
              <span>Buka Dompet</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Link>
      </div>

      {/* Hero Banner (Clean & Direct) */}
      <div className="px-4 mt-2.5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E4620] via-[#2D6A4F] to-[#1B3815] py-3.5 px-4 text-white shadow-xs">
          <div className="relative z-10">
            <h1 className="text-sm font-black leading-snug text-white">
              Selamatkan porsi makanan lezat hari ini
            </h1>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Diskon hingga 70% dari gerai kuliner di sekitarmu
            </p>
          </div>

          {/* Subtle background glow */}
          <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-[#65A30D]/20 blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Search Input & View Switcher */}
      <div className="px-4 mt-3.5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari makanan atau nama gerai..."
            aria-label="Cari makanan surplus terdekat"
            className="pl-9 h-10 rounded-xl bg-card border-border text-xs shadow-2xs"
          />
        </div>

        {/* List / Map Switcher */}
        <div className="flex rounded-xl border border-border bg-card p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label="Tampilan Daftar"
            className={`p-1.5 rounded-lg transition ${
              viewMode === "list"
                ? "bg-primary text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            aria-label="Tampilan Peta"
            className={`p-1.5 rounded-lg transition ${
              viewMode === "map"
                ? "bg-primary text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category Roundels Section */}
      <div className="mt-3.5 px-4">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Kategori Makanan
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-center gap-1 shrink-0 group focus:outline-hidden w-16 text-center"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-sm ring-2 ring-primary/30"
                      : cat.highlight
                      ? "bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D] hover:scale-105"
                      : "bg-card border border-border text-foreground group-hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-[10px] leading-tight font-semibold tracking-tight break-words text-center line-clamp-2 w-full ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort & Count Bar */}
      <div className="px-4 mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Penyelamatan Terdekat ({filteredListings.length})
        </h2>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="distance">Jarak Terdekat</option>
            <option value="discount">Diskon Tertinggi</option>
            <option value="deadline">Batas Waktu</option>
            <option value="price">Harga Termurah</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "list" ? (
        <div className="px-4 mt-2.5 flex flex-col gap-2.5">
          {isLoading ? (
            <>
              <ListingCardSkeleton />
              <ListingCardSkeleton />
              <ListingCardSkeleton />
            </>
          ) : filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          ) : (
            <div className="my-8 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary mb-3">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                Tidak ada makanan dalam kategori ini
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
                Coba ubah kata kunci atau pilih kategori lain.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 rounded-xl text-xs font-semibold"
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Map View */
        <div className="mx-4 mt-2.5 overflow-hidden rounded-2xl border border-border bg-[#F3EFE6] relative h-[420px]">
          <div className="absolute inset-0 bg-[#F3EFE6] flex items-center justify-center">
            {/* User GPS Center */}
            <div className="relative flex items-center justify-center">
              <div className="absolute h-28 w-28 rounded-full bg-[#2D6A4F]/15 animate-ping" />
              <div className="absolute h-18 w-18 rounded-full bg-[#2D6A4F]/25" />
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold shadow-md border-2 border-white">
                <Compass className="h-4 w-4" />
              </div>
            </div>

            {/* Merchant Location Markers */}
            {filteredListings.map((l, idx) => {
              const offsets = [
                { top: "24%", left: "30%" },
                { top: "62%", left: "64%" },
                { top: "28%", left: "70%" },
                { top: "72%", left: "28%" },
              ];
              const pos = offsets[idx % offsets.length];

              return (
                <Link
                  key={l.id}
                  href={`/listing/${l.id}`}
                  style={{ top: pos.top, left: pos.left }}
                  className="absolute flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-extrabold text-foreground shadow-md border border-border hover:border-primary transition group"
                >
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[#E85D04] font-black tabular-nums">-{Math.round(((l.originalPrice - l.discountedPrice) / l.originalPrice) * 100)}%</span>
                  <span className="max-w-[70px] truncate text-[10px] text-muted-foreground">{l.merchant.storeName}</span>
                </Link>
              );
            })}
          </div>

          <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-card/95 backdrop-blur-md p-2.5 text-xs shadow-lg border border-border flex items-center justify-between">
            <span className="font-semibold text-foreground">Menampilkan {filteredListings.length} gerai terdekat</span>
            <Button size="sm" variant="outline" onClick={() => setViewMode("list")} className="h-7 text-xs font-bold rounded-lg">
              Buka Daftar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
