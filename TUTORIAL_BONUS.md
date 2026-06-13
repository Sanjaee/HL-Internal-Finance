# Tutorial: Alur Klaim Bonus Customer

Fitur **Bonus Management** pada aplikasi HL Finance dirancang untuk menghitung secara otomatis dan mengelola pemberian bonus kepada customer yang telah mencapai target omzet tertentu (Bonus Threshold). 

Berikut adalah panduan lengkap dari awal pengaturan hingga bonus berhasil diklaim.

---

## Langkah 1: Atur Target Bonus (Threshold) Customer
Agar sistem bisa menghitung bonus, setiap customer harus memiliki target omzet (*Bonus Threshold*).
1. Buka halaman **Customers** dari menu samping (Sidebar).
2. Klik tombol **Edit** (ikon pensil) pada customer yang Anda inginkan, atau saat membuat customer baru.
3. Pada field **Bonus Threshold (Rp)**, masukkan nominal target (Misal: `10.000.000`).
4. Klik **Save**. 

> [!NOTE]
> Sistem akan menghitung 1 kuota bonus setiap kali customer tersebut mengumpulkan kelipatan omzet sebesar Rp 10.000.000.

---

## Langkah 2: Buat Transaksi Penjualan Biasa
Customer harus berbelanja untuk mengumpulkan omzet.
1. Buka halaman **Transactions**.
2. Klik **Create New Bon**.
3. Pilih customer yang sama, lalu masukkan produk yang dibeli.
4. Simpan transaksi. Transaksi ini awalnya akan berstatus **PIUTANG**.

> [!WARNING]
> Omzet dari transaksi berstatus **PIUTANG** belum akan masuk ke perhitungan bonus. Sistem menggunakan *cash-basis* (berdasarkan uang yang masuk).

---

## Langkah 3: Lakukan Pelunasan (Lunas)
Agar omzet diakui dan progres bonus bertambah, transaksi Piutang harus dilunasi.
1. Setelah membuat transaksi, Anda akan masuk ke halaman **Detail Transaksi** (atau buka dari menu **Transactions** -> klik bon yang diinginkan).
2. Di pojok kanan atas halaman, klik tombol hijau **"Mark as Lunas"**.
3. Masukkan Tanggal Pembayaran, lalu klik **Confirm**.
4. Setelah transaksi berubah status menjadi **LUNAS**, sistem otomatis menambahkan nilai Omzet ke dalam progres Bonus customer tersebut.

---

## Langkah 4: Pantau Progres Bonus
Anda bisa melihat seberapa dekat customer dengan target bonusnya.
1. Buka menu **Bonus Management**.
2. Cari nama customer Anda.
3. Anda akan melihat kolom **Progress**:
   - Menampilkan bar persentase.
   - Jika omzet lunas sudah mencapai atau melebihi Threshold, kolom **Available** akan menampilkan angka `1` (atau lebih, karena bonus dapat ditumpuk/stack).
   - **Penting tentang Progress Bar:** Bar ini menampilkan progres menuju bonus siklus *berikutnya*, bukan dari 0 awal mula. Jika customer punya kelebihan omzet (misal: target Rp 5 juta, belanjanya Rp 5,2 juta), kelebihan Rp 200rb tersebut akan *disimpan otomatis (carry over)* sebagai modal awal untuk bar siklus selanjutnya!

---

## Langkah 5: Klaim (Redeem) Bonus
Jika kolom **Available** sudah berwarna hijau (Minimal `1 Available`), Anda sudah bisa mencairkan bonus tersebut!
1. Di halaman **Bonus Management**, klik tombol **Redeem** (ikon kado) di sebelah kanan baris customer tersebut.
2. Akan muncul jendela (Modal) **Redeem Bonus**.
3. Klik tombol **+ Add Item** untuk memilih barang bonus yang diberikan ke customer.
4. Tentukan **Quantity (Qty)** barang bonusnya.
5. Klik **Confirm Redemption**.

---

## Langkah 6: Pengecekan Bon Bonus
Setelah *Redeem* berhasil, sistem akan **otomatis membuatkan Bon Transaksi khusus**.
1. Buka halaman **Transactions**.
2. Anda akan melihat sebuah transaksi baru di bagian atas dengan label/Badge **BONUS (FREE)**.
3. Jika Anda membuka Bon tersebut:
   - Status otomatis **LUNAS**.
   - **Harga Diskon per unit**, **Omzet**, dan **Tagihan** = `Rp 0`.
   - Laporan laba (*Profit/Laba HL*) Anda tidak akan berkurang/minus, sistem akan mengabaikan biaya modal produk ini dari perhitungan profit.

> [!TIP]
> Dengan mekanisme ini, pengeluaran barang bonus tetap tercatat dengan baik secara kuantitas stok/penjualan, tanpa merusak atau menggembungkan laporan keuangan omzet/piutang bulanan.

---

🎉 **Selesai! Anda telah berhasil menyelesaikan satu siklus utuh sistem Bonus HL Finance.**

---

## Contoh Praktik Langsung: Mengaktifkan & Klaim Bonus Hillary Braun

Jika saat ini tombol Redeem untuk **Hillary Braun** masih berwarna abu-abu (Available: 0), Anda dapat mencoba langkah simulasi berikut secara berurutan di dalam sistem:

### 1. Hitung Kekurangan Omzet
* **Halaman (Page):** `Bonus Management` (di sidebar kiri)
* **Aksi:** Cari baris tabel dengan nama "Hillary Braun". 
* **Pengecekan Angka:** 
  * Di kolom *Threshold* tertulis **Rp 5.276.148**
  * Di kolom *Progress* tertulis **Rp 270.199**
  * **Hitung kekurangannya:** Rp 5.276.148 - Rp 270.199 = **Rp 5.005.949**.
  * Artinya, Hillary Braun butuh tambahan transaksi omzet minimal **Rp 5.005.949** lagi agar kolom `Available` menjadi `1` dan bonus bisa diklaim.

### 2. Buat Transaksi Penjualan Baru
* **Halaman (Page):** `Transactions` -> Klik tombol `Create New Bon`
* **Input yang wajib diisi:**
  * **Customer:** Pilih `Hillary Braun`
  * **Produk:** Klik `Add Product`, lalu pilih barang bebas dari daftar.
  * **Qty / Harga:** Atur Qty dan harganya sedemikian rupa hingga nominal tagihan di bagian paling bawah (`Total Amount`) mencapai minimal **Rp 5.005.949** (atau lebih, misalnya dibulatkan saja menjadi input total tagihan **Rp 5.010.000**).
* **Aksi:** Klik tombol `Save Transaction`.
* *Catatan:* Transaksi yang baru dibuat ini akan masuk ke tab **PIUTANG**. Omzetnya belum dihitung ke dalam bonus.

### 3. Lunasi Transaksi (Syarat Wajib Masuk Bonus)
* **Halaman (Page):** Setelah Anda klik `Save Transaction` sebelumnya, sistem otomatis akan membawa Anda ke halaman **Detail Transaksi** (URL seperti `.../dashboard/transactions/...`).
* **Aksi & Input:**
  1. Perhatikan di pojok kanan atas halaman tersebut terdapat tombol berwarna hijau.
  2. Klik tombol **"Mark as Lunas"** tersebut.
  3. Akan muncul dialog konfirmasi pelunasan. Pada **Payment Date**, biarkan tanggal hari ini.
  4. Klik tombol **Confirm**.
* *Catatan:* Begitu status transaksi berubah dari merah (PIUTANG) menjadi hijau (**LUNAS**), uang sejumlah Rp 5.010.000 tersebut resmi ditambahkan. Total *Progress* Hillary Braun kini melampaui Threshold.

### 4. Eksekusi Redeem (Klaim Bonus)
* **Halaman (Page):** `Bonus Management`
* **Aksi & Input:** 
  1. Cari kembali nama `Hillary Braun`. Kini kolom **Available** seharusnya sudah menampilkan angka `1` atau hijau.
  2. Tombol **Redeem** (ikon kado 🎁) di kolom paling kanan sekarang sudah bisa diklik. Klik tombol tersebut!
  3. Akan muncul dialog **"Redeem Bonus for Hillary Braun"**.
  4. **Rights to Consume:** Isi dengan `1`.
  5. Di kotak *Free Products*, klik tombol **+ Add Item**.
  6. **Product:** Buka dropdown dan pilih satu produk untuk dijadikan bonus (misal produk A).
  7. **Qty:** Ketik jumlah barang gratis yang diberikan, misal `2`.
  8. Terakhir, klik tombol **Confirm Redemption** di pojok kanan bawah.

**Validasi Akhir:** 
Buka kembali halaman `Transactions`. Di baris paling atas, Anda akan melihat sebuah nota baru atas nama Hillary Braun dengan label badge biru bertuliskan **BONUS (FREE)**. Jika nota tersebut dibuka, seluruh tagihannya adalah Rp 0!
