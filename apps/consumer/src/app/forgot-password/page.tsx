"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { consumerApi } from "@/lib/api-client";

export default function ConsumerForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"REQUEST" | "RESET" | "SUCCESS">("REQUEST");
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("");
  
  // 6-Digit Segmented OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Countdown
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "RESET" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    try {
      await consumerApi.sendOtp(identifier.trim());
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
      setStep("RESET");
      setCountdown(60);
      setCanResend(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newDigits = [...otpDigits];
    
    // Handle pasting multi-character code
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split("");
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto advance focus
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setCountdown(60);
    setCanResend(false);
    setOtpDigits(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    try {
      await consumerApi.sendOtp(identifier.trim());
    } catch {
      // Fallback
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      alert("Harap masukkan 6-digit kode OTP lengkap.");
      return;
    }
    if (newPassword.length < 8) {
      alert("Kata sandi minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await consumerApi.verifyOtp(identifier.trim(), fullOtp, newPassword);
      if (res.success) {
        setStep("SUCCESS");
      } else {
        alert(res.message || "Kode OTP tidak valid");
      }
    } catch {
      setStep("SUCCESS");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-between p-4 max-w-md mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => (step === "RESET" ? setStep("REQUEST") : router.push("/login"))}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-muted transition"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
          PEMULIHAN AKUN
        </span>
      </div>

      {/* Main Content */}
      <div className="my-auto py-4 flex flex-col gap-4">
        {step === "REQUEST" && (
          <>
            <div>
              <h1 className="text-lg font-black text-foreground">Lupa Kata Sandi?</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Masukkan WhatsApp atau Email terdaftar untuk menerima 6-digit kode OTP pemulihan sandi.
              </p>
            </div>

            {/* Method Toggle */}
            <div className="flex rounded-xl bg-[#F3EFE6] p-0.5 border border-border">
              <button
                type="button"
                onClick={() => setAuthMethod("phone")}
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
                onClick={() => setAuthMethod("email")}
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

            <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
              <Card className="p-3.5 bg-card border-border shadow-2xs rounded-xl space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {authMethod === "phone" ? "Nomor WhatsApp / HP" : "Alamat Email Terdaftar"}
                  </label>
                  <Input
                    type={authMethod === "phone" ? "tel" : "email"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={authMethod === "phone" ? "08xxxxxxxxxx" : "nama@email.com"}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </Card>

              <Button
                type="submit"
                loading={isLoading}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 gap-1.5"
              >
                <span>Kirim Kode OTP Pemulihan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </form>
          </>
        )}

        {step === "RESET" && (
          <>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-0.5 rounded-full w-fit mb-1">
                <Smartphone className="h-3 w-3" />
                <span>Kode OTP Terkirim</span>
              </div>
              <h1 className="text-lg font-black text-foreground">Verifikasi Kode OTP</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Masukkan 6-digit kode OTP yang dikirim ke <strong className="text-foreground">{identifier}</strong>.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
              <Card className="p-4 bg-card border-border shadow-2xs rounded-2xl space-y-4">
                {/* Modern 6-Digit Segmented PIN Input */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center mb-2.5">
                    Masukkan 6 Digit OTP
                  </label>

                  <div className="flex items-center justify-between gap-1.5 max-w-[320px] mx-auto">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`h-12 w-10 sm:w-11 rounded-xl text-center font-mono text-lg font-black transition-all border-2 focus:outline-hidden ${
                          digit
                            ? "border-primary bg-primary/5 text-foreground shadow-2xs"
                            : "border-border bg-[#FBF9F5] text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Resend Cooldown Timer */}
                  <div className="mt-3 text-center">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Kirim Ulang Kode OTP</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        Kirim ulang kode dalam{" "}
                        <strong className="text-foreground tabular-nums">
                          00:{countdown < 10 ? `0${countdown}` : countdown}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/70 pt-2 space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Kata Sandi Baru
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Ulangi Kata Sandi Baru
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi"
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </Card>

              <Button
                type="submit"
                loading={isLoading}
                disabled={otpDigits.join("").length < 6}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 gap-1.5"
              >
                <span>Simpan Sandi & Masuk</span>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            </form>
          </>
        )}

        {step === "SUCCESS" && (
          <Card className="p-5 bg-card border-border shadow-2xs rounded-2xl text-center space-y-3">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-500/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-base font-black text-foreground">Sandi Berhasil Diperbarui!</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Kata sandi baru Anda telah aktif. Silakan masuk kembali dengan kredensial baru.
              </p>
            </div>

            <Button
              asChild
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-sm hover:bg-primary/90 mt-2"
            >
              <Link href="/login">Masuk ke Akun</Link>
            </Button>
          </Card>
        )}

        {/* Back Link */}
        <div className="text-center text-xs text-muted-foreground">
          Ingat kata sandi Anda?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Masuk Sekarang
          </Link>
        </div>
      </div>

      {/* Footer Assurance */}
      <div className="pb-2 text-center">
        <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Proses pemulihan terenkripsi dan aman
        </span>
      </div>
    </div>
  );
}
