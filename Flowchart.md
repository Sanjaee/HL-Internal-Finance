flowchart TD

    A([Login]) --> B{Kredensial valid?}
    B -- Tidak --> A
    B -- Ya --> C[Dashboard / Home]

    C --> D[Manajemen Customer]
    C --> E[Manajemen Produk]
    C --> F[Manajemen Transaksi / Bon]
    C --> G[Rekap / Laporan]

    D --> D1["Tambah Customer<br/>Nama + Diskon LM/BR + Threshold Bonus"]
    D --> D2[Edit Customer]
    D --> D3["Soft Delete Customer<br/>History tetap ada"]

    D1 --> D4{"Diskon valid?<br/>0-100, urutan matters"}
    D4 -- Tidak --> D1
    D4 -- Ya --> D5["Simpan<br/>Cascading Discount"]

    E --> E1["Tambah Produk<br/>Nama, Modal, Harga Base, Tipe LM/BR"]
    E --> E2[Edit Produk]
    E --> E3["Soft Delete Produk<br/>History tetap ada"]

    F --> F1[Buat Bon Baru]
    F1 --> F2["Isi Tanggal, Nomor Bon,<br/>Customer, Produk + Qty, Ongkir"]

    F2 --> F3{Nomor Bon unik?}
    F3 -- Tidak --> F2
    F3 -- Ya --> F4["Hitung Otomatis<br/>Harga Diskon, Omzet, Total"]

    F4 --> F5{Bonus Bon?}
    F5 -- Ya --> F6["Bonus ON<br/>Omzet = 0, Laba = 0"]
    F5 -- Tidak --> F7["Status PIUTANG"]
    F6 --> F7

    F7 --> H{Pelunasan}

    H -- Lunas 1 Bon --> H1["Input Tanggal Pelunasan<br/>Status LUNAS"]

    H -- Lunas 1 Bulan --> H2["Lunasi Semua Bon Bulan Ini<br/>Status LUNAS"]

    H1 --> H3["Update Piutang, Dibayar,<br/>Omzet, Laba, Bonus"]

    H2 --> H3

    H3 --> I{"Bonus tersedia?"}

    I -- Ya --> I1["Notifikasi Bonus"]
    I1 --> I2["Buat Bonus Bon"]
    I2 --> I3["Kurangi Akumulasi Threshold"]

    I -- Tidak --> C

    C --> J[Detail Customer]
    J --> J1[Pilih Bulan dan Tahun]

    J1 --> J2["Daftar Bon, Piutang,<br/>Dibayar, Omzet, Laba"]

    J2 --> J3["Download PDF"]

    G --> G1["Filter Bulan dan Tahun"]

    G1 --> G2[Rekap per Customer]
    G1 --> G3[Rekap per Tipe LM/BR]
    G1 --> G4[Rekap Keseluruhan]

    G2 --> G5[Ringkasan Rekap]
    G3 --> G5
    G4 --> G5

    G5 --> G6["Download PDF"]