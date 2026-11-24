# Design System & Visual Direction (DESIGN.md) â€” ReportLoop

**Produk:** ReportLoop â€” Pelaporan Fasilitas Kampus Politeknik Negeri Indramayu  
**Dial Desain:** `ENERGY 2 / RHYTHM 2 / MOTION 2`  
**Referensi Struktur Visual:** Adaptasi komposisi editorial modern dari referensi visual (`image_433037.png`) ke dalam palet **Biruâ€“Putih (Light Mode)** dan **Biruâ€“Slate Gelap (Dark Mode)** yang bersih, terstruktur, dan bebas *AI slop*.

---

## 1. Identitas Visual & Adaptasi dari Referensi Gambar

Komposisi visual pada referensi gambar diterapkan secara fungsional untuk kebutuhan **ReportLoop** tanpa menyalin elemen dekoratif yang tidak relevan:

1. **Split Hero dengan Pratinjau Produk Nyata (`index.html`):**
   * **Sisi Kiri (Fokus Tipografi & Aksi):** Judul utama tegas dengan penekanan warna biru merek (`#1d4ed8` pada Light Mode / `#60a5fa` pada Dark Mode) pada frasa kunci (*"Dari Titik Lokasinya."*), deskripsi ringkas alur pelaporan, dan tombol aksi utama untuk masuk sebagai Mahasiswa (portal login Admin Sarpras diisolasi di URL/domain terpisah demi keamanan CIA).
   * **Sisi Kanan (Pratinjau Antarmuka & Bentuk Aksen Geometri):** Bingkai pratinjau aplikasi ReportLoop (peta kampus + kartu status laporan) di atas bidang aksen biru solid melengkung di sudut kanan atas â€” menjadi satu-satunya bidang aksen besar di halaman agar mata langsung tertuju pada pratinjau produk.
2. **Ritme Section Bervariasi (`RHYTHM 2`):**
   * **Bar Alur 3 Langkah Inti:** Ikon Heroicons berbingkai tipis di atas label ringkas (*1. Sematkan Titik Peta*, *2. Klasifikasi Otomatis NLP*, *3. Triase & Upvote Kolektif*).
   * **Section Split Tentang Sistem & Alur:** Penjelasan peran ganda (Mahasiswa Pelapor & Admin Sarpras) dengan daftar poin berikon centang dan pratinjau ringkasan status.
   * **Papan Laporan Publik Langsung (*Live Public Preview*):** Menampilkan kartu laporan nyata dari data aplikasi (bukan mockup statis).
   * **Banner Aksi Penutup (*Callout Card*):** Kartu biru solid berujung membulat (`rounded-2xl`) di bagian bawah untuk ajakan langsung masuk/membuat laporan sebagai Mahasiswa.
3. **Penyesuaian Kejujuran Data (Aturan Anti-Slop R-17 & R-18):**
   * Elemen statistik karangan pada referensi gambar (seperti `120+ Clients`, `250+ Projects`, `8+ Years`) **tidak digunakan**. Angka yang ditampilkan di ReportLoop hanya berasal dari hitungan data laporan nyata (jumlah laporan diterima, diproses, selesai, dan jumlah dukungan).

---

## 2. Sistem Warna: Light Mode & Dark Mode (Biruâ€“Putih)

Palet dibatasi pada **2 warna inti (Putih/Slate netral + Biru Merek)** ditambah **3 warna status fungsional** yang hanya muncul pada badge status dan pin peta.

### 2.1 Token Warna Light Mode (`:root` / Default - Soft-White Anti-Silau)
Palet terang menggunakan *soft-white* (putih tidak terlalu putih/mencolok) untuk menjaga kenyamanan baca bagi mahasiswa bermata minus maupun petugas Sarpras senior.
* **Latar Utama (`--bg-page`):** `#f1f5f9` (Soft-white abu-biru lembut, mengurangi silau layar).
* **Permukaan Kartu (`--bg-surface`):** `#f8fafc` (Putih lembut dengan garis tepi `1px solid #cbd5e1`, bukan `#ffffff` murni yang menyilaukan).
* **Permukaan Sekunder (`--bg-subtle`):** `#e8f0fe` (Biru lembut untuk sorotan info NLP & kartu ringkasan).
* **Teks Utama (`--text-primary`):** `#0f172a` (Kontras > 13:1 terhadap latar soft-white).
* **Teks Sekunder (`--text-secondary`):** `#475569` (Kontras > 6:1 terhadap latar soft-white, lolos WCAG AA).
* **Warna Merek Utama (`--brand`):** `#1d4ed8` (Biru Cobalt tegas; hover `#1e40af`).
* **Garis Pembatas (`--border`):** `#cbd5e1`.

### 2.2 Token Warna Dark Mode (`html.dark`)
* **Latar Utama (`--bg-page`):** `#090e1a` (Biru malam sangat gelap, bukan hitam pekat agar nyaman di mata).
* **Permukaan Kartu (`--bg-surface`):** `#111827` (Slate biru gelap dengan garis tepi `1px solid #1e293b`).
* **Permukaan Sekunder (`--bg-subtle`):** `#172554` (Biru tua lembut untuk kotak prediksi NLP & sorotan aktif).
* **Teks Utama (`--text-primary`):** `#f8fafc` (Putih bersih, kontras > 15:1).
* **Teks Sekunder (`--text-secondary`):** `#cbd5e1` (Abu-biru terang, kontras > 9:1).
* **Warna Merek Utama (`--brand`):** `#3b82f6` untuk tombol/sorotan latar & `#60a5fa` untuk teks tautan/aksen judul (kontras > 6:1 di latar gelap).
* **Garis Pembatas (`--border`):** `#1e293b`.

### 2.3 Warna Status Fungsional (Konsisten di Kedua Tema)
| Status | Light Mode (Latar / Teks) | Dark Mode (Latar / Teks) | Pin Peta |
| :--- | :--- | :--- | :--- |
| **Received (Diterima)** | `#fef3c7` / `#78350f` | `#451a03` / `#fcd34d` | `#d97706` |
| **In Progress (Diperbaiki)** | `#dbeafe` / `#1e3a8a` | `#1e3a8a` / `#93c5fd` | `#2563eb` |
| **Resolved (Selesai)** | `#dcfce7` / `#14532d` | `#052e16` / `#86efac` | `#16a34a` |

---

## 3. Tipografi & Hierarki Skala

* **Font Utama (`--font-sans`):** `Plus Jakarta Sans` â€” dipilih karena proporsi hurufnya jernih untuk kalimat Bahasa Indonesia dan antarmuka operasional kampus.
* **Font Monospace (`--font-mono`):** `JetBrains Mono` â€” digunakan khusus pada angka koordinat GPS (`-6.40850, 108.28150`), ID laporan (`#rep-001`), dan persentase keyakinan NLP agar digit sejajar vertikal.
* **Skala Ukuran:**
  * Hero Headline (`h1`): `clamp(2rem, 4vw, 3rem)`, `font-weight: 800`, `line-height: 1.15`, `letter-spacing: -0.025em`.
  * Judul Section (`h2`): `1.375rem` â€“ `1.75rem`, `font-weight: 800`, `letter-spacing: -0.015em`.
  * Judul Kartu (`h3`): `1rem` â€“ `1.125rem`, `font-weight: 700`.
  * Teks Isi & Form: `0.9375rem` â€“ `1rem` (`16px` pada input mobile untuk mencegah *auto-zoom* iOS).

---

## 4. Sistem Komponen, Radius & Elevasi

* **Hierarki Radius (`R-11`):**
  * Kartu utama & panel peta: `14px` (`0.875rem`).
  * Input form, tombol standar, & badge status: `8px` (`0.5rem`).
  * Filter chip kategori & indikator aktif: `9999px` (pill khusus kontrol filter).
* **Elevasi & Bayangan (`R-12`):**
  * Kartu di atas kanvas memakai garis tepi `1px solid var(--border)` tanpa bayangan tebal.
  * Bayangan lembut hanya dipakai pada elemen melayang: header sticky (`shadow-sm`), pin koordinat di atas peta, dan modal dialog konfirmasi duplikat.
* **Standar Target Sentuh & Fokus (`R-03`, `R-32`):**
  * Seluruh tombol interaktif, chip filter, tab, dan tombol toggle tema memiliki tinggi minimal `44px` (`min-h-[44px]`).
  * Fokus keyboard memakai `outline: 2px solid var(--brand)` dengan `outline-offset: 2px`.

---

## 5. Pustaka Eksternal & Aset Fungsional

Untuk menjaga performa tetap ringan tanpa *bundler* pada tahap Vanilla sebelum migrasi ke React:
1. **Heroicons (Inline SVG 24x24, Stroke `1.75`):** Dipakai secara konsisten sebagai ikon fungsional (pin lokasi peta, kamera foto bukti, pencarian, filter, jempol dukungan/upvote, pengalih tema matahari/bulan, dan tanda centang status).
2. **Leaflet.js `1.9.4` + Tile OpenStreetMap / CartoDB Dark Matter:**
   * Mode Terang menggunakan tile peta standar yang terang.
   * Mode Gelap menyesuaikan tampilan kontainer peta agar tidak menyilaukan mata pengguna.
3. **Scroll Reveal Engine (`IntersectionObserver` Native):**
   * Menggunakan `IntersectionObserver` ringan (`js/utils/scrollReveal.js`) untuk memunculkan section dan kartu secara halus saat digulir (`opacity: 0 -> 1`, `translateY: 14px -> 0`, durasi `350ms`).
   * Otomatis dinonaktifkan jika sistem pengguna mengaktifkan `prefers-reduced-motion: reduce`.

---

## 6. Keringkasan Teks & Tata Letak Modern (Clean UI)

* **Satu Informasi, Satu Tempat:** Hindari mengulang penjelasan yang sama di header kartu, subjudul, dan catatan kaki secara bersamaan. Satukan panduan singkat di satu tempat yang paling relevan.
* **Teks Singkat & Mudah Dipindai:** Gunakan kalimat maksimal 1-2 baris pada deskripsi hero, kartu alur, hint form, dan panel antrean agar tampilan bersih, modern, dan cepat dibaca.

---

## 7. Standar Responsivitas & Fluiditas Layar Seluler (Mobile-First, >= 320px)

Seluruh tampilan wajib tetap fungsional, nyaman disentuh, dan bebas *horizontal scroll* mulai dari lebar layar `320px` hingga desktop lebar:

* **Header Kompak 2 Tingkat (`html/header.html`):** Pada layar `< lg`, header disusun maksimal 2 baris vertikal (baris merek + kontrol cepat Profil/Tema/Keluar di atas; baris navigasi utama + tombol Mode Demo kompak di bawah) agar ruang vertikal viewport tetap lapang untuk konten utama.
* **Tinggi Peta Adaptif (`css/map.css`):** Kontainer `#campus-map` menggunakan `height: clamp(220px, 38vh, 340px)` pada layar seluler dan `420px` pada desktop (`>= 1024px`) sehingga peta tetap nyaman disentuh tanpa mendorong formulir laporan terlalu jauh ke bawah.
* **Perlindungan Luapan Teks & Koordinat (`css/base.css`, `view-mahasiswa.html`):**
  * Aturan global `overflow-x: hidden`, `overflow-wrap: anywhere`, dan `word-break: break-word` mencegah judul atau deskripsi tanpa spasi merusak lebar kartu, sementara elemen `.font-mono` dan input menjaga keterbacaan angka.
  * Input koordinat Latitude dan Longitude memakai susunan 1 kolom (`grid-cols-1`) di bawah `640px` dan 2 kolom (`sm:grid-cols-2`) di layar lebih lebar.
* **Tombol, Tab & Kartu KPI Responsif (`css/base.css`, `view-mahasiswa.html`, `view-admin.html`):**
  * Kelas `.btn` mengizinkan `flex-wrap`, `max-width: 100%`, dan lebar penuh (`w-full sm:w-auto`) pada tombol aksi sejajar di seluler sambil mempertahankan target sentuh minimal `44px`.
  * Tab papan laporan (`.tab`) menggunakan padding kompak (`0.5rem 0.625rem`, `0.8125rem`) dengan wadah gulir horizontal opsional agar seluruh tab tetap terbaca jelas pada layar `320px-360px`.
  * Kartu ringkasan KPI pada panel admin (`view-admin.html`) memakai garis pemisah vertikal internal pada kolom ganjil (`border-r`) serta skala angka `text-2xl sm:text-3xl`.
* **Posisi Toast Aman Layar Sempit (`html/header.html`):** Kontainer `#toast-container` memakai jangkar `left-3 right-3 bottom-4` pada layar `< 640px` dan `sm:right-5 sm:bottom-5 sm:max-w-sm` pada layar lebih besar agar notifikasi tidak pernah terpotong di tepi kiri layar.
* **Teks Singkat & Mudah Dipindai:** Gunakan kalimat maksimal 1â€“2 baris pada deskripsi hero, kartu alur, hint form, dan panel antrean agar tampilan bersih, modern, dan cepat dibaca.
