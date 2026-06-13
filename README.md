# To-Do List Implementasi HL Sales & Receivables Management App

## 1. Authentication
- [x] AC-1.1 Aplikasi mewajibkan login sebelum fitur apa pun dapat diakses.
- [x] AC-1.2 Hanya ada tepat satu akun pengguna; tidak ada alur pendaftaran mandiri (self-registration).
- [x] AC-1.3 Kredensial valid mengarahkan pengguna masuk dan mendarat di halaman utama/dashboard.
- [x] AC-1.4 Kredensial tidak valid ditolak dengan pesan error yang jelas dan akses tidak diberikan.
- [x] AC-1.5 Sesi login bertahan hingga logout (atau sesi kedaluwarsa), dan opsi logout tersedia.

---

## 2. Customer Management (CRUD)
- [x] AC-2.1 Membuat customer baru dengan field Nama (wajib diisi).
- [x] AC-2.2 Mengubah seluruh field dari customer yang sudah ada (Nama, Diskon, Threshold Bonus).
- [x] AC-2.3 Menghapus customer menggunakan metode soft-delete (disembunyikan dari pilihan baru, namun riwayat transaksi tetap utuh di laporan).
- [x] AC-2.4 Menyimpan dua set diskon independen untuk setiap customer: satu untuk tipe LM dan satu untuk tipe BR.
- [x] AC-2.5 Mengatur set diskon sebagai daftar persentase berurutan yang diaplikasikan secara bertingkat/sekuensial (cascading), bukan dijumlahkan.
- [x] AC-2.6 Menambah, mengubah, dan menghapus tingkatan/langkah diskon individu di dalam sebuah set diskon.
- [x] AC-2.7 Memastikan nilai diskon harus numerik antara 0 dan 100 (input tidak valid harus ditolak).
- [x] AC-2.8 Menetapkan batas ambang (threshold) bonus berupa nominal Rupiah untuk setiap customer.
- [x] AC-2.9 Validasi aturan diskon bertingkat: Harga Base dikali sekuensial dengan $(1 - d_n/100)$. (Contoh: Base 100, LM [20, 20, 10] menghasilkan harga diskon 57.6 / diskon efektif 42.4%).

---

## 3. Product Management (CRUD)
- [x] AC-3.1 Membuat, mengubah, dan menghapus produk.
- [x] AC-3.2 Membatasi pilihan Tipe produk hanya untuk LM atau BR.
- [x] AC-3.3 Memastikan field Harga Modal dan Harga Base/Jual bernilai numerik dan $\ge 0$.
- [x] AC-3.4 Memastikan Harga Modal hanya digunakan untuk perhitungan laba dan tidak pernah ditampilkan ke customer.
- [x] AC-3.5 Menghapus produk menggunakan metode soft-delete (disembunyikan dari pilihan baru, riwayat transaksi tetap dipertahankan).

---

## 4. Transaction (Bon) Management
- [x] AC-4.1 Menyediakan field Tanggal yang otomatis terisi tanggal hari ini dan dapat diubah.
- [x] AC-4.2 Menyediakan field Nomor Bon yang wajib diisi dan unik (Nomor Bon duplikat harus ditolak dengan error yang jelas).
- [x] AC-4.3 Memilih Customer dari daftar customer yang sudah terdaftar (bukan teks bebas).
- [x] AC-4.4 Memilih Produk dari katalog produk yang sudah terdaftar (bukan teks bebas).
- [x] AC-4.5 Mendukung multi-line items produk dalam satu transaksi, masing-masing dengan kuantitas $\ge 1$.
- [x] AC-4.6 Menampilkan tipe produk (LM/BR) dan harga jual akhir yang sudah dipotong diskon bertingkat milik customer secara otomatis di setiap baris item.
- [x] AC-4.7 Memastikan diskon per baris item ditarik otomatis berdasarkan Customer x Tipe Produk (pengguna tidak mengisi diskon secara manual saat transaksi).
- [x] AC-4.8 Menyediakan field Ongkir bernilai numerik dan $\ge 0$ per transaksi (bukan per baris item).
- [x] AC-4.9 Mengatur status bawaan (default) transaksi baru sebagai "Piutang".
- [x] AC-4.10 Mengizinkan pengguna melihat, mengubah, dan menghapus transaksi.
  - [x] AC-4.10.1 Mengkalkulasi ulang omzet, profit, dan total secara otomatis ketika transaksi diubah.
- [x] AC-4.11 Menampilkan nilai komputasi pada detail transaksi: omzet per baris, omzet transaksi (tanpa ongkir), ongkir, dan total tagihan (Amount Owed = Omzet + Ongkir).
- [x] Perhitungan Validasi Transaksi:
  - Line omzet = harga diskon unit × qty
  - Transaction omzet = $\Sigma$ line omzet
  - Amount owed (Piutang) = transaction omzet + ongkir
  - Line Laba HL = (harga diskon unit - harga modal) × qty
  - Ongkir bersifat pass-through (tidak mempengaruhi Laba HL)
  - Omzet dan Laba baru diakui di sistem saat status transaksi menjadi "Lunas" (cash basis)

---

## 5. Bonus Logic
- [x] AC-5.1 Sistem membaca batas ambang (threshold) bonus masing-masing customer (misal: Rp 10.000.000).
- [x] AC-5.2 Sistem melacak akumulasi omzet berjalan per customer hanya dari transaksi yang berstatus "Lunas".
- [x] AC-5.3 Menghitung jumlah bonus terkumpul dengan formula: `floor(akumulasi paid omzet / threshold) - bonus yang sudah diberikan` (Bonus dapat ditumpuk/stack).
- [x] AC-5.4 Memunculkan notifikasi/indikator dan jumlah ketersediaan bonus jika customer memiliki minimal 1 kuota bonus yang belum digunakan.
- [x] AC-5.5 Mencatat transaksi bonus dengan mengaktifkan toggle `Bonus = ON` (mendukung beberapa bonus sekaligus dalam satu Bon).
- [x] AC-5.6 Mengurangi kuota akumulasi omzet sebesar nilai threshold untuk setiap bonus yang digunakan, sisa omzet otomatis dibawa (carry over) ke siklus berikutnya.
- [x] AC-5.7 Memastikan produk di dalam Bon Bonus bernilai gratis: dikecualikan dari omzet dan harga modalnya tidak mengurangi Laba HL (biaya bonus diabaikan dari profit).
- [x] AC-5.8 Membedakan transaksi bonus secara visual di daftar transaksi dan rekap agar tidak menggembungkan laporan pendapatan/piutang.

---

## 6. Customer Detail Page
- [x] AC-6.1 Menampilkan halaman khusus tiap customer yang mengelompokkan aktivitas transaksi berdasarkan bulan dan tahun.
- [x] AC-6.2 Menampilkan informasi berikut ketika suatu bulan dipilih:
  - Daftar transaksi (Bon) lengkap dengan tanggal, Nomor Bon, status, dan nominal tagihan.
  - Total Piutang (jumlah tagihan dari transaksi berstatus "Piutang" [omzet + ongkir]).
  - Total sudah dibayar (jumlah pembayaran dari transaksi berstatus "Lunas" [omzet + ongkir]).
  - Total Omzet (omzet dari transaksi "Lunas", tidak termasuk ongkir).
  - Total Laba HL (keuntungan dari transaksi "Lunas").
- [x] AC-6.3 Menampilkan kolom terpisah untuk Omzet LM dan Omzet BR (serta kolom gabungan total).
- [x] AC-6.4 Menyediakan fitur cetak/unduh daftar tersebut ke dalam format PDF (Piutang list, transaction list).
- [x] AC-6.5 Alur Pelunasan Satu Bulan (Settle a whole month):
  - Menyediakan tombol "Sudah Lunas" di halaman bulanan customer.
  - Menampilkan modal konfirmasi yang meminta input "Tanggal Pelunasan".
  - Mengubah seluruh transaksi di bulan tersebut menjadi "Lunas" dengan tanggal pelunasan yang diinput.
  - Memperbarui pengakuan omzet, profit, dan bonus secara realtime.
- [x] AC-6.6 Alur Pelunasan Single Bon:
  - Menyediakan tombol "Lunas" pada detail satu transaksi (Bon).
  - Menampilkan modal konfirmasi tanggal pelunasan yang sama.
  - Mengubah status Bon tersebut menjadi "Lunas" dengan tanggal pelunasan terkait.
- [x] AC-6.7 Memastikan proses pelunasan langsung memperbarui angka totalan (Total Piutang ↓, Total sudah dibayar ↑, Omzet/Laba diakui ↑, Akumulasi omzet bonus customer ↑).
- [x] AC-6.8 Memastikan transaksi yang sudah "Lunas" tidak dapat dilunasi kembali dan ditandai secara visual agar berbeda.
- [x] AC-6.9 Menampilkan detail lengkap Bon (item baris, qty, harga, ongkir, omzet, status, tanggal pelunasan jika ada) saat transaksi di-klik.

---

## 7. Recap / Reporting
- [x] AC-7.1 Menyediakan laporan rekapitulasi per Customer.
- [x] AC-7.2 Menyediakan laporan rekapitulasi per Tipe Produk (LM / BR).
- [x] AC-7.3 Menyediakan laporan rekapitulasi keseluruhan (gabungan semua customer).
- [x] AC-7.4 Menyediakan filter dan pengelompokan laporan berdasarkan bulan dan tahun.
- [x] AC-7.5 Menampilkan metrik minimal pada setiap rekap: Total Omzet (Lunas), Total Laba HL (Lunas), Total Piutang (Outstanding), dan Total Sudah Dibayar (termasuk breakdown LM vs BR jika relevan).
- [x] AC-7.6 Menampilkan total Laba HL kumulatif dari seluruh customer pada rekap keseluruhan.
- [x] AC-7.7 Mengecualikan transaksi bonus dari perhitungan total omzet/pendapatan/profit, namun dapat dilaporkan terpisah sebagai *Bonus Log*.
- [x] AC-7.8 Menyediakan fitur unduh laporan rekapitulasi dalam format PDF.