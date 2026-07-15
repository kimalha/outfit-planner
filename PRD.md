# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Project Name: Outfit.in

---

## 1. PRODUCT OVERVIEW
**Outfit.in** adalah aplikasi manajemen lemari pakaian digital (*digital wardrobe*) dan perencana gaya harian (*outfit planner*). Aplikasi ini dirancang untuk membantu pengguna mengorganisasi koleksi pakaian yang mereka miliki, mencatat riwayat pemakaian, serta menjadwalkan pakaian yang akan dikenakan melalui sistem kalender interaktif.

### Core Objectives:
* Mengubah lemari fisik menjadi katalog digital yang mudah diakses dengan dukungan upload foto asli (Kamera/Galeri).
* Menghilangkan kebingungan memilih pakaian harian dengan rencana pakaian harian (*Today's Plan*) berorientasi carousel tanpa batas kategori.
* Melacak efisiensi penggunaan pakaian lewat pencatatan tanggal terakhir dipakai (*recently worn* dan riwayat pemakaian).

---

## 2. TECH STACK & ARCHITECTURE
Aplikasi ini menggunakan arsitektur decoupled (Frontend & Backend terpisah) dengan struktur modular:
* **Frontend:** React.js (Vite), Tailwind CSS, Axios HTTP Client
* **Backend:** Node.js, Express.js (MVC Pattern: Routes, Controllers, Config)
* **Database:** MySQL
* **Security:** `bcryptjs` (Password Hashing) & **JSON Web Token (JWT)** (Session Management)

### Modular Directory Structure (Frontend):
* `src/context/` — State Management terpusat (Single Source of Truth) untuk `Auth`, `Profile`, `Outfit` (Katalog), `Category`, `Planner`, dan `Notification` untuk menghindari prop drilling.
* `src/pages/` — Modul per halaman yang bersih (`Home`, `Calendar`, `Catalog`, `Profile`, dan `Login/Register`).
* `src/components/modals/` — Kumpulan sheet modal terpusat (seperti `PlanDetailModal`, `AddOutfitModal`, `CategoryModal`, `EditProfileModal`, dst.).
* `src/components/Common/` — Komponen reusable seperti `Icons.jsx` untuk menampung seluruh inline SVG.
* `src/utils/` — Utility helper seperti `dateUtils.js` (lokal timezone YYYY-MM-DD) dan `formatter.js` (styling helper).

---

## 3. FUNCTIONAL REQUIREMENTS

### A. Auth Module (Otentikasi & Pengguna)
* **Register:** Mendaftarkan akun menggunakan `username`, `email`, dan `password` (auto-hash via bcrypt).
* **Login:** Validasi kredensial. Menghasilkan token JWT yang disimpan di `localStorage` frontend, dikelola secara terpusat oleh `AuthContext`.
* **Dynamic Profile:** Menampilkan informasi `username`, `bio`, `fullname`, dan `avatar` berdasarkan verifikasi token JWT via middleware.

### B. Catalog CRUD Module (Lemari Digital)
* **Create (Add Outfit):** Menambahkan pakaian fisik baru dengan nama, kategori, dan upload file gambar asli (kamera perangkat atau galeri foto) via upload FormData.
* **Read:** Menampilkan dan mencari pakaian secara real-time berdasarkan kata kunci nama, brand, warna, atau tag. Dapat difilter berdasarkan kategori pakaian (**Semua, Atasan, Bawahan, Luar, Sepatu, Aksesoris**).
* **Delete:** Menghapus pakaian dari katalog lemari digital secara permanen.
* **Favorites:** Menandai pakaian sebagai favorit secara real-time.

### C. Planner & Calendar Module
* **Today's Plan (Home):** Menampilkan semua pakaian yang dijadwalkan hari ini dalam bentuk carousel geser (horizontal scroll) tanpa batasan jumlah item (tidak dibatasi slot TOP/BOTTOM/SHOES). Terdapat tombol konfirmasi pakaian.
* **Calendar Planner:** Menampilkan tanda kalender (titik biru untuk outfit, titik oranye untuk aktivitas) dan agenda harian.
* **Plan Detail Modal (Pilih Pakaian & Kegiatan):**
  * Memungkinkan pengguna menambah/menghapus agenda kegiatan di hari tertentu.
  * Memilih pakaian dari katalog dengan fitur **pencarian real-time (search bar)** yang bersinergi dengan filter pill kategori. Input pencarian otomatis di-reset saat modal ditutup.
* **Confirm Outfit:** Konfirmasi pakaian harian untuk mencatatnya ke dalam riwayat pemakaian.

### D. History & Recently Worn
* **Recently Worn (Profile):** Menampilkan daftar pakaian yang dikonfirmasi dalam 7 hari terakhir secara horizontal.
* **History Page (View All):** Menampilkan daftar kronologis lengkap dari outfit yang telah dikonfirmasi (terbaru ke terlama) dilengkapi filter rentang waktu (Minggu Ini, Bulan Ini, Semua) dan pencarian real-time. Memiliki penanganan empty state yang aman dengan pesan *"Belum ada outfit yang pernah dipakai."*.

---

## 4. DATABASE SCHEMA (`outfit_db`)

### Table: `users`
* `id` (INT, Primary Key, Auto Increment)
* `username` (VARCHAR(50), NOT NULL)
* `email` (VARCHAR(100), UNIQUE, NOT NULL)
* `password` (VARCHAR(255), NOT NULL)
* `bio` (VARCHAR(255), Default: 'Kece dari lahir')
* `avatar` (VARCHAR(255))

### Table: `clothes`
* `id` (INT, Primary Key, Auto Increment)
* `name` (VARCHAR(100), NOT NULL)
* `category` (VARCHAR(50), NOT NULL)
* `image_url` (VARCHAR(255), NOT NULL)
* `is_favorite` (TINYINT, Default: 0)
* `color` (VARCHAR(50), Nullable)
* `tags` (VARCHAR(255), Nullable)

### Table: `plans`
* `id` (INT, Primary Key, Auto Increment)
* `date` (DATE, NOT NULL)
* `outfit_name` (VARCHAR(100), NOT NULL)
* `activity` (VARCHAR(255), NOT NULL)