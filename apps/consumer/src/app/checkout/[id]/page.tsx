"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Lock,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  discountPercent,
  formatRupiah,
  formatTime,
  formatTimeRemaining,
} from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";
import type { Listing, PaymentMethod } from "@/types";

const FALLBACK_LISTING: Listing = {
  id: "lst-001",
  merchantId: "mer-01",
  title: "Mystery Box Pastry & Viennoiserie",
  description: "Paket misteri aneka croissant dan pastry segar.",
  category: "MYSTERY_BOX",
  originalPrice: 55000,
  discountedPrice: 22000,
  quantityTotal: 6,
  quantityRemaining: 4,
  pickupStart: new Date(Date.now() + 3600000).toISOString(),
  pickupEnd: new Date(Date.now() + 10800000).toISOString(),
  status: "ACTIVE",
  allergens: ["Gluten", "Dairy"],
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

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const quantity = Math.max(1, parseInt(searchParams.get("qty") || "1", 10));

  const [listing, setListing] = useState<Listing>(FALLBACK_LISTING);

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

  const rawTotal = listing.originalPrice * quantity;
  const itemTotal = listing.discountedPrice * quantity;
  const savedAmount = rawTotal - itemTotal;

  // Auto-apply Rescue Credit if balance covers the total
  const [useRescueCredit, setUseRescueCredit] = useState(45000 >= itemTotal);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    45000 >= itemTotal ? "RESCUE_CREDIT" : "QRIS"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isOutOfStock = listing.quantityRemaining <= 0 || quantity > listing.quantityRemaining;

  // If user has rescue credit balance and toggles it
  const availableCredit = 45000;
  const appliedCredit = useRescueCredit
    ? Math.min(availableCredit, itemTotal)
    : 0;
  const finalPayable = itemTotal - appliedCredit;

  const handlePay = async () => {
    setCheckoutError(null);

    if (isOutOfStock) {
      setCheckoutError(`Maaf, stok porsi tidak mencukupi (tersisa ${listing.quantityRemaining} porsi).`);
      return;
    }

    if (finalPayable > 0 && !paymentMethod) {
      setCheckoutError("Silakan pilih metode pembayaran untuk melanjutkan.");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await consumerApi.createOrder({
        listingId: listing.id,
        quantity,
        paymentMethod: (finalPayable === 0 ? "RESCUE_CREDIT" : paymentMethod) as string,
        useRescueCredit,
      });

      if (res.success && res.order) {
        router.push(`/undo/${res.order.id}?listingId=${listing.id}&qty=${quantity}&price=${finalPayable}`);
      } else {
        const orderId = `ord-${Date.now().toString().slice(-6)}`;
        router.push(`/undo/${orderId}?listingId=${listing.id}&qty=${quantity}&price=${finalPayable}`);
      }
    } catch (error: any) {
      setCheckoutError(error.message || "Gagal memproses pembayaran");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3.5 bg-background/90 backdrop-blur-md border-b border-border/80">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-muted transition"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-sm font-black text-foreground">Ringkasan Pesanan</h1>
        <div className="w-9" />
      </div>

      <div className="p-4 flex flex-col gap-4 max-w-md mx-auto w-full">
        {/* Error Feedback */}
        {checkoutError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-bold text-destructive animate-in fade-in shadow-2xs">
            {checkoutError}
          </div>
        )}

        {/* Order Item Card */}
        <Card className="p-4 bg-card border-border shadow-2xs rounded-2xl">
          <div className="flex gap-3">
            <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-muted">
              <Image
                src={listing.photoUrl}
                alt={listing.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {listing.merchant.storeName}
                </span>
                <h2 className="text-xs font-black text-foreground leading-snug line-clamp-2 mt-0.5">
                  {listing.title}
                </h2>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-muted-foreground tabular-nums">
                  {quantity}x @ {formatRupiah(listing.discountedPrice)}
                </span>
                <span className="text-sm font-black text-foreground tabular-nums">
                  {formatRupiah(itemTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Pickup Window details */}
          <div className="mt-3 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Jadwal Pengambilan:</span>
            </div>
            <span className="font-bold text-foreground tabular-nums">
              {formatTime(new Date(listing.pickupStart))} – {formatTime(new Date(listing.pickupEnd))} WIB
            </span>
          </div>
        </Card>

        {/* Rescue Credit Balance Selector */}
        {availableCredit > 0 && (
          <Card className="p-4 bg-card border-border shadow-2xs rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-foreground">Gunakan Rescue Credit</h3>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    Saldo tersedia: {formatRupiah(availableCredit)}
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                id="rescue-credit-toggle"
                checked={useRescueCredit}
                onChange={(e) => {
                  setUseRescueCredit(e.target.checked);
                  if (e.target.checked && availableCredit >= itemTotal) {
                    setPaymentMethod("RESCUE_CREDIT");
                  } else if (!e.target.checked && paymentMethod === "RESCUE_CREDIT") {
                    setPaymentMethod("QRIS");
                  }
                }}
                className="h-5 w-5 rounded-md border-border text-primary focus:ring-primary cursor-pointer accent-[#2D6A4F]"
              />
            </div>
          </Card>
        )}

        {/* Payment Method Selector (if remaining amount > 0) */}
        {finalPayable > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Metode Pembayaran
            </h3>

            <div className="flex flex-col gap-2">
              {/* QRIS */}
              <button
                type="button"
                onClick={() => setPaymentMethod("QRIS")}
                className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                  paymentMethod === "QRIS"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-foreground">QRIS Dinamis</span>
                    <p className="text-[11px] text-muted-foreground">
                      BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, DANA
                    </p>
                  </div>
                </div>

                <div
                  className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === "QRIS"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {paymentMethod === "QRIS" && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
              </button>

              {/* E-Wallet */}
              <button
                type="button"
                onClick={() => setPaymentMethod("EWALLET")}
                className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                  paymentMethod === "EWALLET"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-foreground">E-Wallet Direct</span>
                    <p className="text-[11px] text-muted-foreground">
                      GoPay, ShopeePay, DANA, OVO
                    </p>
                  </div>
                </div>

                <div
                  className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === "EWALLET"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {paymentMethod === "EWALLET" && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Price Breakdown Card */}
        <Card className="p-4 bg-card border-border shadow-2xs rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Rincian Pembayaran
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Harga Normal ({quantity} porsi)</span>
              <span className="line-through tabular-nums">{formatRupiah(rawTotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[#E85D04]">
              <span>Diskon Penyelamatan ({discountPercent(rawTotal, itemTotal)}%)</span>
              <span className="tabular-nums">-{formatRupiah(savedAmount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Biaya Layanan</span>
              <span className="font-bold text-primary">Gratis</span>
            </div>

            {useRescueCredit && appliedCredit > 0 && (
              <div className="flex justify-between font-semibold text-primary pt-1.5 border-t border-border/70">
                <span>Potongan Rescue Credit</span>
                <span className="tabular-nums">-{formatRupiah(appliedCredit)}</span>
              </div>
            )}

            <div className="pt-2.5 border-t border-border flex justify-between items-baseline text-sm font-black text-foreground">
              <span>Total Tagihan</span>
              <span className="text-base font-black text-foreground tabular-nums">
                {formatRupiah(finalPayable)}
              </span>
            </div>
          </div>
        </Card>

        {/* 60s Undo Feature Assurance */}
        <div className="rounded-2xl border border-border bg-[#F3EFE6] p-3.5 text-xs text-foreground flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <span>Dilindungi fitur Instant Undo 60 detik pasca-pembayaran (refund 100%).</span>
        </div>
      </div>

      {/* Sticky Bottom Payment Trigger */}
      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-border bg-card/95 backdrop-blur-md p-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom,0.875rem))] shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground">Total:</span>
            <div className="text-lg font-black text-foreground leading-tight tabular-nums">
              {formatRupiah(finalPayable)}
            </div>
          </div>

          <Button
            onClick={handlePay}
            loading={isProcessing}
            disabled={isOutOfStock || isProcessing}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-black shadow-md hover:bg-primary/90 text-sm gap-2"
          >
            <Lock className="h-4 w-4" />
            <span>{isOutOfStock ? "Stok Habis" : "Bayar Sekarang"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
