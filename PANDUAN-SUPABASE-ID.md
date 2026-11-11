# Panduan menghubungkan StokProduk ke Supabase dan Vercel

Ikuti urutan ini. Jangan mengirim `service_role key` kepada siapa pun dan jangan menaruhnya di kode frontend.

## A. Siapkan database Supabase

1. Masuk ke https://supabase.com/dashboard lalu buka project Supabase milik Anda.
2. Buka **SQL Editor** → **New query**.
3. Buka file `supabase/schema.sql` dari ZIP ini, salin seluruh isinya, tempel ke SQL Editor, lalu tekan **Run**.
4. Pastikan query selesai tanpa error. Query tersebut membuat tabel `products`, tabel `store_config`, mengaktifkan RLS, memberi akses server `service_role`, dan membuat bucket Storage publik bernama `product-images` dengan batas file 5 MB.
5. Buka **Project Settings → API** (pada tampilan baru bisa bernama **API Keys**). Siapkan: **Project URL** dan **service_role / secret key**. Jangan gunakan `anon` key untuk `SUPABASE_SERVICE_ROLE_KEY`.

## B. Masukkan Environment Variables di Vercel

1. Buka https://vercel.com/dashboard → pilih project StokProduk.
2. Buka **Settings → Environment Variables**.
3. Tambahkan variabel berikut satu per satu. Pilih environment **Production** dan **Preview** (Development boleh ditambahkan juga).

| Name | Value |
|---|---|
| `SUPABASE_URL` | Project URL dari Supabase, contoh `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret/service_role key dari Supabase |
| `ADMIN_PIN` | `170990` |
| `ADMIN_SESSION_SECRET` | Rahasia acak minimal 32 karakter |

Untuk membuat `ADMIN_SESSION_SECRET`, gunakan generator password atau jalankan `openssl rand -base64 48` di terminal. Simpan hasilnya sebagai nilai variabel. Jangan gunakan teks contoh dan jangan bagikan secret ini.

**Penting:** nama variabel harus persis sama. Jangan beri awalan `VITE_` pada `SUPABASE_SERVICE_ROLE_KEY`, karena itu dapat mengekspos kunci rahasia ke browser. Jangan membuat file `.env` berisi key lalu mengunggahnya ke GitHub.

## C. Upload source ke GitHub

1. Ekstrak ZIP perbaikan.
2. Buka folder `StokProduk` hasil ekstrak.
3. Upload seluruh isi folder tersebut ke repository GitHub, bukan folder ZIP-nya.
4. Pastikan file `vercel.json`, folder `api`, folder `src`, folder `public`, `package.json`, dan `package-lock.json` ikut terunggah.
5. Pastikan `.env` tidak ikut terunggah. File `.env` sudah masuk `.gitignore`.

## D. Deploy ulang di Vercel

1. Buka project Vercel → **Deployments**.
2. Pilih **Redeploy** untuk commit terbaru, atau tunggu deploy otomatis dari GitHub.
3. Build menggunakan perintah `npm run build` dan output frontend `dist/client`. Proyek menetapkan Node.js minimal `22.22.0`; gunakan versi itu atau yang lebih baru.
4. Setelah deployment berhasil, buka alamat website Anda.

## E. Tes setelah deploy

1. Buka `https://DOMAIN-ANDA/api/health` — harus merespons status `ok`.
2. Buka `https://DOMAIN-ANDA/api/products` — harus menampilkan daftar produk. Jika tabel masih kosong, server akan mengisi 10 produk awal (MLBB, Free Fire, Roblox) secara otomatis.
3. Buka `https://DOMAIN-ANDA/admin`, masukkan PIN `170990`.
4. Tambah satu produk uji, simpan, lalu buka website dari browser/perangkat lain. Produk yang sama harus muncul karena datanya berasal dari Supabase.
5. Ubah stok/harga atau nonaktifkan produk, lalu periksa kembali dari perangkat lain.
6. Coba upload gambar produk. Gambar disimpan di Supabase Storage bucket `product-images`; batas upload melalui panel adalah 3 MB agar aman terhadap batas payload fungsi serverless.
7. Ubah nomor WhatsApp atau logo di pengaturan toko, simpan, lalu refresh website. Pengaturan harus tetap ada.

## F. Data apa yang disimpan di mana?

- Katalog produk, harga, stok, kategori, deskripsi, status aktif: tabel Supabase `products`.
- Nama toko, URL logo, nomor WhatsApp: tabel Supabase `store_config`.
- Gambar yang diunggah melalui admin: Supabase Storage bucket `product-images`.
- PIN admin dan penandatangan sesi: Environment Variables Vercel, bukan tabel dan bukan frontend.
- localStorage yang masih ada di aplikasi hanya untuk preferensi persetujuan cookie/analytics; bukan untuk produk atau pengaturan toko.

## Jika gagal

- Error `SUPABASE_URL ... belum diatur`: periksa Environment Variables Vercel, lalu redeploy.
- Error tabel `products` atau `store_config` tidak ditemukan: jalankan ulang SQL schema di Supabase.
- Upload gagal: pastikan bucket `product-images` ada dan berstatus **Public**, serta file tidak lebih dari 3 MB.
- Login admin mendapat error konfigurasi: pastikan `ADMIN_PIN` dan `ADMIN_SESSION_SECRET` sudah diisi di Vercel, lalu redeploy.
- Jangan pernah menempelkan `service_role key` ke chat, GitHub, atau file frontend.
