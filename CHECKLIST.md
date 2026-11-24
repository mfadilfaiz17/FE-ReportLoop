# Checklist Audit & Roadmap Pengerjaan Frontend â€” ReportLoop

**Target:** Semifinal STACK 2026 (Deadline: 30 November 2026) -> Final Day (16 Desember 2026)  
**Arsitektur:** Tahap 1 Modular Vanilla HTML/CSS/ES Modules -> Tahap 2 React + Vite  

---

## Bagian 0: Hasil Audit yang Sudah Selesai Direvisi

- [x] **Dokumen Spesifikasi & Desain:** Menyusun `PRD.md`, `DESIGN.md`, dan `STACK.md` sesuai alur Semifinal vs. Final Day.
- [x] **Token Warna Light & Dark Mode:** Menambahkan variabel warna Biruâ€“Putih (`:root`) dan Biruâ€“Slate (`html.dark`) pada `css/base.css` serta penyesuaian peta gelap pada `css/map.css`.
- [x] **Pengelola Tema & Konfigurasi Tailwind:** Membuat `js/utils/theme.js` (Heroicons Matahari/Bulan + `localStorage`) dan `js/config/tailwind.config.js` (`darkMode: 'class'`).
- [x] **Efek Gulir Halus (*Scroll Reveal*):** Membuat `js/utils/scrollReveal.js` berbasis `IntersectionObserver` dengan dukungan `prefers-reduced-motion`.
- [x] **Header Aplikasi & Kesiapan Auth API:** Menambahkan tombol toggle tema pada `html/header.html`, memanggil `initTheme()` + `initScrollReveal()` di `js/main.js`, serta menambahkan dukungan `Authorization: Bearer <token>` di `js/services/api.js`.
- [x] **Aksesibilitas Target Sentuh:** Memastikan tombol `.btn-sm` dan filter `.chip` memiliki tinggi minimum `44px`.

---

## Tahap 1: Fondasi Web App, Halaman Utama & Konsistensi Tema (Prioritas Dasar)

- [ ] **1.1 Pembaruan Halaman Utama (`index.html`):**
  - [ ] Mengganti *auto-redirect* langsung ke `masuk.html` menjadi halaman depan bergaya split-hero (`DESIGN.md`) dengan tombol masuk Mahasiswa/Admin, alur 3 langkah berikon Heroicons, pratinjau papan laporan publik nyata (`SEED_REPORTS`), dan toggle Light/Dark Mode.
- [ ] **1.2 Sinkronisasi Tema di Seluruh Entry HTML:**
  - [ ] Memuat `js/config/tailwind.config.js` pada `user.html`, `admin.html`, `masuk.html`, `daftar.html`, `admin-masuk.html`, dan `admin-daftar.html`.
  - [ ] Menambahkan skrip anti-*flicker* tema di `<head>` agar mode gelap langsung aktif sebelum halaman dirender.
- [ ] **1.3 Pembaruan Halaman Autentikasi (`masuk.html`, `daftar.html`, `admin-masuk.html`, `admin-daftar.html`):**
  - [ ] Menambahkan tombol pengalih tema (Terang/Gelap) pada pojok kanan atas halaman autentikasi.
  - [ ] Menyesuaikan kelas warna teks dan kartu agar kontras tetap memenuhi WCAG AA pada mode gelap.
- [ ] **1.4 Pembersihan File Lama:**
  - [ ] Memindahkan atau menghapus file monolitik lama (`reportloop_campus_web_app.html` dan `reportloop_campus_web_app.backup.html`) setelah seluruh halaman modular terverifikasi.

---

## Tahap 2: Fitur Inti Web App & Pengalaman Pengguna (Core MVP)

- [ ] **2.1 Fitur Geolocation GPS Perangkat (`js/features/map.js` & `html/view-mahasiswa.html`):**
  - [ ] Menambahkan tombol **"Gunakan Lokasi GPS Saya"** (`navigator.geolocation`) di atas/bawah peta kampus beserta penanganan error izin lokasi.
- [ ] **2.2 Validasi File Foto Bukti (`js/features/photo.js`):**
  - [ ] Menambahkan validasi tipe file gambar (`image/jpeg`, `image/png`, `image/webp`) dan batas ukuran maksimal `5 MB` dengan pesan umpan balik jelas.
- [ ] **2.3 Konsistensi Dark Mode pada Partial & Kartu Dinamis:**
  - [ ] Memperbarui kelas warna dark mode di `html/view-mahasiswa.html` (kotak pratinjau NLP & banner foto lama).
  - [ ] Memperbarui kelas warna dark mode di `html/view-admin.html` dan `js/features/adminPanel.js` (kartu KPI & baris antrean triase).
  - [ ] Memperbarui kelas warna dark mode di `js/features/publicBoard.js` (kartu laporan publik) dan `html/duplicate-modal.html` (modal konfirmasi duplikat radius 15 m).

---

## Tahap 3: Integrasi & Pengujian End-to-End dengan Backend FastAPI

- [ ] **3.1 Kunci Kontrak API bersama Backend (Ibrahim Movik):**
  - [ ] Memastikan kesamaan path endpoint (`/api/reports`, `/api/reports/{id}/upvote`, `/api/reports/{id}/status`) dan field JSON `Report`.
- [ ] **3.2 Uji Coba Mode Live API (`http://127.0.0.1:8000`):**
  - [ ] Menguji pembuatan laporan baru dengan foto asli (`multipart/form-data`).
  - [ ] Menguji penolakan foto lama (`HTTP 400 STALE_PHOTO_REJECTED`).
  - [ ] Menguji deteksi laporan duplikat radius 15 meter (`HTTP 409 DUPLICATE_NEARBY_REPORT`).
  - [ ] Menguji fitur `+1 Upvote` dan pembaruan status Admin (`Received` -> `In Progress` -> `Resolved`).

---

## Tahap 4: Fitur Tambahan, Optimasi & Tahap Lanjutan

- [ ] **4.1 Dokumentasi & Aset Proposal Semifinal (Target: Sebelum 30 November 2026):**
  - [ ] Mengambil tangkapan layar UI resolusi tinggi (tampilan Mobile & Desktop, Mode Terang & Mode Gelap) untuk bab *Proposed Solution*.
  - [ ] Memastikan tidak ada fitur *Final Day* yang diklaim sudah selesai di proposal maupun video demo 2 menit.
- [ ] **4.2 Migrasi 1:1 ke React + Vite + Leaflet:**
  - [ ] Memindahkan `js/services/`, `js/config/`, `js/data/`, dan `js/utils/` ke `src/` proyek React.
  - [ ] Mengonversi `html/*.html` dan `js/features/*.js` menjadi komponen `.jsx` + *custom hooks*.
- [ ] **4.3 Fitur Wajib Disisakan untuk Final Day (16 Desember 2026):**
  - [ ] Notifikasi *real-time* kepada pelapor saat status laporan diperbarui Admin.
  - [ ] Ekspor rekapitulasi laporan bulanan ke format PDF / CSV.
  - [ ] Klasterisasi marker peta & kolom komentar tindak lanjut pada detail laporan.
