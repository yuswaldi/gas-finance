# Product Requirements Document (PRD)
## FinKeluarga — Automated Family Financial Management System
**Target Agent / Engine:** Gemini CLI (3.8 Flash High / Code Intelligence Mode)  
**Deployment Pipeline:** GitHub Actions $\rightarrow$ `@google/clasp` $\rightarrow$ Google Apps Script (GAS) $\rightarrow$ Google Sheets  
**Document Version:** 2.0.0  
**Target Environments:** Mobile-First Web App (`HtmlService`), Google Spreadsheet Database  

---

## 1. Executive Summary & Domain Context

### 1.1. Profil Finansial Inti (Baseline Input)
* **Penghasilan Bulanan Tetap:** Rp17.000.000 / bulan.
* **Komposisi Keluarga:** 5 Jiwa (Kepala Keluarga/Suami, Istri, 3 Anak).
  * Anak 1: *Fresh Graduate* (subsidi transisi cari kerja: Rp400.000 / bulan, batas evaluasi 6 bulan).
  * Anak 2: Mahasiswa Semester 5 (uang saku + operasional Rp1.500.000 / bulan, cadangan UKT Rp1.000.000 / bulan).
  * Anak 3: Siswa Kelas 3 SMP (SPP & les Rp1.250.000 / bulan, target tabungan masuk SMA Rp1.500.000 / bulan).
* **Aset & Properti:**
  * Rumah: Vila Mutiara Cinere, Limo, Depok (Status: **Lunas**, DSR = 0%).
  * Cadangan Pemeliharaan Rumah & PBB: Rp400.000 / bulan.
* **Mobilitas Kerja (Komuter):**
  * Rute: Limo (Cinere) – Jakarta PP ($46\text{ km/hari $\times$ 22 hari kerja = $\approx 1.012\text{ km/bulan).
  * Transisi Kendaraan: Penjualan Honda PCX 2021 ($\approx\text{Rp22.000.000) digantikan Motor Listrik resmi ber-STNK ($\approx\text{Rp12.000.000} - \text{Rp13.500.000), menghasilkan surplus likuiditas $\approx\text{Rp8.500.000} - \text{Rp10.000.000.
  * Operasional Kerja Rutin: Rp1.450.000 / bulan.

### 1.2. The Three-Phase "Domino Effect" Financial Model
Aplikasi harus memodelkan transisi pengeluaran keluarga secara dinamis tanpa merombak formula kalkulasi:
1. **Fase 1 (Aktif — Nov 2026 s/d Jun 2027):**
   * Alokasi darurat & pendidikan maksimal: SMA Anak 3 (Rp1.500.000/bln), UKT Anak 2 (Rp1.000.000/bln), Dana Hari Tua awal (Rp900.000/bln).
2. **Fase 2 (Jul 2027 s/d Jun 2028):**
   * Pemicu: Anak 1 bekerja (hemat $+\text{Rp400.000), Uang Pangkal SMA selesai (hemat $+\text{Rp1.500.000).
   * Surplus baru: $+\text{Rp1.900.000 / bulan $\rightarrow$ Dialihkan ke Tabungan Kuliah Anak 3 (Rp1.000.000/bln) dan Investasi Hari Tua (Rp900.000/bln, total menjadi Rp1.800.000/bln).
3. **Fase 3 (Mulai Jul 2028 dst.):**
   * Pemicu: Anak 2 lulus kuliah Semester 8 (hemat uang saku $+\text{Rp1.500.000 & UKT $+\text{Rp1.000.000).
   * Akumulasi dana bebas: $+\text{Rp4.400.000 / bulan $\rightarrow$ Investasi Hari Tua melonjak menjadi Rp4.300.000 / bulan ($25,3\%$ dari gaji).

---

## 2. Technical Stack & Repository Structure

### 2.1. Tech Stack Mandate
* **Runtime:** Google Apps Script (V8 Engine).
* **Database:** Single Google Spreadsheet Multi-Tab.
* **Frontend:** Google Apps Script `HtmlService` (Native Single Page Application, Zero External JavaScript/CSS Frameworks, Pure Vanilla ES6, CSS Custom Properties).
* **Build/Deploy Tools:** `@google/clasp` (Chrome Apps Script CLI), Node.js LTS, GitHub Actions.

### 2.2. Repository Architecture (Clasp-Compatible)
Struktur direktori wajib disusun sedemikian rupa agar `clasp push` dapat memetakan file `.js` dan `.html` secara akurat:

```text
finkeluarga/
├── .github/
│   └── workflows/
│       ├── deploy.yml            # CI/CD pipeline ke Google Apps Script via clasp
│       └── validation.yml        # Syntax linting & unit tests
├── .gemini/
│   └── skills/
│       └── finkeluarga-core.md   # Agent Skill spec untuk Gemini CLI
├── src/
│   ├── appsscript.json          # Manifest GAS (OAuth Scopes, V8 runtime, timezone)
│   ├── Code.js                  # Entrypoint (doGet, routing, master bootstrap)
│   ├── Config.js                # App constants, sheet enum, business logic constants
│   ├── Database.js              # Data Access Layer (CRUD, LockService, Caching)
│   ├── FinanceService.js        # Business logic kalkulator amplop, sinking fund & fase
│   ├── index.html               # Main shell & DOM container
│   ├── Stylesheet.html          # CSS Custom Properties, flex/grid layouts, mobile-first
│   └── Javascript.html          # Client-side reactivity, optimistic updates, RPC handlers
├── tests/
│   └── finance.test.js          # Unit tests logic perhitungan finansial
├── .clasp.json                  # Konfigurasi project script ID & root directory
├── .claspignore                 # File yang dikecualikan dari push GAS
├── package.json                 # Dependency dev: @google/clasp, jest
└── README.md                    # Panduan setup lokal dan pairing secrets
```

---

## 3. Google Sheets Database Schema

Spreadsheet database menggunakan 6 tab terstruktur dengan relasi logis:

```
[SYS_CONFIG] ── (Konfigurasi Global & Status Fase)
      │
[MST_CATEGORIES] ── (Relasi Kategori) ──< [TRX_LEDGER] >── [WEEKLY_ENVELOPES]
      │                                        │
[SINKING_FUNDS] <── (Setoran Tabungan Tujuan) ─┘
      │
[VEHICLE_LOG]   ── (Pencatatan Komuter Limo-Jakarta & Servis Motor)
```

### 3.1. Tab: `SYS_CONFIG`
Tabel *key-value* untuk konfigurasi sistem dan *state machine* fase:
| Kolom | Tipe | Contoh Nilai | Keterangan |
| :--- | :--- | :--- | :--- |
| `config_key` (PK) | String | `ACTIVE_PHASE` | Kunci unik parameter sistem |
| `config_val` | String | `PHASE_1` | `PHASE_1` \| `PHASE_2` \| `PHASE_3` |
| `updated_at` | Timestamp | `2026-11-06 13:00:00` | Waktu update terakhir |

### 3.2. Tab: `MST_CATEGORIES`
Daftar seluruh 18 sub-kategori pos pengeluaran berdasarkan alokasi gaji Rp17.000.000:
| Kolom | Tipe | Contoh Nilai | Keterangan |
| :--- | :--- | :--- | :--- |
| `category_id` (PK) | String | `CAT-A01` | Format: `CAT-[GROUP][NO]` |
| `group_code` | String | `A` | `A` (Rumah), `B` (Kantor), `C` (Anak), `D` (Tabungan), `E` (Sosial) |
| `group_name` | String | `A. Rumah Tangga` | Nama grup pos pengeluaran |
| `sub_category` | String | `Belanja Dapur & Sembako` | Rincian nama pos |
| `is_weekly` | Boolean | `TRUE` | `TRUE` jika dikontrol via amplop mingguan |
| `weekly_limit` | Number | `1050000` | Plafon mingguan jika `is_weekly = TRUE` |
| `budget_phase_1` | Number | `4200000` | Plafon bulanan Fase 1 |
| `budget_phase_2` | Number | `4200000` | Plafon bulanan Fase 2 |
| `budget_phase_3` | Number | `4200000` | Plafon bulanan Fase 3 |

### 3.3. Tab: `TRX_LEDGER`
Log seluruh transaksi masuk, keluar, dan pemindahan dana:
| Kolom | Tipe | Contoh Nilai | Keterangan |
| :--- | :--- | :--- | :--- |
| `trx_id` (PK) | String | `TRX-20261106-081522-892` | Format: `TRX-YYYYMMDD-HHmmss-fff` |
| `trx_date` | Date | `2026-11-06` | Tanggal transaksi |
| `period_ym` | String | `2026-11` | Format indeks: `YYYY-MM` |
| `week_index` | String | `2026-W45` | Format indeks ISO-8601 minggu |
| `trx_type` | Enum | `EXPENSE` | `EXPENSE` \| `INCOME` \| `SINKING_TRANSFER` |
| `category_id` (FK) | String | `CAT-A01` | Relasi ke `MST_CATEGORIES.category_id` |
| `amount` | Number | `135000` | Nilai transaksi dalam Rupiah murni |
| `actor` | Enum | `Istri` | `Suami` \| `Istri` |
| `source_wallet` | String | `Rekening Operasional Dapur`| Rekening / dompet fisik |
| `notes` | String | `Belanja mingguan pasar Limo` | Catatan tambahan |
| `created_at` | Timestamp | `2026-11-06 08:15:22` | Timestamp audit sistem |

### 3.4. Tab: `SINKING_FUNDS`
Master pelacakan dana target khusus:
| Kolom | Tipe | Contoh Nilai | Keterangan |
| :--- | :--- | :--- | :--- |
| `fund_id` (PK) | String | `SF-01` | ID target dana |
| `fund_name` | String | `Dana Masuk SMA Anak 3` | Nama tujuan tabungan |
| `target_amount` | Number | `12000000` | Target nominal |
| `current_balance`| Number | `3000000` | Saldo riil terakumulasi |
| `monthly_contrib`| Number | `1500000` | Setoran rutin per bulan |
| `target_date` | Date | `2027-06-30` | Tenggat waktu pencairan |
| `account_info` | String | `Bank Jago - Kantong SMA` | Tempat penyimpanan dana |
| `status` | Enum | `ACTIVE` | `ACTIVE` \| `COMPLETED` \| `PAUSED` |

### 3.5. Tab: `WEEKLY_ENVELOPES`
Log historis dan status saldo kuota amplop mingguan (Senin–Minggu):
| Kolom | Tipe | Contoh Nilai | Keterangan |
| :--- | :--- | :--- | :--- |
| `envelope_id` (PK) | String | `ENV-2026W45-CAT-A01` | Indeks kombinasi minggu dan kategori |
| `week_index` | String | `2026-W45` | Minggu ISO |
| `category_id` (FK) | String | `CAT-A01` | Relasi ke kategori amplop |
| `quota_amount` | Number | `1050000` | Kuota awal minggu |
| `spent_amount` | Number | `720000` | Total terpakai berjalan |
| `remaining` | Number | `330000` | Sisa kuota |

### 3.6. Tab: `VEHICLE_LOG`
Pencatatan efisiensi komuter Cinere–Jakarta ($46\text{ km/hari):
| Kolom | Tipe | Contoh Nilai | Keterangan |
| :--- | :--- | :--- | :--- |
| `log_id` (PK) | String | `VHC-20261106-001` | ID log kendaraan |
| `log_date` | Date | `2026-11-06` | Tanggal log |
| `vehicle_type` | Enum | `EV_MOTOR` | `ICE_PCX` \| `EV_MOTOR` |
| `odometer_km` | Number | `45230` | Angka spidometer |
| `log_type` | Enum | `BATTERY_RENT` | `BBM` \| `CAS_LISTRIK` \| `BATTERY_RENT` \| `SERVIS_OLI` \| `SPAREPART` |
| `cost` | Number | `200000` | Biaya operasional |
| `notes` | String | `Sewa baterai bulanan motor listrik` | Keterangan rute / suku cadang |

---

## 4. Google Apps Script Backend Specification

### 4.1. Concurrency & Integrity (`LockService`)
Setiap mutasi pada `TRX_LEDGER`, `WEEKLY_ENVELOPES`, dan `SINKING_FUNDS` wajib diapit oleh `LockService` untuk mencegah kondisi balapan (*race condition*) antar perangkat Suami dan Istri:
```javascript
const lock = LockService.getScriptLock();
try {
  lock.waitLock(15000); // Batas tunggu maksimal 15 detik
  // Lakukan pembacaan data, appendRow, dan update saldo agregat
} finally {
  lock.releaseLock();
}
```

### 4.2. Aggregation & In-Memory Caching (`CacheService`)
Untuk menjaga responsivitas UI mobile di bawah 1,5 detik:
* Hasil eksekusi `getBootstrapData()` disimpan pada `CacheService.getUserCache()` selama 600 detik ($10\text{ menit).
* Setiap mutasi data via `createTransaction()` atau `updateMilestone()` otomatis memicu `CacheService.getUserCache().remove('BOOTSTRAP_PAYLOAD')`.

### 4.3. Scriptlet Templating Integration
File `Code.js` wajib menyediakan fungsi `include(filename)` untuk menyusun komponen modular HTML/CSS/JS tanpa CDN:
```javascript
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  template.initialDataJson = JSON.stringify(FinanceService.getBootstrapData());
  return template.evaluate()
    .setTitle('FinKeluarga — Depok & Jakarta')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
```

---

## 5. Native Frontend Specification (Zero-Dependency)

### 5.1. Design System Tokens (CSS Variables)
Sistem UI menggunakan CSS murni di dalam `Stylesheet.html`:
```css
:root {
  --color-primary: #0f766e;        /* Teal 700 - Brand FinKeluarga */
  --color-primary-light: #ccfbf1;  /* Teal 100 - Active state nav */
  --color-surface: #ffffff;        /* Pure white card */
  --color-bg: #f8fafc;             /* Slate 50 canvas */
  --color-text-main: #0f172a;      /* Slate 900 text */
  --color-text-muted: #64748b;     /* Slate 500 metadata */
  --color-border: #e2e8f0;         /* Slate 200 borders */
  --color-status-ok: #16a34a;      /* Green 600 (<75% kuota) */
  --color-status-warn: #d97706;    /* Amber 600 (75-90% kuota) */
  --color-status-alert: #dc2626;   /* Red 600 (>90% kuota) */
  --radius-card: 16px;
  --radius-input: 10px;
  --touch-target: 44px;            /* Minimum hit area mobile */
}
```

### 5.2. Navigasi & Rendering
* **SPA Section Toggling:** Kontainer utama terdiri dari `<main>` dengan 4 section (`#view-dashboard`, `#view-input`, `#view-sinking`, `#view-vehicle`).
* **Optimistic Local Update:** Saat transaksi disubmit, form mengunci tombol submit, menampilkan *spinner* CSS murni, dan langsung merefleksikan sisa amplop di memori JavaScript lokal sebelum konfirmasi dari `google.script.run` selesai.

---

## 6. Clasp & GitHub Actions CI/CD Pipeline

### 6.1. Konfigurasi `.clasp.json`
```json
{
  "scriptId": "YOUR_APPS_SCRIPT_PROJECT_ID",
  "rootDir": "./src"
}
```

### 6.2. Konfigurasi `.claspignore`
```text
**/**
!src/**
!src/appsscript.json
!src/*.js
!src/*.html
```

### 6.3. Secret Management di GitHub Repository
Daftarkan secrets berikut pada GitHub Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions:
1. `CLASPRC_JSON`: Seluruh isi file `~/.clasprc.json` yang dihasilkan dari `clasp login` lokal (berisi `access_token`, `refresh_token`, `client_id`, `client_secret`).
2. `SCRIPT_ID`: ID Google Apps Script dari proyek spreadsheet target.

### 6.4. GitHub Actions Workflow File (`.github/workflows/deploy.yml`)
Workflow ini otomatis melakukan validasi dan deployment setiap ada *push* atau *pull request merge* ke cabang `main`:

```yaml
name: Deploy FinKeluarga to Google Apps Script

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Clasp & Dependencies
        run: |
          npm ci || npm install -g @google/clasp

      - name: Authenticate Clasp
        run: |
          mkdir -p ~/.clasp
          echo '${{ secrets.CLASPRC_JSON }}' > ~/.clasprc.json
          chmod 600 ~/.clasprc.json

      - name: Inject Script ID
        run: |
          node -e "
            const fs = require('fs');
            const claspConfig = {
              scriptId: '${{ secrets.SCRIPT_ID }}',
              rootDir: './src'
            };
            fs.writeFileSync('./.clasp.json', JSON.stringify(claspConfig, null, 2));
          "

      - name: Deploy Code to Google Apps Script
        run: |
          npx clasp push --force

      - name: Audit Deployment Status
        run: |
          npx clasp status
          echo "Deployment FinKeluarga berhasil didorong ke Google Apps Script."
```

---

## 7. Verifikasi & Acceptance Criteria (Quality Gates)

1. **Inisialisasi Database Sekali Klik:** Menjalankan fungsi `Database.setupDatabase()` di Apps Script wajib menghasilkan 6 tab lengkap dengan seluruh formula validasi, relasi ID, dan data *seeding* awal pos gaji Rp17.000.000.
2. **Kepatuhan Zero-Dependency:** File `index.html`, `Stylesheet.html`, dan `Javascript.html` tidak boleh memanggil aset eksternal (larangan tag `<script src="...">` atau `<link href="...">` ke CDN luar). Seluruh visualisasi grafis menggunakan elemen DIV progress bar CSS murni.
3. **Integritas Transaksi Bersamaan:** Simulasi input simultan Suami dan Istri dalam selang 100ms tidak boleh merusak agregasi saldo atau menyebabkan penimpaan baris baris transaksi.
4. **Eksekusi Clasp Tanpa Error:** Workflow GitHub Actions dapat login tanpa meminta interaksi konsol browser (*headless execution*) menggunakan refresh token dari secret `CLASPRC_JSON`.