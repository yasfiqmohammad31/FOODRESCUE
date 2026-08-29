"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  QrCode,
  ReceiptText,
  Sparkles,
  Star,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDatetime, formatRupiah, formatTime } from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";
import type { Order } from "@/types";

export default function OrdersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  useEffect(() => {
    let isMounted = true;
    consumerApi.getActiveOrders().then((data) => {
      if (isMounted && data && Array.isArray(data)) {
        setOrders(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeOrdersCount = orders.filter(
    (o) => o.status === "CONFIRMED" || o.status === "PREPARING" || o.status === "READY"
  ).length;
  const completedOrdersCount = orders.filter(
    (o) => o.status === "PICKED_UP" || o.status.startsWith("CANCELLED")
  ).length;

  const filteredOrders = orders.filter((order) => {
    if (tab === "ACTIVE") return order.status === "CONFIRMED" || order.status === "PREPARING" || order.status === "READY";
    if (tab === "COMPLETED") return order.status === "PICKED_UP" || order.status.startsWith("CANCELLED");
    return true;
  });

  return (
    <div className="flex flex-col flex-1 p-4 pb-28 gap-3 max-w-md mx-auto w-full">
      <div>
        <h1 className="text-sm font-black text-foreground">Pesanan Saya</h1>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted/60 p-1 border border-border">
        <button
          type="button"
          onClick={() => setTab("ALL")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
            tab === "ALL"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Semua ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("ACTIVE")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
            tab === "ACTIVE"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Aktif ({activeOrdersCount})
        </button>
        <button
          type="button"
          onClick={() => setTab("COMPLETED")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
            tab === "COMPLETED"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Selesai ({completedOrdersCount})
        </button>
      </div>

      {/* Orders List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </>
        ) : (
          filteredOrders.map((order) => {
            const isActive =
              order.status === "CONFIRMED" ||
              order.status === "PREPARING" ||
              order.status === "READY";

            return (
              <Card
                key={order.id}
                className={`p-4 bg-card border shadow-2xs transition hover:border-primary/40 ${
                  isActive ? "border-primary/40" : "border-border"
                }`}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Store className="h-4 w-4 text-primary shrink-0" />
                    <span
                      className="text-xs font-bold text-foreground truncate"
                      title={order.merchant.storeName}
                    >
                      {order.merchant.storeName}
                    </span>
                  </div>

                  {isActive ? (
                    <Badge className="bg-primary text-primary-foreground text-[10px] font-extrabold animate-pulse shrink-0">
                      Siap Diambil
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] font-semibold text-muted-foreground shrink-0">
                      Selesai
                    </Badge>
                  )}
                </div>

                {/* Order Body */}
                <div className="mt-3 flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted">
                    <Image
                      src={order.listing.photoUrl}
                      alt={order.listing.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <h3
                        className="text-xs font-bold text-foreground leading-snug line-clamp-1"
                        title={order.listing.title}
                      >
                        {order.listing.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {order.quantity} porsi • {formatRupiah(order.totalPrice)}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground">
                      {order.orderNumber}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                    {formatDatetime(new Date(order.createdAt))}
                  </span>

                  {isActive ? (
                    <Button asChild size="sm" className="h-8 rounded-lg bg-primary text-white text-xs font-bold gap-1.5">
                      <Link href={`/voucher/${order.id}`}>
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Buka Tiket QR</span>
                      </Link>
                    </Button>
                  ) : order.listing.category === "MYSTERY_BOX" ? (
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="h-8 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#78350F] text-xs font-black gap-1 shadow-2xs">
                        <Link href={`/reveal/${order.id}`}>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Buka Box</span>
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs font-semibold">
                        <Link href={`/listing/${order.listingId}`}>
                          Pesan Lagi
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs font-semibold">
                      <Link href={`/listing/${order.listingId}`}>
                        Pesan Lagi
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <Card className="p-4 bg-card border border-border shadow-2xs rounded-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      <div className="mt-3 flex gap-3">
        <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
        <div className="flex flex-1 flex-col justify-between">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </Card>
  );
}
