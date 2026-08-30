"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  FileText,
  MapPin,
  Phone,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { merchantApi } from "@/lib/api-client";

export default function MerchantOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Profil & Lokasi Gerai
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("Bakery & Pastry");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [operatingDays, setOperatingDays] = useState<string[]>([
    "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"
  ]);

  // Step 2: Rekening Pencairan
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // Step 3: Ketentuan Kerjasama & SLA
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [picName, setPicName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill from registration data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRaw = localStorage.getItem("fr_merchant");
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          if (user.storeName) setStoreName(user.storeName);
          if (user.name) setPicName(user.name);
          if (user.phone) setPhone(user.phone);
        } catch {}
      }
    }
  }, []);

  const toggleDay = (day: string) => {
    if (operatingDays.includes(day)) {
      if (operatingDays.length > 1) {
        setOperatingDays(operatingDays.filter((d) => d !== day));
      }
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!storeName.trim() || storeName.trim().length < 3) {
      newErrors.storeName = "Nama gerai minimal 3 karakter.";
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      newErrors.phone = "Nomor WhatsApp bisnis tidak valid (10-15 digit).";
    }

    if (!address.trim() || address.trim().length < 8) {
      newErrors.address = "Alamat fisik titik ambil minimal 8 karakter.";
    }

    if (openTime >= closeTime) {
      newErrors.operationalHours = "Jam tutup harus lebih akhir dari jam buka.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      try {
        await merchantApi.submitStep1({
          storeName,
          category,
          businessPhone: cleanPhone,
          address,
          openTime,
          closeTime,
        });
      } catch (err) {
        console.warn("Step 1 sync fallback:", err);
      }
      setCurrentStep(2);
    }
  };

  const handleNextStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const cleanAcc = accountNumber.replace(/\D/g, "");
    if (cleanAcc.length < 8 || cleanAcc.length > 18) {
      newErrors.accountNumber = "Nomor rekening harus 8-18 digit angka.";
    }

    if (!accountHolder.trim() || accountHolder.trim().length < 3) {
      newErrors.accountHolder = "Nama pemilik rekening minimal 3 karakter.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      try {
        await merchantApi.submitStep2({
          bankName,
          accountNumber: cleanAcc,
          accountHolder,
        });
      } catch (err) {
        console.warn("Step 2 sync fallback:", err);
      }
      setCurrentStep(3);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!agreedTerms) {
      newErrors.agreedTerms = "Wajib menyetujui Ketentuan Kerjasama & SLA Mitra.";
    }

    if (!picName.trim() || picName.trim().length < 3) {
      newErrors.picName = "Nama penanggung jawab minimal 3 karakter.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      await merchantApi.submitStep3({ agreedTerms, picName });
      router.push("/");
    } catch {
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-between p-4 max-w-md mx-auto w-full pb-12">
      {/* Header & Step Indicator */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <ShieldCheck className="h-3 w-3" />
            <span>Onboarding Mitra Gerai</span>
          </div>

          <span className="text-xs font-black text-muted-foreground tabular-nums">
            Langkah {currentStep} dari 3
          </span>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <div
            className={`h-1.5 rounded-full transition-all ${
              currentStep >= 1 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              currentStep >= 2 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              currentStep === 3 ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>

        {/* Step Titles */}
        {currentStep === 1 && (
          <div>
            <h1 className="text-base font-black text-foreground">1. Identitas & Titik Ambil Fisik</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Konsumen akan mengambil pesanan surplus langsung ke alamat gerai ini.
            </p>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h1 className="text-base font-black text-foreground">2. Rekening Penyaluran Dana</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pendapatan penjualan surplus (85% bersih) akan ditransfer ke rekening ini.
            </p>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h1 className="text-base font-black text-foreground">3. Ketentuan Kerjasama & SLA</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Harap baca dan setujui standar mutu pangan dan hak bagi hasil mitra.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: Profil & Lokasi Toko */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <form onSubmit={handleNextStep1} className="my-3 flex flex-col gap-3">
          <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nama Gerai / Usaha
              </label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Contoh: Artisan Bakery & Cafe"
                required
                className={`h-9 text-xs rounded-xl ${errors.storeName ? "border-destructive" : ""}`}
              />
              {errors.storeName && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.storeName}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Kategori Usaha
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-card px-2 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
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
                  WhatsApp Bisnis (PIC)
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                  className={`h-9 text-xs rounded-xl ${errors.phone ? "border-destructive" : ""}`}
                />
                {errors.phone && (
                  <span className="text-[10px] text-destructive font-semibold mt-1 block">
                    {errors.phone}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Alamat Fisik Lengkap (Titik Ambil Konsumen)
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jalan, nomor ruko/gedung, kelurahan, kota"
                required
                className={`h-9 text-xs rounded-xl ${errors.address ? "border-destructive" : ""}`}
              />
              {errors.address && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.address}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Jam Buka Toko
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
                  Jam Tutup Toko
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

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Hari Operasional Gerai
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => {
                  const isSelected = operatingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`flex-1 min-w-[38px] py-1.5 text-center text-xs font-bold rounded-lg border transition ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {errors.operationalHours && (
              <span className="text-[10px] text-destructive font-semibold block">
                {errors.operationalHours}
              </span>
            )}
          </Card>

          <Button
            type="submit"
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 gap-1.5"
          >
            <span>Lanjut: Rekening Penyaluran</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Rekening Penyaluran Dana (Non-Overflowing Vertical Stack) */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <form onSubmit={handleNextStep2} className="my-3 flex flex-col gap-3">
          <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl space-y-3">
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
                type="text"
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
                Nama Pemilik Rekening
              </label>
              <Input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Sesuai nama pada buku tabungan"
                required
                className={`h-9 text-xs rounded-xl ${errors.accountHolder ? "border-destructive" : ""}`}
              />
              {errors.accountHolder && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.accountHolder}
                </span>
              )}
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setErrors({});
                setCurrentStep(1);
              }}
              className="flex-1 h-10 rounded-xl text-xs font-bold gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali</span>
            </Button>
            <Button
              type="submit"
              className="flex-2 h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 gap-1.5"
            >
              <span>Lanjut: Perjanjian Kerjasama</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Ketentuan Kerjasama & SLA */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <form onSubmit={handleFinalSubmit} className="my-3 flex flex-col gap-3">
          <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border text-primary">
              <Scale className="h-4 w-4" />
              <h2 className="text-xs font-black text-foreground">Ringkasan SLA & Kerjasama Mitra</h2>
            </div>

            <div className="space-y-2 text-[11px] text-muted-foreground leading-relaxed max-h-48 overflow-y-auto pr-1">
              <div className="p-2 rounded-lg bg-[#F3EFE6] border border-border space-y-1 text-foreground">
                <strong className="text-primary block">1. Pembagian Hasil Transaksi (85/15)</strong>
                <p className="text-[10px] text-muted-foreground">
                  Mitra merchant menerima 85% bersih dari setiap nilai transaksi surplus yang berhasil diambil. Fee platform 15% digunakan untuk biaya payment gateway, pemeliharaan server, dan layanan konsumen.
                </p>
              </div>

              <div className="p-2 rounded-lg bg-[#F3EFE6] border border-border space-y-1 text-foreground">
                <strong className="text-primary block">2. Pakta Kualitas & Keamanan Pangan</strong>
                <p className="text-[10px] text-muted-foreground">
                  Mitra menjamin seluruh makanan surplus yang didaftarkan dalam kondisi bersih, layak konsumsi, belum basi/kedaluwarsa, dan disimpan sesuai standar sanitasi. Makanan yang menyebabkan keluhan mutu kritis dapat berakibat penonaktifan gerai.
                </p>
              </div>

              <div className="p-2 rounded-lg bg-[#F3EFE6] border border-border space-y-1 text-foreground">
                <strong className="text-primary block">3. Aturan No-Show & Pembatalan 60s</strong>
                <p className="text-[10px] text-muted-foreground">
                  Konsumen berhak membatalkan dalam jeda 60 detik pasca bayar. Setelah 60 detik, pesanan bersifat final. Jika konsumen tidak hadir (*no-show*) hingga pickup window usai, dana penjualan tetap menjadi hak merchant.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-2">
              <label className="flex items-start gap-2 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary accent-[#2D6A4F]"
                />
                <span className="text-[11px] leading-snug">
                  Saya telah membaca dan menyetujui seluruh <strong>Ketentuan Kerjasama Mitra</strong> dan <strong>SLA Mutu Pangan</strong>.
                </span>
              </label>
              {errors.agreedTerms && (
                <span className="text-[10px] text-destructive font-semibold block">
                  {errors.agreedTerms}
                </span>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Penanggung Jawab Gerai (Tanda Tangan Digital)
                </label>
                <Input
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Contoh: Budi Santoso (Pemilik / Manajer)"
                  required
                  className={`h-9 text-xs rounded-xl ${errors.picName ? "border-destructive" : ""}`}
                />
                {errors.picName && (
                  <span className="text-[10px] text-destructive font-semibold mt-1 block">
                    {errors.picName}
                  </span>
                )}
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setErrors({});
                setCurrentStep(2);
              }}
              className="flex-1 h-10 rounded-xl text-xs font-bold gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali</span>
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              className="flex-2 h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 gap-1.5"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Setujui & Buka Gerai</span>
            </Button>
          </div>
        </form>
      )}

      <div className="text-center pt-2">
        <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Proses verifikasi anti-fraud mitra resmi FOODRESCUE
        </span>
      </div>
    </div>
  );
}
