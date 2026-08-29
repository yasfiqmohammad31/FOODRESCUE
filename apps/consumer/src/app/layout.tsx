import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { ConsumerAuthGuard } from "@/components/auth-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2D6A4F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "FOODRESCUE — Save Food. Save Money.",
  description:
    "Platform hyperlocal penyelamatan surplus makanan berkualitas dengan diskon 50–70% di sekitarmu.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FOODRESCUE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#EDE8DD] text-foreground flex justify-center selection:bg-[#2D6A4F]/20 selection:text-[#1C1917]">
        {/* Mobile Device Canvas Frame */}
        <div className="relative flex flex-col min-h-screen w-full max-w-md bg-background shadow-2xl pb-16">
          <ConsumerAuthGuard>
            <main className="flex-1 flex flex-col">{children}</main>
            <PWAInstallPrompt />
            <BottomNav />
          </ConsumerAuthGuard>
        </div>
      </body>
    </html>
  );
}
