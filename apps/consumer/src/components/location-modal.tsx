"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string;
  currentRadius: number;
  onSave: (address: string, radius: number) => void;
}

const RADIUS_OPTIONS = [1, 3, 5, 10, 15];

const SUGGESTED_LOCATIONS = [
  "Dekat Kampus ITS, Sukolilo",
  "Asrama Mahasiswa ITS & PENS",
  "Kertajaya Indah & Manyar",
  "Klampis Ngasem & Semolowaru",
  "Gubeng & Darmawangsa (Kampus UNAIR B)",
];

export function LocationModal({
  isOpen,
  onClose,
  currentAddress,
  currentRadius,
  onSave,
}: LocationModalProps) {
  const [address, setAddress] = useState(currentAddress);
  const [radius, setRadius] = useState(currentRadius);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleUseCurrentGPS = () => {
    setIsLocating(true);
    setStatusMessage(null);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsLocating(false);
          setAddress("Posisi GPS Anda Saat Ini (Akurasi Tinggi)");
          setStatusMessage({
            type: "success",
            text: "Koordinat GPS berhasil diperoleh.",
          });
        },
        () => {
          setIsLocating(false);
          setStatusMessage({
            type: "error",
            text: "Izin GPS tidak aktif. Silakan pilih lokasi kampus / jalan di bawah.",
          });
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      setStatusMessage({
        type: "error",
        text: "Browser Anda tidak mendukung geolokasi otomatis.",
      });
    }
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
              Pilih Radius Penyelamatan
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
            loading={isLocating}
            className="w-full justify-center gap-2 border-primary/30 text-primary hover:bg-accent font-semibold"
          >
            <LocateFixed className="h-4 w-4" />
            Gunakan Lokasi GPS Saya Saat Ini
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
          <div className="grid grid-cols-5 gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border py-2.5 text-xs font-bold transition-all",
                  radius === r
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
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setStatusMessage(null);
              }}
              placeholder="Contoh: Jl. Gebang Wetan atau Kampus ITS"
              aria-label="Cari alamat atau nama kampus"
              className="pl-9"
            />
          </div>
        </div>

        {/* Suggested Quick Picks */}
        <div className="mt-3">
          <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Rekomendasi Area Sekitar:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  setAddress(loc);
                  setStatusMessage(null);
                }}
                className="rounded-lg border border-border/70 bg-muted/60 px-2.5 py-1 text-[11px] text-foreground hover:border-primary hover:text-primary transition"
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Apply CTA */}
        <div className="mt-5 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button
            onClick={() => onSave(address, radius)}
            className="flex-1 bg-primary text-primary-foreground font-semibold"
          >
            Terapkan Lokasi
          </Button>
        </div>
      </div>
    </div>
  );
}
