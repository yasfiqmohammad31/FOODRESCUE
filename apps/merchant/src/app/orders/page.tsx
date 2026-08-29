"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  QrCode,
  RotateCcw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDatetime, formatRupiah } from "@/lib/utils";
import { merchantApi } from "@/lib/api-client";
import type { Order } from "@/types";

export default function MerchantOrdersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  // Emergency Cancel State Modal
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("Stok habis mendadak di toko fisik");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    merchantApi
      .getOrdersQueue()
      .then((data) => {
        if (isMounted && data && Array.isArray(data)) {
          setOrders(data);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleExecuteEmergencyCancel = async () => {
    if (!cancellingOrder) return;
    setIsCancelling(true);
    const targetId = cancellingOrder.id;

    try {
      await merchantApi.emergencyCancelOrder(targetId, cancelReason);
    } catch (e) {
      console.warn("Emergency cancel fallback:", e);
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === targetId
          ? {
              ...o,
              status: "CANCELLED_MERCHANT" as any,
              cancelReason,
              cancelledAt: new Date().toISOString(),
            }
          : o
      )
    );
    setIsCancelling(false);
    setCancellingOrder(null);
  };

  const filteredOrders = orders.filter((o) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!o.orderNumber.toLowerCase().includes(q) && !o.listing.title.toLowerCase().includes(q)) {
        return false;
      }
    }

    if (activeTab === "ACTIVE") {
      return o.status !== "PICKED_UP" && !o.status.startsWith("CANCELLED");
    }
    return o.status === "PICKED_UP" || o.status.startsWith("CANCELLED");
  });

  return (
    <div className="flex flex-col gap-3 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-base sm:text-lg font-black text-foreground">
          Kelola Pesanan
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pantau antrean pesanan masuk, siapkan porsi, dan lakukan scan QR voucher.
        </p>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-xl bg-card border border-border p-1">
          <button
            type="button"
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
              activeTab === "ACTIVE"
                ? "bg-primary text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Aktif ({orders.filter((o) => o.status !== "PICKED_UP" && !o.status.startsWith("CANCELLED")).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
              activeTab === "COMPLETED"
                ? "bg-primary text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Riwayat ({orders.filter((o) => o.status === "PICKED_UP" || o.status.startsWith("CANCELLED")).length})
          </button>
        </div>

        <div className="relative flex-1 max-w-[170px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor order..."
            className="pl-8 h-8 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Compact Orders List */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <MerchantOrderSkeleton />
            <MerchantOrderSkeleton />
          </>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const isDelayed = order.status === "UNDO_WINDOW";
            const isConfirmed = order.status === "CONFIRMED";
            const isPreparing = order.status === "PREPARING";
            const isReady = order.status === "READY";
            const isPickedUp = order.status === "PICKED_UP";
            const isCancelled = order.status === "CANCELLED_MERCHANT";

            return (
              <Card key={order.id} className="p-3 bg-card border-border shadow-2xs rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-foreground">
                      {order.orderNumber}
                    </span>
                    {isDelayed ? (
                      <span className="bg-[#E85D04] text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                        Jeda Undo 60s
                      </span>
                    ) : isReady ? (
                      <span className="bg-[#65A30D] text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                        Siap Diambil
                      </span>
                    ) : isPickedUp ? (
                      <span className="bg-muted text-muted-foreground text-[9px] font-bold px-1.5 py-0.2 rounded">
                        Selesai
                      </span>
                    ) : isCancelled ? (
                      <span className="bg-[#E85D04] text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                        Dibatalkan
                      </span>
                    ) : isPreparing ? (
                      <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                        Sedang Disiapkan
                      </span>
                    ) : (
                      <span className="bg-primary/80 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                        Perlu Disiapkan
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground font-medium" suppressHydrationWarning>
                    {formatDatetime(new Date(order.createdAt))}
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className="text-xs font-bold text-foreground truncate"
                      title={order.listing.title}
                    >
                      {order.quantity}x {order.listing.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      Total: <strong>{formatRupiah(order.totalPrice)}</strong> ({order.paymentMethod})
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isConfirmed && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                        className="h-7 px-2.5 rounded-lg bg-primary text-white text-[11px] font-bold shadow-2xs"
                      >
                        Siapkan
                      </Button>
                    )}

                    {isPreparing && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, "READY")}
                        className="h-7 px-2.5 rounded-lg bg-[#65A30D] text-white text-[11px] font-bold shadow-2xs"
                      >
                        Tandai Siap
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

                    {!isPickedUp && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => setCancellingOrder(order)}
                        className="text-[10px] text-destructive hover:underline font-bold px-1 py-1"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="p-8 text-center bg-card rounded-xl border border-dashed border-border text-xs text-muted-foreground">
            Tidak ada pesanan pada status ini.
          </div>
        )}
      </div>

      {/* Emergency Cancel Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl border border-border">
            <div className="flex items-center gap-2.5 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h2 className="text-sm font-black text-foreground">Batalkan Pesanan</h2>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Dana pesanan <strong>{cancellingOrder.orderNumber}</strong> ({formatRupiah(cancellingOrder.totalPrice)}) akan otomatis di-refund 100% instan ke Rescue Credit konsumen.
            </p>

            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Alasan Pembatalan
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="Stok habis mendadak di toko fisik">Stok habis mendadak di toko fisik</option>
                <option value="Toko harus tutup lebih awal (keadaan darurat)">Toko harus tutup lebih awal (keadaan darurat)</option>
                <option value="Kualitas makanan tidak memenuhi standar mutu">Kualitas makanan tidak memenuhi standar mutu</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCancellingOrder(null)}
                className="flex-1 text-xs font-bold h-9 rounded-xl"
              >
                Kembali
              </Button>
              <Button
                onClick={handleExecuteEmergencyCancel}
                loading={isCancelling}
                className="flex-1 bg-destructive text-white text-xs font-black h-9 rounded-xl shadow-xs hover:bg-destructive/90"
              >
                Batalkan & Refund
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MerchantOrderSkeleton() {
  return (
    <Card className="p-3 bg-card border-border shadow-2xs rounded-xl space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <Skeleton className="h-3.5 w-28 rounded-md" />
        <Skeleton className="h-3 w-20 rounded-md" />
      </div>
      <div className="py-1 flex items-center justify-between gap-2">
        <div className="space-y-1 flex-1">
          <Skeleton className="h-3.5 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
        <Skeleton className="h-7 w-20 rounded-lg shrink-0" />
      </div>
    </Card>
  );
}
