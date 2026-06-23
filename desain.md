---
tokens:
  theme: "light-mode"
  inspiration: "Tokopedia Unify Design System"
  tailwind_mappings:
    colors:
      # Hijau khas Tokopedia (Warna Utama/Kepercayaan)
      tokped-primary: "#00AA5B"      # Hijau Tokopedia (Tombol Utama, Status Aktif)
      tokped-primary-light: "#E5F7EE"# Latar belakang badge status aktif
      
      # Warna Aksen Sekunder & Peringatan
      tokped-orange: "#FF5722"       # Oranye (Metrik penting/Klik tertinggi)
      tokped-danger: "#EF144A"       # Merah (Link rusak/expired/error)
      tokped-danger-light: "#FFEAEF" # Latar belakang badge status rusak
      
      # Warna Netral (Teks & Latar Belakang)
      tokped-dark: "#212121"         # Teks utama (sangat kontras & mudah dibaca)
      tokped-muted: "#6D7588"        # Teks sekunder/keterangan (Abu-abu Tokopedia)
      tokped-border: "#E5E7E9"       # Garis pembatas tipis
      tokped-bg: "#F0F3F7"           # Latar belakang aplikasi (Abu-abu terang penambah kontras)
      tokped-card: "#FFFFFF"         # Putih bersih untuk Card dan Tabel
    fonts:
      sans: "var(--font-nunito)"     # Font bulat, ramah, dan modern mirip Tokopedia
      mono: "var(--font-geist-mono)" # Untuk kode shortlink affiliate
    radius:
      button: "rounded-lg"           # 8px (Standar tombol Tokopedia)
      card: "rounded-2xl"            # 16px (Ciri khas card Tokopedia yang sangat melengkung)
---

# Panduan Desain: Affiliate Link Manager (Tokopedia Inspired)

Dokumen ini mendefinisikan identitas visual aplikasi yang terinspirasi dari estetika Tokopedia: Ramah, bersih, didominasi warna putih dengan aksen hijau ikonik, serta sudut komponen yang melengkung halus (*rounded*).

## Prinsip Utama Desain (The Tokopedia Way)
1. **Card-Based Layout**: Semua konten utama (tabel, grafik, statistik) harus dibungkus dalam kontainer putih (`bg-tokped-card`) di atas latar belakang abu-abu terang (`bg-tokped-bg`).
2. **Spacious & Clean**: Berikan ruang bernapas (*padding* & *gap*) yang cukup besar antar elemen agar aplikasi terasa ringan dan mudah dinavigasi.
3. **High Contrast**: Teks utama harus menggunakan `text-tokped-dark` untuk memastikan keterbacaan yang maksimal mirip halaman produk Tokopedia.

## Panduan Komponen UI untuk Next.js + Tailwind

### 1. Tata Letak Dasbor (Layout Container)
*   Gunakan `bg-tokped-bg min-h-screen` sebagai pembungkus halaman utama.
*   Gunakan struktur grid atau flex dengan *gap* yang konsisten (misal: `gap-4` atau `gap-6`).

### 2. Kartu Ringkasan Performa (Stats Cards)
*   **Aestetika**: Wajib menggunakan `bg-tokped-card shadow-sm border border-tokped-border rounded-2xl p-5`.
*   **Metrik Utama (Total Komisi)**: Menggunakan warna `text-tokped-dark text-2xl font-bold tracking-tight`.
*   **Metrik Pendukung (Klik Hari Ini)**: Angka performa harian bisa menggunakan warna aksen `text-tokped-orange`.

### 3. Tabel Manajemen Link (Affiliate Link Table)
*   **Header Tabel**: Menggunakan teks semi-bold `text-tokped-muted text-sm` dengan latar belakang putih polos (hindari header tabel berwarna gelap).
*   **Baris Tabel**: Berikan pembatas `border-b border-tokped-border`. Saat di-hover, baris harus berubah warna tipis secara halus menggunakan `hover:bg-slate-50 transition-colors`.
*   **Teks Link**: Link affiliate wajib menggunakan `font-mono text-sm text-tokped-primary hover:underline`.

### 4. Tombol Utama & Interaksi (Buttons)
*   **Tombol Tambah Link (Primary)**: Menggunakan warna hijau penuh: `bg-tokped-primary text-white font-bold rounded-lg px-4 py-2.5 hover:bg-[#00944F] transition-all`.
*   **Tombol Salin/Copy (Secondary)**: Menggunakan border: `border border-tokped-primary text-tokped-primary font-semibold rounded-lg px-4 py-2 hover:bg-tokped-primary-light transition-all`.

### 5. Badge Status Link
*   **Link Aktif**: `bg-tokped-primary-light text-tokped-primary text-xs font-bold px-3 py-1 rounded-full`.
*   **Link Mati/Expired**: `bg-tokped-danger-light text-tokped-danger text-xs font-bold px-3 py-1 rounded-full`.

---

## Catatan Setup Font di Next.js (`app/layout.tsx`)
Agar font bulat khas Tokopedia aktif, pastikan Anda memuat font **Nunito** di layout utama Next.js Anda:

```typescript
import { Nunito } from 'next/font/google';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```
