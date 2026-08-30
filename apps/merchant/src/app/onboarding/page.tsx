"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  ExternalLink,
  FileCheck,
  FileText,
  Link2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { extractCoordinatesFromMapsUrl } from "@/lib/utils";
import { merchantApi } from "@/lib/api-client";

export default function MerchantOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Profil & Lokasi Gerai
  const [storeName, setStoreName] = useState("");
  const [categories, setCategories] = useState<string[]>([
    "Bakery & Pastry",
    "Cafe & Minuman",
    "Restoran & Rumah Makan",
    "Warung & Kuliner Lokal",
    "Supermarket & Buah Segar",
    "Hotel & Buffet",
    "Fast Food & Cemilan",
  ]);
  const [category, setCategory] = useState("Bakery & Pastry");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
  const [lat, setLat] = useState<number>(-7.2856);
  const [lng, setLng] = useState<number>(112.6954);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState<string | null>(null);

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

  // Prefill from backend & registration data
  useEffect(() => {
    let isMounted = true;
    merchantApi.getCategories().then((cats) => {
      if (isMounted && cats && cats.length > 0) {
        setCategories(cats);
      }
    });

    if (typeof window !== "undefined") {
      const userRaw = localStorage.getItem("fr_merchant");
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          if (user.storeName) setStoreName(user.storeName);
          if (user.name) setPicName(user.name);
          if (user.phone) setPhone(user.phone);
          if (user.category) setCategory(user.category);
        } catch {}
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleMapsUrlChange = (val: string) => {
    setMapsUrl(val);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.location;
      delete next.mapsUrl;
      return next;
    });

    if (!val.trim()) return;

    const coords = extractCoordinatesFromMapsUrl(val);
    if (coords) {
      setLat(coords.lat);
      setLng(coords.lng);
      setGpsSuccess(`Koordinat GPS terdeteksi otomatis dari link: ${coords.lat}, ${coords.lng}`);
      setTimeout(() => setGpsSuccess(null), 5000);
    }
  };

  const handleGetGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        location: "Perangkat atau peramban Anda tidak mendukung GPS Geolocation.",
      }));
      return;
    }

    setIsLocating(true);
    setGpsSuccess(null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.location;
      return next;
    });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
        setLat(newLat);
        setLng(newLng);
        if (!mapsUrl) {
          setMapsUrl(`https://maps.google.com/?q=${newLat},${newLng}`);
        }
        setIsLocating(false);
        setGpsSuccess(`Titik koordinat berhasil dideteksi (Akurasi: ±${Math.round(pos.coords.accuracy)} meter).`);
        setTimeout(() => setGpsSuccess(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        setErrors((prev) => ({
          ...prev,
          location: `Gagal membaca GPS: ${err.message}. Anda dapat mengisi link Google Maps atau angka Latitude & Longitude.`,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
          mapsUrl: mapsUrl.trim() || undefined,
          location: { lat: Number(lat), lng: Number(lng) },
          openTime,
          closeTime,
          operatingDays,
        });

        // Update local storage
        const userRaw = localStorage.getItem("fr_merchant");
        if (userRaw) {
          const user = JSON.parse(userRaw);
          user.storeName = storeName;
          user.category = category;
          localStorage.setItem("fr_merchant", JSON.stringify(user));
        }
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
              Konsumen akan mengambil pesanan surplus langsung ke alamat dan titik GPS gerai ini.
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
          <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl space-y-3">
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
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
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

            {/* Titik Lokasi Peta / GPS Restoran */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>Titik Lokasi & Google Maps Gerai</span>
                </div>
                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold shadow-2xs hover:bg-primary/90 transition disabled:opacity-50"
                >
                  <LocateFixed className={`h-3 w-3 ${isLocating ? "animate-spin" : ""}`} />
                  <span>{isLocating ? "Mencari GPS..." : "Deteksi GPS Saya"}</span>
                </button>
              </div>

              {/* Input Link Google Maps (Utama & Praktis) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-foreground">
                    Link / Tautan Google Maps (Paling Mudah)
                  </label>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    Rekomendasi
                  </span>
                </div>
                <div className="relative">
                  <Input
                    value={mapsUrl}
                    onChange={(e) => handleMapsUrlChange(e.target.value)}
                    placeholder="Tempel link Google Maps (misal: https://maps.app.goo.gl/...)"
                    className="h-9 text-xs pl-8 rounded-xl bg-card border-primary/30 focus:border-primary"
                  />
                  <Link2 className="h-3.5 w-3.5 text-primary absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                  💡 <strong>Cara dapat link:</strong> Buka Google Maps di HP &gt; Cari nama gerai Anda &gt; Klik <strong>Bagikan (Share)</strong> &gt; Pilih <strong>Salin Link</strong> &gt; Tempel di sini.
                </p>
              </div>

              {gpsSuccess && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 p-2 rounded-xl border border-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{gpsSuccess}</span>
                </div>
              )}

              {errors.location && (
                <span className="text-[10px] text-destructive font-semibold block">
                  {errors.location}
                </span>
              )}

              {/* Collapsible Manual Coordinates Helper */}
              <div className="pt-1 border-t border-primary/10">
                <button
                  type="button"
                  onClick={() => setShowAdvancedCoords(!showAdvancedCoords)}
                  className="flex items-center justify-between w-full text-[10px] font-bold text-muted-foreground hover:text-foreground py-0.5"
                >
                  <div className="flex items-center gap-1">
                    <span>Koordinat Titik Presisi: {lat}, {lng}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-primary">
                    <span>{showAdvancedCoords ? "Sembunyikan" : "Atur / Tinjau Manual"}</span>
                    {showAdvancedCoords ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                </button>

                {showAdvancedCoords && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50 animate-in fade-in">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Latitude
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={lat}
                        onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                        required
                        className="h-8 text-xs font-mono bg-card"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Longitude
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={lng}
                        onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                        required
                        className="h-8 text-xs font-mono bg-card"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Google Maps Preview Action */}
              <div className="flex items-center justify-between pt-1 border-t border-primary/10">
                <span className="text-[10px] text-muted-foreground">
                  Digunakan untuk rute navigasi konsumen saat ambil makanan.
                </span>
                <a
                  href={mapsUrl.trim() || `https://maps.google.com/?q=${lat},${lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0"
                >
                  <span>Cek di Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
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
            <span>Lanjut ke Rekening Penyaluran</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Rekening Penyaluran Dana */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <form onSubmit={handleNextStep2} className="my-3 flex flex-col gap-3">
          <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Bank Tujuan Penyaluran
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-card px-2 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="BCA">Bank BCA (Bank Central Asia)</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BRI">Bank BRI (Bank Rakyat Indonesia)</option>
                <option value="BNI">Bank BNI (Bank Negara Indonesia)</option>
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
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Contoh: 8271928401"
                required
                className={`h-9 text-xs rounded-xl font-mono ${
                  errors.accountNumber ? "border-destructive" : ""
                }`}
              />
              {errors.accountNumber && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.accountNumber}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nama Pemilik Rekening Sesuai Buku Tabungan
              </label>
              <Input
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Contoh: Budi Santoso / PT Artisan Kuliner"
                required
                className={`h-9 text-xs rounded-xl ${
                  errors.accountHolder ? "border-destructive" : ""
                }`}
              />
              {errors.accountHolder && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.accountHolder}
                </span>
              )}
            </div>

            <div className="rounded-xl bg-muted/60 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                Penyaluran dana hasil penjualan surplus akan dicairkan otomatis sesuai permintaan penarikan mitra.
              </span>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="flex-1 h-10 rounded-xl text-xs font-bold gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 gap-1"
            >
              <span>Lanjut ke SLA</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Ketentuan Kerjasama & SLA */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <form onSubmit={handleFinalSubmit} className="my-3 flex flex-col gap-3">
          <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl space-y-2.5">
            <div className="space-y-2 max-h-56 overflow-y-auto rounded-xl bg-muted/40 p-3 border border-border/80 text-[11px] leading-relaxed text-foreground/90">
              <h3 className="font-bold text-xs text-primary">Service Level Agreement (SLA) Mitra FOODRESCUE</h3>
              <p>
                <strong>1. Bagi Hasil Bersih 85/15:</strong> Mitra berhak menerima 85% dari nilai transaksi bruto setiap makanan surplus yang berhasil diselamatkan dan diambil konsumen.
              </p>
              <p>
                <strong>2. Standar Mutu & Higienitas:</strong> Seluruh makanan yang dijual via FOODRESCUE adalah makanan surplus layak konsumsi dari batch produksi harian, bukan sisa piring konsumen.
              </p>
              <p>
                <strong>3. Waktu Pengambilan:</strong> Mitra wajib menyiapkan paket makanan sesuai batas waktu pengambilan yang tertera pada aplikasi.
              </p>
              <p>
                <strong>4. Kebijakan Instant Undo:</strong> Konsumen memiliki hak pembatalan transaksi 60 detik pasca-pembayaran. Notifikasi pesanan baru akan dikirimkan ke gerai setelah periode 60 detik terlewati.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nama Penanggung Jawab (PIC Gerai)
              </label>
              <Input
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Nama lengkap PIC mitra"
                required
                className={`h-9 text-xs rounded-xl ${errors.picName ? "border-destructive" : ""}`}
              />
              {errors.picName && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.picName}
                </span>
              )}
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-[11px] font-bold text-foreground leading-snug">
                  Saya mewakili gerai telah membaca, memahami, dan menyetujui seluruh ketentuan kerjasama serta SLA operasional FOODRESCUE.
                </span>
              </label>
              {errors.agreedTerms && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.agreedTerms}
                </span>
              )}
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="flex-1 h-10 rounded-xl text-xs font-bold gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 gap-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Selesaikan Pendaftaran</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
