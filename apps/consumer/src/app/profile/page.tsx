"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Award,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  HelpCircle,
  Info,
  LogOut,
  MessageCircle,
  Moon,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";

const USER_PROFILE = {
  name: "Alex Pratama",
  email: "alex@kampus.ac.id",
  phone: "+6281234567890",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
};

const ALLERGEN_OPTIONS = [
  "Gluten (Gandum/Tepung)",
  "Dairy (Susu & Olahan)",
  "Eggs (Telur)",
  "Seafood & Ikan",
  "Kacang-kacangan",
  "Soy (Kedelai)",
];

export default function ProfilePage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Modals state
  const [activeModal, setActiveModal] = useState<"SAFETY" | "HELP" | "ALLERGENS" | null>(null);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggleAllergen = (item: string) => {
    if (selectedAllergens.includes(item)) {
      setSelectedAllergens(selectedAllergens.filter((a) => a !== item));
    } else {
      setSelectedAllergens([...selectedAllergens, item]);
    }
  };

  const handleSaveAllergens = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveModal(null);
    }, 800);
  };

  return (
    <div className="flex flex-col flex-1 p-4 pb-24 gap-4">
      {/* Profile Header */}
      <Card className="p-4 bg-card border-border shadow-2xs">
        <div className="flex items-center gap-3.5">
          <Avatar className="h-14 w-14 border-2 border-primary/40 shadow-xs">
            <AvatarImage src={USER_PROFILE.avatarUrl} />
            <AvatarFallback className="bg-primary/15 text-primary font-bold">AP</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-foreground">{USER_PROFILE.name}</h1>
              <Badge className="bg-primary text-white text-[10px] py-0">Food Hero</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{USER_PROFILE.email}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{USER_PROFILE.phone}</p>
          </div>
        </div>
      </Card>

      {/* Quick Wallet Link */}
      <Link href="/wallet" className="block focus:outline-hidden group">
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#1E4620] via-[#2D6A4F] to-[#1B3815] p-4 text-white shadow-xs group-hover:opacity-95 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Wallet className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-100">Saldo Rescue Credit</span>
              <div className="text-base font-black text-white tabular-nums">{formatRupiah(45000)}</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>

      {/* Preferences Section */}
      <Card className="p-2 bg-card border-border shadow-2xs">
        <div className="divide-y divide-border/60">
          {/* Notification Toggle */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Push Notifikasi Penyelamatan</span>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              aria-label="Aktifkan push notifikasi"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-[#2D6A4F] cursor-pointer"
            />
          </div>

          {/* Badges Link */}
          <Link href="/impact" className="flex items-center justify-between p-3 hover:bg-muted/40 transition">
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Lencana & Statistik Dampak</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          {/* Allergens Preference Trigger */}
          <button
            type="button"
            onClick={() => setActiveModal("ALLERGENS")}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 transition"
          >
            <div className="flex items-center gap-3">
              <Utensils className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Preferensi Pantangan / Alergi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">
                {selectedAllergens.length > 0 ? `${selectedAllergens.length} Dipilih` : "Tidak Ada"}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </div>
      </Card>

      {/* Support & Safety Policy Section */}
      <Card className="p-2 bg-card border-border shadow-2xs">
        <div className="divide-y divide-border/60">
          {/* Food Safety Policy Trigger */}
          <button
            type="button"
            onClick={() => setActiveModal("SAFETY")}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 transition"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-foreground">Standar Keamanan Pangan & Higienitas</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Help Center & Undo Policy Trigger */}
          <button
            type="button"
            onClick={() => setActiveModal("HELP")}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 transition"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Pusat Bantuan & Kebijakan Undo</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </Card>

      {/* Logout */}
      <Button
        asChild
        variant="ghost"
        className="w-full justify-center gap-2 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive h-10 rounded-xl"
      >
        <Link href="/login">
          <LogOut className="h-4 w-4" />
          <span>Keluar dari Akun</span>
        </Link>
      </Button>

      <div className="text-center text-[10px] text-muted-foreground pt-1">
        FOODRESCUE v1.0.0 (MVP) • Save Food. Save Money.
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: Standar Keamanan Pangan & Higienitas */}
      {/* ========================================================================= */}
      {activeModal === "SAFETY" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="safety-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 id="safety-modal-title" className="text-sm font-black text-foreground">
                  Standar Keamanan & Higienitas
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Tutup"
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-3 text-emerald-950">
                <span className="font-bold block mb-0.5">Jaminan Kualitas FOODRESCUE:</span>
                Makanan surplus yang dijual <strong>bukanlah sisa makanan dari piring konsumen</strong>, melainkan makanan layak konsumsi yang belum terjual dari batch harian gerai.
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-sand-100/70 border border-border flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">1</span>
                  <div>
                    <h3 className="font-bold text-foreground">Produksi & Panggang di Hari yang Sama</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Semua produk bento, bakery, dan pastry dimasak pada tanggal yang sama dengan jadwal pickup.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sand-100/70 border border-border flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">2</span>
                  <div>
                    <h3 className="font-bold text-foreground">Penyimpanan Suhu Terkontrol</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Produk dingin (sushi/salad) disimpan dalam chiller &le; 4&deg;C dan makanan hangat disimpan dalam warmer higienis.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sand-100/70 border border-border flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">3</span>
                  <div>
                    <h3 className="font-bold text-foreground">Kemasan Rapi Food-Grade</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Diserahkan dalam wadah bersegel bersih untuk mencegah kontaminasi saat perjalanan pulang.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sand-100/70 border border-border flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">4</span>
                  <div>
                    <h3 className="font-bold text-foreground">Garansi 100% Kompensasi Saldo</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Jika makanan yang diterima tidak layak santap, foto bukti saat serah terima dan saldo akan dikembalikan 100% ke Rescue Credit.</p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setActiveModal(null)}
              className="w-full h-10 rounded-xl bg-primary text-white text-xs font-bold"
            >
              Saya Mengerti
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Modal: Pusat Bantuan & Kebijakan Undo / No-Show */}
      {/* ========================================================================= */}
      {activeModal === "HELP" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 id="help-modal-title" className="text-sm font-black text-foreground">
                  Pusat Bantuan & Kebijakan
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Tutup"
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl border border-border bg-sand-50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <RotateCcw className="h-4 w-4 text-emerald-600" />
                  <span>Bagaimana Cara Kerja Instant Undo 60 Detik?</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Setelah pembayaran berhasil, Anda memiliki jeda 60 detik sebelum pesanan dikirim ke gerai. Jika salah memesan, cukup tekan tombol <strong>Batalkan Pesanan</strong> dan dana akan kembali 100% seketika ke Rescue Credit Anda.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-sand-50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>Apa itu Kebijakan No-Show?</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Makanan surplus memiliki masa simpan terbatas. Jika Anda tidak mengambil pesanan hingga batas waktu pengambilan (*pickup window*) berakhir, pesanan dinyatakan hangus tanpa pengembalian dana demi melindungi kepastian operasional mitra gerai.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-sand-50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>Butuh Bantuan Mendesak?</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tim Support FOODRESCUE siap membantu kendala pengambilan atau kendala aplikasi melalui WhatsApp Support Kampus (08:00 - 22:00 WIB).
                </p>
              </div>
            </div>

            <Button
              onClick={() => setActiveModal(null)}
              className="w-full h-10 rounded-xl bg-primary text-white text-xs font-bold"
            >
              Tutup Pusat Bantuan
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Modal: Preferensi Pantangan / Alergi */}
      {/* ========================================================================= */}
      {activeModal === "ALLERGENS" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="allergen-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <h2 id="allergen-modal-title" className="text-sm font-black text-foreground">
                  Preferensi Pantangan & Alergi
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Tutup"
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Pilih bahan yang ingin Anda hindari. Makanan yang mengandung bahan ini akan ditandai dengan peringatan khusus di feed.
            </p>

            <div className="grid grid-cols-1 gap-2 my-2">
              {ALLERGEN_OPTIONS.map((item) => {
                const isSelected = selectedAllergens.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleAllergen(item)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-2xs font-bold"
                        : "border-border bg-sand-50/60 text-foreground hover:bg-sand-100"
                    }`}
                  >
                    <span>{item}</span>
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        isSelected ? "bg-primary border-primary text-white" : "border-border bg-card"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleSaveAllergens}
              className="w-full h-11 rounded-xl bg-primary text-white text-xs font-bold shadow-sm"
            >
              {saveSuccess ? "Tersimpan" : "Simpan Preferensi"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
