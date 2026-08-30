"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  QrCode,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatDatetime,
  formatDistance,
  formatRupiah,
  formatTime,
  formatTimeRemaining,
} from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";
import type { Order } from "@/types";

interface VoucherPageProps {
  params: Promise<{ id: string }>;
}

const DEFAULT_ORDER: Order = {
  id: "ord-001",
  orderNumber: "FR-20260829-8821",
  consumerId: "usr-cns-001",
  merchantId: "mer-01",
  listingId: "lst-001",
  quantity: 1,
  totalPrice: 22000,
  paymentMethod: "RESCUE_CREDIT",
  status: "CONFIRMED",
  undoDeadline: new Date(Date.now() - 10000).toISOString(),
  createdAt: new Date().toISOString(),
  merchant: {
    storeName: "Artisan Bakery & Cafe",
    address: "Jl. Raya Darmo Permai No. 45, Surabaya",
    location: { lat: -7.2856, lng: 112.6954 },
  },
  listing: {
    title: "Mystery Box Pastry & Viennoiserie",
    category: "MYSTERY_BOX",
    photoUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800",
  },
  paidAt: new Date().toISOString(),
  confirmedAt: new Date().toISOString(),
  pickedUpAt: null,
  cancelledAt: null,
  cancelReason: null,
};

export default function VoucherPage({ params }: VoucherPageProps) {
  const { id: orderId } = use(params);
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [tokenRotationSeconds, setTokenRotationSeconds] = useState(30);
  const [qrToken, setQrToken] = useState("FR-VOUCHER-TOKEN-LIVE-8821");
  const [order, setOrder] = useState<Order>(DEFAULT_ORDER);

  // Initial voucher token fetch & order detail fetch
  useEffect(() => {
    let isMounted = true;
    consumerApi.getVoucherToken(orderId).then((res) => {
      if (isMounted && res.success && res.token) {
        setQrToken(res.token);
        if (res.order) setOrder(res.order);
      }
    });
    consumerApi.getOrderById(orderId).then((resOrder) => {
      if (isMounted && resOrder) {
        setOrder(resOrder);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // 30s token rotation ticker with API refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setTokenRotationSeconds((prev) => {
        if (prev <= 1) {
          consumerApi.refreshVoucherToken(orderId).then((res) => {
            if (res.success && res.token) {
              setQrToken(res.token);
            } else {
              setQrToken(`FR-VOUCHER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
            }
          });
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderId]);

  const handleCopyOrderNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pickupEndTime = "21:30";
  const timeRemaining = "1 jam 45 menit";

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3.5 bg-background/90 backdrop-blur-md border-b border-border/80">
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-muted transition"
          aria-label="Kembali ke Pesanan"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-foreground">Tiket Pengambilan</span>
        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "Voucher FOODRESCUE",
                text: `Voucher Pengambilan ${order.orderNumber} di ${order.merchant.storeName}`,
                url: window.location.href,
              });
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground transition"
          aria-label="Bagikan"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4 max-w-md mx-auto w-full">
        {/* Header Title Section from Reference */}
        <div className="text-center">
          <h1 className="text-xl font-black text-foreground">
            Your Rescue is Ready
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Order #{order.orderNumber}
          </p>
        </div>

        {/* Dynamic Rotating QR Voucher Card from Reference */}
        <Card className="overflow-hidden border border-border bg-card shadow-sm rounded-3xl">
          {/* Merchant Info Header */}
          <div className="p-4 border-b border-border/70 bg-[#F3EFE6]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white font-bold">
                <Store className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-black text-foreground">{order.merchant.storeName}</h2>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Ambil Sebelum {pickupEndTime} WIB</span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Canvas */}
          <div className="p-6 flex flex-col items-center justify-center bg-white text-center">
            <p className="text-xs font-semibold text-foreground mb-4">
              Tunjukkan kode QR ini ke kasir untuk mengambil makanan.
            </p>

            {/* Anti-Fraud QR Container with Corner Guides */}
            <div className="relative flex h-56 w-56 items-center justify-center rounded-2xl bg-[#FBF9F5] p-4 border border-border/60 shadow-inner">
              {/* Corner Guides */}
              <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-primary" />

              {/* QR Pattern Matrix */}
              <div className="grid h-full w-full grid-cols-6 grid-rows-6 gap-1 p-2 bg-[#1C1917] rounded-xl">
                <div className="col-span-2 row-span-2 rounded bg-white p-1">
                  <div className="h-full w-full bg-[#1C1917] rounded-xs flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-xs" />
                  </div>
                </div>
                <div className="col-span-2 row-span-1 bg-white/20 rounded-xs" />
                <div className="col-span-2 row-span-2 rounded bg-white p-1">
                  <div className="h-full w-full bg-[#1C1917] rounded-xs flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-xs" />
                  </div>
                </div>
                <div className="col-span-2 row-span-2 rounded bg-white p-1">
                  <div className="h-full w-full bg-[#1C1917] rounded-xs flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-xs" />
                  </div>
                </div>
                <div className="col-span-2 row-span-2 flex items-center justify-center bg-primary rounded text-white font-black text-[11px]">
                  RESCUE
                </div>
                <div className="col-span-2 row-span-2 bg-white/30 rounded-xs" />
              </div>
            </div>

            {/* 30s Live Refresh Bar from Reference */}
            <div className="mt-4 w-full max-w-[224px] space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-semibold text-muted-foreground px-1">
                <span className="flex items-center gap-1 text-primary">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Rotasi Token Anti-Fraud
                </span>
                <span className="text-primary font-bold tabular-nums">{tokenRotationSeconds}s</span>
              </div>
              <div className="h-1.5 w-full bg-[#F3EFE6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(tokenRotationSeconds / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tag Footer from Reference */}
          {order.listing.category === "MYSTERY_BOX" ? (
            <div className="bg-[#FEF3C7] px-4 py-2 flex justify-center items-center gap-1.5 text-[#78350F] text-xs font-black border-t border-[#FCD34D]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Mystery Box Rescue</span>
            </div>
          ) : (
            <div className="bg-[#F3EFE6] px-4 py-2 flex justify-center items-center gap-1.5 text-foreground text-xs font-bold border-t border-border">
              <span>Porsi Menu Terpilih</span>
            </div>
          )}
        </Card>

        {/* Order Number Copy Card */}
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-card border border-border px-4 py-3 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Nomor Order
            </span>
            <span className="font-mono text-sm font-black text-foreground">
              {order.orderNumber}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyOrderNumber}
            className="h-8 gap-1.5 rounded-xl text-xs font-bold"
            aria-label="Salin Nomor Order"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Tersalin" : "Salin"}</span>
          </Button>
        </div>

        {/* Store Location & Google Maps Action */}
        <Card className="p-4 bg-card border-border shadow-2xs rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-foreground">{order.merchant.storeName}</h3>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                {order.merchant.address}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border flex gap-2">
            <a
              href={
                order.merchant.location?.lat && order.merchant.location?.lng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${order.merchant.location.lat},${order.merchant.location.lng}`
                  : `https://maps.google.com/?q=${encodeURIComponent(order.merchant.address)}`
              }
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs hover:bg-primary/90 transition"
            >
              <MapPin className="h-4 w-4" />
              <span>Petunjuk Arah Google Maps</span>
              <ExternalLink className="h-3 w-3 opacity-80" />
            </a>
          </div>
        </Card>

        {/* No-show Policy Alert */}
        <div className="rounded-2xl bg-[#F3EFE6] border border-border p-3 text-xs text-foreground leading-relaxed flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-[#E85D04] shrink-0 mt-0.5" />
          <span>Pesanan yang tidak diambil sebelum {pickupEndTime} WIB akan hangus sesuai kebijakan operasional gerai.</span>
        </div>
      </div>
    </div>
  );
}
