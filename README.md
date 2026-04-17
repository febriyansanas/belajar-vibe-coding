# Belajar Vibe Coding - Backend API User

Aplikasi ini adalah sebuah sistem Backend API yang dibangun untuk mengelola *User Management* (registrasi, login, autentikasi sesi profil, dan logout). Proyek ini dirancang secara modern dengan performa tinggi, memanfaatkan ekosistem runtime terbaru.

---

## 🛠 Technology Stack
Aplikasi ini dikembangkan menggunakan teknologi modern untuk performa dan keamanan optimal:
- **Runtime**: [Bun](https://bun.sh/) (Runtime JavaScript *all-in-one* super cepat pengganti Node.js).
- **Framework Web**: [ElysiaJS](https://elysiajs.com/) (Web framework ergonomis berfokus performa untuk ekosistem Bun).
- **Database**: [MySQL](https://www.mysql.com/) (Relational Database Management System).
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) (Penghubung antara aplikasi dan database dengan keamanan tipe TypeScript).

### Library Tambahan
- `bcryptjs`: Digunakan untuk melakukan *hashing* dan memvalidasi kata sandi pengguna secara aman.
- `@elysiajs/cors`: Middleware untuk menerapkan *Cross-Origin Resource Sharing*.
- `@elysiajs/swagger`: Auto-generasi dokumen API Swagger/OpenAPI.
- `bun:test`: *Test runner* bawaan dari Bun berkecepatan tinggi untuk pengujian unit API.

---

## ?? Arsitektur & Struktur File (MVC Pattern via Service Layer)
Proyek ini mengadopsi pemisahan *concern* untuk menjaga agar kode terstruktur, modular, dan bersih (menggunakan prinsip DRY).

```text
.
??? src/
?   ??? db/
?   ?   ??? index.ts            # Konfigurasi koneksi MySQL Database (Connection Pooling)
?   ?   ??? schema.ts           # Definisi struktur tabel database Drizzle ORM
?   ??? routes/
?   ?   ??? users-route.ts      # Definisi Endpoint API (Routing, Schema Validation, Auth Hook)
?   ??? services/
?   ?   ??? users-services.ts   # Berisi core/logika bisnis aplikasi dan query ke database
?   ??? index.ts                # Entry point utama aplikasi (registrasi plugin, inisialisasi framework)
??? tests/
?   ??? user.test.ts            # Skenario pengujian (Unit Tests) untuk masing-masing Endpoint API
??? package.json                # Kumpulan scripts dependencies (Bun)
??? drizzle.config.ts           # Konfigurasi migrasi/push schema Drizzle
??? .env                        # Environtment Variables (disembunyikan)
```
- **Routes (`/routes`)**: Hanya mengatur validasi *payload* JSON (`t.String`, `maxLength`, dsb) dan mem-filter Request (via Header Authentication).
- **Services (`/services`)**: Murni untuk komputasi, operasi database (`insert`, `select`, `delete`), hingga perhitungan hash *password*. Memisahkan hal ini membuat fungsi dapat di-*reuse* dan lebih mudah di-*test*.

---

## ?? Schema Database
Aplikasi ini memiliki 2 (dua) buah tabel utama yang didefinisikan menggunakan Drizzle Orm:

### 1. Tabel `users`
Tabel master penyimpan profil pengguna dengan field:
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR 255)
- `email` (VARCHAR 255, **Unique**)
- `password` (VARCHAR 255, string yang sudah *di-hash* bcrypt)
- `createdAt` (TIMESTAMP, nilai *default-now*)

### 2. Tabel `session`
Tabel untuk mengatur manajemen sesi (*Authorization Token-Based*) dengan *relation join* kepada user :
- `id` (INT, Primary Key, Auto Increment)
- `token` (VARCHAR 255, UUID Auth Token)
- `userId` (INT, Foreign Key ke tabel `users.id`)
- `createdAt` (TIMESTAMP, nilai *default-now*)

---

## ?? API Endpoint yang Tersedia
Seluruh fungsionalitas Endpoint diberikan *prefix* (awalan) otomatis `/api/users`. Detail selengkapnya bisa disimulasikan dari panel antarmuka `/swagger` saat aplikasi dijalankan.

| HTTP Method | Endpoint | Kegunaan | Autentikasi Diperlukan? |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | Registrasi akun pengguna baru | ? Tidak |
| `POST` | `/api/users/login` | Melakukan sesi login dan mengeluarkan token otorisasi | ? Tidak |
| `GET` | `/api/users/current` | Menarik detail status profil dari pengguna yang masuk | ? Ya (Header: `Authorization: Bearer <token>`) |
| `DELETE` | `/api/users/logout` | Mencabut dan menghapus Token di sistem basis data supaya hangus | ? Ya (Header: `Authorization: Bearer <token>`) |

---

## ??️ Cara Setup Ke Lingkungan Lokal (Dev)

Langkah awal sebelum menjalankan kode ini:

1. **Clone repository ini** melalui Terminal/Git Bash:
   ```bash
   git clone https://github.com/febriyansanas/belajar-vibe-coding.git
   cd belajar-vibe-coding
   ```
2. **Install Dependensi package** proyek ini dengan menggunakan Bun:
   ```bash
   bun install
   ```
3. **Konfigurasi Variabel Lingkungan**. Buat file `.env` di direktori *root*. Salin referensi format lalu isi dengan database kredensial lokal komputer Anda (MySQL):
   ```env
   DATABASE_URL="mysql://username:password@127.0.0.1:3306/nama_database_kamu"
   PORT=3000
   ```
4. **Push Struktur Database (Migrasi Drizzle)**. Eksekusi ini guna membangun tabel ke dalam `nama_database_kamu` sesuai rujukan dari file `schema.ts`.
   ```bash
   bun run db:push
   ```

---

## ?? Cara Menjalankan Aplikasi
Menyalakan server lokal untuk ujicoba *Endpoint* (menggunakan *hot-reload* bawaan dari Bun `watch`).
```bash
bun run dev
```
Setelah server naik, API Anda merespon lewat:
- Base API Path : `http://localhost:3000/api`
- Test Root Endpoint: `http://localhost:3000/ping` 
- Swagger UI (Dokumentasi Auto-gerak) : `http://localhost:3000/swagger`

---

## ?? Cara Melakukan Test (Unit Testing)
Sistem ini memfasilitasi 16 skenario pengujian komprehensif validasi (meliputi Uji Normalitas, Input Panjang Gagal, Format Salah, Gagal Hak Akses 401 dan lainya).
Seluruh tabel uji sudah dilindungi dari residu sehingga berjalan efisien menggunakan hooks `beforeEach` milik *Bun*.
Untuk test *Automation Error & Success*:

```bash
bun test
```
*Note: Konsol akan mengindikasikan status "Pass" berwarna hijau jika semua fungsi backend (Registrasi - Logout) ber-operasi optimal.*
