"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";
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

export default function ConsumerRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Nama lengkap minimal 2 karakter.";
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      newErrors.phone = "Nomor HP tidak valid (10-15 digit).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      newErrors.email = "Alamat email tidak valid.";
    }

    if (!password || password.length < 6) {
      newErrors.password = "Kata sandi minimal 6 karakter.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await consumerApi.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: "CONSUMER",
      });
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
                try {
                  const res = await consumerApi.googleAuth(response.credential, "CONSUMER");
                  if (res.success && res.token) {
                    localStorage.setItem("fr_token", res.token);
                    if (res.user) {
                      localStorage.setItem("fr_user", JSON.stringify(res.user));
                    }
                    router.push("/feed");
                  } else {
                    setErrors({ email: res.message || "Autentikasi Google gagal" });
                  }
                } catch {
                  router.push("/feed");
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
              text: "signup_with",
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

  const handleGoogleRegister = async () => {
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
          onClick={() => router.back()}
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
          <h1 className="text-lg font-black text-foreground">Daftar Akun Baru</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bergabunglah menjadi Food Hero dan selamatkan makanan lezat terdekat.
          </p>
        </div>

        {/* 1-Tap Google Sign Up (FedCM & Mobile Popup Compliant) */}
        <div className="w-full flex flex-col items-center justify-center min-h-[40px]">
          <div ref={googleBtnRef} className="w-full flex justify-center [&_iframe]:!rounded-xl" />
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-background px-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider absolute">
            atau formulir manual
          </span>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nama Lengkap
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Rian Pratama"
                required
                className={`h-9 text-xs rounded-xl ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && (
                <span className="text-[10px] text-destructive font-semibold mt-1 block">
                  {errors.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  WhatsApp / HP
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

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className={`h-9 text-xs rounded-xl ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && (
                  <span className="text-[10px] text-destructive font-semibold mt-1 block">
                    {errors.email}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Kata Sandi
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
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
            <span>Daftar & Mulai Rescue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>

        {/* Switch to Login */}
        <div className="text-center text-xs text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Masuk di Sini
          </Link>
        </div>
      </div>

      {/* Footer Terms */}
      <div className="pb-2 text-center">
        <p className="text-[10px] text-muted-foreground">
          Dengan mendaftar, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi FOODRESCUE.
        </p>
      </div>
    </div>
  );
}
