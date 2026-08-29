"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Compass,
  Layers,
  MapPin,
  Navigation,
  Sparkles,
  Star,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistance, formatRupiah } from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";
import type { Listing } from "@/types";

const FALLBACK_PIN: Listing = {
  id: "lst-001",
  merchantId: "mer-01",
  title: "Mystery Box Pastry & Viennoiserie",
  description: "Paket misteri aneka croissant segar.",
  category: "MYSTERY_BOX",
  originalPrice: 55000,
  discountedPrice: 22000,
  quantityTotal: 6,
  quantityRemaining: 4,
  pickupStart: "19:00",
  pickupEnd: "21:30",
  status: "ACTIVE",
  allergens: [],
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

export default function MapPage() {
  const [listings, setListings] = useState<Listing[]>([FALLBACK_PIN]);
  const [selectedListing, setSelectedListing] = useState<Listing>(FALLBACK_PIN);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    consumerApi.getListings({ lat: -7.2856, lng: 112.6954, radius: 10 }).then((data) => {
      if (isMounted && data && Array.isArray(data) && data.length > 0) {
        setListings(data);
        setSelectedListing(data[0]);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefreshGPS = () => {
    setToastMessage("Koordinat GPS terkini diperbarui!");
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  return (
    <div className="relative flex flex-col flex-1 h-[calc(100vh-4rem)] overflow-hidden bg-stone-200">
      {/* Top Floating Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 rounded-2xl bg-card/95 backdrop-blur-md px-3.5 py-2.5 shadow-lg border border-border flex-1">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate text-xs font-bold text-foreground">
            Radius 5 km: Sukolilo, Surabaya
          </span>
        </div>

        <button
          type="button"
          onClick={handleRefreshGPS}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card border border-border shadow-lg text-primary hover:bg-muted transition shrink-0"
          aria-label="Perbarui posisi GPS saya"
        >
          <Navigation className="h-4 w-4 fill-primary" />
        </button>
      </div>

      {/* Floating GPS Feedback Toast */}
      {toastMessage && (
        <div className="absolute top-18 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-[#1C1917] text-white border border-white/20 px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 whitespace-nowrap">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-white">{toastMessage}</span>
        </div>
      )}

      {/* Simulated Map Canvas */}
      <div className="relative h-full w-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] bg-stone-100 flex items-center justify-center">
        {/* User GPS Center */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-36 w-36 rounded-full bg-emerald-500/10 animate-ping" />
          <div className="absolute h-24 w-24 rounded-full bg-emerald-500/20" />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold shadow-xl border-2 border-white">
            <Compass className="h-4 w-4" />
          </div>
        </div>

        {/* Merchant Location Markers */}
        {listings.map((listing, index) => {
          const positions = [
            { top: "25%", left: "30%" },
            { top: "68%", left: "68%" },
            { top: "32%", left: "75%" },
            { top: "62%", left: "22%" },
          ];
          const pos = positions[index % positions.length];
          const isSelected = selectedListing.id === listing.id;

          return (
            <button
              key={listing.id}
              type="button"
              onClick={() => setSelectedListing(listing)}
              style={{ top: pos.top, left: pos.left }}
              className={`absolute flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black shadow-lg transition-all duration-200 transform -translate-x-1/2 -translate-y-1/2 ${
                isSelected
                  ? "bg-primary text-white scale-110 ring-4 ring-primary/30 z-10"
                  : "bg-card text-foreground border border-border hover:scale-105 z-0"
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>{formatRupiah(listing.discountedPrice)}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Floating Active Merchant Card */}
      {selectedListing && (
        <div className="absolute bottom-4 left-4 right-4 z-20 animate-in slide-in-from-bottom-5 duration-200">
          <Card className="p-3.5 bg-card/95 backdrop-blur-md border-border shadow-xl rounded-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {selectedListing.merchant.storeName}
                </span>
                <h3 className="text-xs font-bold text-foreground leading-snug line-clamp-1">
                  {selectedListing.title}
                </h3>

                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <span className="font-extrabold text-foreground tabular-nums">
                    {formatRupiah(selectedListing.discountedPrice)}
                  </span>
                  <span className="text-muted-foreground line-through text-[11px] tabular-nums">
                    {formatRupiah(selectedListing.originalPrice)}
                  </span>
                  <span className="font-semibold text-primary text-[11px]">
                    {selectedListing.distanceMeters ? formatDistance(selectedListing.distanceMeters) : "450 m"}
                  </span>
                </div>
              </div>

              <Button asChild size="sm" className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-bold shadow-xs">
                <Link href={`/listing/${selectedListing.id}`}>
                  Lihat Detail
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
