"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Flame,
  Globe2,
  Leaf,
  TrendingUp,
  TreeDeciduous,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/utils";
import { merchantApi } from "@/lib/api-client";

export default function MerchantAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState<"7D" | "30D">("7D");

  const WEEKLY_SALES_DATA = [
    { day: "Sen", portions: 6, revenue: 132000, wasteKg: 15.0 },
    { day: "Sel", portions: 8, revenue: 176000, wasteKg: 20.0 },
    { day: "Rab", portions: 5, revenue: 110000, wasteKg: 12.5 },
    { day: "Kam", portions: 9, revenue: 198000, wasteKg: 22.5 },
    { day: "Jum", portions: 12, revenue: 264000, wasteKg: 30.0 },
    { day: "Sab", portions: 15, revenue: 330000, wasteKg: 37.5 },
    { day: "Min", portions: 11, revenue: 242000, wasteKg: 27.5 },
  ];

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-foreground">
            Dampak & Analitik
          </h1>
          <p className="text-xs text-muted-foreground">
            Laporan porsi surplus, reduksi emisi, dan pendapatan tambahan gerai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-[#F3EFE6] p-0.5 border border-border text-xs font-bold">
            <button
              type="button"
              onClick={() => setPeriod("7D")}
              className={`px-3 py-1 rounded-lg transition ${
                period === "7D"
                  ? "bg-primary text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriod("30D")}
              className={`px-3 py-1 rounded-lg transition ${
                period === "30D"
                  ? "bg-primary text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              30 Hari
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Total Diselamatkan
                </span>
                <div className="text-lg font-black text-foreground tabular-nums">
                  248 Porsi
                </div>
                <span className="text-[10px] text-primary font-semibold block truncate">
                  99.2 kg limbah dicegah
                </span>
              </div>
            </Card>

            <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-[#2D6A4F]">
                <Leaf className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Reduksi Emisi CO2e
                </span>
                <div className="text-lg font-black text-foreground tabular-nums">
                  620 kg
                </div>
                <span className="text-[10px] text-[#2D6A4F] font-semibold block truncate">
                  Setara 4.5 pohon/bulan
                </span>
              </div>
            </Card>

            <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-[#B45309]">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Total Pendapatan
                </span>
                <div className="text-lg font-black text-foreground tabular-nums truncate">
                  {formatRupiah(5456000)}
                </div>
                <span className="text-[10px] text-[#B45309] font-semibold block truncate">
                  Bagi hasil 85% bersih
                </span>
              </div>
            </Card>
          </div>

          {/* Weekly Sales Chart Card */}
          <Card className="p-4 bg-card border-border shadow-2xs rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tren Penjualan Surplus ({period})
                </h2>
                <span className="text-sm font-black text-foreground">
                  Rata-rata 9.6 porsi/hari
                </span>
              </div>

              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                +24% vs minggu lalu
              </span>
            </div>

            {/* Simple Bar Visualization */}
            <div className="pt-4 pb-2 flex items-end justify-between gap-2 h-36">
              {WEEKLY_SALES_DATA.map((item) => {
                const maxPortions = 15;
                const heightPercent = Math.round((item.portions / maxPortions) * 100);

                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] font-bold text-muted-foreground tabular-nums group-hover:text-primary transition">
                      {item.portions}
                    </span>
                    <div
                      className="w-full max-w-[28px] rounded-t-lg bg-primary/20 group-hover:bg-primary transition-all duration-200"
                      style={{ height: `${heightPercent}%` }}
                      title={`${item.day}: ${item.portions} porsi (${formatRupiah(item.revenue)})`}
                    />
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
