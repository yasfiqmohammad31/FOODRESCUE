"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Building,
  CheckCircle2,
  ChevronRight,
  Coins,
  CreditCard,
  History,
  Info,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDatetime, formatRupiah } from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";
import type { CreditTransaction } from "@/types";

const INITIAL_TRANSACTIONS: CreditTransaction[] = [];

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount < 10000) {
      alert("Minimal penarikan saldo adalah Rp 10.000.");
      return;
    }
    if (amount > balance) {
      alert("Nominal penarikan melebihi saldo tersedia.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const newBalance = balance - amount;
      const newTx: CreditTransaction = {
        id: `tx-${Date.now().toString().slice(-4)}`,
        creditId: "rc-001",
        orderId: null,
        amount: -amount,
        balanceAfter: newBalance,
        type: "WITHDRAWAL",
        description: `Pencairan Saldo ke ${bankName} (${accountNumber.slice(-4)})`,
        createdAt: new Date().toISOString(),
      };

      setBalance(newBalance);
      setTransactions([newTx, ...transactions]);
      setIsProcessing(false);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      setToastMessage(`Transfer ${formatRupiah(amount)} ke ${bankName} berhasil diproses!`);
      setTimeout(() => setToastMessage(null), 4000);
    }, 700);
  };

  return (
    <div className="flex flex-col flex-1 p-4 pb-28 gap-4 max-w-md mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-[#2D6A4F] flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D6A4F]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Dompet Digital Internal
        </span>
        <h1 className="text-xl font-black text-foreground">Rescue Credit</h1>
      </div>

      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E4620] via-[#2D6A4F] to-[#1B3815] p-5 text-white shadow-md">
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#65A30D]/20 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xs">
              <Coins className="h-5 w-5 text-amber-300" />
            </div>
            <span className="text-xs font-bold text-white/90">Saldo Tersedia</span>
          </div>

          <span className="rounded-full bg-[#E85D04] px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
            Instan Refund
          </span>
        </div>

        <div className="mt-4">
          <div className="text-3xl font-black tracking-tight text-white tabular-nums">
            {formatRupiah(balance)}
          </div>
          <p className="mt-1 text-xs text-white/80">
            Dapat digunakan langsung untuk checkout atau ditarik ke rekening bank.
          </p>
        </div>

        {/* Action Buttons inside Card */}
        <div className="mt-5 pt-3.5 border-t border-white/15 grid grid-cols-2 gap-2">
          <Button
            asChild
            size="sm"
            className="h-8.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#1C1917] font-black text-xs shadow-xs"
          >
            <Link href="/feed">
              <span>Pakai Rescue</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsWithdrawModalOpen(true)}
            variant="outline"
            className="h-8.5 rounded-xl bg-white/10 border-white/30 hover:bg-white/20 text-white font-bold text-xs"
          >
            <Building className="h-3.5 w-3.5 mr-1" />
            <span>Tarik ke Bank</span>
          </Button>
        </div>
      </div>

      {/* Rescue Credit Info Explanation */}
      <div className="rounded-2xl border border-border bg-card p-3.5 text-xs text-foreground flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-foreground block">Jaminan Keamanan Saldo</span>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Setiap pembatalan pada <strong>jeda 60 detik</strong> dikembalikan 100% instan ke saldo ini tanpa potongan admin.
          </p>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Riwayat Mutasi Saldo
          </h2>
          <span className="text-[10px] font-semibold text-muted-foreground">
            {transactions.length} Transaksi
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {transactions.map((tx) => {
            const isCredit = tx.type === "REFUND_IN" || tx.type === "TOPUP";

            return (
              <Card key={tx.id} className="p-3 bg-card border-border shadow-2xs rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isCredit
                          ? "bg-primary/10 text-primary"
                          : "bg-[#F3EFE6] text-foreground"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-foreground truncate">
                        {isCredit ? "Pengembalian Dana (Refund)" : tx.description}
                      </h3>
                      <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                        {formatDatetime(new Date(tx.createdAt))}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-black tabular-nums ${
                        isCredit ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {isCredit ? `+${formatRupiah(tx.amount)}` : `-${formatRupiah(tx.amount)}`}
                    </span>
                    <span className="block text-[9px] text-muted-foreground tabular-nums">
                      Sisa: {formatRupiah(tx.balanceAfter)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl border border-border space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black text-foreground">Tarik Saldo ke Rekening</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Saldo tersedia: <strong className="text-foreground">{formatRupiah(balance)}</strong>. Dana akan ditransfer via jaringan bank terintegrasi.
            </p>

            <form onSubmit={handleWithdrawSubmit} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Bank / E-Wallet Tujuan
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-8.5 rounded-xl border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">BRI</option>
                  <option value="BNI">BNI</option>
                  <option value="BSI">BSI</option>
                  <option value="GoPay">GoPay</option>
                  <option value="OVO">OVO</option>
                  <option value="DANA">DANA</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nomor Rekening / No. HP E-Wallet
                </label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 081234567890 / 8271928401"
                  required
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Pemilik Rekening
                </label>
                <Input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Sesuai nama di buku rekening"
                  required
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Nominal Penarikan (Rp)
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(balance.toString())}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Tarik Semua
                  </button>
                </div>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Minimal Rp 10.000"
                  required
                  className="h-8.5 text-xs rounded-xl font-bold tabular-nums"
                />
              </div>

              <div className="p-2 rounded-lg bg-[#F3EFE6] border border-border text-[10px] text-muted-foreground flex justify-between">
                <span>Biaya Penarikan:</span>
                <strong className="text-primary font-bold">Rp 0 (Gratis)</strong>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 text-xs font-bold h-9 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  loading={isProcessing}
                  disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > balance}
                  className="flex-1 bg-primary text-primary-foreground font-black text-xs h-9 rounded-xl shadow-xs"
                >
                  Kirim ke Bank
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
