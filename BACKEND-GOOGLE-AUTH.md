# Panduan Backend: Google Auth untuk ReportLoop (FastAPI)

Dokumen ini untuk pengembang backend. Frontend sudah selesai dan hanya mengirim **token ID Google** ke satu endpoint. Backend wajib memverifikasi token itu sendiri. Frontend tidak boleh dipercaya untuk menentukan identitas atau peran.

---

## 1. Alur singkat

1. Pengguna menekan tombol Google (Google Identity Services, SDK resmi).
2. Google mengembalikan `credential` (JWT token ID) ke browser.
3. Frontend mengirim `POST /api/auth/google` ke backend.
4. Backend memverifikasi token ke Google, mencari atau membuat akun, lalu mengembalikan `token` sesi milik backend.
5. Frontend menyimpan `token` dan mengirimnya sebagai `Authorization: Bearer <token>` di setiap request berikutnya.

---

## 2. Kontrak endpoint

`POST /api/auth/google`

Request (JSON):

```json
{
  "credential": "<token ID Google>",
  "role": "user",
  "nim": "2205101",
  "invite_code": "<kode undangan admin>"
}
```

- `credential`: wajib.
- `role`: `user` (mahasiswa) atau `admin` (Sarpras).
- `nim`: hanya untuk `role=user`, diisi saat akun Google belum terdaftar. Boleh tidak ada.
- `invite_code`: hanya untuk `role=admin`, diisi saat akun belum terdaftar. Boleh tidak ada.

Response sukses `200`:

```json
{
  "id": "2205101",
  "email": "nama@gmail.com",
  "name": "Nama Lengkap",
  "token": "<token sesi backend>"
}
```

- `id` untuk mahasiswa adalah **NIM**, untuk admin adalah **email** (huruf kecil).
- Keempat field wajib ada. Jika `id` atau `token` kosong, frontend menolak respons.

Response error. Frontend membaca `code` dari `body.code` atau `body.detail.code`, dan pesan dari `body.message`, `body.detail` (string), atau `body.detail.message`:

| Kondisi | Status | `code` | Efek di frontend |
|---|---|---|---|
| Akun belum terdaftar, NIM belum dikirim | `422` | `NIM_REQUIRED` | Membuka modal minta NIM, lalu kirim ulang |
| Akun admin belum terdaftar, kode belum dikirim | `422` | `INVITE_REQUIRED` | Membuka modal minta kode undangan |
| Token Google tidak valid atau kedaluwarsa | `401` | bebas | Menampilkan `message` |
| Kode undangan salah, NIM sudah dipakai akun lain | `400` atau `409` | bebas | Menampilkan `message` |

Contoh body error:

```json
{ "detail": { "code": "NIM_REQUIRED", "message": "NIM diperlukan untuk akun baru." } }
```

---

## 3. Menyiapkan Google Cloud Console

1. Buka Google Cloud Console, buat atau pilih project.
2. Menu **APIs & Services > OAuth consent screen**: isi nama aplikasi, email dukungan, lalu simpan.
3. Menu **Credentials > Create credentials > OAuth client ID**, tipe **Web application**.
4. Pada **Authorized JavaScript origins**, tambahkan alamat frontend:
   - lokal: `http://localhost:5500`
   - production: `https://domain-frontend-anda`
5. Salin **Client ID** (`xxxx.apps.googleusercontent.com`). Backend dan frontend memakai Client ID yang **sama**.
6. Client Secret tidak diperlukan untuk alur token ID ini.

---

## 4. Contoh implementasi FastAPI

Instal dependensi:

```bash
pip install fastapi uvicorn google-auth requests pyjwt python-dotenv
```

`.env` (jangan di-commit, tambahkan ke `.gitignore`):

```env
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
JWT_SECRET=isi-dengan-string-acak-panjang
ADMIN_INVITE_CODE=isi-kode-rahasia-dari-unit-sarpras
CORS_ORIGINS=http://localhost:5500
```

Kerangka endpoint:

```python
import os, time
import jwt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as g_requests

router = APIRouter()
CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
JWT_SECRET = os.environ["JWT_SECRET"]

class GoogleLogin(BaseModel):
    credential: str
    role: str
    nim: str | None = None
    invite_code: str | None = None

def fail(status, code, message):
    raise HTTPException(status_code=status, detail={"code": code, "message": message})

@router.post("/api/auth/google")
def google_login(body: GoogleLogin):
    if body.role not in ("user", "admin"):
        fail(400, "BAD_ROLE", "Peran tidak valid.")

    try:
        info = id_token.verify_oauth2_token(body.credential, g_requests.Request(), CLIENT_ID)
    except ValueError:
        fail(401, "BAD_TOKEN", "Token Google tidak valid atau kedaluwarsa.")

    if not info.get("email_verified"):
        fail(401, "EMAIL_UNVERIFIED", "Email Google belum terverifikasi.")

    email = info["email"].lower()
    name = info.get("name") or email.split("@")[0]

    account = find_account(body.role, email)  # query database
    if account is None:
        if body.role == "user":
            if not body.nim:
                fail(422, "NIM_REQUIRED", "NIM diperlukan untuk akun baru.")
            if not (body.nim.isdigit() and 6 <= len(body.nim) <= 12):
                fail(400, "BAD_NIM", "NIM harus 6 sampai 12 digit.")
            if nim_taken(body.nim):
                fail(409, "NIM_TAKEN", "NIM ini sudah dipakai akun lain.")
            account = create_user(nim=body.nim, email=email, name=name)
        else:
            if not body.invite_code:
                fail(422, "INVITE_REQUIRED", "Kode undangan Sarpras diperlukan.")
            if body.invite_code != os.environ["ADMIN_INVITE_CODE"]:
                fail(400, "BAD_INVITE", "Kode undangan tidak cocok.")
            account = create_admin(email=email, name=name)

    now = int(time.time())
    token = jwt.encode(
        {"sub": account.id, "role": body.role, "iat": now, "exp": now + 7 * 24 * 3600},
        JWT_SECRET,
        algorithm="HS256",
    )
    return {"id": account.id, "email": email, "name": name, "token": token}
```

`find_account`, `nim_taken`, `create_user`, `create_admin` adalah fungsi database buatan Anda. Tabel minimal: `users(nim PK, email UNIQUE, name, created_at)` dan `admins(email PK, name, created_at)`.

CORS (wajib, karena frontend dan backend beda origin):

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ["CORS_ORIGINS"].split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 5. Aturan keamanan yang wajib dipenuhi backend

- **Selalu verifikasi** token ID ke Google (audience harus sama dengan Client ID). Jangan percaya `email` atau `name` dari frontend.
- **Peran ditentukan oleh backend** dari token sesi. Penjaga peran di frontend (`requireRole`) hanya soal tampilan dan bisa dilewati. Endpoint `PATCH /api/reports/{id}/status` wajib menolak token non-admin dengan `403`.
- Kode undangan admin disimpan di environment server, **tidak** di kode frontend atau repo.
- Verifikasi `email_verified` bernilai true.
- Untuk membatasi ke email kampus, cek domain (`info.get("hd")` atau akhiran email) sebelum membuat akun.
- Gunakan HTTPS di production. Token sesi disimpan frontend di `localStorage`, jadi jaga agar tidak ada celah XSS (frontend sudah memakai `escapeHtml`).
- Batasi laju percobaan login di sisi server.

---

## 6. Menghubungkan frontend ke backend

Frontend membaca dua nilai dari `localStorage` (sumber: `js/config/constants.js`):

```js
localStorage.setItem('reportloop.apiBase', 'http://127.0.0.1:8000');
localStorage.setItem('reportloop.googleClientId', 'xxxx.apps.googleusercontent.com');
```

Muat ulang halaman. Tombol Google resmi akan muncul menggantikan tombol bawaan. Untuk production, ganti nilai default di `constants.js` (lihat `MIGRASI-PRODUCTION.md`) agar tidak bergantung pada console browser.

---

## 7. Daftar uji

- [ ] Masuk Google mahasiswa baru: backend membalas `NIM_REQUIRED`, modal NIM muncul, lalu berhasil dan masuk ke `user.html`.
- [ ] Masuk Google mahasiswa yang sudah terdaftar: langsung masuk.
- [ ] Admin baru tanpa kode: `INVITE_REQUIRED`. Kode salah: pesan error tampil.
- [ ] Token palsu atau kedaluwarsa: `401`, pesan tampil.
- [ ] Token mahasiswa dipakai memanggil `PATCH /api/reports/{id}/status`: `403`.
- [ ] CORS tidak memblokir request dari origin frontend.
