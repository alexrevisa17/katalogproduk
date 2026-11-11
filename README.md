# Bang Pray Store

Aplikasi katalog dan toko top-up digital **Bang Pray Store** untuk produk Mobile Legends, Free Fire, dan Roblox. Aplikasi ini menggunakan React, TypeScript, Vite, Express, Supabase (Postgres + Storage), dan Vercel.

Dokumen ini menjelaskan fitur yang benar-benar ada di source code saat ini, serta langkah setup Supabase dan Vercel. Jangan memasukkan secret atau file `.env` ke GitHub.

## Fitur aplikasi

- Homepage katalog produk dengan pencarian, kategori, kartu produk dua kolom pada layar kecil, dan carousel Produk Terlaris.
- Dialog detail produk berbentuk bottom sheet.
- Panel admin di `/admin` untuk login, tambah/edit/hapus produk, mengubah ketersediaan, dan mengatur nama toko, logo, serta nomor WhatsApp.
- Data produk dan konfigurasi toko disimpan di Supabase, bukan `localStorage`.
- Gambar produk dan logo diunggah ke Supabase Storage bucket publik `product-images`.
- Upload gambar produk mendukung JPG, PNG, WebP, dan GIF dengan batas **10 MiB (10 × 1024 × 1024 byte)** per file.
- Admin menggunakan PIN dari environment variable `ADMIN_PIN`. Setelah login, server memberikan cookie sesi HttpOnly yang ditandatangani dengan `ADMIN_SESSION_SECRET`; masa berlaku sesi 12 jam.
- PWA menggunakan manifest dan service worker. Manifest/ikon bermerek mengambil logo toko yang disimpan di konfigurasi Supabase. Instalasi tetap bergantung pada dukungan browser dan perangkat.
- Endpoint health check: `/api/health`.

## Teknologi dan versi runtime

- Node.js **22.22.0** (lihat `.nvmrc` dan `engines` di `package.json`).
- React 19, TypeScript, Vite 6, Tailwind CSS.
- Express 5 untuk API server.
- Supabase Postgres REST API dan Supabase Storage.
- Vercel Functions untuk deployment API.

## Struktur penting repository

```text
api/
  [...path].ts          # Vercel function untuk Express API utama
  admin/                # Vercel routes untuk sesi admin
  upload/sign.ts        # Endpoint khusus membuat signed upload URL
src/
  pages/
    index.tsx           # Homepage/katalog
    admin.tsx           # Panel admin dan form produk
  components/
    ProductSheet.tsx    # Dialog detail produk homepage
    BestsellerCarousel.tsx
  server/
    entry.ts             # Registrasi route Express
    supabase.ts          # Akses Supabase DB dan Storage
    api/                 # Handler produk, konfigurasi, upload, autentikasi
  hooks/
    useStoreConfig.ts
supabase/
  schema.sql             # Tabel, RLS, dan bucket Storage
public/
  manifest.webmanifest
  sw.js
vercel.json
env.example
```

## Persiapan Supabase

### 1. Buat atau pilih proyek

1. Buka [Supabase](https://supabase.com/dashboard).
2. Buat proyek baru atau pilih proyek yang sudah dimiliki.
3. Tunggu sampai database proyek selesai dibuat.
4. Buka **Project Settings → API** (atau **Project Settings → API Keys**, sesuai tampilan dashboard).
5. Catat:
   - **Project URL**.
   - **service_role key** / secret service-role key. Key ini hanya untuk server; jangan pernah memasukkannya ke kode browser atau variabel berawalan `VITE_`.

Nama menu dan jenis tampilan API key dapat berbeda pada dashboard Supabase. Gunakan key server-side yang memiliki hak service role, bukan publishable/anon key.

### 2. Jalankan SQL schema

1. Di dashboard proyek Supabase, buka **SQL Editor**.
2. Pilih **New query**.
3. Buka file `supabase/schema.sql` di repository ini.
4. Salin seluruh isi file tersebut ke SQL Editor.
5. Klik **Run** dan pastikan query berhasil.

SQL tersebut membuat:

- Tabel `public.products` untuk katalog.
- Tabel `public.store_config` untuk nama toko, logo, dan WhatsApp.
- Bucket Storage publik bernama `product-images`.
- Batas ukuran file bucket **10 MiB**.
- Daftar MIME yang diizinkan: JPEG, PNG, WebP, dan GIF.
- Row Level Security (RLS) pada tabel produk dan konfigurasi.

Jika bucket `product-images` sudah ada, perintah `ON CONFLICT` di schema memperbarui bucket itu menjadi publik dan menetapkan batas 10 MiB serta MIME yang diizinkan. Menjalankan ulang schema aman untuk tujuan penyelarasan struktur ini; jangan menghapus bucket atau tabel yang sudah berisi data.

Untuk memeriksa batas bucket setelah menjalankan SQL:

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';
```

Nilai `file_size_limit` yang diharapkan adalah `10485760`.

### 3. Cara kerja keamanan data Supabase

- Browser tidak mengakses database dengan service-role key.
- Request database dilakukan oleh server aplikasi menggunakan `SUPABASE_SERVICE_ROLE_KEY`.
- RLS diaktifkan pada tabel `products` dan `store_config`; aplikasi tidak membuat policy akses publik untuk tabel tersebut.
- Endpoint baca katalog dan konfigurasi toko disediakan oleh API aplikasi.
- Operasi tulis produk, pengaturan toko, dan upload dilindungi pemeriksaan sesi admin di server.
- Bucket gambar bersifat publik agar URL gambar produk dapat ditampilkan oleh pengunjung. Jangan menyimpan dokumen pribadi atau file rahasia di bucket ini.

## Environment variables

Tambahkan variabel berikut di Vercel. Semua nama harus persis dan **jangan** diberi awalan `VITE_`.

| Variable | Wajib | Isi |
|---|---:|---|
| `SUPABASE_URL` | Ya | Project URL Supabase, contoh `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | Secret/service-role key dari proyek Supabase |
| `ADMIN_PIN` | Ya | PIN yang dipilih pemilik toko |
| `ADMIN_SESSION_SECRET` | Ya | Rahasia acak minimal 32 karakter |

Jangan menaruh nilai rahasia sungguhan di README, source code, screenshot publik, atau GitHub. PIN admin tidak disimpan di database dan tidak ditentukan oleh README; nilai yang berlaku adalah nilai `ADMIN_PIN` di environment deployment.

Untuk membuat secret sesi acak di komputer yang memiliki OpenSSL:

```bash
openssl rand -base64 48
```

Salin hasilnya ke `ADMIN_SESSION_SECRET`. Jangan gunakan PIN sebagai session secret.

### Pengembangan lokal (opsional)

```bash
cp env.example .env
```

Lalu ganti placeholder Supabase dan autentikasi di `.env` dengan nilai proyek sendiri. Jangan commit `.env`. Jalankan:

```bash
npm install
npm run dev
```

Vite menjalankan middleware API lokal dari `src/server/entry.ts`; Supabase tetap diperlukan agar data produk, konfigurasi toko, autentikasi, dan upload dapat bekerja.

## Deploy ke Vercel

### 1. Hubungkan repository

1. Buka [Vercel Dashboard](https://vercel.com/dashboard).
2. Pilih **Add New → Project**.
3. Import repository GitHub `alexrevisa17/katalogproduk`.
4. Pastikan Production Branch adalah `main`.

### 2. Pengaturan build

Konfigurasi proyek mengikuti `vercel.json` yang ada di repository:

| Pengaturan | Nilai |
|---|---|
| Framework Preset | Other (atau biarkan Vercel mendeteksi konfigurasi) |
| Build Command | `npm run build` |
| Output Directory | `dist/client` |
| Install Command | `npm install` |
| Node.js | 22.x; proyek meminta minimal 22.22.0 |

Jangan mengganti Output Directory menjadi `dist` atau `public`. Vercel perlu menyajikan hasil frontend dari `dist/client`. Build juga membuat `dist/server.bundle.mjs` yang dipakai API function.

### 3. Tambahkan Environment Variables

Di **Project → Settings → Environment Variables**, tambahkan empat variabel pada bagian sebelumnya:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PIN`
- `ADMIN_SESSION_SECRET`

Pilih environment **Production**. Jika ingin menguji Preview Deployment dari branch lain, tambahkan variabel yang sesuai untuk **Preview** juga. Jangan masukkan secret ke variabel `VITE_*`.

### 4. Deploy ulang

Setelah semua environment variable disimpan, buka **Deployments** lalu lakukan **Redeploy** pada deployment terbaru (atau push commit baru ke `main`). Environment variable baru tidak berlaku pada deployment yang sudah berjalan sebelum perubahan tersebut.

### 5. Verifikasi deployment

Buka domain Vercel milik toko dan periksa:

| URL | Hasil yang diharapkan |
|---|---|
| `/api/health` | JSON status health |
| `/api/products` | JSON daftar produk |
| `/api/store-config` | JSON konfigurasi toko |
| `/admin` | Halaman login/panel admin |

Jika tabel `products` kosong, handler katalog akan mengisi data awal dari `src/lib/default-products.ts` pada pembacaan pertama. Setelah itu, perubahan katalog disimpan ke Supabase.

Login melalui `/admin` menggunakan nilai yang sudah diatur di `ADMIN_PIN`. Setelah login, uji tambah/edit produk dan pengaturan logo/WhatsApp. Uji upload dengan file kecil terlebih dahulu; kemudian uji file yang lebih besar. Pastikan bucket `product-images` ada dan batasnya `10485760`.

## API aplikasi

| Method | Endpoint | Akses / kegunaan |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/products` | Membaca katalog |
| POST | `/api/products` | Simpan/tambah produk; wajib sesi admin |
| DELETE | `/api/products/:id` | Hapus produk; wajib sesi admin |
| GET | `/api/store-config` | Membaca konfigurasi toko |
| PUT | `/api/store-config` | Simpan konfigurasi; wajib sesi admin |
| POST | `/api/admin/login` | Login menggunakan PIN |
| GET | `/api/admin/session` | Memeriksa sesi |
| POST | `/api/admin/logout` | Logout |
| POST | `/api/upload/sign` | Membuat signed upload URL; wajib sesi admin |
| POST | `/api/upload` | Endpoint upload server-side lama; wajib sesi admin |
| GET | `/api/brand-icon.svg` | Ikon yang dibentuk dari logo toko |
| GET | `/api/brand-manifest` | Manifest PWA berdasarkan konfigurasi logo |
| GET | `/api/brand-logo-file` | Mengarahkan ke file logo toko |

API utama dijalankan melalui Express yang dibundel pada build. Vercel juga memiliki function khusus `api/upload/sign.ts` untuk membuat signed URL upload; browser mengirim file langsung ke Supabase Storage setelah URL tersebut diterima. Jangan menghapus file function atau mengubah rewrites tanpa memeriksa alur API.

## Panduan gambar produk

Rasio berikut sesuai dengan area gambar yang digunakan oleh UI saat ini. Resolusi adalah rekomendasi kualitas, bukan batas wajib selama gambar memenuhi batas upload 10 MiB.

| Area | Field produk | Rasio area | Resolusi rekomendasi |
|---|---|---:|---:|
| Kartu katalog homepage (2 kolom) | `imageThumbnail` | 4:3 | **800 × 600 px** |
| Carousel Produk Terlaris | `imageDetail` (fallback `image`) | Kartu memiliki tinggi tetap 160 px; gambar menjadi latar `cover` | **1200 × 675 px** |
| Dialog detail produk | `imageDetail` (fallback `image`) | 16:9 | **1200 × 675 px** |

Catatan tampilan:

- Gambar katalog menggunakan `object-contain` dalam wadah 4:3 sehingga gambar dengan rasio berbeda tetap terlihat utuh; mungkin ada ruang kosong di sisi gambar.
- Gambar detail menggunakan rasio 16:9 dan `object-fit: cover`; gunakan gambar 16:9 agar tidak terpotong.
- Carousel memakai gambar detail sebagai latar dekoratif dengan `object-fit: cover`, overlay, dan tinggi kartu tetap 160 px. Bagian gambar dapat ter-crop sesuai lebar layar. Ini bukan pratinjau penuh gambar detail.
- Gunakan satu gambar 16:9 untuk carousel dan dialog detail agar identitas visualnya sama.
- File persegi 400 × 400 px yang sudah ada tetap dapat dipakai pada kartu katalog; dengan `contain`, gambar tidak terpotong tetapi tidak memenuhi seluruh area 4:3.

## PWA dan instalasi

- Manifest dinamis di `/api/brand-manifest` menggunakan logo toko dari konfigurasi Supabase.
- Ikon dinamis dilayani oleh `/api/brand-icon.svg`; file logo asli diarahkan melalui `/api/brand-logo-file`.
- Service worker berada di `public/sw.js`. Ia menyimpan app shell dan aset statis yang sama-origin untuk membantu pemuatan berikutnya/offline.
- Request API `/api/*` tidak disimpan dalam cache service worker; data katalog, login, dan operasi admin memerlukan koneksi jaringan.
- Instalasi PWA tergantung dukungan browser/OS, HTTPS, manifest, dan kriteria instalasi browser. Pada Android Chrome, buka domain HTTPS lalu gunakan opsi **Install app** bila tersedia. Jika browser hanya menawarkan **Tambahkan ke layar utama** atau **Buat pintasan**, itu bukan selalu instalasi WebAPK penuh.
- Setelah mengganti logo, browser mungkin masih menyimpan ikon lama. Perbarui service worker/cache atau hapus lalu pasang ulang aplikasi bila ikon belum berubah.

## Perintah pemeriksaan

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

Jalankan pemeriksaan yang relevan sebelum merge/deploy. Status build lokal dan status deployment Vercel harus dilihat langsung di log masing-masing; dokumentasi ini tidak menyatakan build selalu lolos.

## Keamanan dan operasional

- Jangan pernah commit `.env`, Supabase service-role key, atau session secret.
- Jika service-role key pernah terpublikasi, segera rotate dari dashboard Supabase dan perbarui Vercel Environment Variables, lalu redeploy.
- Gunakan PIN admin yang tidak mudah ditebak dan rahasia sesi acak yang berbeda.
- Cookie admin bersifat HttpOnly, Secure pada production, SameSite=Strict, dan berlaku 12 jam.
- Mekanisme pembatasan percobaan PIN saat ini menggunakan memori proses; jangan menganggapnya sebagai rate limit terdistribusi/persisten untuk semua instance serverless.
- Bucket `product-images` bersifat publik agar gambar produk dapat dilihat pengunjung. Jangan mengunggah file rahasia.
- Backup database Supabase secara berkala sebelum menjalankan perubahan schema besar atau menghapus data.

## Troubleshooting

**Katalog tidak muncul atau API mengembalikan 503**
- Pastikan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah diatur pada environment Vercel yang benar.
- Pastikan SQL `supabase/schema.sql` sudah dijalankan pada proyek Supabase yang URL-nya sama.
- Periksa log Vercel Function untuk request `/api/products` atau `/api/store-config`.

**Login admin gagal**
- Pastikan `ADMIN_PIN` dan `ADMIN_SESSION_SECRET` tersedia di Vercel.
- Panjang `ADMIN_SESSION_SECRET` minimal 32 karakter.
- Redeploy setelah mengubah environment variables.
- Sesi berlangsung 12 jam; login kembali jika sesi kedaluwarsa.

**Upload gambar gagal**
- Pastikan bucket publik bernama persis `product-images`.
- Pastikan batas bucket adalah `10485760` byte dan MIME mengizinkan JPEG, PNG, WebP, GIF.
- Pastikan gambar tidak melebihi 10 MiB.
- Periksa log function `/api/upload/sign` dan respons Storage di browser/Vercel.
- Jangan membuat `SUPABASE_SERVICE_ROLE_KEY` sebagai variabel `VITE_*`.

**Logo atau ikon PWA belum berubah**
- Pastikan logo sudah tersimpan di pengaturan toko.
- Pastikan URL logo dapat diakses oleh server dari host aplikasi atau proyek Supabase yang dikonfigurasi.
- Refresh situs; bila perlu bersihkan cache/service worker atau pasang ulang PWA.

## Lisensi

Gunakan dan distribusikan source code sesuai lisensi yang berlaku pada repository dan dependensi pihak ketiga. Periksa file lisensi proyek sebelum redistribusi.
