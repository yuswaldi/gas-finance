/**
 * FinKeluarga — Main Controller & Web App Entrypoint
 * File: src/Code.js
 */

/**
 * Entrypoint HTTP GET untuk Google Apps Script HtmlService Web App.
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  
  // Suntikkan data awal bootstrap langsung ke HTML output
  // Ini mencegah delay loading dan layout shift di perangkat seluler
  let initialData = {};
  try {
    initialData = FinanceService.getBootstrapData();
  } catch (err) {
    initialData = {
      error: err.message,
      appName: CONFIG.APP_NAME,
      categories: [],
      envelopes: [],
      sinkingFunds: []
    };
  }
  
  template.initialDataJson = JSON.stringify(initialData);

  return template.evaluate()
    .setTitle('FinKeluarga — Manajemen Keuangan Keluarga Depok & Jakarta')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * Scriptlet helper untuk menyisipkan modul modular HTML/CSS/JS tanpa CDN.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * RPC Endpoint: Mengambil payload data snapshot terkini
 */
function apiGetBootstrapData() {
  return FinanceService.getBootstrapData();
}

/**
 * RPC Endpoint: Mencatat mutasi transaksi baru (Pengeluaran, Pemasukan, Sinking Transfer)
 */
function apiCreateTransaction(payload) {
  return FinanceService.createTransaction(payload);
}

/**
 * RPC Endpoint: Mencatat riwayat komuter dan operasional kendaraan
 */
function apiRecordVehicleLog(payload) {
  return FinanceService.recordVehicleLog(payload);
}

/**
 * RPC Endpoint: Mengubah fase finansial domino (Fase 1, Fase 2, atau Fase 3)
 */
function apiSwitchPhase(newPhaseKey) {
  return FinanceService.switchPhase(newPhaseKey);
}

/**
 * RPC Endpoint: Inisialisasi master database sekali klik
 */
function apiSetupDatabase() {
  return Database.setupDatabase();
}
