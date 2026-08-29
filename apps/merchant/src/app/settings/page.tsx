"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  CreditCard,
  LogOut,
  MapPin,
  Power,
  Save,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
export default function MerchantSettingsPage() {
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [storeName, setStoreName] = useState("Artisan Bakery & Cafe");
  const [category, setCategory] = useState("Bakery & Pastry");
  const [address, setAddress] = useState("Jl. Raya Darmo Permai No. 45, Surabaya");
  const [description, setDescription] = useState("Artisan bakery & specialty sourdough dengan komitmen nol limbah pangan.");

  // Operational schedule
  const [openTime, setOpenTime] = useState("07:00");
  const [closeTime, setCloseTime] = useState("21:30");
  const [operatingDays, setOperatingDays] = useState<string[]>([
    "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"
  ]);

  // Bank Disbursement Info
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("8271928401");
  const [accountHolder, setAccountHolder] = useState("Artisan Bakery Official");

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const toggleDay = (day: string) => {
    if (operatingDays.includes(day)) {
      if (operatingDays.length > 1) {
        setOperatingDays(operatingDays.filter((d) => d !== day));
      }
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (storeName.trim().length < 3) {
      newErrors.storeName = "Nama gerai minimal 3 karakter.";
    }

    if (address.trim().length < 8) {
      newErrors.address = "Alamat gerai harus lengkap (minimal 8 karakter).";
    }

    if (openTime >= closeTime) {
      newErrors.operationalHours = "Jam tutup harus lebih akhir daripada jam buka.";
    }

    if (operatingDays.length === 0) {
      newErrors.operatingDays = "Pilih minimal 1 hari operasional.";
    }

    const cleanAcc = accountNumber.replace(/\D/g, "");
    if (cleanAcc.length < 8 || cleanAcc.length > 18) {
      newErrors.accountNumber = "Nomor rekening harus 8-18 digit angka.";
    }

    if (accountHolder.trim().length < 3) {
      newErrors.accountHolder = "Nama pemilik rekening minimal 3 karakter.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-base sm:text-lg font-black text-foreground">
          Pengaturan Gerai
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola profil gerai, status operasional, dan rekening pencairan dana.
        </p>
      </div>

      {/* Instant Store Status Card */}
      <Card className="p-4 bg-card border-border shadow-2xs rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              isStoreOpen ? "bg-emerald-500/10 text-primary" : "bg-destructive/10 text-destructive"
            }`}
          >
            <Power className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-foreground">
              Status Gerai Saat Ini:{" "}
              <strong className={isStoreOpen ? "text-primary font-black" : "text-destructive font-black"}>
                {isStoreOpen ? "Buka (Menerima Pesanan)" : "Tutup Sementara"}
              </strong>
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {isStoreOpen
                ? "Listing Anda aktif dan dapat dibeli konsumen."
                : "Semua listing disembunyikan sementara dari pembeli."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsStoreOpen(!isStoreOpen)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition border shrink-0 ${
            isStoreOpen
              ? "bg-destructive text-white hover:bg-destructive/90 border-destructive"
              : "bg-primary text-white hover:bg-primary/90 border-primary"
          }`}
        >
          {isStoreOpen ? "Tutup Gerai" : "Buka Gerai"}
        </button>
      </Card>

      {/* Main Form Card with Generous Spacing */}
      <Card className="p-4 bg-card border-border shadow-2xs rounded-2xl">
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Section 1: Store Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/70">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                1. Informasi Gerai
              </h2>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded">
                Terverifikasi
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nama Gerai / Toko
              </label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className={`h-9 text-xs rounded-xl ${errors.storeName ? "border-destructive" : ""}`}
              />
              {errors.storeName && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.storeName}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Kategori Usaha
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="Bakery & Pastry">Bakery & Pastry</option>
                <option value="Cafe & Kopi">Cafe & Kopi</option>
                <option value="Restoran / Rumah Makan">Restoran / Rumah Makan</option>
                <option value="Warung & Kuliner Lokal">Warung & Kuliner Lokal</option>
                <option value="Supermarket / Buah">Supermarket / Buah</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Alamat Fisik Titik Ambil (Pickup Point)
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className={`h-9 text-xs rounded-xl ${errors.address ? "border-destructive" : ""}`}
              />
              {errors.address && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.address}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Deskripsi Toko
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="border-t border-border/70" />

          {/* Section 2: Operational Schedule */}
          <div className="space-y-3">
            <div className="pb-1.5 border-b border-border/70">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                2. Jam & Hari Operasional
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Jam Buka
                </label>
                <Input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  required
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Jam Tutup
                </label>
                <Input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  required
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>
            {errors.operationalHours && (
              <span className="text-[10px] text-destructive font-semibold block">
                {errors.operationalHours}
              </span>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Hari Operasional
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => {
                  const isSelected = operatingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        isSelected
                          ? "bg-primary text-white shadow-2xs"
                          : "bg-[#F3EFE6] text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {errors.operatingDays && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.operatingDays}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-border/70" />

          {/* Section 3: Bank Disbursement (Alternative Full-Width Stacked Layout with Zero Overflow) */}
          <div className="space-y-3">
            <div className="pb-1.5 border-b border-border/70">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                3. Rekening Penyaluran Dana Penjualan
              </h2>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Bank Tujuan Pencairan
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="BCA">Bank Central Asia (BCA)</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                <option value="BNI">Bank Negara Indonesia (BNI)</option>
                <option value="BSI">Bank Syariah Indonesia (BSI)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nomor Rekening Bank
              </label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Contoh: 8271928401"
                required
                className={`h-9 text-xs rounded-xl font-mono ${errors.accountNumber ? "border-destructive" : ""}`}
              />
              {errors.accountNumber && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.accountNumber}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nama Pemilik Rekening (Sesuai Buku Tabungan)
              </label>
              <Input
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Nama lengkap pemilik rekening"
                required
                className={`h-9 text-xs rounded-xl ${errors.accountHolder ? "border-destructive" : ""}`}
              />
              {errors.accountHolder && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.accountHolder}
                </span>
              )}
            </div>
          </div>

          {/* Form Bottom Bar */}
          <div className="border-t border-border/70 pt-2 flex items-center justify-between gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs font-bold text-destructive hover:underline"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar dari Akun</span>
            </Link>

            <div className="flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1 text-xs font-bold text-primary animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Pengaturan Tersimpan!
                </span>
              )}
              <Button
                type="submit"
                className="h-9 px-5 text-xs font-black bg-primary text-primary-foreground rounded-xl gap-1.5 shadow-xs hover:bg-primary/90"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Perubahan</span>
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
