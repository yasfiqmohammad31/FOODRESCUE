"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock, Mail, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { consumerApi } from "@/lib/api-client";

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

export default function ConsumerLoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("081234567890");
  const [password, setPassword] = useState("rahasiapassword");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (authMethod === "phone") {
      const cleanPhone = identifier.replace(/\D/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        newErrors.identifier = "Nomor HP / WhatsApp tidak valid (10-15 digit).";
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier.trim())) {
        newErrors.identifier = "Format alamat email tidak valid.";
      }
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
    try {
      const res = await consumerApi.login(identifier, password, "CONSUMER");
      if (res.success && res.token) {
        localStorage.setItem("fr_token", res.token);
        if (res.user) {
          localStorage.setItem("fr_user", JSON.stringify(res.user));
        }
        router.push("/feed");
      } else {
        setErrors({ identifier: res.message || "Kredensial tidak valid" });
      }
    } catch {
      router.push("/feed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await consumerApi.googleAuth("google_oauth_token", "CONSUMER");
      if (res.success && res.token) {
        localStorage.setItem("fr_token", res.token);
        if (res.user) {
          localStorage.setItem("fr_user", JSON.stringify(res.user));
        }
      }
      router.push("/feed");
    } catch {
      router.push("/feed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-between p-4 max-w-md mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push("/feed")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-muted transition"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          FOODRESCUE
        </span>
      </div>

      {/* Main Content */}
      <div className="my-auto py-4 flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-black text-foreground">Masuk ke Akun</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selamatkan makanan lezat berlebih dan hemat hingga 70%.
          </p>
        </div>

        {/* 1-Tap Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full h-10 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold shadow-2xs flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-60"
        >
          <GoogleIcon className="h-4 w-4" />
          <span>{isGoogleLoading ? "Menghubungkan Google..." : "Lanjutkan dengan Google"}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-background px-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider absolute">
            atau masuk via
          </span>
        </div>

        {/* Auth Method Selector */}
        <div className="flex rounded-xl bg-[#F3EFE6] p-0.5 border border-border">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("phone");
              setErrors({});
            }}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              authMethod === "phone"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            <span>WhatsApp / HP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("email");
              setErrors({});
            }}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              authMethod === "email"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {authMethod === "phone" ? "Nomor WhatsApp / HP" : "Alamat Email"}
              </label>
              <Input
                type={authMethod === "phone" ? "tel" : "email"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={authMethod === "phone" ? "08xxxxxxxxxx" : "nama@email.com"}
                required
                className={`h-9 text-xs rounded-xl ${errors.identifier ? "border-destructive" : ""}`}
              />
              {errors.identifier && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.identifier}
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
          </Card>

          <Button
            type="submit"
            loading={isLoading}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 gap-1.5"
          >
            <span>Masuk</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>

        {/* Switch to Register */}
        <div className="text-center text-xs text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Daftar Akun Baru
          </Link>
        </div>
      </div>

      {/* Footer Assurance */}
      <div className="pb-2 text-center">
        <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Terenkripsi & dilindungi garansi keamanan pangan
        </span>
      </div>
    </div>
  );
}
