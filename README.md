# FinKeluarga — Automated Family Financial Management System

Sistem manajemen keuangan keluarga 5 jiwa (Cinere, Depok – Jakarta) berbasis **Google Apps Script (V8 Engine)**, **Google Sheets Multi-Tab Database**, dan **Mobile-First Native Web App (`HtmlService`)**.

Aplikasi ini mengimplementasikan model perencanaan keuangan **Three-Phase Domino Effect** pada alokasi gaji tetap Rp17.000.000/bulan dengan sistem amplop mingguan, pelacak sinking funds, serta analitik efisiensi motor listrik komuter Cinere–Jakarta.

---

## ⚡ Zero Local Tooling Architecture

> [!IMPORTANT]
> **Tidak perlu menginstall Node.js, npm, maupun `@google/clasp` pada host lokal pengembang atau server lokal.**  
> Seluruh proses pengujian unit test (Jest) dan deployment kode otomatis ke Google Apps Script dijalankan secara mandiri di dalam container runner **GitHub Actions** (`ubuntu-latest`). Host lokal hanya berfungsi murni sebagai lingkungan penulisan kode sumber dan *git version control*.

---

## 📁 Struktur Repositori

```text
personal_finance/
├── .github/
│   └── workflows/
│       ├── validation.yml          # CI: Menjalankan unit tests Jest di cloud runner
│       └── deploy.yml              # CD: Otomatisasi deployment clasp push ke GAS
├── .gemini/
│   └── skills/
│       └── finkeluarga-core.md     # Agent Skill spec untuk Gemini CLI
├── src/
│   ├── appsscript.json            # Manifest GAS (V8 runtime, timezone Jakarta)
│   ├── Code.js                    # Web App controller, doGet(), RPC bridge
│   ├── Config.js                  # Master constants, 18 kategori Rp17jt, fase dominos
│   ├── Database.js                # Data Access Layer, auto-detect bound/standalone, LockService
│   ├── FinanceService.js          # Business logic kalkulator amplop, sinking funds, EV commuter
│   ├── index.html                 # Mobile-first semantic SPA container
│   ├── Stylesheet.html            # Zero-dependency CSS Custom Properties & responsive styles
│   └── Javascript.html            # Vanilla ES6 reactive controller, optimistic UI, localStorage
├── tests/
│   ├── mockGoogleAppsScript.js    # In-memory mock engine untuk testing GAS di Node.js
│   └── finance.test.js            # Unit test validasi logika matematika & 3-fase domino
├── .clasp.json                    # Konfigurasi project clasp (rootDir: ./src)
├── .claspignore                   # Filter file lokal agar tidak terunggah ke GAS
├── package.json                   # Definisi devDependencies (Jest) untuk GitHub Actions
├── AGENT_SKILL_SPEC.md            # Panduan arsitektur & aturan baku agen pengembang
├── IMPLEMENTATION_PLAN.md         # Rencana implementasi teknis lengkap
└── README.md                      # Dokumentasi sistem & petunjuk operasional
```

---

## 🚀 Panduan Setup & Deployment

### 1. Persiapan Google Spreadsheet
1. Buat Google Spreadsheet baru di Google Drive Anda (misal beri nama: `FinKeluarga DB`).
2. Terdapat 2 opsi arsitektur:
   * **Opsi A (Container-Bound - Rekomendasi):** Buka spreadsheet $\rightarrow$ Klik menu **Extensions** $\rightarrow$ **Apps Script**.
   * **Opsi B (Standalone):** Buat proyek Apps Script terpisah di `script.google.com`, lalu salin Spreadsheet ID dari URL dan masukkan ke variabel `SPREADSHEET_ID` di `src/Config.js`.

### 2. Konfigurasi GitHub Repository Secrets
Agar GitHub Actions dapat melakukan push otomatis ke Google Apps Script:
1. Buka repositori GitHub Anda $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Tambahkan 2 secrets:
   * `SCRIPT_ID`: ID Google Apps Script dari proyek target (dapat dilihat di Apps Script Editor $\rightarrow$ **Project Settings** $\rightarrow$ **Script ID**).
   * `CLASPRC_JSON`: Seluruh teks isi file `~/.clasprc.json` (dihasilkan sekali dari autentikasi akun Google).

### 3. Deployment Otomatis via GitHub Actions
* Setiap kali ada push atau PR merge ke cabang `main`, GitHub Actions otomatis:
  1. Menjalankan unit test finansial di `.github/workflows/validation.yml`.
  2. Melakukan deployment kode `src/` ke Apps Script via `.github/workflows/deploy.yml`.

### 4. Inisialisasi Database Sekali Klik
Setelah kode terdeploy ke Apps Script:
1. Buka editor Google Apps Script.
2. Pilih fungsi `apiSetupDatabase` atau `Database.setupDatabase`, lalu klik **Run**.
3. Berikan izin OAuth (Authorization) pertama kali saat diminta.
4. Fungsi ini otomatis membuat dan memformat 6 tab database lengkap:
   * `SYS_CONFIG`: Konfigurasi global & state machine fase.
   * `MST_CATEGORIES`: 18 pos pengeluaran alokasi gaji Rp17.000.000.
   * `TRX_LEDGER`: Buku besar seluruh transaksi harian.
   * `WEEKLY_ENVELOPES`: Saldo amplop mingguan (Dapur & Kantor).
   * `SINKING_FUNDS`: Pelacak tabungan terarah.
   * `VEHICLE_LOG`: Log komuter Cinere–Jakarta & penghematan EV.

### 5. Membuka Web App di Smartphone
1. Di Apps Script Editor, klik tombol **Deploy** $\rightarrow$ **New deployment**.
2. Pilih tipe: **Web app**.
   * Description: `FinKeluarga Production v2.0`.
   * Execute as: **Me** (`user@gmail.com`).
   * Who has access: **Anyone with Google Account** (atau **Anyone**).
3. Salin URL Web App yang dihasilkan, lalu buka di browser smartphone atau simpan sebagai shortcut di Home Screen (*Add to Home screen*).

---

## 💡 Fitur Unggulan FinKeluarga

* **Sistem Amplop Mingguan Anti-Boncos:** Kontrol pengeluaran Dapur (Rp1.050.000/minggu) dan Amplop Kerja Suami (Rp300.000/minggu) dengan bar status warna visual (Hijau `<75%`, Kuning `75-90%`, Merah `>90%`).
* **Optimistic Local Updates:** Saldo amplop langsung berkurang seketika di layar saat menekan submit, tanpa harus menunggu jeda internet roundtrip Google Sheets.
* **Toggle Aktor dengan Memori:** Pilihan pencatat transaksi `Suami` atau `Istri` tersimpan otomatis di `localStorage` peramban.
* **Three-Phase Domino Effect Switcher:** Pengalihan dinamis antara Fase 1, Fase 2, dan Fase 3 lengkap dengan dialog konfirmasi pengaman dampak finansial keluarga.
* **Analitik Komuter EV Cinere-Jakarta:** Pelacakan penghematan riil motor listrik terhadap baseline BBM Honda PCX lama ($46\text{ km/hari}$).
* **Integrasi Mutasi Concurrency:** Seluruh operasi tulis dibungkus `LockService.getScriptLock()` untuk mencegah balapan transaksi antar gawai.

---

## 📄 Lisensi
Hak cipta © 2026 FinKeluarga. Dilisensikan untuk penggunaan manajemen internal keluarga Cinere Depok & Jakarta.
