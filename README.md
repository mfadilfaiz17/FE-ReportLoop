# ReportLoop â€” Frontend (Temporary Development README)

> **Status:** Draft / Early Prototype (Tahap 1 â€” Vanilla HTML5, Tailwind CSS CDN, ES2022 Modules)  
> Dokumen ini bersifat sementara selama pengembangan **Semifinal STACK 2026 (GDGoC ITB)** sebelum migrasi ke **React + Vite** dan perilisan README production.

**ReportLoop** adalah aplikasi web pelacakan masalah fasilitas kampus dan lingkungan hunian mahasiswa berbasis lokasi peta (*Leaflet.js*) serta dukungan kolektif (`+1 Upvote`). Dikembangkan oleh **Tim Perintis** (D4 Teknologi Rekayasa Komputer, Politeknik Negeri Indramayu).

---

## Cara Menjalankan (Lokal)

1. Buka folder `FE-ReportLoop` di VS Code.
2. Jalankan melalui server HTTP lokal, misalnya:
   - Ekstensi **Live Server** di VS Code (klik *Go Live* pada `index.html`), atau
   - Terminal: `python -m http.server 5500` / `npx serve .`
3. Buka `http://localhost:5500` (atau port Live Server Anda).

> **Catatan:** Jangan membuka file `.html` langsung lewat `file://`, karena ES Modules dan API enkripsi browser (`crypto.subtle`) membutuhkan `localhost` atau `HTTPS`.

### Mode Data (`Demo` vs `Live FastAPI`)
- **Mode Demo (Default):** Menggunakan data awal `SEED_REPORTS` dan `localStorage` browser sehingga seluruh alur dapat diuji tanpa backend.
- **Mode Live API:** Hubungkan ke server FastAPI di `http://127.0.0.1:8000` melalui tombol **Mode Data** pada header aplikasi.

---

## Google OAuth (Client ID Asli, Diverifikasi Backend)

Tombol **Masuk/Daftar dengan Google** membaca `GOOGLE_CLIENT_ID` dari `js/config/constants.js`. Tidak ada akun Google dummy.

- **Client ID kosong (default):** tombol hanya menampilkan pesan bahwa Google belum dikonfigurasi.
- **Client ID terisi:** aplikasi memuat Google Identity Services resmi dan tombol Google asli tampil. Token ID dikirim ke `POST /api/auth/google` dan wajib diverifikasi backend. Panduan backend ada di `BACKEND-GOOGLE-AUTH.md`.

Cara menghubungkan Client ID asli: buat OAuth Client ID (tipe *Web application*) di Google Cloud Console, tambahkan alamat server lokal Anda (misalnya `http://localhost:5500`) ke *Authorized JavaScript origins*, lalu jalankan di console browser dan muat ulang halaman:

```js
localStorage.setItem('reportloop.googleClientId', '<CLIENT_ID>.apps.googleusercontent.com');
```

Untuk melepas Client ID: `localStorage.removeItem('reportloop.googleClientId')`.

---

## Akun & Cara Masuk (Mode Demo)

Akun disimpan secara lokal di `localStorage` browser masing-masing.

- **Mahasiswa (Pelapor)**
  1. Daftar di `html/daftar.html` menggunakan **NIM (12 digit)**, **Email Google umum** (`@gmail.com`), dan kata sandi (min. 8 karakter), atau gunakan tombol **Daftar dengan Google** (OAuth).
  2. Masuk melalui `html/masuk.html` (via NIM + sandi atau **Masuk dengan Google**), dengan opsi **Ingat saya di perangkat ini** (sesi 7 hari) dan **Lupa kata sandi?** untuk mengakses `html/user.html`.
- **Admin Sarpras (Pengelola)**
  1. Daftar di `html/admin-daftar.html` menggunakan **Email Google**, kata sandi (min. 8 karakter), dan kode undangan demo (diberikan terpisah oleh tim pengembang, tidak ditulis di repo), atau gunakan tombol **Daftar dengan Google** + kode undangan.
  2. Masuk melalui `html/admin-masuk.html` (via email atau **Masuk dengan Google**), dilengkapi opsi **Ingat saya** (7 hari) dan **Lupa kata sandi?** untuk mengakses panel triase `html/admin.html`.

---

## Struktur Direktori Saat Ini

```text
FE-ReportLoop/
index.html          # Landing page & pratinjau papan laporan publik
css/                # Token warna Light/Dark (base.css) & styling peta (map.css)
html/               # Halaman peran, halaman auth, dan partial komponen UI
js/
main.js         # Entry point & inisialisasi modul
config/         # Konstanta kampus, endpoint API, & konfigurasi Tailwind
data/           # Data dummy SEED_REPORTS untuk Mode Demo
state/          # Store state aplikasi
services/       # API client FastAPI, auth demo, kalkulasi geo 15m, & NLP
features/       # Kontroler UI (peta, foto, form, papan publik, panel admin)
utils/          # Theme toggle, toast, badge, sanitasi HTML, scroll reveal
PRD.md              # Spesifikasi kebutuhan produk frontend
DESIGN.md           # Panduan sistem desain Light/Dark Mode
STACK.md            # Arsitektur teknis & peta migrasi ke React
CHECKLIST.md        # Checklist audit & roadmap pengerjaan
```

---

## Status Fitur (Prototype vs. Target Production)

**Sudah tersedia di prototype (Semifinal):**
- Autentikasi terpisah Mahasiswa (NIM + Email Google) dan Admin Sarpras (Email Google + kode undangan), dilengkapi **Google OAuth**, **Lupa kata sandi**, dan opsi **Ingat saya (7 hari)**.
- Peta interaktif kampus Polindra (Leaflet.js) dengan *draggable marker* dan status pin.
- Form pelaporan + pratinjau kategori NLP otomatis (*Infrastructure*, *Cleanliness*, *Security*).
- Validasi foto bukti dan deteksi laporan duplikat dalam radius 15 meter.
- Papan laporan publik dengan filter, pencarian, dan `+1 Upvote`.
- Panel triase Admin Sarpras (`Received` -> `In Progress` -> `Resolved`) + Light/Dark Mode.

**Disiapkan untuk tahap selanjutnya (Final Day & Production):**
- Notifikasi *real-time* ke pelapor saat status berubah.
- Ekspor rekap laporan bulanan (PDF / CSV).
- Klasterisasi marker peta & kolom komentar tindak lanjut.
- Migrasi 1:1 ke **React + Vite** setelah integrasi penuh dengan backend FastAPI.
