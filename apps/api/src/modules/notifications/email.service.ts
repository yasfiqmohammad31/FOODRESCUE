import type { Env, Order, Listing, MerchantProfile, PayoutItem } from "../../types";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Sends an email using Resend API (https://resend.com)
 * Works seamlessly in Cloudflare Workers Edge runtime using standard fetch.
 */
export async function sendEmail(env: Env, options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = env.RESEND_API_KEY;
  const fromAddress = options.from || env.EMAIL_FROM || "FOODRESCUE <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[EMAIL SIMULATION] To: ${options.to} | Subject: "${options.subject}" (RESEND_API_KEY not configured)`);
    return {
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}`,
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      console.error("[RESEND API ERROR]", data);
      return {
        success: false,
        error: data.message || "Gagal mengirim email via Resend API",
      };
    }

    console.log(`[EMAIL SENT VIA RESEND] ID: ${data.id} to ${options.to}`);
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error: any) {
    console.error("[EMAIL NETWORK ERROR]", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan jaringan saat mengirim email",
    };
  }
}

/**
 * Safely dispatches a background task using Cloudflare Worker waitUntil if available,
 * or standard background promise without throwing if running in local Node tests.
 */
export function safeDispatch(c: any, promise: Promise<any>): void {
  try {
    if (c && c.executionCtx && typeof c.executionCtx.waitUntil === "function") {
      c.executionCtx.waitUntil(promise);
      return;
    }
  } catch {}
  promise.catch((err) => {
    console.error("[ASYNC DISPATCH ERROR]", err);
  });
}

// ============================================================================
// HTML Email Templates
// ============================================================================

export function buildOrderConfirmationEmail(
  order: Order,
  listing: Listing,
  merchant?: MerchantProfile,
  consumerName?: string
): { subject: string; html: string } {
  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(order.totalPrice);

  const formattedOriginal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(listing.originalPrice * order.quantity);

  const subject = `🌱 [FOODRESCUE] Struk Pesanan #${order.id.slice(-6).toUpperCase()} - ${listing.title}`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f5f0; margin: 0; padding: 24px; color: #1c1917;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header -->
    <tr>
      <td style="background-color: #166534; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">🌱 FOODRESCUE</h1>
        <p style="color: #bbf7d0; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Penyelamatan Makanan Berhasil Diselesaikan</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 24px;">
        <p style="font-size: 14px; margin: 0 0 16px 0;">Halo <strong>${consumerName || "Food Hero"}</strong>,</p>
        <p style="font-size: 13px; line-height: 1.5; color: #57534e; margin: 0 0 20px 0;">
          Terima kasih telah menyelamatkan makanan surplus lezat hari ini! Pesanan Anda telah terkonfirmasi dan siap diambil di gerai mitra.
        </p>

        <!-- Order Summary Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdfbf7; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <tr>
            <td style="padding-bottom: 8px; font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px;">ID Pesanan</td>
            <td align="right" style="padding-bottom: 8px; font-size: 12px; font-weight: 800; font-family: monospace; color: #166534;">#${order.id}</td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #1c1917;">${listing.title}</td>
            <td align="right" style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #1c1917;">${order.quantity} Porsi</td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px; font-size: 12px; color: #78716c;">Gerai Mitra</td>
            <td align="right" style="padding-bottom: 8px; font-size: 12px; font-weight: 600; color: #1c1917;">${merchant?.storeName || "Mitra Gerai FOODRESCUE"}</td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px; font-size: 12px; color: #78716c;">Alamat Pengambilan</td>
            <td align="right" style="padding-bottom: 8px; font-size: 12px; color: #44403c;">${merchant?.address || "Alamat terdaftar di aplikasi"}</td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px; font-size: 12px; color: #78716c;">Waktu Ambil</td>
            <td align="right" style="padding-bottom: 8px; font-size: 12px; font-weight: 700; color: #166534;">${listing.pickupStartTime} - ${listing.pickupEndTime} WIB</td>
          </tr>
          <tr>
            <td style="border-top: 1px dashed #d6d3d1; padding-top: 10px; font-size: 13px; font-weight: 800; color: #1c1917;">Total Pembayaran</td>
            <td align="right" style="border-top: 1px dashed #d6d3d1; padding-top: 10px; font-size: 15px; font-weight: 900; color: #166534;">${formattedTotal}</td>
          </tr>
          <tr>
            <td colspan="2" align="right" style="font-size: 11px; color: #78716c; text-decoration: line-through;">Harga Normal: ${formattedOriginal}</td>
          </tr>
        </table>

        <!-- QR Instruction Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
          <tr>
            <td width="32" valign="top" style="font-size: 20px;">📱</td>
            <td style="font-size: 12px; color: #065f46; line-height: 1.4;">
              <strong>Cara Pengambilan di Gerai:</strong><br>
              1. Buka halaman pesanan di aplikasi web FOODRESCUE.<br>
              2. Tunjukkan <strong>QR Voucher Dinamis</strong> ke kasir gerai.<br>
              3. Kasir akan memindai QR untuk serah terima paket makanan.
            </td>
          </tr>
        </table>

        <p style="font-size: 11px; color: #a8a29e; text-align: center; margin: 0;">
          Pesanan ini menghemat estimasi ~0.8 kg emisi CO2e bagi bumi. Terima kasih atas partisipasi Anda!
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #fafaf9; border-top: 1px solid #f5f5f4; padding: 16px; text-align: center; font-size: 11px; color: #78716c;">
        © 2026 FOODRESCUE Indonesia • Platform Penyelamatan Makanan Surplus Hyperlocal
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}

export function buildUndoRefundEmail(
  order: Order,
  refundAmount: number,
  newBalance: number,
  consumerName?: string
): { subject: string; html: string } {
  const formattedRefund = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(refundAmount);

  const formattedBalance = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(newBalance);

  const subject = `↩️ [FOODRESCUE] Pengembalian Dana 100% Saldo Rescue Credit #${order.id.slice(-6).toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f6f5f0; margin: 0; padding: 24px; color: #1c1917;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4;">
    <tr>
      <td style="background-color: #0284c7; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">↩️ Pengembalian Dana Berhasil</h1>
        <p style="color: #e0f2fe; margin: 6px 0 0 0; font-size: 13px;">Fitur Pembatalan 60s Instant Undo</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="font-size: 14px; margin: 0 0 16px 0;">Halo <strong>${consumerName || "Pengguna"}</strong>,</p>
        <p style="font-size: 13px; line-height: 1.5; color: #57534e; margin: 0 0 20px 0;">
          Permintaan pembatalan pesanan <strong>#${order.id}</strong> dalam jendela 60 detik telah diproses. Dana sebesar <strong>100%</strong> telah langsung dikembalikan ke saldo <strong>Rescue Credit</strong> Anda.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <tr>
            <td style="font-size: 12px; color: #0369a1;">Nominal Refund (100%):</td>
            <td align="right" style="font-size: 14px; font-weight: 800; color: #0284c7;">+${formattedRefund}</td>
          </tr>
          <tr>
            <td style="padding-top: 8px; font-size: 12px; color: #0369a1;">Total Saldo Rescue Credit Sekarang:</td>
            <td align="right" style="padding-top: 8px; font-size: 15px; font-weight: 900; color: #0369a1;">${formattedBalance}</td>
          </tr>
        </table>

        <p style="font-size: 12px; color: #57534e;">
          Saldo Rescue Credit ini dapat Anda gunakan kembali secara instan tanpa biaya admin untuk memesan paket makanan lainnya di aplikasi FOODRESCUE.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #fafaf9; padding: 14px; text-align: center; font-size: 11px; color: #78716c;">
        © 2026 FOODRESCUE Indonesia
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}

export function buildMerchantPayoutEmail(
  payout: PayoutItem,
  merchant: MerchantProfile
): { subject: string; html: string } {
  const formattedNet = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(payout.netAmount);

  const subject = `💰 [FOODRESCUE] Pencairan Saldo Gerai ${merchant.storeName} - ${formattedNet}`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f6f5f0; margin: 0; padding: 24px; color: #1c1917;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4;">
    <tr>
      <td style="background-color: #166534; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">💰 Pencairan Pendapatan Gerai</h1>
        <p style="color: #bbf7d0; margin: 6px 0 0 0; font-size: 13px;">Penyelesaian Bagi Hasil 85% SLA Mitra</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="font-size: 14px; margin: 0 0 16px 0;">Halo Mitra <strong>${merchant.storeName}</strong>,</p>
        <p style="font-size: 13px; line-height: 1.5; color: #57534e; margin: 0 0 20px 0;">
          Permintaan penarikan pendapatan penjualan surplus makanan Anda telah kami terima dan sedang diproses ke rekening bank terdaftar:
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdfbf7; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <tr>
            <td style="font-size: 12px; color: #78716c;">ID Penarikan:</td>
            <td align="right" style="font-size: 12px; font-family: monospace; font-weight: 700;">#${payout.id}</td>
          </tr>
          <tr>
            <td style="padding-top: 6px; font-size: 12px; color: #78716c;">Rekening Tujuan:</td>
            <td align="right" style="padding-top: 6px; font-size: 12px; font-weight: 700;">${payout.bankName} - ${payout.accountNumber}</td>
          </tr>
          <tr>
            <td style="padding-top: 6px; font-size: 12px; color: #78716c;">Atas Nama:</td>
            <td align="right" style="padding-top: 6px; font-size: 12px; font-weight: 700;">${payout.accountHolder}</td>
          </tr>
          <tr>
            <td style="border-top: 1px dashed #d6d3d1; padding-top: 10px; font-size: 13px; font-weight: 800;">Dana Diterima (85% Net):</td>
            <td align="right" style="border-top: 1px dashed #d6d3d1; padding-top: 10px; font-size: 15px; font-weight: 900; color: #166534;">${formattedNet}</td>
          </tr>
        </table>

        <p style="font-size: 12px; color: #78716c; margin: 0;">
          Dana akan masuk dalam 1x24 jam kerja sesuai jadwal kliring perbankan nasional.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #fafaf9; padding: 14px; text-align: center; font-size: 11px; color: #78716c;">
        © 2026 FOODRESCUE Indonesia
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}
