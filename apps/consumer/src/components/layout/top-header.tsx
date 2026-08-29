"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, ChevronDown, MapPin, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { LocationModal } from "@/components/location-modal";

interface TopHeaderProps {
  currentAddress?: string;
  radiusKm?: number;
}

export function TopHeader({
  currentAddress = "Dekat Kampus ITS, Sukolilo",
  radiusKm = 5,
}: TopHeaderProps) {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(radiusKm);
  const [address, setAddress] = useState(currentAddress);

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-col border-b border-border/80 bg-background/90 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Geo Location Selector */}
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span className="flex h-2 w-2 rounded-full bg-[#65A30D] animate-pulse" />
              <span>Lokasi Penyelamatan</span>
            </div>

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="group flex items-center gap-1 text-left text-sm font-black text-foreground transition hover:text-primary mt-0.5"
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate max-w-[200px]">{address}</span>
              <span className="shrink-0 rounded-full bg-[#F3EFE6] px-2 py-0.5 text-[10px] font-bold text-foreground">
                {selectedRadius} km
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-transform" />
            </button>
          </div>

          {/* Quick Actions: Notification */}
          <div className="flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Link href="/notifications" aria-label="Lihat Notifikasi">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#E85D04]" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentAddress={address}
        currentRadius={selectedRadius}
        onSave={(newAddress, newRadius) => {
          setAddress(newAddress);
          setSelectedRadius(newRadius);
          setIsLocationModalOpen(false);
        }}
      />
    </>
  );
}
