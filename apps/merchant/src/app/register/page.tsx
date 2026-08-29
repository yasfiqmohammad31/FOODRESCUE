"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building, Mail, MapPin, Phone, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchMerchantApi } from "@/lib/api-client";

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("Bakery & Pastry");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetchMerchantApi("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: ownerName.trim() || storeName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: "MERCHANT",
        }),
      });
      if (res.success && res.token) {
        localStorage.setItem("fr_merchant_token", res.token);
      }
      router.push("/onboarding");
    } catch {
      router.push("/onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (typeof window !== "undefined" && (window as any).google?.accounts?.id && googleClientId) {
      (window as any).google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (response.credential) {
            try {
              const res = await fetchMerchantApi("/api/auth/google", {
                method: "POST",
                body: JSON.stringify({ idToken: response.credential, role: "MERCHANT" }),
              });
              if (res.success && res.token) {
                localStorage.setItem("fr_merchant_token", res.token);
                if (res.user) {
                  localStorage.setItem("fr_merchant", JSON.stringify(res.user));
                }
                router.push("/onboarding");
              }
            } catch {
              router.push("/onboarding");
            } finally {
              setIsGoogleLoading(false);
            }
          } else {
            setIsGoogleLoading(false);
          }
        },
      });

      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsGoogleLoading(false);
        }
      });
      return;
    }

    try {
      const res = await fetchMerchantApi("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken: "google_oauth_merchant_token", role: "MERCHANT" }),
      });
      if (res.success && res.token) {
        localStorage.setItem("fr_merchant_token", res.token);
        if (res.user) {
          localStorage.setItem("fr_merchant", JSON.stringify(res.user));
        }
      }
      router.push("/onboarding");
    } catch {
      router.push("/onboarding");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-4 max-w-md mx-auto w-full">
      {/* Brand Header */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          FOODRESCUE MERCHANT
        </span>
      </div>

      <div className="my-auto py-4 flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-black text-foreground">Daftar Mitra Merchant</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monetisasi sisa stok harian dan kurangi pemborosan makanan.
          </p>
        </div>

        {/* 1-Tap Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={isGoogleLoading}
          className="w-full h-10 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold shadow-2xs flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-60"
        >
          <GoogleIcon className="h-4 w-4" />
          <span>{isGoogleLoading ? "Menghubungkan Akun..." : "Daftar Cepat dengan Google"}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-background px-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider absolute">
            atau data gerai
          </span>
        </div>

        {/* Register Form */}
        <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl">
          <form onSubmit={handleRegister} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Gerai
                </label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nama Toko"
                  required
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-8.5 rounded-xl border border-input bg-card px-2 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="Bakery & Pastry">Bakery & Pastry</option>
                  <option value="Cafe & Kopi">Cafe & Kopi</option>
                  <option value="Restoran / Rumah Makan">Restoran / Rumah Makan</option>
                  <option value="Warung & Kuliner Lokal">Warung & Kuliner Lokal</option>
                  <option value="Supermarket / Buah">Supermarket / Buah</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  WhatsApp Bisnis
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Email Bisnis
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@toko.com"
                  required
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Alamat Gerai (Titik Ambil)
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jalan, kelurahan, kota"
                required
                className="h-8.5 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Kata Sandi
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                className="h-8.5 text-xs rounded-xl"
              />
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs hover:bg-primary/90 gap-1.5 mt-1"
            >
              <span>Daftarkan Gerai</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>

          <div className="mt-3 pt-3 border-t border-border text-center text-xs text-muted-foreground">
            Sudah terdaftar?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Masuk ke Portal Gerai
            </Link>
          </div>
        </Card>
      </div>

      <div className="pb-2 text-center">
        <p className="text-[10px] text-muted-foreground">
          Dengan mendaftar, gerai Anda menyetujui Ketentuan Kerjasama Mitra FOODRESCUE.
        </p>
      </div>
    </div>
  );
}
