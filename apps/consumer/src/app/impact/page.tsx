"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Award,
  Globe2,
  Leaf,
  Salad,
  Share2,
  ShieldCheck,
  Sprout,
  Star,
  TreeDeciduous,
  UtensilsCrossed,
} from "lucide-react";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";
import type { Badge } from "@/types";

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "bdg-01": Sprout,
  "bdg-02": Salad,
  "bdg-03": Globe2,
  "bdg-04": ShieldCheck,
  "bdg-05": Leaf,
  "bdg-06": Star,
};

const DEFAULT_STATS = {
  totalPortionsSaved: 0,
  totalCo2PreventedKg: 0,
  totalMoneySaved: 0,
  treesEquivalent: 0,
};

const USER_PROFILE = {
  name: "Alex Pratama",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
};

const DEFAULT_BADGES: Badge[] = [
  {
    id: "bdg-01",
    name: "First Rescue",
    description: "Menyelamatkan porsi makanan surplus pertamamu.",
    iconUrl: "sprout",
    criteria: { type: "PORTIONS", threshold: 1 },
    earnedAt: "2026-08-05T12:00:00Z",
  },
  {
    id: "bdg-02",
    name: "Rescue Regular",
    description: "Telah menyelamatkan 10 porsi makanan dari pembuangan.",
    iconUrl: "salad",
    criteria: { type: "PORTIONS", threshold: 10 },
    earnedAt: "2026-08-22T19:30:00Z",
  },
  {
    id: "bdg-03",
    name: "Carbon Warrior",
    description: "Mencegah minimal 50 kg emisi CO2e ke atmosfer.",
    iconUrl: "globe",
    criteria: { type: "CO2_SAVED", threshold: 50 },
    progress: 70,
  },
];

export default function ImpactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [badges, setBadges] = useState<Badge[]>(DEFAULT_BADGES);

  useEffect(() => {
    let isMounted = true;
    consumerApi.getImpact().then((res) => {
      if (isMounted && res.success && res.stats) {
        setStats({
          totalPortionsSaved: res.stats.portionsSaved ?? 14,
          totalCo2PreventedKg: res.stats.co2eSavedKg ?? 35.0,
          totalMoneySaved: res.stats.moneySavedRp ?? 320000,
          treesEquivalent: res.stats.treesEquivalent ?? 2.1,
        });
        if (res.badges) setBadges(res.badges);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const treesEquivalent = (stats.totalCo2PreventedKg / 21).toFixed(1);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Dampak Penyelamatan Pangan",
        text: `Saya telah menyelamatkan ${stats.totalPortionsSaved} porsi makanan dan mencegah ${stats.totalCo2PreventedKg} kg CO2e bersama FOODRESCUE!`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="flex flex-col flex-1 p-4 pb-28 gap-3.5 max-w-md mx-auto w-full">
      {/* Profile & Level Header */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-card border border-border p-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-[#F3EFE6] border border-primary/20">
            <Image
              src={USER_PROFILE.avatarUrl}
              alt={USER_PROFILE.name}
              fill
              className="object-cover"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                LEVEL 12
              </span>
              <h1 className="text-xs font-black text-foreground">
                {USER_PROFILE.name}
              </h1>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Food Hero • Sejak Agustus 2026
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="h-8 rounded-xl text-[11px] font-bold gap-1 text-primary border-primary hover:bg-primary/10 shadow-2xs shrink-0"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Bagikan</span>
        </Button>
      </div>

      {isLoading ? (
        <ImpactSkeleton />
      ) : (
        <>
          {/* Main Hero Impact Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E4620] via-[#2D6A4F] to-[#1B3815] p-5 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-amber-300" />
                <span className="text-xs font-bold text-white/90">Dampak Kumulatif</span>
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                Top 5% Penyelamat
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-white/70 uppercase tracking-wider block">
                  Porsi Diselamatkan
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-0.5">
                  {stats.totalPortionsSaved} <span className="text-xs font-normal text-white/80">Porsi</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-white/70 uppercase tracking-wider block">
                  Emisi CO2e Dicegah
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-0.5">
                  {stats.totalCo2PreventedKg} <span className="text-xs font-normal text-white/80">kg</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-white/90">
              <span className="truncate">Setara serapan oksigen <strong>{treesEquivalent} pohon/tahun</strong></span>
              <TreeDeciduous className="h-4 w-4 text-emerald-300 shrink-0 ml-2" />
            </div>
          </div>

          {/* Secondary Metric Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <Card className="p-3 bg-card border-border shadow-2xs rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Total Hemat Pengeluaran
              </span>
              <div className="text-base font-black text-primary tabular-nums mt-1 truncate">
                {formatRupiah(stats.totalMoneySaved)}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Dibandingkan harga normal
              </span>
            </Card>

            <Card className="p-3 bg-card border-border shadow-2xs rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Total Limbah Pangan Dicegah
              </span>
              <div className="text-base font-black text-foreground tabular-nums mt-1">
                {stats.totalPortionsSaved * 0.4} kg
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Tidak terbuang ke TPA
              </span>
            </Card>
          </div>

          {/* Badges Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Lencana Pencapaian ({badges.filter((b: Badge) => Boolean(b.earnedAt)).length}/{badges.length})
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {badges.map((badge: Badge) => {
                const IconComponent = BADGE_ICONS[badge.id] || Award;
                const isUnlocked = Boolean(badge.earnedAt);

                return (
                  <Card
                    key={badge.id}
                    className={`p-2.5 bg-card border text-center flex flex-col items-center justify-between gap-1.5 rounded-xl shadow-2xs ${
                      isUnlocked ? "border-primary/30" : "border-border opacity-50"
                    }`}
                    title={`${badge.name}: ${badge.description}`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isUnlocked
                          ? "bg-primary text-white shadow-xs"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div>
                      <h3
                        className="text-[11px] font-black text-foreground line-clamp-1"
                        title={badge.name}
                      >
                        {badge.name}
                      </h3>
                      <p
                        className="text-[9px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug"
                        title={badge.description}
                      >
                        {badge.description}
                      </p>
                    </div>

                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                        isUnlocked
                          ? "bg-emerald-500/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isUnlocked ? "Terbuka" : "Terkunci"}
                    </span>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ImpactSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-44 rounded-3xl" />
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  );
}
