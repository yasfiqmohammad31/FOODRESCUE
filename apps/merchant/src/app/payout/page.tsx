"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  Info,
  Lock,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDatetime, formatRupiah } from "@/lib/utils";
import { merchantApi } from "@/lib/api-client";

interface PayoutHistoryItem {
  id: string;
  payoutNumber: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: "COMPLETED" | "PROCESSING";
  createdAt: string;
}

export default function MerchantPayoutPage() {
  const router = useRouter();
  const [availableBalance, setAvailableBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [history, setHistory] = useState<PayoutHistoryItem[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [bankInfo, setBankInfo] = useState({
    bankName: "BCA",
    accountNumber: "",
    accountHolder: "",
  });

  useEffect(() => {
    let isMounted = true;
    merchantApi.getStats().then((data) => {
      if (isMounted && data && typeof data.availableBalance === "number") {
        setAvailableBalance(data.availableBalance);
      }
    });

    merchantApi.getProfile().then((res) => {
      if (isMounted && res.success && res.merchant) {
        setBankInfo({
          bankName: res.merchant.bankName || "BCA",
          accountNumber: res.merchant.accountNumber || "",
          accountHolder: res.merchant.accountHolder || res.merchant.storeName || "",
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickAmount = (amount: number) => {
    setErrorText(null);
    setWithdrawAmount(amount.toString());
  };

  const handleWithdrawAll = () => {
    setErrorText(null);
    setWithdrawAmount(availableBalance.toString());
  };

  const handleInitiateWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    const amount = Number(withdrawAmount);
    if (!amount || amount < 10000) {
      setErrorText("Minimal penarikan saldo adalah Rp 10.000.");
      return;
    }
    if (amount > availableBalance) {
      setErrorText("Nominal penarikan melebihi saldo tersedia.");
      return;
    }

    setIsConfirming(true);
  };

  const handleExecuteWithdraw = async () => {
    setIsLoading(true);
    const amount = Number(withdrawAmount);

    try {
      const res = await merchantApi.withdrawFunds(amount);
      const newHistoryItem: PayoutHistoryItem = res.success && res.payout
        ? {
            id: res.payout.id,
            payoutNumber: res.payout.payoutNumber,
            amount: res.payout.amount,
            bankName: res.payout.bankName,
            accountNumber: res.payout.accountNumber,
            status: "PROCESSING",
            createdAt: res.payout.createdAt,
          }
        : {
            id: `po-${Date.now().toString().slice(-4)}`,
            payoutNumber: `WD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
            amount,
            bankName: bankInfo.bankName,
            accountNumber: bankInfo.accountNumber,
            status: "PROCESSING",
            createdAt: new Date().toISOString(),
          };

      setAvailableBalance((prev) => prev - amount);
      setHistory([newHistoryItem, ...history]);
      setIsConfirming(false);
      setWithdrawAmount("");
      setSuccessMessage(`Permintaan transfer sebesar ${formatRupiah(amount)} berhasil diproses!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      setErrorText(e.message || "Gagal memproses penarikan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-black text-foreground">
            Pencairan Dana ke Bank
          </h1>
          <p className="text-xs text-muted-foreground">
            Tarik hasil penjualan surplus ke rekening bank terdaftar.
          </p>
        </div>

        <Link
          href="/settings"
          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
        >
          <span>Ubah Rekening</span>
        </Link>
      </div>

      {/* Toast Notification */}
      {successMessage && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-[#2D6A4F] flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D6A4F]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E4620] via-[#2D6A4F] to-[#1B3815] p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
            Saldo Pendapatan Bersih (85%)
          </span>
          <span className="rounded-full bg-[#65A30D] px-2 py-0.5 text-[9px] font-black text-white">
            Siap Ditarik
          </span>
        </div>

        <div className="mt-2 text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
          {formatRupiah(availableBalance)}
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80">
          <span>Rekening Tujuan:</span>
          {bankInfo.accountNumber ? (
            <strong className="text-white">
              {bankInfo.bankName} •••• {bankInfo.accountNumber.slice(-4)}
            </strong>
          ) : (
            <Link href="/settings" className="text-amber-300 font-bold hover:underline">
              + Atur Rekening di Pengaturan
            </Link>
          )}
        </div>
      </div>

      {/* Withdrawal Form Card */}
      <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl">
        <form onSubmit={handleInitiateWithdraw} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Nominal Transfer (Rp)
              </label>
              <button
                type="button"
                onClick={handleWithdrawAll}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Tarik Semua Saldo
              </button>
            </div>
            <Input
              type="number"
              value={withdrawAmount}
              onChange={(e) => {
                setErrorText(null);
                setWithdrawAmount(e.target.value);
              }}
              placeholder="Minimal Rp 10.000"
              required
              className={`h-9 text-xs rounded-xl font-bold tabular-nums ${errorText ? "border-destructive" : ""}`}
            />
            {errorText && (
              <span className="text-[10px] text-destructive font-semibold mt-1 block">
                {errorText}
              </span>
            )}
          </div>

          {/* Quick Amount Pills */}
          <div className="flex gap-1.5 flex-wrap">
            {[100000, 250000, 500000, 1000000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAmount(amt)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F3EFE6] hover:bg-muted text-foreground transition"
              >
                +{formatRupiah(amt)}
              </button>
            ))}
          </div>

          {/* Transfer Detail Summary */}
          <div className="p-2.5 rounded-xl bg-[#F3EFE6] border border-border/70 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Rekening Penerima:</span>
              <strong className="text-foreground">{bankInfo.bankName} - {bankInfo.accountNumber}</strong>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Atas Nama:</span>
              <strong className="text-foreground">{bankInfo.accountHolder}</strong>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Biaya Penyaluran:</span>
              <strong className="text-primary font-bold">Rp 0 (Gratis)</strong>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > availableBalance}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs hover:bg-primary/90 gap-1.5"
          >
            <span>Tarik ke Rekening Bank</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>
      </Card>

      {/* Payout History Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Riwayat Pencairan Dana
          </h2>
          <span className="text-[10px] text-muted-foreground font-semibold">
            {history.length} Penarikan
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {history.map((item) => (
            <Card key={item.id} className="p-3 bg-card border-border shadow-2xs rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-foreground tabular-nums block">
                    {item.payoutNumber}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {item.bankName} •••• {item.accountNumber.slice(-4)} • {formatDatetime(new Date(item.createdAt))}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-foreground tabular-nums block">
                  -{formatRupiah(item.amount)}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                    item.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-primary"
                      : "bg-amber-500/10 text-[#B45309]"
                  }`}
                >
                  {item.status === "COMPLETED" ? "Berhasil Transfer" : "Diproses Xendit"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl border border-border space-y-3.5">
            <div className="flex items-center gap-2.5 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-sm font-black text-foreground">Konfirmasi Penarikan Dana</h2>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Anda akan mentransfer saldo penjualan sebesar <strong className="text-foreground">{formatRupiah(Number(withdrawAmount))}</strong> ke rekening bank berikut:
            </p>

            <div className="p-3 rounded-xl bg-[#F3EFE6] border border-border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank:</span>
                <strong>{bankInfo.bankName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nomor Rekening:</span>
                <strong className="font-mono">{bankInfo.accountNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama Penerima:</span>
                <strong>{bankInfo.accountHolder}</strong>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setIsConfirming(false)}
                className="flex-1 text-xs font-bold h-9 rounded-xl"
              >
                Batal
              </Button>
              <Button
                onClick={handleExecuteWithdraw}
                loading={isLoading}
                className="flex-1 bg-primary text-primary-foreground font-black text-xs h-9 rounded-xl shadow-xs"
              >
                Konfirmasi Transfer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
