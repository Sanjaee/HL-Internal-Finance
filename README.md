Acceptance Criteria — HL Sales & Receivables
Management App

Scope: single-user internal app for managing Customers, Products, Transactions (Bon),
receivables (Piutang), bonuses, and reporting for the business “HL”. Currency: IDR (Rp)
only, no tax/PPN. “jt” = juta = 1,000,000. Accounting basis: cash basis — omzet, profit,
and bonus eligibility are recognized only when a transaction is Lunas (paid). See
Decision D3.
Glossary / Conventions
Term Meaning
Bon A single transaction / invoice (identified by Nomor Bon).
LM / BR Product types. Each customer has a separate discount set per
type.
Harga Modal Product cost price (what HL pays). Used for profit only.
Harga Base / Harga Jual Product list price before discount.
Diskon bertingkat
(cascading)
A sequence of % discounts applied one after another, NOT
summed.
Ongkir Shipping cost. Pass-through — charged to customer, no profit
impact.
Omzet Revenue = discounted price × qty (shipping excluded).
Recognized when Lunas.
Laba HL Profit = (discounted price − modal) × qty. Recognized when
Lunas.
Piutang Receivable / unpaid amount. Default status of a new transaction.
Lunas Paid / settled.

1. Authentication

AC-1.1 The app requires login before any feature is accessible.
AC-1.2 Exactly one user account exists; there is no self-registration flow.
AC-1.3 Given valid credentials, the user is logged in and lands on the home/dashboard.
AC-1.4 Given invalid credentials, login is rejected with a clear error and no access is
granted.
AC-1.5 A logged-in session persists until logout (or session expiry, if implemented), and
a logout option is available.

2. Customer Management (CRUD)

A Customer has: Nama, Diskon per tipe (LM & BR), and a Bonus eligibility threshold.
AC-2.1 User can create a customer with a name (required).
AC-2.2 User can edit any field of an existing customer.
AC-2.3 Deleting a customer performs a soft-delete: the customer is hidden from new
selections, but all historical transactions remain intact and visible in reports.
AC-2.4 Each customer holds two independent discount sets: one for LM, one for BR.
AC-2.5 A discount set is an ordered list of percentage values (e.g. LM = [20, 20,
10] ). Order matters because discounts are applied sequentially.
AC-2.6 Within a discount set, the user can add, edit, and delete individual discount
steps.
AC-2.7 Discount values must be numeric and between 0 and 100; invalid entries are
rejected.
AC-2.8 Each customer has a bonus eligibility threshold (a Rupiah amount, e.g.
10,000,000) used by the bonus logic in §5.
Cascading discount rule (enforced everywhere a price is shown/calculated):
Given base price B and discount steps [d1, d2, … dn] (in %), discounted unit price =
B × (1 − d1/100) × (1 − d2/100) × … × (1 − dn/100) .
AC-2.9 Example check: B = 100 , LM [20, 20, 10] → 100 × 0.8 × 0.8 × 0.9 =
57.6 . The effective discount is 42.4%, and the system must not treat it as 50%.

3. Product Management (CRUD)

A Product has: Nama, Harga Modal (cost), Harga Base/Jual (selling price), Tipe (LM or
BR).
AC-3.1 User can create, edit, and delete products.
AC-3.2 Tipe is restricted to LM or BR.
AC-3.3 Harga Modal and Harga Base are numeric and ≥ 0.
AC-3.4 Harga Modal is used only for profit (Laba) calculations and is never shown as a
customer-facing price.
AC-3.5 Deleting a product performs a soft-delete: hidden from new selections, history
preserved.

4. Transaction (Bon) Management

Each transaction captures:
Tanggal — defaults to today, editable.
Nomor Bon — receipt number, must be unique.
Customer — chosen from existing customers.
Produk line items — each: product (from catalog), quantity, with BR/LM type and price
shown.
Ongkir — shipping amount.
Deskripsi — free text.
Bonus — on/off toggle (see §5).
Status — Piutang / Lunas; defaults to Piutang.
AC-4.1 Date field is pre-filled with the current date and can be changed.
AC-4.2 Nomor Bon is required and must be unique; saving a duplicate Nomor Bon is
rejected with a clear error.
AC-4.3 Customer is selected from the existing customer list (not free text).
AC-4.4 Products are selected from the existing product catalog (not free text).
AC-4.5 A transaction supports multiple product lines, each with its own quantity (≥ 1).
AC-4.6 For each product line, the UI shows the product type (LM/BR) and the price
applied for this customer (the discounted unit price computed from that customer’s
discount set for that product’s type).
AC-4.7 The discount applied to each line is derived automatically from the selected
customer × the product’s type — the user does not type discounts manually on the
transaction.
AC-4.8 Ongkir is numeric and ≥ 0 and is captured per transaction (not per line).
AC-4.9 Status defaults to Piutang on creation; user may set Lunas later (see §6 flows).
AC-4.10 User can view, edit, and delete a transaction.
AC-4.10.1 Editing a transaction recalculates omzet, profit, and totals.
AC-4.11 The transaction shows computed values: per-line omzet, transaction omzet
(excl. ongkir), ongkir, and total amount owed = omzet + ongkir.
Calculation rules (per transaction):
Line discounted unit price = cascading discount (§2) using the customer’s set for
that line’s type.
Line omzet = discounted unit price × quantity.
Transaction omzet = Ʃ line omzet (ongkir excluded).
Amount owed (Piutang) = transaction omzet + ongkir.
Line Laba HL = (discounted unit price − harga modal) × quantity.
Ongkir is pass-through → it does not affect Laba HL.
Omzet and Laba are recognized only when the transaction becomes Lunas (cash
basis).

5. Bonus Logic

A “bonus bon” is a transaction opened specifically to give a customer free bonus products
once they have earned it through accumulated paid omzet.
AC-5.1 Each customer has a bonus eligibility threshold (§2.8), e.g. Rp 10,000,000.
AC-5.2 The system maintains a running accumulated omzet per customer, counting
only Lunas (paid) transactions.
AC-5.3 Bonuses stack: the number of bonuses earned = floor(accumulated paid
omzet / threshold) minus bonuses already granted.
AC-5.4 When a customer has at least one earned bonus, the system surfaces eligibility
(flag/notification) and the number of bonuses available.
AC-5.5 A bonus is recorded as a transaction with Bonus = on. The user may include
multiple bonuses in a single bon.
AC-5.6 Each bonus granted consumes one threshold’s worth of accumulated omzet;
the remainder carries over to the next bonus cycle.
AC-5.7 Bonus product lines are given free: they are excluded from omzet and their
cost does not reduce Laba HL (bonus cost is ignored in profit).
AC-5.8 Bonus transactions are clearly distinguishable from normal sales in lists and
recaps so they don’t inflate revenue/receivables.
Scenario (worked example):
Given Customer A threshold = 10,000,000
 And Customer A accumulated PAID omzet = 25,000,000
 And no bonuses granted yet
Then 2 bonuses are available (floor(25/10) = 2)
When the user creates one bonus bon and assigns both bonuses
Then 20,000,000 is consumed (2 × threshold)
 And 5,000,000 carries over toward the next bonus
 And the bonus products are free → no omzet, no profit impact

6. Customer Detail Page

Each customer has a dedicated page showing their activity, grouped by month.
AC-6.1 The page lists the customer’s transactions grouped by month (selectable by
month/year).
AC-6.2 Selecting a month shows, for that month:
List of transactions (Bon) with date, Nomor Bon, status, amount.
Total Piutang (sum of amounts owed on Piutang transactions = omzet + ongkir).
Total sudah dibayar (sum of amounts paid on Lunas transactions = omzet +
ongkir).
Total Omzet (Ʃ omzet of Lunas transactions, excl. ongkir).
Total Laba HL (Ʃ profit of Lunas transactions).
AC-6.3 Omzet is shown with BR and LM in separate columns (plus a combined total).
AC-6.4 User can view and download (PDF) these lists (Piutang list, transaction list).
Settlement (Pelunasan) flows:
AC-6.5 — Settle a whole month:
Given the user is viewing a month (e.g. January) on a customer's page
When the user clicks "Sudah Lunas" (settle month)
Then a modal asks for a Tanggal Pelunasan (payment date)
When the user confirms
Then every transaction in that month for that customer is set to status Lunas
 And each carries the entered payment date
 And their omzet/profit become recognized (cash basis)
AC-6.6 — Settle a single Bon:
Given the user opens a single transaction (Bon) detail
When the user clicks "Lunas"
Then the same payment-date modal appears
When the user confirms
Then only that transaction is set to Lunas with the entered payment date
AC-6.7 Settling updates totals immediately (Total Piutang ↓, Total sudah dibayar ↑,
recognized Omzet/Laba ↑, accumulated bonus omzet ↑).
AC-6.8 Already-Lunas transactions are not re-settled and are visually distinct.
AC-6.9 Clicking a Bon opens its full detail (lines, qty, prices, ongkir, omzet, status,
payment date if any).

7. Recap / Reporting

AC-7.1 Recap available per customer.
AC-7.2 Recap available per product type (LM / BR).
AC-7.3 Recap available overall (all customers combined).
AC-7.4 Each recap can be filtered/grouped per month and per year.
AC-7.5 Each recap reports at minimum: Total Omzet (Lunas), Total Laba HL (Lunas),
Total Piutang (outstanding), Total sudah dibayar, broken down by LM vs BR where
relevant.
AC-7.6 Overall recap shows total Laba HL across all customers.
AC-7.7 Bonus transactions are excluded from omzet/revenue/profit totals (per §5.7–5.8)
and may be reported separately as a bonus log.
AC-7.8 Recaps are downloadable as PDF.

8. Master Calculation Reference (single source of truth)

Quantity Formula
Discounted unit price
Base × Π(1 − dᵢ/100) over the customer’s discount steps for
that type
Line omzet discounted unit price × qty
Transaction omzet Σ line omzet (ongkir excluded)
Amount owed (Piutang) transaction omzet + ongkir
Line Laba HL (discounted unit price − harga modal) × qty
Transaction Laba HL Σ line Laba HL (ongkir excluded — pass-through)
Recognized Omzet
(reports)
Σ transaction omzet where status = Lunas
Recognized Laba HL
(reports)
Σ transaction Laba HL where status = Lunas
Total paid Σ (omzet + ongkir) where status = Lunas
Total outstanding
piutang
Σ (omzet + ongkir) where status = Piutang
Bonus accumulator Σ omzet where status = Lunas (per customer)
Bonuses available floor(bonus accumulator / threshold) − bonuses
already granted
Bonus items free → 0 omzet, 0 profit impact

9. Confirmed Decisions (resolved)

# Question Decision
D1 Ongkir & profit Pass-through — shipping adds no profit. Laba = omzet − modal.
D2
Receivable vs
omzet
Customer owes omzet + ongkir; omzet excludes ongkir.
D3 Omzet /
eligibility basis
Only Lunas (paid) transactions count → cash basis for omzet,
profit, and bonus accumulation.
D4
Bonus
mechanics
Bonuses stack; multiple bonuses can be placed in one bon; each
consumes one threshold, remainder carries.
D5 Bonus product
cost Ignored in profit — free bonus items do not reduce Laba HL.
D6 Deleting items
with history
Soft-delete (hide from new use, keep history).
D7 Nomor Bon Must be unique; duplicates rejected.
D8 Export format PDF.
D9 Currency / tax IDR only, no tax/PPN.

Berdasarkan **Acceptance Criteria HL Sales & Receivables** dan contoh dashboard yang Anda kirim, saya sarankan **jangan langsung bikin UI seperti gambar itu dulu**. Bangun per modul sampai selesai, lalu dashboard terakhir.

# 1. AUTHENTICATION

### Halaman

```text
/login
```

### Component

* Form Login
* Username
* Password
* Login Button
* Logout

### Table

```sql
users
```

---

# 2. DASHBOARD (SETELAH LOGIN)

### Cards

Buat 4 Summary Card

```text
Total Omzet
Total Laba HL
Total Piutang
Total Sudah Dibayar
```

### Chart

```text
Monthly Omzet Trend
```

Type:

```text
Line Chart
```

Data:

```text
Jan
Feb
Mar
...
```

### Table

```text
Piutang Terbaru
```

Kolom:

```text
Tanggal
Nomor Bon
Customer
Status
Total
```

---

# 3. CUSTOMER MANAGEMENT

Menu:

```text
Master Data
 └ Customer
```

### Table Customer

Kolom:

```text
Nama Customer
Threshold Bonus
Diskon LM
Diskon BR
Status
Action
```

### Button

```text
Tambah Customer
Edit
Delete
```

### Form Customer

Field:

```text
Nama Customer
Threshold Bonus
```

### Section Diskon LM

Table:

```text
Urutan
Diskon %
```

Button:

```text
Tambah Step
Edit Step
Delete Step
```

### Section Diskon BR

Table:

```text
Urutan
Diskon %
```

---

# 4. PRODUCT MANAGEMENT

Menu:

```text
Master Data
 └ Product
```

### Table Product

Kolom:

```text
Nama Produk
Tipe
Harga Modal
Harga Base
Status
Action
```

### Form Product

Field:

```text
Nama Produk
Tipe (LM/BR)
Harga Modal
Harga Base
```

---

# 5. TRANSACTION (BON)

Ini modul utama.

Menu:

```text
Transactions
 └ Bon
```

### Table Transaction

Kolom:

```text
Tanggal
Nomor Bon
Customer
Status
Ongkir
Omzet
Total Tagihan
Action
```

### Filter

```text
Tanggal
Customer
Status
```

### Create Transaction

Header:

```text
Tanggal
Nomor Bon
Customer
Ongkir
Deskripsi
Bonus Toggle
```

---

## Detail Item Table

Seperti invoice.

Kolom:

```text
Produk
Tipe
Qty
Harga Base
Diskon
Harga Setelah Diskon
Omzet
Laba
```

Button:

```text
Tambah Produk
Hapus Produk
```

---

## Summary Transaction

Card:

```text
Total Omzet
Ongkir
Total Tagihan
Total Laba
```

---

# 6. TRANSACTION DETAIL

Halaman:

```text
/transaction/:id
```

### Header Card

```text
Nomor Bon
Tanggal
Customer
Status
Tanggal Pelunasan
```

### Table Item

```text
Produk
Qty
Harga
Diskon
Omzet
Laba
```

### Summary

```text
Omzet
Ongkir
Total
Laba
```

### Action

```text
Edit
Lunas
Delete
```

---

# 7. CUSTOMER DETAIL

Menu:

```text
Customer Detail
```

### Header Card

```text
Nama Customer
Threshold Bonus
Bonus Available
```

### Filter

```text
Month
Year
```

---

## Summary Cards

4 Card

```text
Total Piutang
Total Dibayar
Total Omzet
Total Laba
```

---

## Chart

### Omzet LM vs BR

Type:

```text
Bar Chart
```

Data:

```text
LM
BR
```

---

### Omzet Bulanan

Type:

```text
Line Chart
```

---

## Table Transaction

Kolom:

```text
Tanggal
Nomor Bon
Status
Omzet
Ongkir
Total
```

Button:

```text
View Detail
```

---

## Action

```text
Sudah Lunas (1 Bulan)
```

---

# 8. PELUNASAN

### Modal

```text
Tanggal Pelunasan
```

Button:

```text
Confirm
Cancel
```

---

### History Pelunasan Table

Kolom:

```text
Nomor Bon
Tanggal Bon
Tanggal Pelunasan
Nilai
```

---

# 9. BONUS MANAGEMENT

Menu:

```text
Bonus
```

### Summary Card

```text
Accumulated Omzet
Threshold
Bonus Earned
Bonus Used
Bonus Available
```

---

## Chart

Type:

```text
Progress Bar
```

Contoh:

```text
7 jt / 10 jt
```

---

## Bonus History Table

Kolom:

```text
Tanggal
Nomor Bon
Customer
Jumlah Bonus
Status
```

---

## Create Bonus Bon

Field:

```text
Customer
Jumlah Bonus Dipakai
Produk Bonus
Qty
```

---

# 10. REPORTING

Menu:

```text
Reports
```

---

## Report Customer

### Filter

```text
Customer
Month
Year
```

### Cards

```text
Total Omzet
Total Laba
Total Piutang
Total Dibayar
```

### Chart

```text
Monthly Revenue
```

Type:

```text
Line Chart
```

### Table

```text
Tanggal
Nomor Bon
Omzet
Laba
Status
```

### Export

```text
PDF
```

---

## Report LM/BR

### Cards

```text
Total LM
Total BR
```

### Chart

```text
LM vs BR
```

Type:

```text
Pie Chart
```

### Table

```text
Type
Omzet
Laba
Qty
```

---

## Overall Report

### Cards

```text
Total Omzet
Total Laba
Total Piutang
Total Dibayar
Total Bonus
```

### Chart 1

```text
Omzet Per Bulan
```

Line Chart

### Chart 2

```text
Top Customer
```

Bar Chart

### Chart 3

```text
LM vs BR
```

Pie Chart

### Table

```text
Customer
Omzet
Laba
Piutang
Bonus
```

### Export

```text
PDF
```

---

# Struktur Sidebar Final

```text
Dashboard

Master Data
 ├ Customer
 └ Product

Transactions
 ├ Bon
 └ Bonus

Receivables
 └ Pelunasan

Reports
 ├ Customer Report
 ├ LM/BR Report
 └ Overall Report

Settings
 └ User
```

Jika mengikuti acceptance criteria 100%, maka total halaman yang perlu dibuat sekitar:

```text
1. Login
2. Dashboard
3. Customer List
4. Customer Form
5. Customer Detail
6. Product List
7. Product Form
8. Transaction List
9. Transaction Form
10. Transaction Detail
11. Bonus List
12. Bonus Form
13. Pelunasan Modal
14. Customer Report
15. LM/BR Report
16. Overall Report
17. PDF Export Layout
```

Urutan pengerjaan terbaik:
**Customer → Product → Transaction → Pelunasan → Bonus → Customer Detail → Reporting → Dashboard terakhir.** Karena Dashboard hanya menampilkan data dari semua modul tersebut.
