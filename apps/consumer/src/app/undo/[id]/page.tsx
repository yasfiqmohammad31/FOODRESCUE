"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";

interface UndoPageProps {
  params: Promise<{ id: string }>;
}

export default function UndoPage({ params }: UndoPageProps) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const listingId = searchParams.get("listingId") || "lst-001";
  const quantity = parseInt(searchParams.get("qty") || "1", 10);
  const price = parseInt(searchParams.get("price") || "22000", 10);
  const listingTitle = "Mystery Box Pastry & Viennoiserie";

  const TOTAL_SECONDS = 60;
  const [deadline] = useState(() => Date.now() + TOTAL_SECONDS * 1000);
  const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_SECONDS);
  const [isUndone, setIsUndone] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessingUndo, setIsProcessingUndo] = useState(false);

  // 60-second countdown timer with background tab reconciliation
  useEffect(() => {
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        router.push(`/voucher/${orderId}`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateRemaining();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [deadline, router, orderId]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCancelModal) {
        setShowCancelModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCancelModal]);

  // Handle user requesting undo
  const handleConfirmCancel = async () => {
    setIsProcessingUndo(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }

    try {
      await consumerApi.undoOrder(orderId);
    } catch (e) {
      console.warn("Undo fallback:", e);
    } finally {
      setIsProcessingUndo(false);
      setShowCancelModal(false);
      setIsUndone(true);
    }
  };

  // Progress percentage (60s -> 0s)
  const progressPercent = ((TOTAL_SECONDS - secondsRemaining) / TOTAL_SECONDS) * 100;
  const strokeDashoffset = 339.292 - (339.292 * (TOTAL_SECONDS - secondsRemaining)) / TOTAL_SECONDS;

  if (isUndone) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-primary mb-4 shadow-inner">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="text-xl font-black text-foreground">
          Pesanan Dibatalkan
        </h1>

        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
          Dana <strong className="text-foreground">{formatRupiah(price)}</strong> telah dikembalikan ke saldo <strong>Rescue Credit</strong>.
        </p>

        {/* Rescue Credit Balance Card */}
        <Card className="mt-6 w-full max-w-xs p-3.5 bg-[#F3EFE6] border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Saldo Rescue Credit</span>
            </div>
            <span className="text-sm font-black text-primary tabular-nums">
              {formatRupiah(35000 + price)}
            </span>
          </div>
        </Card>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5">
          <Button
            onClick={() => router.push("/feed")}
            className="w-full bg-primary text-primary-foreground font-bold h-11 rounded-xl text-xs"
          >
            Kembali ke Menu
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/wallet")}
            className="w-full h-11 rounded-xl font-semibold text-muted-foreground text-xs"
          >
            Lihat Saldo Dompet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-background p-5">
      {/* Top Header Section from Reference */}
      <div className="flex flex-col items-center text-center mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E85D04]/10 border border-[#E85D04]/20 px-3 py-1 text-xs font-black text-[#E85D04]">
          <ShieldCheck className="h-4 w-4 text-[#E85D04]" />
          Instant Undo 60s
        </span>

        <h1 className="mt-3 text-xl font-black text-foreground">
          Order Secured!
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground max-w-xs">
          Menyiapkan voucher penyelamatanmu. Kamu dapat membatalkannya kapan saja selama timer berjalan.
        </p>
      </div>

      {/* Center 60s Countdown Radial Dial from Reference */}
      <div
        role="timer"
        aria-live="polite"
        aria-label={`Sisa waktu pembatalan ${secondsRemaining} detik`}
        className="my-6 flex flex-col items-center justify-center"
      >
        <div className="relative flex h-60 w-60 items-center justify-center">
          {/* Radial SVG Dial */}
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 120 120" aria-hidden="true">
            {/* Background Track */}
            <circle
              cx="60"
              cy="60"
              r="54"
              className="stroke-[#E7E0D3]"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="60"
              cy="60"
              r="54"
              className="stroke-[#E85D04] transition-all duration-1000 ease-linear"
              strokeWidth="7"
              strokeDasharray="339.292"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Digital Countdown */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-foreground tabular-nums tracking-tight">
              {secondsRemaining}s
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
              Sisa Waktu
            </span>
          </div>
        </div>

        {/* Order Summary Tile */}
        <Card className="mt-5 w-full max-w-xs p-3.5 bg-card border-border shadow-2xs rounded-2xl">
          <div className="flex items-center justify-between text-xs">
            <div className="flex flex-col text-left">
              <span className="font-bold text-foreground line-clamp-1">{listingTitle}</span>
              <span className="text-[11px] text-muted-foreground">Artisan Bakery & Cafe ({quantity} porsi)</span>
            </div>
            <span className="font-black text-foreground shrink-0 ml-2 tabular-nums">{formatRupiah(price)}</span>
          </div>
        </Card>
      </div>

      {/* Bottom Action Area */}
      <div className="flex flex-col gap-2.5 pb-2">
        {/* Cancel Button */}
        <Button
          onClick={() => setShowCancelModal(true)}
          className="w-full h-12 rounded-xl bg-[#E85D04] hover:bg-[#E85D04]/90 text-white text-xs font-black shadow-sm gap-2 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Batalkan Pesanan (Refund Instan)</span>
        </Button>

        {/* Skip Wait Button */}
        <Button
          variant="outline"
          onClick={() => router.push(`/voucher/${orderId}`)}
          className="w-full h-11 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
        >
          <span>Buka Tiket QR Sekarang</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Confirmation Modal */}
      {showCancelModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-xs rounded-2xl bg-card p-5 shadow-2xl border border-border">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E85D04]/15 text-[#E85D04] mb-3 mx-auto">
              <ShieldAlert className="h-5 w-5" />
            </div>

            <h3 id="cancel-modal-title" className="text-center text-sm font-black text-foreground">
              Batalkan Pesanan?
            </h3>

            <p className="mt-1 text-center text-xs text-muted-foreground leading-relaxed">
              Dana <strong className="text-foreground">{formatRupiah(price)}</strong> akan langsung dikembalikan 100% ke saldo <strong>Rescue Credit</strong>.
            </p>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={isProcessingUndo}
                className="flex-1 text-xs font-semibold h-9 rounded-xl"
              >
                Kembali
              </Button>

              <Button
                onClick={handleConfirmCancel}
                loading={isProcessingUndo}
                className="flex-1 text-xs font-bold h-9 rounded-xl bg-[#E85D04] hover:bg-[#E85D04]/90 text-white"
              >
                Ya, Batalkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
