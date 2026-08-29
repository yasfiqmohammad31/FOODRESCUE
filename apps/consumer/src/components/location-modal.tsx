"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PRESET_HUBS, useGeoLocation } from "@/contexts/geo-context";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RADIUS_OPTIONS = [1, 3, 5, 10, 15, 25];

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const {
    address: currentAddress,
    radiusKm: currentRadius,
    lat,
    lng,
    isLocating,
    requestCurrentGPS,
    setLocation,
    setRadius,
  } = useGeoLocation();

  const [addressInput, setAddressInput] = useState(currentAddress);
  const [selectedRadius, setSelectedRadius] = useState(currentRadius);
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number }>({ lat, lng });
  const [statusMessage, setStatusMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleUseCurrentGPS = async () => {
    setStatusMessage(null);
    const ok = await requestCurrentGPS();
    if (ok) {
      setStatusMessage({
        type: "success",
        text: "Koordinat GPS aktif berhasil diperoleh.",
      });
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setStatusMessage({
        type: "error",
        text: "Izin GPS tidak aktif / tidak tersedia. Silakan pilih hub kampus di bawah.",
      });
    }
  };

  const handleSelectPreset = (hub: (typeof PRESET_HUBS)[0]) => {
    setAddressInput(hub.name);
    setTempCoords({ lat: hub.lat, lng: hub.lng });
    setStatusMessage({
      type: "success",
      text: `Area diubah ke ${hub.name}`,
    });
  };

  const handleApply = () => {
    setLocation(addressInput, tempCoords.lat, tempCoords.lng);
    setRadius(selectedRadius);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 id="location-modal-title" className="text-base font-bold text-foreground">
              Pilih Radius & Lokasi Penyelamatan
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* GPS Button */}
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentGPS}
            disabled={isLocating}
            className="w-full justify-center gap-2 border-primary/30 text-primary hover:bg-primary/5 font-bold h-11 rounded-xl"
          >
            <LocateFixed className={cn("h-4 w-4", isLocating && "animate-spin text-primary")} />
            <span>{isLocating ? "Mencari Sinyal GPS..." : "Gunakan Lokasi GPS Saya Saat Ini"}</span>
          </Button>

          {/* Inline Status Message Banner */}
          {statusMessage && (
            <div
              className={`mt-2.5 flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium ${
                statusMessage.type === "error"
                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-900"
                  : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-900"
              }`}
            >
              {statusMessage.type === "error" ? (
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Radius Selector */}
        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Maksimal Jarak Pengambilan (Radius)
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRadius(r)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border py-2.5 text-xs font-bold transition-all",
                  selectedRadius === r
                    ? "border-primary bg-primary text-primary-foreground shadow-sm scale-102"
                    : "border-border bg-card text-foreground hover:bg-accent hover:border-primary/40"
                )}
              >
                <span>{r} km</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Address Input */}
        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Cari Lokasi / Kampus / Kos
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value);
                setStatusMessage(null);
              }}
              placeholder="Contoh: Jl. Gebang Wetan atau Kampus ITS"
              aria-label="Cari alamat atau nama kampus"
              className="pl-9 h-10 rounded-xl"
            />
          </div>
        </div>

        {/* Suggested Quick Picks */}
        <div className="mt-3">
          <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Pusat Kampus & Kota Terdekat:</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_HUBS.map((hub) => (
              <button
                key={hub.name}
                type="button"
                onClick={() => handleSelectPreset(hub)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[11px] transition font-medium",
                  addressInput === hub.name
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/70 bg-muted/60 text-foreground hover:border-primary hover:text-primary"
                )}
              >
                {hub.name}
              </button>
            ))}
          </div>
        </div>

        {/* Apply CTA */}
        <div className="mt-5 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
            Batal
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-primary text-primary-foreground font-bold rounded-xl"
          >
            Terapkan Lokasi
          </Button>
        </div>
      </div>
    </div>
  );
}
