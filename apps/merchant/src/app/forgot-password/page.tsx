"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchMerchantApi } from "@/lib/api-client";

export default function MerchantForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"REQUEST" | "SENT">("REQUEST");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await fetchMerchantApi("/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ identifier: email.trim(), method: "email" }),
      });
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
      setStep("SENT");
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between p-4 max-w-md mx-auto w-full">
      {/* Brand Header */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-muted transition"
          aria-label="Kembali ke Login"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          PEMULIHAN AKUN GERAI
        </span>
      </div>

      <div className="my-auto py-4 flex flex-col gap-4">
        {step === "REQUEST" && (
          <>
            <div>
              <h1 className="text-lg font-black text-foreground">Pemulihan Sandi Gerai</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Masukkan email bisnis terdaftar untuk menerima tautan pemulihan kata sandi portal gerai.
              </p>
            </div>

            <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl">
              <form onSubmit={handleSendResetLink} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Email Bisnis / Toko Terdaftar
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@toko.com"
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs hover:bg-primary/90 gap-1.5"
                >
                  <span>Kirim Tautan Pemulihan</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </form>
            </Card>
          </>
        )}

        {step === "SENT" && (
          <Card className="p-5 bg-card border-border shadow-2xs rounded-2xl text-center space-y-3">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-500/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-base font-black text-foreground">Tautan Terkirim!</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Kami telah mengirimkan instruksi pemulihan kata sandi ke <strong>{email}</strong>. Silakan periksa kotak masuk atau folder spam email Anda.
              </p>
            </div>

            <Button
              asChild
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 mt-2"
            >
              <Link href="/login">Kembali ke Halaman Masuk</Link>
            </Button>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground">
          Ingat kata sandi akun?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Masuk Sekarang
          </Link>
        </div>
      </div>

      <div className="pb-2 text-center">
        <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Proses pemulihan terenkripsi dan aman untuk data gerai
        </span>
      </div>
    </div>
  );
}
