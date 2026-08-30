"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchMerchantApi } from "@/lib/api-client";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      newErrors.email = "Alamat email bisnis tidak valid.";
    }

    if (!password || password.length < 6) {
      newErrors.password = "Kata sandi minimal 6 karakter.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetchMerchantApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: email, password, role: "MERCHANT" }),
      });
      if (res.success && res.token) {
        localStorage.setItem("fr_merchant_token", res.token);
        if (res.user) {
          localStorage.setItem("fr_merchant", JSON.stringify(res.user));
        }
        router.push("/");
      } else {
        setErrors({
          general:
            res.message ||
            "Email atau kata sandi tidak cocok. Pastikan akun mitra Anda sudah terdaftar.",
        });
      }
    } catch (e: any) {
      setErrors({ general: e.message || "Gagal masuk. Periksa koneksi internet Anda." });
    } finally {
      setIsLoading(false);
    }
  };

  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initGoogle = () => {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id && googleClientId) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: { credential?: string }) => {
              if (response.credential) {
                setIsGoogleLoading(true);
                setErrors({});
                try {
                  const res = await fetchMerchantApi("/api/auth/google", {
                    method: "POST",
                    body: JSON.stringify({
                      idToken: response.credential,
                      role: "MERCHANT",
                      mode: "login",
                    }),
                  });
                  if (res.success && res.token) {
                    localStorage.setItem("fr_merchant_token", res.token);
                    if (res.user) {
                      localStorage.setItem("fr_merchant", JSON.stringify(res.user));
                    }
                    router.push("/");
                  } else {
                    setErrors({
                      general:
                        res.message ||
                        "Akun Google ini belum terdaftar sebagai mitra gerai. Silakan daftar akun baru terlebih dahulu.",
                    });
                  }
                } catch (e: any) {
                  setErrors({
                    general: e.message || "Gagal memproses autentikasi Google.",
                  });
                } finally {
                  setIsGoogleLoading(false);
                }
              }
            },
            auto_select: false,
            use_fedcm_for_prompt: true,
          });

          if (googleBtnRef.current) {
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "outline",
              size: "large",
              type: "standard",
              shape: "rectangular",
              text: "continue_with",
              logo_alignment: "left",
              width: 340,
            });
          }
        } catch (e) {
          console.warn("[GSI Init]", e);
        }
      }
    };

    if (typeof window !== "undefined") {
      if (!(window as any).google?.accounts?.id) {
        const script = document.createElement("script");
        script.id = "google-gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.body.appendChild(script);
      } else {
        initGoogle();
      }
    }
  }, [router]);

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
          <h1 className="text-lg font-black text-foreground">Masuk Portal Gerai</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola paket surplus, pantau pesanan, dan analitik toko.
          </p>
        </div>

        {/* Global Error Banner */}
        {errors.general && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="leading-snug block">{errors.general}</span>
              <div className="mt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-black text-xs"
                >
                  <span>Daftar sebagai mitra gerai baru</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 1-Tap Google Sign In (FedCM & Mobile Popup Compliant) */}
        <div className="w-full flex flex-col items-center justify-center min-h-[40px]">
          <div ref={googleBtnRef} className="w-full flex justify-center [&_iframe]:!rounded-xl" />
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-background px-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider absolute">
            atau email bisnis
          </span>
        </div>

        {/* Login Form */}
        <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl">
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Email Bisnis / Toko
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@toko.com"
                required
                className={`h-9 text-xs rounded-xl ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.email}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Kata Sandi
                </label>
                <Link href="/forgot-password" className="text-[10px] font-bold text-primary hover:underline">
                  Lupa Sandi?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                required
                className={`h-9 text-xs rounded-xl ${errors.password ? "border-destructive" : ""}`}
              />
              {errors.password && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.password}
                </span>
              )}
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs hover:bg-primary/90 gap-1.5"
            >
              <span>Masuk ke Dashboard Gerai</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>

          <div className="mt-3 pt-3 border-t border-border text-center text-xs text-muted-foreground">
            Belum terdaftar?{" "}
            <Link href="/register" className="font-bold text-primary hover:underline">
              Daftar Jadi Mitra Merchant
            </Link>
          </div>
        </Card>
      </div>

      <div className="pb-2 text-center">
        <span className="text-[10px] text-muted-foreground">
          Portal Resmi Mitra Usaha & Gerai Kuliner FOODRESCUE
        </span>
      </div>
    </div>
  );
}
