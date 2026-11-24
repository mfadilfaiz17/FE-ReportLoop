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

## Akun & Cara Masuk (Mode Demo)

Akun disimpan secara lokal di `localStorage` browser masing-masing.

- **Mahasiswa (Pelapor)**
  1. Daftar di `html/daftar.html` menggunakan **NIM (6â€“12 digit)** dan kata sandi (min. 8 karakter).
  2. Masuk melalui `html/masuk.html` untuk mengakses `html/user.html`.
- **Admin Sarpras (Pengelola)**
  1. Daftar di `html/admin-daftar.html` menggunakan **Email**, kata sandi (min. 8 karakter), dan kode undangan demo (diberikan terpisah oleh tim pengembang, tidak ditulis di repo).
  2. Masuk melalui `html/admin-masuk.html` untuk mengakses panel triase `html/admin.html`.

---

## Struktur Direktori Saat Ini

```text
FE-ReportLoop/
â”œâ”€â”€ index.html          # Landing page & pratinjau papan laporan publik
â”œâ”€â”€ css/                # Token warna Light/Dark (base.css) & styling peta (map.css)
â”œâ”€â”€ html/               # Halaman peran, halaman auth, dan partial komponen UI
â”œâ”€â”€ js/
â”‚   â”œâ”€â”€ main.js         # Entry point & inisialisasi modul
â”‚   â”œâ”€â”€ config/         # Konstanta kampus, endpoint API, & konfigurasi Tailwind
â”‚   â”œâ”€â”€ data/           # Data dummy SEED_REPORTS untuk Mode Demo
â”‚   â”œâ”€â”€ state/          # Store state aplikasi
â”‚   â”œâ”€â”€ services/       # API client FastAPI, auth demo, kalkulasi geo 15m, & NLP
â”‚   â”œâ”€â”€ features/       # Kontroler UI (peta, foto, form, papan publik, panel admin)
â”‚   â””â”€â”€ utils/          # Theme toggle, toast, badge, sanitasi HTML, scroll reveal
â”œâ”€â”€ PRD.md              # Spesifikasi kebutuhan produk frontend
â”œâ”€â”€ DESIGN.md           # Panduan sistem desain Light/Dark Mode
â”œâ”€â”€ STACK.md            # Arsitektur teknis & peta migrasi ke React
â””â”€â”€ CHECKLIST.md        # Checklist audit & roadmap pengerjaan
```

---

## Status Fitur (Prototype vs. Target Production)

**Sudah tersedia di prototype (Semifinal):**
- Autentikasi terpisah Mahasiswa (NIM) dan Admin Sarpras (Email + kode undangan).
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
