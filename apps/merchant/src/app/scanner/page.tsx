"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Flashlight,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  SwitchCamera,
  User,
  VideoOff,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDatetime, formatRupiah } from "@/lib/utils";
import { merchantApi } from "@/lib/api-client";
import type { Order } from "@/types";

export default function MerchantScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [scanStream, setScanStream] = useState<MediaStream | null>(null);

  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<Order | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize and start live camera
  const startCamera = async (mode: "environment" | "user" = facingMode) => {
    try {
      if (scanStream) {
        scanStream.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setScanStream(stream);
      setHasCameraPermission(true);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("[Scanner Camera]", err);
      setHasCameraPermission(false);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanStream) {
      scanStream.getTracks().forEach((t) => t.stop());
      setScanStream(null);
    }
    setIsCameraActive(false);
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (scanStream) {
      const track = scanStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : null;
      if (capabilities && capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashlightOn } as any],
          });
          setFlashlightOn(!flashlightOn);
        } catch {
          setFlashlightOn(!flashlightOn);
        }
      } else {
        setFlashlightOn(!flashlightOn);
      }
    }
  };

  // Switch between front and back camera
  const switchCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Live BarcodeDetector Scanning Loop
  useEffect(() => {
    let animationFrameId: number;
    let barcodeDetector: any = null;

    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });
      } catch {}
    }

    const detectBarcode = async () => {
      if (isCameraActive && videoRef.current && videoRef.current.readyState >= 2 && !verifiedOrder && !isVerifying) {
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              handleCodeDetected(rawValue);
            }
          } catch {}
        }
      }
      if (isCameraActive && !verifiedOrder) {
        animationFrameId = requestAnimationFrame(detectBarcode);
      }
    };

    if (isCameraActive) {
      animationFrameId = requestAnimationFrame(detectBarcode);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isCameraActive, verifiedOrder, isVerifying]);

  // Start camera on mount if permissions allow
  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator?.mediaDevices?.getUserMedia === "function") {
      startCamera("environment");
    }
    return () => {
      stopCamera();
    };
  }, []);

  const handleCodeDetected = async (rawCode: string) => {
    if (isVerifying || verifiedOrder) return;
    setIsVerifying(true);
    setManualError(null);

    // Get current merchant id
    let merchantId = "mer-01";
    try {
      const userRaw = localStorage.getItem("fr_merchant");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        merchantId = user.id ? `mer-${user.id}` : "mer-01";
      }
    } catch {}

    try {
      const res = await merchantApi.verifyPickup({
        token: rawCode,
        orderNumber: rawCode,
        merchantId,
      });

      if (res.success && res.order) {
        setVerifiedOrder(res.order);
        setToastMessage("Voucher QR Berhasil Diverifikasi!");
      } else {
        setManualError(res.message || "QR Voucher tidak valid atau telah digunakan.");
      }
    } catch {
      setManualError("Gagal memverifikasi ke server.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const cleanInput = manualCode.trim().replace(/^#/, "").toUpperCase();
    if (!cleanInput) {
      setManualError("Masukkan nomor pesanan.");
      return;
    }

    handleCodeDetected(cleanInput);
  };

  const handleCompleteHandover = async () => {
    setIsCompleted(true);
    if (verifiedOrder) {
      try {
        await merchantApi.updateOrderStatus(verifiedOrder.id, "PICKED_UP");
      } catch (e) {
        console.warn("Handover fallback:", e);
      }
    }
    setTimeout(() => {
      setVerifiedOrder(null);
      setIsCompleted(false);
      setManualCode("");
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#1C1917] text-white border border-white/20 px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div>
        <h1 className="text-base sm:text-lg font-black text-foreground">
          Pemindai QR Serah Terima Makanan
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Arahkan kamera ke QR Voucher di aplikasi pembeli untuk verifikasi instan.
        </p>
      </div>

      {/* Main Viewfinder Box */}
      <Card className="overflow-hidden border border-border bg-[#111827] text-white shadow-xl flex flex-col items-center justify-between min-h-[380px] relative rounded-3xl p-4">
        {/* Top Camera Controls */}
        <div className="w-full flex items-center justify-between z-20">
          <Badge className={`font-bold text-xs gap-1 ${isCameraActive ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>
            <Camera className="h-3.5 w-3.5" />
            <span>{isCameraActive ? "Kamera Aktif" : "Kamera Nonaktif"}</span>
          </Badge>

          <div className="flex items-center gap-2">
            {/* Toggle Camera On/Off */}
            {isCameraActive ? (
              <button
                type="button"
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/20 text-destructive-foreground border border-destructive/40 text-xs font-bold hover:bg-destructive/30 transition shadow-2xs"
                title="Matikan Kamera"
                aria-label="Matikan Kamera"
              >
                <VideoOff className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[11px] text-red-300">Matikan Kamera</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-600/40 transition shadow-2xs"
                title="Nyalakan Kamera"
                aria-label="Nyalakan Kamera"
              >
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-300">Nyalakan Kamera</span>
              </button>
            )}

            {isCameraActive && (
              <>
                <button
                  type="button"
                  onClick={switchCamera}
                  className="p-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition"
                  title="Ganti Kamera"
                  aria-label="Ganti Kamera Depan / Belakang"
                >
                  <SwitchCamera className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-xl border transition ${
                    flashlightOn
                      ? "bg-amber-400 text-amber-950 border-amber-300 shadow-xs"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  }`}
                  title="Lampu Kilat"
                  aria-label={flashlightOn ? "Matikan Lampu Kilat" : "Nyalakan Lampu Kilat"}
                >
                  <Flashlight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Video Element */}
        <div className="relative flex h-64 w-64 items-center justify-center my-3 overflow-hidden rounded-2xl border-2 border-white/20 bg-black/80 shadow-inner">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 h-full w-full object-cover ${isCameraActive ? "opacity-100" : "opacity-0"}`}
          />

          {!isCameraActive && (
            <div className="flex flex-col items-center gap-2 text-center p-4 z-10">
              <VideoOff className="h-8 w-8 text-zinc-500" />
              <p className="text-xs text-zinc-400">Kamera tidak aktif</p>
              <Button
                size="sm"
                onClick={() => startCamera("environment")}
                className="text-xs font-bold h-8 rounded-xl bg-primary text-white"
              >
                Aktifkan Kamera
              </Button>
            </div>
          )}

          {/* Scanner Aim Framing & Laser */}
          {isCameraActive && (
            <>
              {/* Corner Indicators */}
              <div className="absolute inset-3 border-2 border-dashed border-emerald-400/70 rounded-xl pointer-events-none" />

              {/* Animated Laser Scanning Beam */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-scan-beam pointer-events-none" />
            </>
          )}

          {/* Hidden Canvas for Frame Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Status Prompt */}
        <div className="text-center z-10">
          <p className="text-xs font-medium text-white/80">
            {isVerifying ? "Memverifikasi token QR..." : "Posisikan kode QR di dalam kotak bidik"}
          </p>
          <span className="text-[10px] text-white/50 block mt-0.5">
            QR Code akan terbaca otomatis dalam &le; 1 detik
          </span>
        </div>
      </Card>

      {/* Manual Input Fallback */}
      <Card className="p-3.5 bg-card border-border shadow-2xs rounded-2xl">
        <form onSubmit={handleManualVerify} className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
            <Search className="h-3.5 w-3.5 text-primary" />
            <span>Verifikasi Manual Nomor Pesanan</span>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Jika kamera tidak dapat memindai atau pembeli hanya membawa nomor struk pesanan:
          </p>

          <div className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => {
                setManualCode(e.target.value);
                setManualError(null);
              }}
              placeholder="Contoh: FR-20260830-1049 atau ord-xxx"
              className="h-9 text-xs rounded-xl font-mono"
            />
            <Button
              type="submit"
              loading={isVerifying}
              className="h-9 px-4 text-xs font-bold rounded-xl bg-primary text-white shrink-0"
            >
              Cek
            </Button>
          </div>

          {manualError && (
            <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{manualError}</span>
            </div>
          )}
        </form>
      </Card>

      {/* ========================================================================= */}
      {/* Verified Order Modal Dialog */}
      {/* ========================================================================= */}
      {verifiedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-black text-foreground">
                  Validasi Penyerahan Berhasil
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setVerifiedOrder(null)}
                aria-label="Tutup"
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between text-emerald-950">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Nomor Pesanan
                </span>
                <div className="text-sm font-black font-mono">{verifiedOrder.orderNumber}</div>
              </div>
              <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                Lunas & Valid
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Paket Surplus</span>
                <strong className="text-foreground text-right">{verifiedOrder.listing?.title || "Mystery Box"}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Jumlah Diambil</span>
                <strong className="text-foreground">{verifiedOrder.quantity} Porsi</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Metode Pembayaran</span>
                <strong className="text-foreground">{verifiedOrder.paymentMethod}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Pendapatan Bersih Mitra (85%)</span>
                <strong className="text-emerald-700 font-bold">
                  {formatRupiah(Math.round(verifiedOrder.totalPrice * 0.85))}
                </strong>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleCompleteHandover}
                disabled={isCompleted}
                className="w-full h-11 rounded-xl bg-primary text-white text-xs font-black shadow-md hover:bg-primary/90 gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isCompleted ? "Penyerahan Selesai!" : "Konfirmasi Makanan Telah Diserahkan"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
