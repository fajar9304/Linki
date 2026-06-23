# Linki - The Ultimate Conversion Engine for Affiliates

Linki adalah platform link-in-bio "Zero-Friction" yang dioptimalkan khusus untuk kreator afiliasi e-commerce (seperti Shopee, Tokopedia, TikTok Shop). Dengan teknologi **Smart Deep Linking** dan **Visual Product Grid**, Linki membantu kreator melipatgandakan Click-Through Rate (CTR) dan komisi mereka dengan mengarahkan audiens langsung ke aplikasi native e-commerce tanpa friction in-app browser media sosial.

---

## 📂 Struktur Proyek (Monorepo pnpm)

Proyek ini disusun menggunakan struktur monorepo pnpm untuk memudahkan manajemen dependensi antara frontend dan backend:

*   **`apps/api` (NestJS)**: Backend API utama yang melayani Deep Linking Engine, pencatatan Click Logs analitik, dan operasi CRUD.
*   **`apps/web` (Next.js 16)**: Frontend untuk Halaman Publik Kreator (`/[username]`) dan Dashboard Kreator (`/dashboard`) yang dibangun menggunakan Tailwind CSS v4.
*   **`desain.md`**: Panduan Desain & Token Visual terintegrasi berbasis **Tokopedia Unify Design System**.

---

## 🛠️ Konfigurasi Port Default

Untuk menghindari konflik port lokal (misalnya port 3000/3001 yang sering dipakai development server lain), Linki telah dikonfigurasi menggunakan port custom berikut:

*   **Frontend (Next.js)**: Berjalan di **Port 5000** (`http://localhost:5000`)
*   **Backend API (NestJS)**: Berjalan di **Port 5001** (`http://localhost:5001`)

---

## 🚀 Memulai Pengembangan Lokal

### Prerequisites
Pastikan Anda sudah menginstal:
*   [Node.js](https://nodejs.org/) (versi 18+)
*   [pnpm](https://pnpm.io/) (`npm i -g pnpm`)
*   [Docker](https://www.docker.com/) (opsional, untuk menjalankan PostgreSQL & Redis lokal)

### Langkah Setup

1.  **Instalasi Dependensi Monorepo**
    Di direktori utama (`d:/LINKI`), jalankan:
    ```bash
    pnpm install
    ```

2.  **Menjalankan Infrastruktur Lokal (Docker)**
    Untuk menyalakan PostgreSQL (Database utama), Redis (Caching), dan Meilisearch (Pencarian cepat) lokal, gunakan file Compose yang telah disediakan:
    ```bash
    docker compose up -d
    ```

3.  **Setup Database & Migrasi (Prisma v6)**
    Sesuaikan `DATABASE_URL` pada `.env` di `apps/api/.env`.
    Kemudian, generate client Prisma dengan perintah:
    ```bash
    pnpm --filter api exec prisma generate
    ```
    Dan jalankan migrasi DB:
    ```bash
    pnpm db:migrate
    ```

4.  **Menjalankan Server Development**
    Jalankan kedua server secara bersamaan dari root folder menggunakan:
    *   Menjalankan frontend:
        ```bash
        pnpm dev:web
        ```
    *   Menjalankan backend:
        ```bash
        pnpm dev:api
        ```

---

## 🌐 Rancangan API & Engine Utama

### 1. True Deep Linking Engine (P0)
Engine redirect transparan terletak pada `/r/:username/:productId` di backend. 
*   **Deteksi User-Agent**: Otomatis mendeteksi sistem operasi pengunjung (iOS / Android / Desktop).
*   **Redirect Native Intent**: Mengarahkan pengunjung menggunakan skema URL native e-commerce (e.g. `intent://` untuk Android dan `shopee://`/`tokopedia://` untuk iOS) guna memaksa pembukaan aplikasi native e-commerce.
*   **Fallback Browser**: Jika aplikasi native tidak terinstal, script frontend di redirect page akan memicu timeout asinkron (800ms) untuk mengalihkan ke browser web mobile.
*   **Async Click Logs**: Pencatatan data analitik (viewer IP hash, tipe perangkat, rujukan referrer media sosial) dilakukan secara asinkron tanpa memblokir pemuatan halaman redirect (<50ms).

### 2. Resilient Scraper Service
Service scraping metadata e-commerce terletak di `POST /products/scrape` backend.
*   Menggunakan `axios` dan `cheerio` untuk mengekstrak tag OpenGraph (`og:title`, `og:image`).
*   Menggunakan blok try/catch tangguh sehingga jika terjadi pemblokiran IP oleh Cloudflare/sistem anti-bot e-commerce, API tidak akan crash atau mengembalikan HTTP 500, melainkan mengembalikan status flag `{ success: false, data: {}, manualInputRequired: true }` dengan HTTP 200/201 yang aman.

### 3. Autentikasi Keamanan (Basic AuthGuard)
Seluruh endpoint manajemen link produk & kategori dilindungi oleh `AuthGuard` di backend yang memeriksa header `Authorization: Bearer <secret-token>` menggunakan token statis rahasia (dikonfigurasi pada `.env` via `API_SECRET_TOKEN`).

---

## 🎨 Panduan Skema & Token Desain
Semua komponen frontend dirancang mobile-first berbasis standard Tokopedia Unify Design System:
*   Warna Ikonik Tokopedia Hijau (`#00AA5B`) dan Oranye Aksen (`#FF5722`).
*   Layout berbasis kartu putih kontras tinggi di atas background abu-abu terang (`#F0F3F7`).
*   Sudut melengkung halus `rounded-2xl` (16px) untuk card dan `rounded-lg` (8px) untuk tombol utama.
*   Daftar detail token visual dapat dibaca langsung pada [desain.md](file:///d:/LINKI/desain.md).
