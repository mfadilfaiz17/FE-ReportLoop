# Checklist Audit & Step Pengerjaan Frontend â€” ReportLoop

**Target:** Semifinal STACK 2026 (Deadline: 30 November 2026) -> Final Day (16 Desember 2026)  
**Arsitektur:** Tahap 1 Modular Vanilla HTML/CSS/ES Modules -> Tahap 2 React + Vite  

---

## Bagian 0: Sudah Selesai Direvisi

- [x] **Email Google, Google OAuth, Lupa Kata Sandi & Ingat Saya (7 Hari):** Menambahkan field email Google umum pada registrasi & profil mahasiswa, tombol *Masuk/Daftar dengan Google* (memakai Google Identity Services SDK resmi; token ID diverifikasi backend, tanpa akun dummy), dialog pemulihan kata sandi, serta checkbox *Ingat saya di perangkat ini* (memperpanjang sesi dari 8 jam menjadi 7 hari) pada `masuk.html`, `daftar.html`, `admin-masuk.html`, `admin-daftar.html`, `authPage.js`, `auth.js`, dan `profile.js`.
- [x] **Dokumen Spesifikasi & Desain:** Menyusun dan memperbarui `PRD.md`, `DESIGN.md`, dan `STACK.md` sesuai alur Semifinal vs. Final Day serta feedback terbaru (isolasi portal Sarpras, foto live wajib, profil khusus laporan user, palet *soft-white*, dan prinsip teks ringkas Clean UI).
- [x] **Token Warna Light & Dark Mode:** Menambahkan variabel warna dasar pada `css/base.css` serta penyesuaian peta gelap pada `css/map.css`.
- [x] **Pengelola Tema & Konfigurasi Tailwind:** Membuat `js/utils/theme.js` (Heroicons Matahari/Bulan + `localStorage`) dan `js/config/tailwind.config.js` (`darkMode: 'class'`).
- [x] **Efek Gulir Halus (*Scroll Reveal*):** Membuat `js/utils/scrollReveal.js` berbasis `IntersectionObserver` dengan dukungan `prefers-reduced-motion`.
- [x] **Header Aplikasi & Kesiapan Auth API:** Menambahkan tombol toggle tema pada `html/header.html`, memanggil `initTheme()` + `initScrollReveal()` di `js/main.js`, serta menambahkan dukungan `Authorization: Bearer <token>` di `js/services/api.js`.
- [x] **Aksesibilitas Target Sentuh:** Memastikan tombol `.btn-sm` dan filter `.chip` memiliki tinggi minimum `44px`.
- [x] **Penyederhanaan Teks (Clean UI):** Meringkas teks yang berulang dan menyatukan panduan singkat pada `index.html`, `html/view-mahasiswa.html`, `html/view-admin.html`, dan `html/footer.html`.

---

## Step Pengerjaan & Checklist yang Belum Dikerjakan (Urutan Eksekusi)

### Step 1: Penyesuaian Palet Warna *Soft-White* & Konsistensi Tema (Terang/Gelap)
- [x] **1.1 Pembaruan Token *Soft-White* (`css/base.css`):**
  - [x] Mengubah latar Light Mode ke *soft-white* (`--bg-page: #f1f5f9`, `--bg-surface: #f8fafc`, `--border: #cbd5e1`) agar tidak terlalu putih/menyilaukan bagi mahasiswa bermata minus maupun petugas Sarpras senior.
- [x] **1.2 Sinkronisasi Tema di Seluruh Entry HTML:**
  - [x] Memuat `js/config/tailwind.config.js` pada `user.html`, `admin.html`, `masuk.html`, `daftar.html`, `admin-masuk.html`, dan `admin-daftar.html`.
  - [x] Menambahkan skrip anti-*flicker* tema di `<head>` agar mode gelap/terang langsung aktif sebelum halaman dirender.
- [x] **1.3 Konsistensi Dark Mode pada Partial & Kartu Dinamis:**
  - [x] Memperbarui kelas warna dark mode di `html/view-mahasiswa.html` (kotak pratinjau NLP & banner foto lama).
  - [x] Memperbarui kelas warna dark mode di `html/view-admin.html` dan `js/features/adminPanel.js` (kartu KPI & baris antrean triase).
  - [x] Memperbarui kelas warna dark mode di `js/features/publicBoard.js` (kartu laporan publik) dan `html/duplicate-modal.html` (modal konfirmasi duplikat radius 15 m).

### Step 2: Isolasi Portal Login & UI Sarpras (Keamanan CIA)
- [x] **2.1 Pemisahan Tautan Publik & Portal Sarpras (`index.html`, `html/header.html`, `html/masuk.html`):**
  - [x] Menghapus seluruh tautan langsung ke `admin-masuk.html` / `admin-daftar.html` / `admin.html` dari `index.html`, `header.html`, dan halaman Mahasiswa agar akses Sarpras terisolasi (siap dipisah ke subdomain khusus di produksi).
  - [x] Memastikan `admin-masuk.html` dan `admin-daftar.html` berdiri sebagai UI terpisah dengan tombol pengalih tema (Terang/Gelap) dan proteksi guard peran pada `js/services/auth.js`.

### Step 3: Perbaikan Alur Foto Live & Pemblokiran Foto Lama (`photo.js`, `reportForm.js`, `view-mahasiswa.html`)
- [x] **3.1 Hapus Opsi Foto Lama di Form Buat Laporan Baru:**
  - [x] Menghilangkan pilihan/radio/tombol simulasi foto lama dari antarmuka `html/view-mahasiswa.html` sehingga form hanya menerima unggahan foto **live** (`capture="environment"`).
  - [x] Memastikan pada `js/features/photo.js` dan `js/features/reportForm.js`, apabila file foto terdeteksi sebagai foto lama (> 24 jam / `isStalePhoto`), tombol kirim diblokir dan laporan **tidak bisa dikirim**.
- [x] **3.2 Validasi File Foto Bukti (`js/features/photo.js`):**
  - [x] Menambahkan validasi tipe file gambar (`image/jpeg`, `image/png`, `image/webp`) dan batas ukuran maksimal `5 MB` dengan pesan umpan balik jelas.

### Step 4: Pemisahan Papan Laporan Profil (Khusus User) vs. Papan Laporan Umum
- [x] **4.1 Filter Khusus Laporan User di Profil (`js/features/profile.js`, `html/user.html`):**
  - [x] Memastikan saat membuka **Buka Papan Laporan** dari bagian **Profil**, daftar yang ditampilkan khusus berisi laporan milik user yang sedang login (difilter berdasarkan `user_id` / NIM pelapor).
  - [x] Memastikan laporan umum dari seluruh mahasiswa hanya tampil pada tab/halaman **Papan Laporan** utama (`js/features/publicBoard.js`).

### Step 5: Pembaruan Landing Page (`index.html`), Peta GPS, Tracking Progres Admin & Pembersihan File
â€‹- [x] **5.0 Pembaruan Dokumen `.md` untuk Fitur Tracking Admin:** Memperbarui `PRD.md`, `DESIGN.md`, dan `STACK.md` untuk mencatat alur pelacakan progres pengerjaan admin (`Diterima` -> `Diperbaiki` -> `Selesai`), riwayat status (`status_history`), dan aturan tampilan yang konsisten.
â€‹- [x] **5.0b Implementasi Fitur Tracking Pengerjaan Admin (User View):** Menambahkan indikator 3 tahap progres dan rincian riwayat status pada tampilan user (`publicBoard.js`, `profile.js`, dan `css/base.css`) sesuai panduan `DESIGN.md` dan `PRD.md`.
- [ ] **5.1 Pembaruan Halaman Utama (`index.html`):**
  - [ ] Mengganti *auto-redirect* langsung ke `masuk.html` menjadi halaman depan bergaya split-hero (`DESIGN.md`) dengan tombol masuk khusus Mahasiswa, alur 3 langkah berikon Heroicons, pratinjau papan laporan publik nyata (`SEED_REPORTS`), dan toggle Light/Dark Mode.
- [ ] **5.2 Fitur Geolocation GPS Perangkat (`js/features/map.js` & `html/view-mahasiswa.html`):**
  - [ ] Menambahkan tombol **"Gunakan Lokasi GPS Saya"** (`navigator.geolocation`) di atas/bawah peta kampus beserta penanganan error izin lokasi.
- [ ] **5.3 Pembersihan File Lama:**
  - [ ] Memindahkan atau menghapus file monolitik lama (`reportloop_campus_web_app.html` dan `reportloop_campus_web_app.backup.html`) jika masih ada setelah seluruh halaman modular terverifikasi.

### Step 6: Integrasi & Pengujian End-to-End dengan Backend FastAPI
- [ ] **6.1 Kunci Kontrak API bersama Backend (Ibrahim Movik):**
  - [ ] Memastikan kesamaan path endpoint (`/api/reports`, `/api/reports/{id}/upvote`, `/api/reports/{id}/status`) dan field JSON `Report`.
- [ ] **6.2 Uji Coba Mode Live API (`http://127.0.0.1:8000`):**
  - [ ] Menguji pembuatan laporan baru dengan foto live asli (`multipart/form-data`).
  - [ ] Menguji penolakan foto lama (`HTTP 400 STALE_PHOTO_REJECTED`) agar tidak bisa dikirim.
  - [ ] Menguji deteksi laporan duplikat radius 15 meter (`HTTP 409 DUPLICATE_NEARBY_REPORT`).
  - [ ] Menguji fitur `+1 Upvote` dan pembaruan status Admin (`Received` -> `In Progress` -> `Resolved`).
- [ ] **6.3 Persiapan Backend Google OAuth (detail lengkap di `BACKEND-GOOGLE-AUTH.md`):**
  - [ ] Membuat OAuth Client ID (Web application) di Google Cloud Console dan mendaftarkan origin frontend; Client ID yang sama dipakai FE dan BE.
  - [ ] Mengimplementasikan `POST /api/auth/google`: verifikasi token ID ke Google, cek `email_verified`, cari atau buat akun, lalu kembalikan `{ id, email, name, token }`.
  - [ ] Mengembalikan kode error `NIM_REQUIRED` / `INVITE_REQUIRED` (status `422`) untuk akun baru agar modal lengkapi verifikasi di FE muncul.
  - [ ] Menyimpan `ADMIN_INVITE_CODE` dan `JWT_SECRET` di `.env` server, serta mengaktifkan CORS untuk origin frontend.
  - [ ] Memastikan `PATCH /api/reports/{id}/status` menolak token non-admin dengan `403`.
  - [ ] Mengisi `reportloop.apiBase` dan `reportloop.googleClientId` (atau nilai default di `constants.js` untuk production), lalu menjalankan daftar uji di bagian 7 `BACKEND-GOOGLE-AUTH.md`.

### Step 7: Aset Proposal Semifinal, Migrasi React & Fitur Final Day
- [ ] **7.1 Dokumentasi & Aset Proposal Semifinal (Target: Sebelum 30 November 2026):**
  - [ ] Mengambil tangkapan layar UI resolusi tinggi (tampilan Mobile & Desktop, Mode Terang Soft-White & Mode Gelap) untuk bab *Proposed Solution*.
  - [ ] Memastikan tidak ada fitur *Final Day* yang diklaim sudah selesai di proposal maupun video demo 2 menit.
- [ ] **7.2 Migrasi 1:1 ke React + Vite + Leaflet:**
  - [ ] Memindahkan `js/services/`, `js/config/`, `js/data/`, dan `js/utils/` ke `src/` proyek React.
  - [ ] Mengonversi `html/*.html` dan `js/features/*.js` menjadi komponen `.jsx` + *custom hooks*.
- [ ] **7.3 Fitur Wajib Disisakan untuk Final Day (16 Desember 2026):**
  - [ ] Notifikasi *real-time* kepada pelapor saat status laporan diperbarui Admin.
  - [ ] Ekspor rekapitulasi laporan bulanan ke format PDF / CSV.
  - [ ] Klasterisasi marker peta & kolom komentar tindak lanjut pada detail laporan.
