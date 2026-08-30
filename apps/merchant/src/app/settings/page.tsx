"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  ExternalLink,
  Link2,
  LocateFixed,
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
import { extractCoordinatesFromMapsUrl } from "@/lib/utils";
import { merchantApi } from "@/lib/api-client";

export default function MerchantSettingsPage() {
  const router = useRouter();
  const [isStoreOpen, setIsStoreOpen] = useState(true);
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
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
  const [lat, setLat] = useState<number>(-7.2856);
  const [lng, setLng] = useState<number>(112.6954);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState<string | null>(null);

  // Operational schedule
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [operatingDays, setOperatingDays] = useState<string[]>([
    "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"
  ]);

  // Bank Disbursement Info
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const userRaw = typeof window !== "undefined" ? localStorage.getItem("fr_merchant") : null;
    const user = userRaw ? JSON.parse(userRaw) : null;

    if (user?.storeName) {
      setStoreName(user.storeName);
    }
    if (user?.category) {
      setCategory(user.category);
    }

    merchantApi.getCategories().then((cats) => {
      if (isMounted && cats && cats.length > 0) {
        setCategories(cats);
      }
    });

    merchantApi.getProfile().then((res) => {
      if (isMounted && res.success && res.merchant) {
        setStoreName(res.merchant.storeName || user?.storeName || "");
        setCategory(res.merchant.category || user?.category || "Bakery & Pastry");
        setAddress(res.merchant.address || "");
        if (res.merchant.mapsUrl) setMapsUrl(res.merchant.mapsUrl);
        if (res.merchant.location?.lat) setLat(res.merchant.location.lat);
        if (res.merchant.location?.lng) setLng(res.merchant.location.lng);
        setOpenTime(res.merchant.openTime || "08:00");
        setCloseTime(res.merchant.closeTime || "21:00");
        setBankName(res.merchant.bankName || "BCA");
        setAccountNumber(res.merchant.accountNumber || "");
        setAccountHolder(res.merchant.accountHolder || "");
        setIsStoreOpen(res.merchant.isStoreOpen ?? false);
        if (res.merchant.operatingDays && Array.isArray(res.merchant.operatingDays)) {
          setOperatingDays(res.merchant.operatingDays);
        }
      }
    });
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
        setGpsSuccess(`Titik koordinat berhasil diperbarui (Akurasi: ±${Math.round(pos.coords.accuracy)} meter).`);
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
    if (cleanAcc && (cleanAcc.length < 8 || cleanAcc.length > 18)) {
      newErrors.accountNumber = "Nomor rekening harus 8-18 digit angka.";
    }

    if (accountHolder && accountHolder.trim().length < 3) {
      newErrors.accountHolder = "Nama pemilik rekening minimal 3 karakter.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleToggleStore = async () => {
    setErrors({});
    try {
      const res = await merchantApi.toggleStoreStatus();
      if (res.success && typeof res.isStoreOpen === "boolean") {
        setIsStoreOpen(res.isStoreOpen);
      } else {
        setErrors({ storeStatus: res.message || "Tidak dapat membuka gerai: Buat minimal 1 listing makanan surplus terlebih dahulu." });
      }
    } catch (err: any) {
      setErrors({ storeStatus: err.message || "Gagal mengubah status gerai." });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const res = await merchantApi.updateProfile({
        storeName,
        category,
        address,
        mapsUrl: mapsUrl.trim() || undefined,
        location: { lat: Number(lat), lng: Number(lng) },
        openTime,
        closeTime,
        operatingDays,
        bankName,
        accountNumber,
        accountHolder,
        isStoreOpen,
      });

      if (res.success === false) {
        setErrors({ general: res.message || "Gagal menyimpan pengaturan gerai." });
        if (res.reason === "NO_ACTIVE_LISTINGS") {
          setIsStoreOpen(false);
        }
        return;
      }

      const userRaw = localStorage.getItem("fr_merchant");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        user.storeName = storeName;
        user.category = category;
        localStorage.setItem("fr_merchant", JSON.stringify(user));
      }
    } catch (err) {
      console.warn("Failed to save settings to API:", err);
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
          Kelola profil gerai, kategori usaha, titik lokasi Google Maps, dan rekening pencairan.
        </p>
      </div>

      {/* Error Alert */}
      {(errors.storeStatus || errors.general) && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errors.storeStatus || errors.general}</span>
        </div>
      )}

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
          onClick={handleToggleStore}
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
                1. Informasi Gerai & Titik Peta
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
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Alamat Fisik Pengambilan
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Jl. Raya Darmo No. 45, Surabaya"
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
                  <span>{isLocating ? "Mencari GPS..." : "Perbarui via GPS"}</span>
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
          </div>

          {/* Section 2: Operational Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/70">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                2. Jam & Hari Operasional
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Jam Buka Gerai
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
                  Jam Tutup Gerai
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
              {errors.operatingDays && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.operatingDays}
                </span>
              )}
            </div>
          </div>

          {/* Section 3: Bank Disbursement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/70">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                3. Rekening Penyaluran Dana
              </h2>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Bank Penyaluran
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BRI">Bank BRI</option>
                <option value="BNI">Bank BNI</option>
                <option value="BSI">Bank Syariah Indonesia (BSI)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nomor Rekening
              </label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Contoh: 8271928401"
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
                Nama Pemilik Rekening
              </label>
              <Input
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Sesuai buku tabungan"
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
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Simpan Pengaturan Gerai</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Success Notification Toast */}
      {saved && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#1C1917] text-white border border-white/20 px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Pengaturan gerai berhasil disimpan!</span>
        </div>
      )}
    </div>
  );
}
