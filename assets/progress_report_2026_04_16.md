# Project Progress Report: VOWS Live Message Board
**Tanggal:** 16 April 2026

## 📋 Ringkasan Proyek
Website **"VOWS"** adalah sebuah platform *Realtime Live Message Board* yang dirancang khusus untuk event clubbing. Website ini bersifat *100% Client-Side* (tanpa backend server sendiri) yang dideploy di GitHub Pages dan menggunakan Firebase Realtime Database untuk sinkronisasi data secara instan.

---

## 🛠️ Kemajuan & Fitur yang Diimplementasikan

### 1. Desain Visual (Dark Clubbing Theme)
- **Warna:** Menyesuaikan logo **Red, Chrome, & Black**.
- **Efek Teks:** Heading menggunakan gradasi metalik perak dan merah dengan bayangan glow neon.
- **UI:** Menggunakan konsep *Glassmorphism* (kartu transparan dengan blur latar belakang).
- **Animasi:**
    - **Scanline:** Efek laser merah yang menyapu layar.
    - **Pulse Glow:** Latar belakang yang berdenyut cahaya merah.
    - **Pop Animation:** Pesan baru muncul dengan efek perbesaran (scale) dan glow intens.

### 2. Fitur Realtime & Logic ([app.js](file:///c:/KIKI/Pribadi/Web%20Project/Javascript/vows/app.js))
- **Realtime Sync:** Menggunakan Firebase SDK v8 untuk sinkronisasi pesan antar device tanpa refresh.
- **Message Queuing:** Pesan yang masuk bersamaan akan diantre dengan **interval 3 detik** per pesan agar enak dibaca.
- **Dual Display:**
    - Kolom Kiri: Menampilkan 1 pesan terbaru dalam ukuran sangat besar (fokus utama).
    - Kolom Kanan: Daftar semua chat yang masuk secara vertikal.
- **Export Data:** Tombol untuk mengunduh seluruh riwayat chat ke file `.json`.
- **QR Code Generator:** QR Code dinamis yang otomatis mengarah ke halaman [input.html](file:///c:/KIKI/Pribadi/Web%20Project/Javascript/vows/input.html) berdasarkan URL hosting saat ini.

### 3. Struktur Halaman
- **[index.html](file:///c:/KIKI/Pribadi/Web%20Project/Javascript/vows/index.html):** Halaman tampilan utama (untuk layar/projector).
- **[input.html](file:///c:/KIKI/Pribadi/Web%20Project/Javascript/vows/input.html):** Halaman form untuk user mengirim nama dan pesan. Sudah dilengkapi logo dan desain responsif mobile.
- **[style.css](file:///c:/KIKI/Pribadi/Web%20Project/Javascript/vows/style.css):** Pusat seluruh desain dan animasi.
- **[app.js](file:///c:/KIKI/Pribadi/Web%20Project/Javascript/vows/app.js):** Pusat logika Firebase dan pengaturan antrean pesan.

---

## 🚀 Status Hosting & Konfigurasi
- **Hosting:** Siap dideploy ke **GitHub Pages**.
- **Firebase:** Sukses dikonfigurasi menggunakan lokasi server `asia-southeast1` (Singapore) untuk latency rendah.
- **Database URL:** `https://vows-2e1e0-default-rtdb.asia-southeast1.firebasedatabase.app`

---

## 📍 Petunjuk Update Mendatang
Jika Anda ingin melakukan update di masa depan, Anda bisa mengirimkan file ini kembali kepada AI untuk memberikan konteks instan mengenai struktur yang sudah ada.

> [!TIP]
> **Hal yang perlu diperhatikan saat update:**
> - Jika mengubah layout di [index.html](file:///c:/KIKI/Pribadi/Web%20Project/Javascript/vows/index.html), pastikan ID `chatContainer` dan class `.new-chat` tetap ada karena diakses oleh [app.js](file:///c:/KIKI/Pribadi/Web%20Project/Javascript/vows/app.js).
> - Jika ingin mengubah kecepatan antrean, cari variabel `waitTime` di dalam fungsi [processDisplayQueue](file:///c:/KIKI/Pribadi/Web%20Project/Javascript/vows/app.js#53-78) pada file [app.js](file:///c:/KIKI/Pribadi/Web%20Project/Javascript/vows/app.js).
