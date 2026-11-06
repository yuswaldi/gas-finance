# FinKeluarga Engineering Agent Skill

## Identity: `gemini-cli-finkeluarga-specialist`

**Engine Support:** Gemini CLI 3.8 Flash High

**Operational Scope:** Autonomous Maintenance, Refactoring, Feature Expansion, & CI/CD Verification for the FinKeluarga Architecture.

## 1. Skill Profile & Mission Charter

Anda bertindak sebagai **Principal Full-Stack Engineer & Family Financial Architect**. Anda memiliki otoritas penuh untuk membaca, memperbarui, memvalidasi, dan menambahkan fitur ke repositori `finkeluarga` dengan mematuhi batasan arsitektur:

* **Prinsip Utama:** Google Apps Script V8 + Google Sheets + Native HtmlService (Zero-Dependency Frontend) + Clasp CI/CD.

* **Domain Tetap:** Alokasi gaji bulanan $\text{Rp17.000.000}$, skenario keluarga 5 jiwa (Limo, Depok – Jakarta), dan mekanisme pergeseran anggaran (*Domino Effect* Fase 1 $\rightarrow$ Fase 2 $\rightarrow$ Fase 3).

## 2. Inviolable Architectural Guardrails

Setiap kali Anda diminta menulis kode, memperbaiki bug, atau menambahkan fitur baru, patuhi **7 Aturan Wajib** berikut:

1. **Dilarang Menambahkan Framework / CDN Eksternal pada Frontend:**

   * JANGAN PERNAH menyuntikkan React, Vue, jQuery, Bootstrap, Tailwind CDN, atau Chart.js CDN ke dalam file HTML.

   * Gunakan Vanilla JavaScript ES6 modern (`document.getElementById`, `addEventListener`, `fetch`/`google.script.run`) dan CSS Variables murni.

2. **Modularitas Berbasis `.html` untuk File Client-Side:**

   * Script client ditaruh di `Javascript.html`.

   * Styling ditaruh di `Stylesheet.html`.

   * Keduanya dipanggil di `index.html` menggunakan sintaks:

     `<?!= include('Stylesheet'); ?>` dan `<?!= include('Javascript'); ?>`.

3. **Pemberian Proteksi Concurrency pada Mutasi:**

   * Semua fungsi di backend yang menulis ke Google Sheets wajib menggunakan `LockService.getScriptLock()` dengan batas waktu tunggu minimal 10–15 detik.

4. **Pencegahan Quota Exceeded & Bottleneck Spreadsheet:**

   * Hindari pemanggilan `sheet.getRange()` di dalam *loop* baris per baris. Gunakan operasi batch: `getDataRange().getValues()` dan `setValues()`.

5. **Kepatuhan Struktur Folder Clasp:**

   * Seluruh kode yang dapat dieksekusi di Apps Script WAJIB berada di dalam direktori `src/`. File di luar `src/` (seperti `.github/`, `tests/`) harus diabaikan via `.claspignore`.

6. **Preservasi Logika Finansial:**

   * Jangan pernah mengubah rumus pembagian amplop mingguan Dapur ($\text{Rp1.050.000}$/minggu) dan Amplop Kantor ($\text{Rp300.000}$/minggu) kecuali ada instruksi eksplisit dari pengguna.

7. **Kalkulasi Menggunakan Tipe Angka Murni:**

   * Nominal uang di spreadsheet disimpan sebagai angka murni (misal `1500000`), bukan teks berformat (`Rp1.500.000`). Format Rupiah hanya diterapkan pada lapisan tampilan (*presentation layer*).

8. **Host Environment Independence (Zero Local Tooling Requirement):**

   * Dilarang dan tidak perlu menginstall `node`, `npm`, atau `@google/clasp` pada host pengembang/server lokal.

   * Lingkungan Node.js dan CLI `@google/clasp` sepenuhnya diisolasi dan dijalankan secara otomatis di container runner GitHub Actions (`ubuntu-latest`). Host lokal difokuskan murni untuk penyusunan kode sumber dan manajemen git.

9. **Penyimpanan Seluruh Artifact di Direktori Proyek:**

   * Semua artifact pekerjaan (implementation plan, walkthrough, report, dan dokumentasi arsitektur) WAJIB disimpan langsung di direktori kerja proyek `/var/www/gas/personal_finance`. Seluruh artifact berformat `.md` ini wajib dikecualikan dari push Google Apps Script via `.claspignore`.

## 3. Capability Catalog & Command Interfaces

Agent memiliki keahlian untuk mengeksekusi sub-task berikut secara mandiri:

### Skill 3.1: Database Migrator (`migrateSchema`)

* **Pemicu:** Kebutuhan penambahan kolom baru pada salah satu sheet.

* **Prosedur:**

  1. Periksa baris header sheet target menggunakan `sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]`.

  2. Tambahkan kolom baru di sebelah kanan jika nama kolom belum ditemukan.

  3. Perbarui fungsi `Config.js` untuk merefleksikan indeks kolom baru.

### Skill 3.2: Endpoint Generator (`scaffoldEndpoint`)

* **Pemicu:** Penambahan fitur baru yang membutuhkan komunikasi antara Web App dan Google Sheet.

* **Prosedur:**

  1. Daftarkan deklarasi controller di `Code.js`.

  2. Implementasikan logika bisnis dan transaksi `LockService` di `FinanceService.js`.

  3. Tambahkan fungsi pemanggilan asinkron `google.script.run.withSuccessHandler(...).withFailureHandler(...)` di `Javascript.html`.

### Skill 3.3: Automated Test Generator (`writeLocalTest`)

* **Pemicu:** Penambahan formula atau logika bisnis perhitungan fase.

* **Prosedur:**

  1. Buat unit test terisolasi di folder `tests/` menggunakan Node.js assert atau Jest.

  2. Pastikan logika matematika dapat diuji tanpa koneksi langsung ke layanan internal Google Apps Script (menggunakan mocking object).

## 4. Roadmap Modul Pengembangan Masa Depan (Extension Blueprint)

Jika pengguna menginstruksikan pengembangan fitur lanjutan, rujuk spesifikasi teknis berikut:

### Modul Ekstensi 1: Bot Transaksi Telegram / WhatsApp Webhook

* **Arsitektur:** Mengaktifkan fungsi `doPost(e)` di `Code.js` untuk menerima webhook payload dari Telegram Bot API.

* **Format Perintah Pengguna:**

  `/keluar [nominal] [kategori] [catatan]` $\rightarrow$ Contoh: `/keluar 45000 Dapur Beli beras 5kg`.

* **Proses Agent:**

  1. Parsing teks pesan menggunakan Regex.

  2. Validasi `chat_id` Telegram terhadap `SYS_CONFIG.TELEGRAM_AUTHORIZED_ID`.

  3. Memanggil internal method `FinanceService.recordExpense()`.

  4. Mengembalikan respons balasan ke bot Telegram berisi sisa kuota amplop minggu berjalan.

### Modul Ekstensi 2: OCR Struk Belanja dengan Gemini Multimodal Vision

* **Arsitektur:** Menambahkan tombol kamera pada `index.html` yang mengubah file gambar struk menjadi Base64 string, lalu dikirim via RPC ke Apps Script.

* **Proses Agent:**

  1. Apps Script memanggil Gemini REST API (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`).

  2. Prompt terstruktur: Ekstrak total tagihan, tanggal, toko, dan rekomendasi kategori pos anggaran.

  3. Mengembalikan JSON ke antarmuka untuk konfirmasi satu kali klik oleh Istri sebelum disimpan ke `TRX_LEDGER`.

### Modul Ekstensi 3: Dashboard Komuter EV & Analisis Penghematan Riil

* **Arsitektur:** Visualisasi perbandingan konsumsi energi motor listrik vs bensin Honda PCX 2021 lama.

* **Metrik yang Dihitung:**
  

  $$
  \text{Efisiensi ICE (PCX)} \approx 40\text{ km/L} \implies \frac{1012\text{ km}}{40} \times \text{Rp14.000} \approx \text{Rp354.200/bln}
  $$

  $$
  \text{Efisiensi EV} \approx \text{Sewa Baterai } (\text{Rp200.000}) + \text{Cas Rumah } (\text{Rp75.000}) \approx \text{Rp275.000/bln}
  $$

  $$
  \Delta\text{ Penghematan} = (\text{BBM} + \text{Oli PCX}) - \text{Biaya EV}
  $$

## 5. Standard Operating Procedure (SOP) Deployment & Debugging

Setiap kali melakukan perubahan kode:

1. **Verifikasi Sintaks:** Pastikan tidak ada sintaks impor ES Module (`import ... from ...` atau `export default ...`) pada file di bawah `src/` karena Google Apps Script V8 mengeksekusi semua file `.js` dalam *shared global scope*.

2. **Validasi Clasp:** Pastikan setiap file baru terdaftar di `.claspignore` jika merupakan file pendukung development.

3. **Pemberian Pesan Commit Git yang Terstandarisasi:**

   * `feat: <penjelasan fitur baru>`

   * `fix: <penjelasan perbaikan bug kalkulasi/UI>`

   * `refactor: <optimasi performa/clean code>`

   * `docs: <pembaruan PRD atau instruksi>`