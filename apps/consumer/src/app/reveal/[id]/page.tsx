"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Gift,
  Heart,
  PackageOpen,
  Share2,
  Sparkles,
  Star,
  Store,
  ThumbsUp,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";

interface RevealPageProps {
  params: Promise<{ id: string }>;
}

const SURPRISE_ITEMS = [
  {
    name: "Classic French Butter Croissant",
    portion: "1 Pcs",
    originalPrice: 22000,
    highlight: "Tekstur renyah berlapis dengan butter Prancis.",
  },
  {
    name: "Pain au Chocolat (Dark Chocolate)",
    portion: "1 Pcs",
    originalPrice: 24000,
    highlight: "Isi cokelat hitam leleh dan kulit flaky.",
  },
  {
    name: "Apple Cinnamon Danish",
    portion: "1 Pcs",
    originalPrice: 19000,
    highlight: "Pastry apel karamel dengan kayu manis.",
  },
];

const REVIEW_TAGS = [
  "Renyah & Segar",
  "Porsi Mengenyangkan",
  "Kemasan Bersih",
  "Pelayanan Ramah",
  "Sangat Hemat",
];

export default function MysteryBoxRevealPage({ params }: RevealPageProps) {
  const { id: orderId } = use(params);
  const router = useRouter();

  const [isOpened, setIsOpened] = useState(false);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([REVIEW_TAGS[0], REVIEW_TAGS[1]]);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const merchantStoreName = "Artisan Bakery & Cafe";

  const totalValueNormal = SURPRISE_ITEMS.reduce((acc, item) => acc + item.originalPrice, 0);
  const paidPrice = 22000;
  const savedAmount = totalValueNormal - paidPrice;

  const handleOpenBox = () => {
    setIsOpened(true);
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await consumerApi.submitReview({
        orderId,
        rating,
        comment: `${reviewComment} (${selectedTags.join(", ")})`,
      });
    } catch (err) {
      console.warn("Review submit fallback:", err);
    }
    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3.5 bg-background/90 backdrop-blur-md border-b border-border">
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-muted transition"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Mystery Box Unboxing
        </span>

        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "Mystery Box FOODRESCUE",
                text: `Saya membuka Mystery Box dari ${merchantStoreName} senilai ${formatRupiah(totalValueNormal)} hanya bayar ${formatRupiah(paidPrice)}!`,
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
        {!isOpened ? (
          /* Sealed Box State */
          <div className="flex flex-col items-center text-center py-6 animate-in fade-in zoom-in-95 duration-300">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] border border-[#FCD34D] px-3 py-1 text-xs font-black text-[#78350F] shadow-2xs">
              <Gift className="h-4 w-4 text-[#B45309]" />
              Paket Siap Dibuka
            </span>

            <h1 className="text-2xl font-black text-foreground mt-3 leading-tight">
              Buka Mystery Box
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
              Surplus pilihan terbaik hari ini dari dapur <strong>{merchantStoreName}</strong>.
            </p>

            {/* Interactive Box Graphics Container */}
            <div
              onClick={handleOpenBox}
              className="relative my-8 flex h-56 w-56 cursor-pointer items-center justify-center rounded-3xl bg-gradient-to-br from-[#F59E0B] via-[#E85D04] to-[#B45309] p-1 text-white shadow-xl transition-transform duration-300 hover:scale-105 active:scale-95 group"
            >
              {/* Inner Box Surface */}
              <div className="flex h-full w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-white/40 bg-black/20 p-6 text-center backdrop-blur-xs">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white mb-2.5 shadow-inner group-hover:rotate-12 transition-transform duration-300">
                  <Gift className="h-9 w-9" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Ketuk Untuk Buka
                </span>
                <span className="text-[10px] font-medium text-amber-100 mt-0.5 font-mono">
                  #{orderId}
                </span>
              </div>
            </div>

            <Button
              onClick={handleOpenBox}
              className="h-12 w-full max-w-xs rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md gap-2"
            >
              <PackageOpen className="h-4 w-4" />
              <span>Buka Box Sekarang</span>
            </Button>
          </div>
        ) : isSubmitted ? (
          /* Success Review Submitted State */
          <div className="flex flex-col items-center text-center py-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-primary mb-3 shadow-inner">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="text-lg font-black text-foreground">
              Ulasan Berhasil Terkirim
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
              Terima kasih atas ulasanmu untuk <strong>{merchantStoreName}</strong>.
            </p>

            <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
              <Button
                onClick={() => router.push("/feed")}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Jelajah Makanan Lainnya
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/impact")}
                className="w-full h-11 rounded-xl text-xs font-semibold text-muted-foreground"
              >
                Lihat Statistik Dampak
              </Button>
            </div>
          </div>
        ) : (
          /* Revealed Items & Review Form State */
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
            {/* Celebration Header */}
            <div className="rounded-3xl bg-gradient-to-br from-[#1E4620] via-[#2D6A4F] to-[#1B3815] p-4 text-white shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-300 block">
                  Isi Box Terungkap!
                </span>
                <h2 className="text-sm font-black mt-0.5">
                  3 Menu Pilihan Spesial
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-white/70 font-semibold block">Nilai Asli</span>
                <span className="text-sm font-black text-amber-300 tabular-nums">
                  {formatRupiah(totalValueNormal)}
                </span>
              </div>
            </div>

            {/* Revealed Item Cards */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rincian Menu
              </h3>

              {SURPRISE_ITEMS.map((item, idx) => (
                <Card key={item.name} className="p-3 bg-card border-border shadow-2xs rounded-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#F3EFE6] text-xs font-bold text-foreground">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                          {item.highlight}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
                      {formatRupiah(item.originalPrice)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Savings Summary Banner */}
            <div className="rounded-2xl border border-border bg-[#F3EFE6] p-3 flex items-center justify-between text-xs text-foreground">
              <span>Hanya Bayar: <strong className="tabular-nums">{formatRupiah(paidPrice)}</strong></span>
              <span className="font-extrabold text-[#E85D04] tabular-nums">
                Hemat {formatRupiah(savedAmount)}!
              </span>
            </div>

            {/* Review & Feedback Section */}
            <Card className="p-4 bg-card border-border shadow-2xs rounded-3xl">
              <form onSubmit={handleSubmitReview} className="space-y-3.5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Beri Rating untuk {merchantStoreName}
                  </h3>

                  {/* Interactive Star Rating */}
                  <div className="flex items-center justify-center gap-2 my-2.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            star <= rating
                              ? "fill-[#F59E0B] text-[#F59E0B]"
                              : "fill-[#E7E0D3] text-[#E7E0D3]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Feedback Chips */}
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {REVIEW_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                            isSelected
                              ? "bg-primary text-white font-bold shadow-2xs"
                              : "border border-border bg-[#F3EFE6] text-muted-foreground hover:bg-[#E7E0D3]"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Comment Input */}
                <div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tulis ulasan singkat (opsional)..."
                    rows={2}
                    className="w-full rounded-xl border border-input bg-card p-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs"
                >
                  Kirim Ulasan
                </Button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
