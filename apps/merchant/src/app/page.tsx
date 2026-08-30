"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Power,
  QrCode,
  ShieldCheck,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDatetime, formatRupiah } from "@/lib/utils";
import { merchantApi } from "@/lib/api-client";
import type { Order } from "@/types";

const INITIAL_STATS = {
  todayRevenue: 0,
  todayPortionsSaved: 0,
  availableBalance: 0,
  activeListingsCount: 0,
  pendingOrdersCount: 0,
  storeRating: 5.0,
  totalReviews: 0,
  isStoreOpen: false,
};

export default function MerchantDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [storeName, setStoreName] = useState("Mitra Gerai");
  const [isToggleStoreModalOpen, setIsToggleStoreModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch real-time dashboard data
  useEffect(() => {
    let isMounted = true;
    const userRaw = typeof window !== "undefined" ? localStorage.getItem("fr_merchant") : null;
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.storeName) setStoreName(user.storeName);
        else if (user.name) setStoreName(user.name);
      } catch {}
    }

    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [statsData, ordersData, profileData] = await Promise.all([
          merchantApi.getStats(),
          merchantApi.getOrdersQueue(),
          merchantApi.getProfile(),
        ]);
        if (isMounted) {
          if (statsData) {
            setStats(statsData);
            setIsStoreOpen(statsData.isStoreOpen ?? false);
          }
          if (profileData?.merchant?.storeName) {
            setStoreName(profileData.merchant.storeName);
          }
          if (ordersData && Array.isArray(ordersData)) {
            setOrders(ordersData);
          }
        }
      } catch (err) {
        console.warn("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  // Active delayed order (in 60s undo window)
  const delayedOrder = orders.find((o) => o.status === "UNDO_WINDOW");

  const handleUpdateStatus = async (orderId: string, newStatus: "PREPARING" | "READY") => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    try {
      await merchantApi.updateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.warn("Status update fallback:", e);
    }
  };

  const handleConfirmStoreToggle = async () => {
    const nextStatus = !isStoreOpen;
    setIsStoreOpen(nextStatus);
    setIsToggleStoreModalOpen(false);
    try {
      await merchantApi.toggleStoreStatus();
    } catch (e) {
      console.warn("Store toggle fallback:", e);
    }
    setToastMessage(
      nextStatus
        ? "Gerai Anda sekarang BUKA. Listing aktif kembali terlihat oleh pembeli."
        : "Gerai Anda sekarang DITUTUP SEMENTARA. Listing disembunyikan dari aplikasi pembeli."
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="flex flex-col gap-3.5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl bg-[#1C1917] text-white border border-white/20 p-3 text-xs font-bold flex items-center gap-2 shadow-xl animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Title & Instant Store Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-2 w-2 rounded-full ${
                isStoreOpen ? "bg-[#65A30D] animate-pulse" : "bg-destructive"
              }`}
            />
            <span
              className="text-[11px] font-bold text-muted-foreground truncate max-w-[150px]"
              title={storeName}
            >
              {storeName}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-black text-foreground mt-0.5">
            Ringkasan Operasional Hari Ini
          </h1>
        </div>

        {/* Instant Store Toggle Button */}
        <button
          type="button"
          onClick={() => setIsToggleStoreModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black transition border shadow-2xs ${
            isStoreOpen
              ? "bg-emerald-500/10 border-emerald-500/30 text-[#2D6A4F] hover:bg-emerald-500/20"
              : "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
          }`}
        >
          <Power className="h-3 w-3" />
          <span>{isStoreOpen ? "Gerai Buka" : "Gerai Tutup"}</span>
        </button>
      </div>

      {/* Instant Closure Warning Banner */}
      {!isStoreOpen && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive shadow-2xs flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <div className="min-w-0">
              <span className="text-xs font-black block">
                Gerai Sedang Ditutup Sementara
              </span>
              <p className="text-[11px] text-destructive/90 leading-snug mt-0.5">
                Konsumen tidak dapat melihat listing Anda. Buka gerai kembali saat siap menerima pesanan.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleConfirmStoreToggle}
            className="h-7 px-2.5 text-[10px] font-black bg-destructive text-white hover:bg-destructive/90 shrink-0"
          >
            Buka Gerai
          </Button>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl text-xs font-bold gap-1.5 shadow-2xs">
          <Link href="/scanner">
            <QrCode className="h-3.5 w-3.5 text-primary" />
            <span>Scan QR Voucher</span>
          </Link>
        </Button>

        <Button asChild size="sm" className="h-9 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-xs hover:bg-primary/90 gap-1.5">
          <Link href="/listings?action=new">
            <Plus className="h-3.5 w-3.5" />
            <span>Buat Listing Baru</span>
          </Link>
        </Button>
      </div>

      {/* Delayed Notification Queue Alert */}
      {delayedOrder && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-3.5 w-3.5 text-[#E85D04] shrink-0 animate-pulse" />
            <p className="text-[11px] text-[#78350F] font-semibold truncate">
              Pesanan <strong>{delayedOrder.orderNumber}</strong> dalam jeda undo konsumen (60s)
            </p>
          </div>

          <span className="shrink-0 text-[9px] font-black text-white bg-[#E85D04] px-1.5 py-0.5 rounded">
            Menunggu
          </span>
        </div>
      )}

      {/* Loading Skeleton or Standalone Financial Hero Card */}
      {isLoading ? (
        <MerchantDashboardSkeleton />
      ) : (
        <>
          {/* Standalone Financial Hero Card: Pendapatan Hari Ini & Saldo Siap Cair */}
          <Card className="p-3.5 bg-card border-border shadow-2xs rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Pendapatan Hari Ini
                </span>
              </div>
              <span className="bg-emerald-500/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                +{stats.todayPortionsSaved} porsi terjual
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-black text-foreground tabular-nums tracking-tight">
                {formatRupiah(stats.todayRevenue)}
              </div>
            </div>

            {/* Saldo Siap Cair & Tarik Saldo CTA */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px]">
                  Saldo Siap Cair: <strong className="text-foreground font-black tabular-nums">{formatRupiah(stats.availableBalance)}</strong>
                </span>
              </div>

              <Button asChild size="sm" className="h-7 px-3 rounded-lg text-[11px] font-black bg-primary text-white shadow-2xs hover:bg-primary/90">
                <Link href="/payout">Tarik Saldo</Link>
              </Button>
            </div>
          </Card>

          {/* 3 Operational KPI Cards (3-Column Row) */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Card 1: Porsi Terselamatkan */}
            <div className="p-2.5 bg-card border border-border rounded-xl shadow-2xs flex flex-col justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                Porsi Selamat
              </span>
              <div className="text-sm sm:text-base font-black text-primary tabular-nums mt-0.5">
                {stats.todayPortionsSaved} <span className="text-[10px] font-semibold text-muted-foreground">Pkt</span>
              </div>
              <span className="text-[9px] text-muted-foreground font-medium mt-0.5 block truncate">
                {(stats.todayPortionsSaved * 0.4).toFixed(1)} kg limbah
              </span>
            </div>

            {/* Card 2: Listing Aktif */}
            <div className="p-2.5 bg-card border border-border rounded-xl shadow-2xs flex flex-col justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                Listing Aktif
              </span>
              <div className="text-sm sm:text-base font-black text-[#B45309] tabular-nums mt-0.5">
                {stats.activeListingsCount} <span className="text-[10px] font-semibold text-muted-foreground">Paket</span>
              </div>
              <span className="text-[9px] text-muted-foreground font-medium mt-0.5 block truncate">
                Siap diambil
              </span>
            </div>

            {/* Card 3: Rating Gerai */}
            <div className="p-2.5 bg-card border border-border rounded-xl shadow-2xs flex flex-col justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                Rating Gerai
              </span>
              <div className="text-sm sm:text-base font-black text-foreground tabular-nums mt-0.5">
                ★ {stats.storeRating.toFixed(1)}
              </div>
              <span className="text-[9px] text-muted-foreground font-medium mt-0.5 block truncate">
                {stats.totalReviews} ulasan
              </span>
            </div>
          </div>
        </>
      )}

      {/* Orders Queue Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Antrean Pesanan ({orders.filter((o) => o.status !== "PICKED_UP" && o.status !== "UNDO_WINDOW").length})
          </h2>
          <Link href="/orders" className="text-[11px] font-bold text-primary hover:underline">
            Lihat Semua
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {orders
            .filter((o) => o.status !== "PICKED_UP")
            .map((order) => {
              const isUndo = order.status === "UNDO_WINDOW";
              const isConfirmed = order.status === "CONFIRMED";
              const isPreparing = order.status === "PREPARING";
              const isReady = order.status === "READY";

              return (
                <div
                  key={order.id}
                  className={`p-2.5 rounded-xl border transition shadow-2xs flex items-center justify-between gap-2.5 ${
                    isUndo
                      ? "bg-amber-500/5 border-amber-500/30"
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-foreground tabular-nums">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        • {order.quantity}x porsi
                      </span>
                    </div>
                    <span
                      className="text-xs font-bold text-foreground truncate mt-0.5"
                      title={order.listing.title}
                    >
                      {order.listing.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatRupiah(order.totalPrice)} • Dipesan: {formatDatetime(new Date(order.createdAt))}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isUndo && (
                      <span className="text-[10px] font-bold text-[#E85D04] bg-[#FEF3C7] px-2 py-1 rounded-lg">
                        Jeda 60s
                      </span>
                    )}

                    {isConfirmed && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                        className="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold shadow-2xs hover:bg-primary/90"
                      >
                        Siapkan
                      </Button>
                    )}

                    {isPreparing && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, "READY")}
                        className="h-7 px-2.5 rounded-lg bg-[#65A30D] text-white text-[11px] font-bold shadow-2xs hover:bg-[#65A30D]/90"
                      >
                        Siap Ambil
                      </Button>
                    )}

                    {isReady && (
                      <Button
                        asChild
                        size="sm"
                        className="h-7 px-2.5 rounded-lg bg-primary text-white text-[11px] font-bold shadow-2xs"
                      >
                        <Link href="/scanner">Scan QR</Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Modal Toggle Status Gerai (Buka / Tutup Instan) */}
      {isToggleStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power className={`h-4 w-4 ${isStoreOpen ? "text-destructive" : "text-primary"}`} />
                <h2 className="text-sm font-black text-foreground">
                  {isStoreOpen ? "Tutup Gerai Sementara?" : "Buka Gerai Kembali?"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsToggleStoreModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isStoreOpen
                ? "Saat gerai ditutup, semua paket surplus Anda akan disembunyikan dari aplikasi konsumen. Pesanan yang sudah dipesan sebelumnya tetap dapat diserahkan."
                : "Gerai Anda akan kembali aktif dan paket surplus yang masih memiliki stok akan dapat direservasi kembali oleh pembeli."}
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setIsToggleStoreModalOpen(false)}
                className="flex-1 text-xs font-bold h-9 rounded-xl"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmStoreToggle}
                className={`flex-1 text-xs font-black h-9 rounded-xl shadow-xs ${
                  isStoreOpen
                    ? "bg-destructive text-white hover:bg-destructive/90"
                    : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {isStoreOpen ? "Ya, Tutup Gerai" : "Ya, Buka Gerai"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MerchantDashboardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Financial Card Skeleton */}
      <Card className="p-3.5 bg-card border border-border rounded-2xl space-y-2.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
        <Skeleton className="h-8 w-44 rounded-md" />
        <div className="pt-2 border-t border-border/60 flex justify-between items-center">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
      </Card>

      {/* 3 Metric Cards Skeleton */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}
