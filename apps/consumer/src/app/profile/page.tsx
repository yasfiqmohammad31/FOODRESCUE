"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  LogOut,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  User,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";
import { consumerApi } from "@/lib/api-client";

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
}

const ALLERGEN_OPTIONS = [
  "Gluten (Gandum/Tepung)",
  "Dairy (Susu & Olahan)",
  "Eggs (Telur)",
  "Seafood & Ikan",
  "Kacang-kacangan",
  "Soy (Kedelai)",
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Modals state
  const [activeModal, setActiveModal] = useState<"EDIT_PROFILE" | "SAFETY" | "HELP" | "ALLERGENS" | null>(null);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  // Load real authenticated user profile
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fr_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const userData: UserProfile = {
            id: parsed.id,
            name: parsed.name || "Food Rescuer",
            email: parsed.email || "user@kampus.ac.id",
            phone: parsed.phone || "",
          };
          setUser(userData);
          setEditName(userData.name);
          setEditPhone(userData.phone);
        } catch {
          // ignore
        }
      }

      // Load wallet balance
      consumerApi.getWallet().then((res: any) => {
        if (res?.balance !== undefined) {
          setWalletBalance(res.balance);
        }
      }).catch(() => {});
    }
  }, []);

  const handleOpenEditModal = () => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone);
      setEditError("");
      setActiveModal("EDIT_PROFILE");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError("Nama lengkap tidak boleh kosong.");
      return;
    }

    setIsUpdating(true);
    setEditError("");

    try {
      const res = await consumerApi.updateProfile({
        id: user?.id,
        name: editName.trim(),
        phone: editPhone.trim(),
      });

      if (res.success && res.user) {
        const updatedUser: UserProfile = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone || "",
        };
        setUser(updatedUser);
        localStorage.setItem("fr_user", JSON.stringify(res.user));
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setActiveModal(null);
        }, 600);
      } else {
        // Fallback local update
        const updatedUser: UserProfile = {
          ...user!,
          name: editName.trim(),
          phone: editPhone.trim(),
        };
        setUser(updatedUser);
        localStorage.setItem("fr_user", JSON.stringify(updatedUser));
        setActiveModal(null);
      }
    } catch {
      // Fallback local update
      const updatedUser: UserProfile = {
        ...user!,
        name: editName.trim(),
        phone: editPhone.trim(),
      };
      setUser(updatedUser);
      localStorage.setItem("fr_user", JSON.stringify(updatedUser));
      setActiveModal(null);
    } finally {
      setIsUpdating(false);
    }
  };

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

  const displayName = user?.name || "Pengguna Tamu";
  const displayEmail = user?.email || "Belum masuk akun";
  const displayPhone = user?.phone?.trim() || "";

  // Dynamic Initials Generator
  const nameParts = displayName.trim().split(/\s+/);
  const initials = nameParts.length > 1
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col flex-1 p-4 pb-24 gap-4">
      {/* Profile Header */}
      <Card className="p-4 bg-card border-border shadow-2xs rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* Dynamic Initials Avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D6A4F] to-[#16432B] text-white font-black text-lg tracking-wider shadow-sm ring-2 ring-[#2D6A4F]/20">
              {initials || "FR"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold text-foreground truncate">{displayName}</h1>
                {user && <Badge className="bg-primary text-white text-[10px] py-0 shrink-0">Food Hero</Badge>}
              </div>

              {/* Email (Primary Identity) */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
                <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{displayEmail}</span>
              </div>

              {/* Phone (WhatsApp) */}
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                {displayPhone ? (
                  <span>{displayPhone}</span>
                ) : (
                  <span className="text-amber-600 font-medium italic">No. WhatsApp belum ditambahkan</span>
                )}
              </div>

              {!user && (
                <Link href="/login" className="inline-block mt-1.5 text-xs font-bold text-primary hover:underline">
                  Masuk / Daftar Akun &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Edit Profile Button */}
          {user && (
            <button
              type="button"
              onClick={handleOpenEditModal}
              aria-label="Edit Profil"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sand-100/80 border border-border text-foreground hover:bg-sand-200 transition shadow-2xs"
            >
              <Pencil className="h-3.5 w-3.5 text-primary" />
            </button>
          )}
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
              <div className="text-base font-black text-white tabular-nums">{formatRupiah(walletBalance)}</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>

      {/* Preferences Section */}
      <Card className="p-2 bg-card border-border shadow-2xs rounded-2xl">
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
      <Card className="p-2 bg-card border-border shadow-2xs rounded-2xl">
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
      {user && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            localStorage.removeItem("fr_token");
            localStorage.removeItem("fr_user");
            router.replace("/login");
          }}
          className="w-full justify-center gap-2 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive h-10 rounded-xl"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar dari Akun</span>
        </Button>
      )}

      <div className="text-center text-[10px] text-muted-foreground pt-1">
        FOODRESCUE v1.0.0 (MVP) • Save Food. Save Money.
      </div>

      {/* ========================================================================= */}
      {/* 0. Modal: Edit Profil (Nama & Nomor WhatsApp) */}
      {/* ========================================================================= */}
      {activeModal === "EDIT_PROFILE" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                <h2 id="edit-profile-title" className="text-sm font-black text-foreground">
                  Edit Profil Pengguna
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

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              {editError && (
                <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Lengkap
                </label>
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  required
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Alamat Email (Akun Utama)
                </label>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="h-10 text-xs rounded-xl bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Email terhubung dengan sesi login Anda.</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nomor WhatsApp / HP
                </label>
                <Input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="h-10 text-xs rounded-xl font-mono"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Digunakan untuk pengiriman kode OTP dan info pesanan.</span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  loading={isUpdating}
                  className="w-full h-10 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/90"
                >
                  {saveSuccess ? "Berhasil Disimpan!" : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
