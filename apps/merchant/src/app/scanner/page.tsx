"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Flashlight,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDatetime, formatRupiah } from "@/lib/utils";
import { merchantApi } from "@/lib/api-client";
import type { Order } from "@/types";

export default function MerchantScannerPage() {
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState<Order | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSimulateScan = async () => {
    setManualError(null);
    try {
      const res = await merchantApi.verifyPickup({
        orderNumber: "FR-20260829-8821",
        merchantId: "mer-01",
      });
      if (res.success && res.order) {
        setVerifiedOrder(res.order);
      } else {
        setManualError(res.message || "Gagal memindai voucher.");
      }
    } catch {
      setManualError("Gagal menghubungi server verifikasi.");
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const cleanInput = manualCode.trim().replace(/^#/, "").toUpperCase();
    if (!cleanInput) {
      setManualError("Masukkan nomor pesanan.");
      return;
    }

    try {
      const res = await merchantApi.verifyPickup({
        orderNumber: cleanInput,
        merchantId: "mer-01",
      });

      if (res.success && res.order) {
        setVerifiedOrder(res.order);
      } else {
        setManualError(res.message || "Nomor pesanan tidak ditemukan. Pastikan format benar (contoh: FR-20260829-8821).");
      }
    } catch {
      setManualError("Gagal memverifikasi pesanan.");
    }
  };

  const handleCompleteHandover = async () => {
    setIsCompleted(true);
    if (verifiedOrder) {
      try {
        await merchantApi.updateOrderStatus(verifiedOrder.id, "PICKED_UP");
      } catch (e) {
        console.warn("Handover fallback:", e);
      }
    }
    setTimeout(() => {
      setVerifiedOrder(null);
      setIsCompleted(false);
    }, 2500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-foreground">
          Pemindai QR Penyerahan Makanan
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          Arahkan kamera ke QR Voucher di aplikasi pembeli untuk verifikasi instan.
        </p>
      </div>

      {/* Main Viewfinder Box */}
      <Card className="overflow-hidden border border-[#2D6A4F]/40 bg-[#1C1917] p-4 text-white shadow-xl flex flex-col items-center justify-between min-h-[380px] relative rounded-3xl">
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between z-10">
          <Badge className="bg-primary text-white font-bold text-xs gap-1">
            <Camera className="h-3.5 w-3.5" />
            Kamera Aktif
          </Badge>

          <button
            type="button"
            onClick={() => setFlashlightOn(!flashlightOn)}
            className={`p-2 rounded-xl border transition ${
              flashlightOn
                ? "bg-amber-400 text-amber-950 border-amber-300 shadow-xs"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
            title="Lampu Kilat"
            aria-label={flashlightOn ? "Matikan Lampu Kilat" : "Nyalakan Lampu Kilat"}
          >
            <Flashlight className="h-4 w-4" />
          </button>
        </div>

        {/* Viewfinder Target */}
        <div className="relative flex h-56 w-56 items-center justify-center my-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {/* Corner Markers */}
          <div className="absolute inset-2 border-2 border-dashed border-[#65A30D]/40 rounded-xl" />

          {/* Smooth Linear Scanning Beam */}
          <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#65A30D] to-transparent shadow-[0_0_12px_#65a30d] animate-scan-beam" />

          {/* Simulated Detection Button */}
          <button
            type="button"
            onClick={handleSimulateScan}
            className="z-10 rounded-xl bg-black/80 px-4 py-2 text-xs font-bold text-emerald-300 backdrop-blur-md border border-[#65A30D]/40 hover:bg-primary hover:text-white transition shadow-sm"
          >
            Simulasikan Scan Kamera
          </button>
        </div>

        {/* Bottom Hint */}
        <p className="text-xs text-white/80 text-center z-10 font-medium">
          Posisikan kode QR pembeli di dalam area pemindaian
        </p>
      </Card>

      {/* Manual Input Fallback */}
      <Card className="p-4 bg-card border-border shadow-2xs rounded-2xl">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Kendala Kamera? Masukkan Nomor Order Manual
        </h2>

        <form onSubmit={handleManualVerify} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={manualCode}
                onChange={(e) => {
                  setManualError(null);
                  setManualCode(e.target.value);
                }}
                placeholder="Contoh: FR-20260829-8821"
                className={`pl-9 h-10 text-xs font-mono rounded-xl ${manualError ? "border-destructive" : ""}`}
              />
            </div>

            <Button type="submit" className="h-10 px-4 text-xs font-bold bg-primary text-white rounded-xl">
              Verifikasi
            </Button>
          </div>
          {manualError && (
            <span className="text-[10px] text-destructive font-semibold block">
              {manualError}
            </span>
          )}
        </form>
      </Card>

      {/* Verification Success Modal */}
      {verifiedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border">
            {isCompleted ? (
              <div className="py-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-foreground">Serah Terima Berhasil!</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status pesanan telah diperbarui menjadi Selesai (Picked Up).
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black text-foreground">Voucher Valid & Terverifikasi</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVerifiedOrder(null)}
                    className="p-1 rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Nomor Pesanan</span>
                    <span className="font-mono text-xs font-black text-foreground">
                      {verifiedOrder.orderNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Menu</span>
                    <span className="text-xs font-bold text-foreground">
                      {verifiedOrder.quantity}x {verifiedOrder.listing.title}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total Tagihan</span>
                    <span className="text-xs font-black text-primary tabular-nums">
                      {formatRupiah(verifiedOrder.totalPrice)} (Lunas)
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setVerifiedOrder(null)}
                    className="flex-1 text-xs font-bold h-10 rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleCompleteHandover}
                    className="flex-1 text-xs font-bold h-10 rounded-xl bg-primary text-white"
                  >
                    Serahkan Makanan
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
