# Product Requirements Document (PRD) â€” Frontend ReportLoop

**Versi:** 1.0 (Fase Semifinal STACK 2026 â€” GDGoC ITB)  
**Pemilik Modul:** M. Fadil Faiz (UI/UX Designer & Frontend Developer)  
**Tim:** Tim Perintis â€” D4 Teknologi Rekayasa Komputer, Politeknik Negeri Indramayu  
**Target Lingkungan:** Web App Responsif (*Mobile-First* & *Desktop*)  

---

## 1. Ringkasan Produk & Tujuan Frontend

**ReportLoop** adalah aplikasi web pelacakan masalah fasilitas kampus dan lingkungan hunian mahasiswa berbasis lokasi dan dukungan kolektif (*upvote*). Frontend bertugas menggantikan alur pelaporan berbasis grup pesan (WhatsApp) yang tidak terstruktur menjadi antarmuka pelaporan yang cepat, transparan, dan terukur.

### Sasaran Utama Frontend
1. **Kemudahan Adopsi Pengguna:** Alur pelaporan maksimum 4 langkah (pilih titik peta, ambil foto, isi deskripsi singkat, kirim) agar mahasiswa dan pengelola yang terbiasa memakai WhatsApp tidak mengalami hambatan teknis.
2. **Transparansi Publik:** Menyediakan papan laporan terbuka (*Public Issue Board*) dengan indikator status nyata (`Received`, `In Progress`, `Resolved`) dan mekanisme `+1 Upvote` sebagai penentu prioritas penanganan.
3. **Triase Efisien bagi Pengelola (Sarpras):** Menyediakan antrean laporan yang otomatis diurutkan berdasarkan jumlah dukungan terbanyak dan kategori divisi hasil klasifikasi NLP.
4. **Kesiapan Demo & Integrasi:** Mendukung **Mode Demo Interaktif** (*local fallback* tanpa server) dan **Mode Live FastAPI** secara mulus dalam satu antarmuka.

---

## 2. Pengguna & Peran (User Personas)

| Peran | Deskripsi | Hak Akses Utama |
| :--- | :--- | :--- |
| **Pengunjung / Publik** | Mahasiswa atau tamu yang membuka halaman utama sebelum masuk. | Melihat ringkasan solusi ReportLoop, memantau pratinjau papan laporan publik (*read-only*), dan berpindah ke halaman masuk/daftar. |
| **Mahasiswa (Pelapor)** | Penghuni kampus/asrama yang menemukan kerusakan fasilitas. | Membuat laporan baru dengan foto & koordinat peta, melihat prediksi kategori NLP otomatis, memantau status laporan, serta memberikan `+1 Upvote` (1x per laporan). |
| **Admin Sarpras (Pengelola)** | Petugas sarana dan prasarana yang menindaklanjuti laporan. | Melihat ringkasan jumlah laporan per status, memfilter antrean berdasarkan kategori NLP dan status, meninjau koordinat di peta, serta mengubah status (`Received` -> `In Progress` -> `Resolved`). |

---

## 3. Ruang Lingkup Fitur: Semifinal vs. Final Day

Mengacu pada aturan **STACK 2026**, aplikasi Semifinal wajib berjalan utuh untuk alur inti (*Early Prototype*), namun harus menyisakan 2â€“3 tugas substantif untuk dikerjakan langsung saat **Build Session Final Day (16 Desember 2026)**.

### 3.1 Cakupan Wajib Semifinal (Deadline: 30 November 2026)
* **FR-01 Autentikasi Peran & Isolasi Portal Sarpras (CIA):** Halaman masuk & daftar terpisah untuk Mahasiswa (berbasis NIM) dan Admin Sarpras (berbasis Email + Kode Undangan). Portal masuk Admin Sarpras (`admin-masuk.html` / subdomain terpisah di produksi) diisolasi dan tidak ditautkan di UI publik (`index.html`) maupun halaman Mahasiswa untuk meminimalkan permukaan serangan dan menjaga aspek keamanan CIA (*Confidentiality, Integrity, Availability*).
* **FR-02 Peta Interaktif Kampus (Leaflet.js):** Menampilkan area geofencing kampus Politeknik Negeri Indramayu, pin laporan aktif berdasarkan warna status, pin target laporan baru yang dapat diklik/digeser, preset titik cepat kampus, serta tombol lokasi GPS perangkat.
* **FR-03 Form Pelaporan (Foto Live Wajib) & Pratinjau NLP Real-Time:** Input judul, deskripsi, koordinat otomatis dari peta, unggah foto bukti **live** langsung dari kamera (`capture="environment"`) tanpa opsi pilihan foto lama, serta pratinjau kategori otomatis (*Infrastructure*, *Cleanliness*, *Security*). Foto yang terdeteksi sebagai foto lama (> 24 jam) ditolak sistem sehingga tidak dapat dikirim.
* **FR-04 Pencegahan Laporan Duplikat (Radius 15 Meter):** Mendeteksi laporan aktif berkategori sama dalam jarak <= 15 meter (Haversine di mode demo / PostGIS `ST_DWithin` di mode live) dan menampilkan modal konfirmasi untuk mengalihkan pengguna ke tombol `+1 Upvote` atau mengirim paksa (`force_submit=true`).
* **FR-05 Papan Laporan Publik, Profil Laporan Saya & Upvote:** Papan Laporan utama menampilkan seluruh laporan umum dengan pencarian kata kunci, filter kategori, filter status, pengurutan (dukungan terbanyak / terbaru), tab *Semua laporan* vs *Dukungan saya*, serta tombol *Upvote* idempoten (1 dukungan per pengguna per laporan). Khusus pada bagian **Profil**, aksi *Buka Papan Laporan* hanya menampilkan daftar laporan milik pengguna tersebut (bukan laporan umum).
* **FR-06 Panel Triase Admin Sarpras:** Ringkasan KPI riil dari jumlah laporan, antrean laporan terurut berdasarkan dukungan tertinggi, filter divisi & status, tombol aksi perubahan status bertahap, dan tombol *Lihat peta* yang memusatkan peta ke titik laporan.
* **FR-07 Tema Terang (Soft-White) & Gelap (Light / Dark Mode):** Pengalih tema biru-putih lembut (*soft-white*, tidak terlalu putih agar tidak menyilaukan) dan biru-slate gelap dengan kontras ramah bagi mahasiswa bermata minus maupun petugas Sarpras senior, tersimpan di `localStorage` serta menghormati preferensi sistem.

### 3.2 Ruang Lingkup Disisakan untuk Final Day (16 Desember 2026)
Fitur berikut **tidak boleh** diklaim selesai pada demo/proposal Semifinal:
* **FD-01 Notifikasi Real-Time ke Pelapor:** Pemberitahuan langsung (in-app / webhook) ketika status laporan diubah oleh Admin.
* **FD-02 Ekspor Rekapitulasi Bulanan (PDF / CSV):** Laporan statistik bulanan dan rata-rata waktu penyelesaian (*Mean Time to Resolution*).
* **FD-03 Klasterisasi Marker & Komentar Tindak Lanjut:** Pengelompokan marker padat pada peta serta kolom komentar diskusi warga/admin.

---

## 4. Alur Pengguna Utama (Core User Flows)

### Flow A: Pelaporan Kerusakan oleh Mahasiswa
1. Mahasiswa masuk melalui `masuk.html` (atau daftar di `daftar.html`) dan diarahkan ke `user.html`.
2. Mahasiswa menentukan titik lokasi dengan mengklik peta Leaflet, menggeser pin biru, memilih preset lokasi kampus, atau menekan tombol GPS.
3. Mahasiswa mengisi **Judul Keluhan** dan **Deskripsi Kondisi** -> komponen pratinjau NLP menampilkan prediksi kategori dan tingkat keyakinan (*confidence*).
4. Mahasiswa melampirkan **Foto Bukti Live** langsung dari kamera (opsi foto lama dihilangkan dari form).
5. Saat tombol **Kirim laporan** ditekan:
   * *Validasi 1 (Kesegaran Foto):* Jika foto terdeteksi > 24 jam, tampilkan banner peringatan `STALE_PHOTO_REJECTED` (HTTP 400) dan hentikan pengiriman.
   * *Validasi 2 (Duplikat Spasial <= 15m):* Jika ditemukan laporan aktif berkategori sama dalam radius 15 meter, buka modal `duplicate-modal` (HTTP 409) agar mahasiswa mendukung laporan yang sudah ada atau memilih tetap kirim baru.
   * *Sukses:* Laporan ditambahkan ke daftar publik dengan status awal `Received` (`Diterima`) dan `1` dukungan awal.

### Flow B: Triase & Pembaruan Status oleh Admin Sarpras
1. Petugas Sarpras mengakses portal login terpisah secara langsung melalui `admin-masuk.html` (atau domain khusus Sarpras di produksi, terpisah dari UI publik/mahasiswa) dan diarahkan ke `admin.html`.
2. Admin melihat ringkasan jumlah laporan (`Semua`, `Menunggu ditangani`, `Sedang diperbaiki`, `Selesai`) dan antrean yang otomatis diurutkan berdasarkan jumlah dukungan terbanyak.
3. Admin dapat memfilter berdasarkan kategori divisi NLP (`Infrastructure`, `Cleanliness`, `Security`) atau status, lalu mengklik **Lihat peta** untuk memeriksa lokasi tepat kerusakan.
4. Admin menekan **Mulai perbaikan** (`Received` -> `In Progress`) atau **Tandai selesai** (`In Progress` -> `Resolved`). Perubahan langsung diperbarui pada papan publik dan warna pin peta.

---

## 5. Kontrak API Frontend â€“ Backend (FastAPI Specification)

Dokumen ini menjadi acuan sinkronisasi antara **Frontend** dan **Backend (Ibrahim Movik)** sebelum migrasi ke React:

| Metode | Endpoint | Payload / Query | Respons Sukses | Penanganan Error di FE |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports` | Optional: `?category=&status=&sort=` | `200 OK` â€” Array objek `Report` | Fallback ke `SEED_REPORTS` (Mode Demo) dengan toast peringatan. |
| `POST` | `/api/reports` | `multipart/form-data`: `title`, `description`, `latitude`, `longitude`, `force_submit` (`bool`), `photo` (`file`) | `201 Created` â€” Objek `Report` baru hasil klasifikasi NLP | `400` (`STALE_PHOTO_REJECTED`): tampilkan banner foto lama.<br>`409` (`DUPLICATE_NEARBY_REPORT`): buka modal laporan serupa. |
| `POST` | `/api/reports/{id}/upvote` | Header `Authorization` / `user_id` | `200 OK` â€” Objek `Report` dengan `upvotes` terbaru | `409` jika sudah pernah upvote; sinkronkan state lokal. |
| `PATCH` | `/api/reports/{id}/status` | JSON `{ "status": "In Progress" \| "Resolved" }` | `200 OK` â€” Objek `Report` dengan status terbaru | Tampilkan toast gagal dan kembalikan tombol ke status semula. |

### Skema Objek `Report` (JSON)
```json
{
  "id": "rep-001",
  "title": "Lampu lorong lantai 2 padam",
  "description": "Lampu penerangan koridor lantai 2 mati sejak kemarin malam.",
  "photo_url": "/uploads/rep-001.jpg",
  "photo_verification": "Verified (Fresh camera photo)",
  "latitude": -6.4085,
  "longitude": 108.2815,
  "category": "Infrastructure",
  "nlp_confidence": 0.91,
  "status": "In Progress",
  "upvotes": 14,
  "created_at": "2026-11-22T08:15:00+07:00"
}
```

---

## 6. Standar Non-Fungsional & Kualitas Web App

1. **Responsivitas & Target Sentuh:** Bebas *horizontal scroll* mulai lebar layar `360px` hingga `1440px`; seluruh tombol, tab, dan input memiliki tinggi sentuh minimal `44px`.
2. **Aksesibilitas (WCAG AA & Keyboard):** Rasio kontras teks minimal `4.5:1` pada Mode Terang maupun Mode Gelap; seluruh kontrol dapat dinavigasi dengan `Tab`, `Enter`, dan `Escape` dengan indikator fokus jelas.
3. **Ketahanan State UI:** Setiap tampilan data menyediakan *Loading State* (skeleton), *Empty State* (penjelasan penyebab + tombol aksi), dan *Error State* (pesan galat + tombol muat ulang).
4. **Kesiapan Migrasi React:** Seluruh logika bisnis (API, geo Haversine, klasifikasi NLP, state store) dipisahkan dari manipulasi DOM sehingga dapat dikonversi menjadi *custom hooks* dan komponen React tanpa mengubah kontrak data.
5. **Keringkasan Teks & Tata Letak Clean:** Teks antarmuka dibuat ringkas, tidak berulang di banyak area, dan informasi pendukung disatukan di satu tempat agar tampilan modern, bersih, dan mudah dipindai.
