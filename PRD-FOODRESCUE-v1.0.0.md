# **Product Requirement Document (PRD)**

 

 

## **1\. Project Overview & Objective**

 

* **Nama Produk:** FOODRESCUE

* **Tagline:** *Save Food. Save Money.*

* **Visi Produk:** Menjadi platform *hyperlocal* terdepan yang menghubungkan bisnis F\&B pemilik surplus makanan dengan konsumen untuk menekan angka *food waste* sekaligus menyediakan makanan berkualitas dengan harga terjangkau.

* **Tujuan Proyek (MVP):**

* Mengurangi volume makanan terbuang dari merchant mitra hingga 40% per hari.

* Menyediakan akses makanan siap santap berdiskon 50–70% bagi segmen mahasiswa dan Gen Z.

* Membangun platform PWA yang ringan, cepat, dan mudah diakses tanpa friksi instalasi rumit.

 

 

 

 

## **2\. Target Persona & Problem Statement**

 

| Segmen | Masalah Utama | Nilai Tambah (Value Proposition) |
| :---- | :---- | :---- |
| **Merchant** (Kafe, Bakery, Katering, Restoran) | Makanan surplus layak makan terbuang percuma di akhir hari; menimbulkan kerugian operasional dan dampak lingkungan. | Monetisasi sisa stok harian, mengurangi biaya pembuangan limbah, dan meningkatkan *brand image* ramah lingkungan. |
| **Konsumen** (Mahasiswa & Gen Z) | Anggaran makan harian terbatas; menginginkan makanan berkualitas dengan harga miring di sekitar lokasi tinggal/kampus. | Akses makanan layak konsumsi dengan diskon besar melalui metode *self-pickup* yang fleksibel. |

   
 

 

## **3\. Fitur Utama & Spesifikasi Fungsional**

 

### **Consumer Side (PWA)**

 

* **Geo-Location Feed & Discovery:** Menampilkan daftar listing merchant terdekat dalam radius tertentu berbasis lokasi pengguna (tampilan *List* dan *Map View*).

* **Detail Listing & Countdown:** Informasi detail paket makanan (*regular item* / *mystery rescue box*), jam batas pengambilan (*pickup window*), label alergen, dan sisa stok.

* **60-Second Instant Undo Cancellation:** Jeda waktu 60 detik setelah pembayaran bagi pengguna untuk membatalkan pesanan jika terjadi kesalahan *checkout*.

* **Rescue Credit Balance:** Dompet digital internal untuk menampung dana pengembalian (*refund*) secara instan dari pesanan yang dibatalkan.

* **Digital Pickup Voucher:** Tiket digital interaktif dengan QR code dinamis dan petunjuk arah Google Maps.

* **Impact Tracker & Gamification:** Riwayat personal mengenai total porsi makanan terselamatkan, perkiraan jejak karbon ($C{O}_{2}$) yang dicegah, dan lencana profil (*Food Hero Badges*).

 

### **Merchant Side (Web/PWA Portal)**

 

* **Quick Listing & Template:** Form input cepat porsi surplus, harga diskon, foto, serta batas waktu pengambilan (*pickup slot*).

* **Delayed Notification Queue:** Notifikasi pesanan baru masuk ke merchant setelah jeda 60 detik (menunggu periode *undo* konsumen selesai).

* **QR Scanner Verification:** Fitur kamera web untuk memindai QR code konsumen saat proses penyerahan makanan di gerai.

* **Emergency Merchant Cancellation:** Tombol pembatalan darurat jika stok offline habis mendadak, memicu *auto-refund* ke Rescue Credit konsumen.

* **Sustainability Dashboard:** Metrik agregat porsi terjual, pendapatan tambahan, dan total limbah makanan yang berhasil dicegah.

 

 

## **4\. Alur Penggunaan (User Flow & Edge Cases)**

 

         
    [Konsumen: Browse & Checkout]    
            │    
            ▼    
    [Pembayaran via QRIS / E-Wallet]    
            │    
            ▼    
    [Layar Countdown 60 Detik (Instant Undo)]    
       ├─► (Jika Batal dalam 60s) ──► Refund ke Rescue Credit ──► Stok Kembali (+1)    
       │    
       └─► (Setelah 60s / Selesai)    
                  │    
                  ▼    
    [Notifikasi Terkirim ke Merchant] ──► [Merchant Menyiapkan Paket]    
                  │    
                  ▼    
    [Konsumen Datang Saat Pickup Window] ──► [Scan QR Voucher] ──► [Transaksi Selesai]    
           
 

### **Penanganan Kendala Operasional (Edge Cases)**

 

* **Merchant Out of Stock:** Merchant menekan *Emergency Cancel*; sistem otomatis mengembalikan 100% dana ke Rescue Credit user dan membatalkan pesanan.

* **No-Show Konsumen:** Jika konsumen tidak hadir hingga *pickup window* berakhir, pesanan ditandai hangus tanpa refund demi melindungi hak merchant.

* **Bad Food Quality Complaint:** Jika rating yang diberikan bintang 1 atau 2 terkait kesegaran makanan, sistem otomatis memicu tiket bantuan (Customer Support Ticket) untuk investigasi dan perlindungan standar kebersihan mitra merchant.

 

 

## **5\. Arsitektur Teknologi & Integrasi AI**

 

* **Frontend:** Next.js (React) \+ Tailwind CSS, dikonfigurasi sebagai **Progressive Web App (PWA)** dengan Service Workers untuk *caching* dan *Web Push Notifications*.

* **Backend & Basis Data:** Node.js (NestJS/Express) dengan PostgreSQL \+ ekstensi **PostGIS** untuk kalkulasi jarak radius geolokasi.

* **Payment Gateway:** Xendit (integrasi Dynamic QRIS, E-Wallet API, dan Disbursement API untuk penarikan dana).

* **Implementasi AI:**

* *AI Dynamic Pricing:* Penyesuaian tingkat diskon secara otomatis mendekati akhir jam *pickup* untuk memaksimalkan rasio penjualan habis.

* *Predictive Surplus Analytics:* Estimasi volume surplus harian merchant berdasarkan tren data historis hari dan waktu.

* *AI Review Sentiment & Moderation:* Analisis sentimen otomatis pada ulasan masuk untuk mendeteksi keluhan kritis mengenai keamanan pangan secara real-time dan menyaring kata-kata tidak pantas.

 

 

 

 

## **6\. Model Bisnis & Metrik Keberhasilan (KPI)**

 

### **Model Pendapatan (Business Model)**

 

* **Transaction Commission:** Potongan komisi 15–20% dari setiap transaksi makanan yang berhasil diselamatkan melalui platform.

* **Merchant Subscription / Featured Slot:** Biaya langganan bulanan opsional untuk merchant yang ingin menempati posisi teratas pada feed pencarian.

 

### **Metrik Keberhasilan (KPI)**

 

* **Bisnis:** *Gross Merchandise Value* (GMV), jumlah transaksi bulanan, *Merchant Retention Rate*.

* **Sosial & Lingkungan:** Total kilogram makanan yang terselamatkan, total estimasi reduksi emisi gas metana/karbon ($kgC{O}_{2}e$).

* **Kepuasan & Kualitas:** Rata-rata Merchant Rating (Target \>4.3/5.0), Review Submission Rate (\>40% dari total pesanan sukses).

* **Operasional & Teknis:** *Order Cancellation Rate* (\<2%), waktu *load* PWA (\<2 detik pada jaringan 4G), *Pickup Success Rate* (\>95%).