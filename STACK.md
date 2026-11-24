# Frontend Tech Stack & Architecture Guide (STACK.md) â€” ReportLoop

**Fase:** Tahap 1 (Modular Vanilla HTML/CSS/ES Modules) -> Tahap 2 (Migrasi 1:1 ke React + Vite + Leaflet)  
**Pemilik Modul:** M. Fadil Faiz (UI/UX Designer & Frontend Developer)  
**Tujuan Dokumen:** Menjamin struktur kode awal memakai Vanilla Web Standards agar mudah di-debug bersama Backend FastAPI (Ibrahim Movik), sekaligus siap dipindahkan ke React tanpa menulis ulang logika bisnis.

---

## 1. Strategi Dua Tahap (Vanilla-First -> React Migration)

1. **Tahap 1 â€” Modular Vanilla HTML5 + Tailwind CSS + ES2022 Modules (Semifinal Early Prototype):**
   * Tanpa *build step* rumit sehingga langsung bisa dijalankan via Live Server / HTTP lokal saat demo dan pengujian endpoint FastAPI (`http://127.0.0.1:8000`).
   * Menggunakan ES Modules (`<script type="module">`) dengan pemisahan ketat antara **lapisan layanan (`services/`)**, **state terpusat (`state/`)**, **utilitas murni (`utils/`)**, dan **komponen tampilan (`features/` + `html/`)**.
2. **Tahap 2 â€” Migrasi ke React + Vite (Setelah Kontrak API 100% Teruji):**
   * Setiap folder dan berkas di struktur Vanilla memiliki pasangan langsung di struktur React sehingga proses konversi bersifat mekanis dan minim risiko bug.

---

## 2. Daftar Pustaka & Dependensi Eksternal

| Teknologi / Pustaka | Versi / Sumber | Fungsi & Alasan Pemilihan |
| :--- | :--- | :--- |
| **HTML5 Semantik** | Standar W3C | Struktur dokumen multi-halaman (`index.html` di root serta `html/user.html`, `html/admin.html`, `html/masuk.html`, `html/daftar.html`, `html/admin-masuk.html`, `html/admin-daftar.html`). |
| **Tailwind CSS + Custom CSS Tokens** | CDN + `css/base.css` | Utilitas tata letak responsif *mobile-first* dipadukan variabel CSS (`--bg-page`, `--brand`, `--border`) untuk dukungan *Light/Dark Mode* instan tanpa *flicker*. |
| **Vanilla JS (ES Modules)** | ES2022 Native | Pengelolaan state, validasi form, perhitungan jarak Haversine, klasifikasi NLP lokal, dan integrasi `fetch` API. |
| **Leaflet.js** | `1.9.4` (unpkg CDN) | Peta interaktif ringan untuk menampilkan polygon batas kampus Polindra, pin laporan berstatus, dan *draggable marker* lokasi laporan baru. |
| **Heroicons (Inline SVG)** | v2 Outline/Solid (24x24) | Ikon fungsional terstandar (peta, kamera, filter, dukungan/upvote, mode terang/gelap) tanpa menambah beban font ikon eksternal. |
| **IntersectionObserver API** | Browser Native | Animasi kemunculan elemen saat gulir (`js/utils/scrollReveal.js`) yang menghormati `prefers-reduced-motion`. |
| **Plus Jakarta Sans & JetBrains Mono** | Google Fonts | Tipografi utama antarmuka dan font monospace khusus koordinat/ID laporan. |

---

## 3. Struktur Direktori & Peta Konversi ke React

```text
FE-ReportLoop/
â”œâ”€â”€ index.html                  # Landing & Papan Publik Read-Only (Hero + Alur + Live Board)
â”œâ”€â”€ user.html                   # Ruang Kerja Mahasiswa (Peta + Form Laporan + Papan Upvote)
â”œâ”€â”€ admin.html                  # Panel Triase Admin Sarpras (KPI + Antrean Prioritas + Peta)
â”œâ”€â”€ masuk.html / daftar.html    # Autentikasi Mahasiswa (NIM)
â”œâ”€â”€ admin-masuk.html / admin-daftar.html # Autentikasi Petugas Sarpras terisolasi (terpisah dari UI publik/mahasiswa demi keamanan CIA; disiapkan untuk subdomain khusus di produksi)
â”œâ”€â”€ PRD.md                      # Spesifikasi Kebutuhan Produk Frontend
â”œâ”€â”€ DESIGN.md                   # Sistem Desain Blue-White Light/Dark Mode
â”œâ”€â”€ STACK.md                    # Dokumentasi Arsitektur & Kontrak Teknis
â”œâ”€â”€ css/
â”‚   â”œâ”€â”€ base.css                # Token warna Light/Dark, komponen tombol/form/badge, utilitas
â”‚   â””â”€â”€ map.css                 # Dimensi kontainer Leaflet, pin target, & penyesuaian Dark Mode
â”œâ”€â”€ html/                       # Partial HTML (setara komponen JSX di React)
â”‚   â”œâ”€â”€ header.html             # -> <Header/> (Navigasi peran, toggle tema, mode API, sesi)
â”‚   â”œâ”€â”€ footer.html             # -> <Footer/>
â”‚   â”œâ”€â”€ view-mahasiswa.html     # -> <StudentDashboard/>
â”‚   â”œâ”€â”€ view-admin.html         # -> <AdminDashboard/>
â”‚   â””â”€â”€ duplicate-modal.html    # -> <DuplicateReportModal/>
â””â”€â”€ js/
    â”œâ”€â”€ main.js                 # -> App.jsx / main.jsx (Bootstrap halaman & event delegation)
    â”œâ”€â”€ config/
    â”‚   â”œâ”€â”€ constants.js        # -> src/config/constants.js (Koordinat kampus, URL API, aturan NLP)
    â”‚   â””â”€â”€ tailwind.config.js  # -> tailwind.config.js
    â”œâ”€â”€ data/
    â”‚   â””â”€â”€ seedReports.js      # -> src/data/seedReports.js (Data awal Mode Demo)
    â”œâ”€â”€ state/
    â”‚   â””â”€â”€ store.js            # -> src/context/ReportContext.jsx / Zustand store
    â”œâ”€â”€ services/               # Logika murni tanpa akses DOM (100% reusable di React)
    â”‚   â”œâ”€â”€ api.js              # -> src/services/api.js (Client REST FastAPI + Auth Header)
    â”‚   â”œâ”€â”€ auth.js             # -> src/services/auth.js (Manajemen sesi & validasi peran)
    â”‚   â”œâ”€â”€ geo.js              # -> src/utils/geo.js (Rumus Haversine radius 15m)
    â”‚   â””â”€â”€ nlp.js              # -> src/utils/nlp.js (Simulasi prediksi kategori TF-IDF/NB)
    â”œâ”€â”€ features/               # Kontroler UI per modul (setara komponen pintar React)
    â”‚   â”œâ”€â”€ header.js           # Navigasi aktif, toggle Light/Dark Mode, toggle Demo/Live API
    â”‚   â”œâ”€â”€ map.js              # Inisialisasi Leaflet, GPS Geolocation, & sinkronisasi marker
    â”‚   â”œâ”€â”€ photo.js            # Upload foto live wajib (tanpa opsi foto lama), validasi tipe/ukuran, & pratinjau kamera
    â”‚   â”œâ”€â”€ reportForm.js       # Submit laporan (blokir foto lama), deteksi duplikat 15m, upvote, & update status
    â”‚   â”œâ”€â”€ publicBoard.js      # Filter kategori/status, pencarian, tab dukungan, & render kartu laporan umum
    â”‚   â”œâ”€â”€ adminPanel.js       # Hitung KPI riil & render antrean triase Sarpras
    â”‚   â”œâ”€â”€ duplicateModal.js   # Kontrol dialog aksesibel (Escape & Tab focus trap)
    â”‚   â””â”€â”€ authPage.js         # Validasi form login/register Mahasiswa & Admin
    â””â”€â”€ utils/
        â”œâ”€â”€ badges.js           # Pemetaan label & kelas warna status/kategori
        â”œâ”€â”€ escapeHtml.js       # Sanitasi string untuk mencegah XSS pada innerHTML
        â”œâ”€â”€ scrollReveal.js     # Efek kemunculan halus berbasis IntersectionObserver
        â”œâ”€â”€ theme.js            # Pengelola tema Light/Dark (localStorage + prefers-color-scheme)
        â””â”€â”€ toast.js            # Notifikasi umpan balik aksi pengguna
```

---

## 4. Arsitektur Data & Sinkronisasi Backend (FastAPI)

### 4.1 Penanganan Mode Ganda (`Demo Mode` vs `Live FastAPI`)
* Aplikasi berjalan default dalam **Mode Demo Interaktif** menggunakan `SEED_REPORTS` agar penguji dapat mencoba seluruh alur (buat laporan, uji foto lama, uji duplikat 15 meter, upvote, dan triase admin) meskipun backend lokal belum menyala.
* Tombol **Mode Data** di header melakukan pengecekan `GET /api/reports` dengan batas waktu `2500ms`. Jika server FastAPI aktif, state langsung beralih ke mode sinkronisasi penuh dengan PostgreSQL + PostGIS.

### 4.2 Kesiapan Token Autentikasi & Endpoint
* `js/services/api.js` menyediakan pembungkus `authHeaders()` yang otomatis menyertakan `Authorization: Bearer <token>` apabila sesi memiliki token JWT dari backend.
* Seluruh panggilan jaringan menangani status HTTP standar FastAPI: `200 OK`, `201 Created`, `400 Bad Request` (`STALE_PHOTO_REJECTED`), dan `409 Conflict` (`DUPLICATE_NEARBY_REPORT`).

---

## 5. Checklist Kesiapan Sebelum Konversi ke React

- [ ] Seluruh alur pengguna (Pengunjung -> Masuk -> Buat Laporan + Peta + Foto -> Upvote -> Triase Admin) berjalan tanpa error di konsol browser.
- [ ] Mode Terang (Biruâ€“Putih) dan Mode Gelap (Biruâ€“Slate) teruji kontras dan keterbacaannya di seluruh halaman.
- [ ] Kontrak JSON `Report` dan endpoint `/api/reports` sudah teruji langsung dengan server FastAPI milik Ibrahim.
- [ ] Setelah 3 poin di atas terpenuhi, salin folder `js/services/`, `js/config/`, `js/data/`, dan `js/utils/` ke `src/` proyek React + Vite dan konversi `html/*.html` menjadi komponen `.jsx`.
