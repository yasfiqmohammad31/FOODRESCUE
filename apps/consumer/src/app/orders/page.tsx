"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  X,
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

  // Review & Rating State
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, { rating: number; comment: string }>>({});
  const [reviewModalOrder, setReviewModalOrder] = useState<Order | null>(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    consumerApi.getActiveOrders().then((data) => {
      if (isMounted && data && Array.isArray(data)) {
        setOrders(data);
      }
    });

    // Load past reviews
    consumerApi.getReviews().then((res) => {
      if (isMounted && res.success && Array.isArray(res.reviews)) {
        const map: Record<string, { rating: number; comment: string }> = {};
        res.reviews.forEach((r: any) => {
          if (r.orderId) map[r.orderId] = { rating: r.rating, comment: r.comment };
        });
        setReviewedOrders(map);
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

  const handleOpenReviewModal = (order: Order) => {
    setReviewModalOrder(order);
    const existing = reviewedOrders[order.id];
    if (existing) {
      setRatingInput(existing.rating);
      setCommentInput(existing.comment);
    } else {
      setRatingInput(5);
      setCommentInput("");
    }
    setReviewError(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder) return;

    if (!commentInput.trim() || commentInput.trim().length < 3) {
      setReviewError("Tuliskan ulasan singkat Anda (minimal 3 karakter).");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    let consumerId = "usr-cns-001";
    try {
      const userRaw = localStorage.getItem("fr_user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user.id) consumerId = user.id;
      }
    } catch {}

    try {
      const res = await consumerApi.submitReview({
        orderId: reviewModalOrder.id,
        rating: ratingInput,
        comment: commentInput.trim(),
        consumerId,
      });

      if (res.success) {
        setReviewedOrders((prev) => ({
          ...prev,
          [reviewModalOrder.id]: { rating: ratingInput, comment: commentInput.trim() },
        }));
        setToastMessage(res.message || "Ulasan berhasil dikirim. Terima kasih!");
        setTimeout(() => setToastMessage(null), 4000);
        setReviewModalOrder(null);
      } else {
        setReviewError(res.message || "Gagal mengirim ulasan.");
      }
    } catch (err: any) {
      setReviewError(err.message || "Gagal mengirim ulasan ke server.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const RATING_LABELS: Record<number, string> = {
    5: "Sangat Puas! (Porsi mantap & lezat)",
    4: "Puas (Kualitas makanan terjaga)",
    3: "Cukup (Sesuai standar)",
    2: "Kurang Puas",
    1: "Kecewa (Ada keluhan mutu pangan)",
  };

  return (
    <div className="flex flex-col flex-1 p-4 pb-28 gap-3 max-w-md mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#1C1917] text-white border border-white/20 px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
            const isCompleted = order.status === "PICKED_UP";
            const review = reviewedOrders[order.id];

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
                  ) : isCompleted ? (
                    <Badge variant="secondary" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 shrink-0">
                      ✓ Telah Diambil
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] font-semibold text-muted-foreground shrink-0">
                      Dibatalkan
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

                {/* Reviewed Snippet if any */}
                {review && (
                  <div className="mt-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 shrink-0" />
                      <span className="font-bold text-amber-900 text-[11px]">
                        Ulasan Anda: {review.rating}/5
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-800/80 truncate max-w-[160px]">
                      &quot;{review.comment}&quot;
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                    {formatDatetime(new Date(order.createdAt))}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isActive ? (
                      <Button asChild size="sm" className="h-8 rounded-lg bg-primary text-white text-xs font-bold gap-1.5">
                        <Link href={`/voucher/${order.id}`}>
                          <QrCode className="h-3.5 w-3.5" />
                          <span>Buka Tiket QR</span>
                        </Link>
                      </Button>
                    ) : isCompleted ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleOpenReviewModal(order)}
                          className={`h-8 rounded-lg text-xs font-bold gap-1 shadow-2xs ${
                            review
                              ? "bg-muted text-foreground hover:bg-accent border border-border"
                              : "bg-[#E85D04] hover:bg-[#D94E03] text-white"
                          }`}
                        >
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{review ? "Ubah Ulasan" : "Beri Ulasan"}</span>
                        </Button>

                        {order.listing.category === "MYSTERY_BOX" && (
                          <Button asChild size="sm" className="h-8 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#78350F] text-xs font-black gap-1 shadow-2xs">
                            <Link href={`/reveal/${order.id}`}>
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Box</span>
                            </Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs font-semibold">
                        <Link href={`/listing/${order.listingId}`}>
                          Pesan Lagi
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* Review & Rating Modal */}
      {/* ========================================================================= */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-[#E85D04]">
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground">Beri Ulasan & Rating</h2>
                  <p className="text-[11px] text-muted-foreground">{reviewModalOrder.merchant.storeName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOrder(null)}
                aria-label="Tutup"
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Food Safety Reassurance Alert */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-950 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-900 leading-snug">
                Ulasan Anda diawasi oleh <strong>AI Sentiment & Food Safety Moderation</strong> untuk menjamin mutu pangan surplus tetap prima.
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div className="flex flex-col items-center gap-1.5 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Bagaimana Pengalaman Makanan Anda?
                </span>
                <div className="flex items-center gap-2 my-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating !== null ? hoverRating : ratingInput) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRatingInput(star)}
                        className="p-1.5 transition transform hover:scale-125 focus:outline-hidden"
                      >
                        <Star
                          className={`h-8 w-8 transition ${
                            isFilled
                              ? "fill-amber-400 text-amber-500 drop-shadow-xs"
                              : "text-zinc-300 dark:text-zinc-700"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {RATING_LABELS[hoverRating || ratingInput]}
                </span>
              </div>

              {/* Comment Textarea */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Ulasan Makanan & Layanan Gerai
                </label>
                <textarea
                  value={commentInput}
                  onChange={(e) => {
                    setCommentInput(e.target.value);
                    setReviewError(null);
                  }}
                  rows={3}
                  required
                  placeholder="Ceritakan kesegaran makanan, keramahan staf toko, dan kelayakan porsi..."
                  className={`w-full rounded-xl border bg-card p-3 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary ${
                    reviewError ? "border-destructive" : "border-input"
                  }`}
                />
                {reviewError && (
                  <span className="text-[10px] text-destructive font-semibold mt-1 block flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {reviewError}
                  </span>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewModalOrder(null)}
                  className="flex-1 text-xs font-bold h-10 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  loading={isSubmittingReview}
                  className="flex-1 bg-primary text-white text-xs font-black h-10 rounded-xl shadow-xs hover:bg-primary/90"
                >
                  Kirim Ulasan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
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
