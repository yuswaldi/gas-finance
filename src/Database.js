/**
 * FinKeluarga — Data Access Layer (DAL)
 * File: src/Database.js
 */

const Database = {
  /**
   * Mengambil instance Spreadsheet secara fleksibel (Container-Bound atau Standalone fallback).
   */
  getSpreadsheet() {
    try {
      const active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) return active;
    } catch (e) {
      // Ignore and fallback if not running in bound context
    }

    if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    }

    throw new Error('Spreadsheet ID belum dikonfigurasi pada Config.js dan skrip tidak berjalan dalam konteks Container-Bound.');
  },

  /**
   * Mengambil referensi tab/sheet berdasarkan nama. Jika autoCreate = true, buat jika belum ada.
   */
  getSheet(sheetName, autoCreate = true) {
    const ss = this.getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet && autoCreate) {
      sheet = ss.insertSheet(sheetName);
    }
    return sheet;
  },

  /**
   * Membaca seluruh data pada sheet sebagai array of array (2D Array) secara batch.
   */
  readAll(sheetName) {
    const sheet = this.getSheet(sheetName, false);
    if (!sheet) return [];
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return []; // Hanya header atau kosong
    return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  },

  /**
   * Membaca header baris pertama sheet.
   */
  readHeaders(sheetName) {
    const sheet = this.getSheet(sheetName, false);
    if (!sheet || sheet.getLastColumn() < 1) return [];
    return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  },

  /**
   * Menambahkan satu baris data dengan proteksi LockService.
   */
  appendRowLocked(sheetName, rowData) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(CONFIG.LOCK.TIMEOUT_MS);
      const sheet = this.getSheet(sheetName, true);
      sheet.appendRow(rowData);
      SpreadsheetApp.flush();
      return true;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Menambahkan sekumpulan baris (batch append) dengan proteksi LockService.
   */
  batchAppendLocked(sheetName, rowsData) {
    if (!rowsData || rowsData.length === 0) return true;
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(CONFIG.LOCK.TIMEOUT_MS);
      const sheet = this.getSheet(sheetName, true);
      const startRow = sheet.getLastRow() + 1;
      const numRows = rowsData.length;
      const numCols = rowsData[0].length;
      sheet.getRange(startRow, 1, numRows, numCols).setValues(rowsData);
      SpreadsheetApp.flush();
      return true;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Mengupdate baris spesifik berdasarkan indeks baris sheet (1-based index).
   */
  updateRowLocked(sheetName, rowIndex, rowData) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(CONFIG.LOCK.TIMEOUT_MS);
      const sheet = this.getSheet(sheetName, true);
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      SpreadsheetApp.flush();
      return true;
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Format styling header: Teal (#0f766e) background, white text, bold, freeze row 1.
   */
  formatHeader(sheet, headers) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0f766e');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  },

  /**
   * Inisialisasi Database Sekali Klik (One-Click Setup):
   * Membuat 6 tab lengkap, format header, data validation dropdowns, dan seeding data awal.
   */
  setupDatabase() {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(CONFIG.LOCK.TIMEOUT_MS);
      const ss = this.getSpreadsheet();

      // 1. Tab: SYS_CONFIG
      let sheetConfig = this.getSheet(CONFIG.SHEETS.SYS_CONFIG, true);
      const configHeaders = ['config_key', 'config_val', 'updated_at'];
      this.formatHeader(sheetConfig, configHeaders);
      if (sheetConfig.getLastRow() <= 1) {
        const now = new Date();
        const initialConfig = [
          ['ACTIVE_PHASE', 'PHASE_1', now],
          ['FAMILY_NAME', 'Keluarga Cinere Depok', now],
          ['MONTHLY_SALARY', 17000000, now],
          ['HOME_STATUS', 'Lunas (Cinere Depok)', now],
          ['COMMUTER_ROUTE', 'Cinere - Jakarta PP (46 km/hari)', now]
        ];
        sheetConfig.getRange(2, 1, initialConfig.length, 3).setValues(initialConfig);
      }

      // 2. Tab: MST_CATEGORIES
      let sheetCat = this.getSheet(CONFIG.SHEETS.MST_CATEGORIES, true);
      const catHeaders = [
        'category_id', 'group_code', 'group_name', 'sub_category',
        'is_weekly', 'weekly_limit', 'budget_phase_1', 'budget_phase_2', 'budget_phase_3'
      ];
      this.formatHeader(sheetCat, catHeaders);
      if (sheetCat.getLastRow() <= 1) {
        const catRows = CONFIG.CATEGORIES_SEED.map(c => [
          c.id, c.group_code, c.group_name, c.sub_category,
          c.is_weekly, c.weekly_limit, c.phase_1, c.phase_2, c.phase_3
        ]);
        sheetCat.getRange(2, 1, catRows.length, catHeaders.length).setValues(catRows);
      }

      // 3. Tab: TRX_LEDGER
      let sheetTrx = this.getSheet(CONFIG.SHEETS.TRX_LEDGER, true);
      const trxHeaders = [
        'trx_id', 'trx_date', 'period_ym', 'week_index', 'trx_type',
        'category_id', 'amount', 'actor', 'source_wallet', 'notes', 'created_at'
      ];
      this.formatHeader(sheetTrx, trxHeaders);

      // Data validation dropdowns TRX_LEDGER
      const ruleTrxType = SpreadsheetApp.newDataValidation()
        .requireValueInList(['EXPENSE', 'INCOME', 'SINKING_TRANSFER'], true)
        .build();
      sheetTrx.getRange('E2:E1000').setDataValidation(ruleTrxType);

      const ruleActor = SpreadsheetApp.newDataValidation()
        .requireValueInList(['Suami', 'Istri'], true)
        .build();
      sheetTrx.getRange('H2:H1000').setDataValidation(ruleActor);

      // 4. Tab: WEEKLY_ENVELOPES
      let sheetEnv = this.getSheet(CONFIG.SHEETS.WEEKLY_ENVELOPES, true);
      const envHeaders = ['envelope_id', 'week_index', 'category_id', 'quota_amount', 'spent_amount', 'remaining'];
      this.formatHeader(sheetEnv, envHeaders);

      // 5. Tab: SINKING_FUNDS
      let sheetSf = this.getSheet(CONFIG.SHEETS.SINKING_FUNDS, true);
      const sfHeaders = [
        'fund_id', 'fund_name', 'target_amount', 'current_balance',
        'monthly_contrib', 'target_date', 'account_info', 'status'
      ];
      this.formatHeader(sheetSf, sfHeaders);

      const ruleStatus = SpreadsheetApp.newDataValidation()
        .requireValueInList(['ACTIVE', 'COMPLETED', 'PAUSED'], true)
        .build();
      sheetSf.getRange('H2:H50').setDataValidation(ruleStatus);

      if (sheetSf.getLastRow() <= 1) {
        const sfRows = CONFIG.SINKING_FUNDS_SEED.map(s => [
          s.id, s.name, s.target_amount, s.current_balance,
          s.monthly_contrib, s.target_date, s.account_info, s.status
        ]);
        sheetSf.getRange(2, 1, sfRows.length, sfHeaders.length).setValues(sfRows);
      }

      // 6. Tab: VEHICLE_LOG
      let sheetVeh = this.getSheet(CONFIG.SHEETS.VEHICLE_LOG, true);
      const vehHeaders = ['log_id', 'log_date', 'vehicle_type', 'odometer_km', 'log_type', 'cost', 'notes'];
      this.formatHeader(sheetVeh, vehHeaders);

      const ruleVehType = SpreadsheetApp.newDataValidation()
        .requireValueInList(['ICE_PCX', 'EV_MOTOR'], true)
        .build();
      sheetVeh.getRange('C2:C500').setDataValidation(ruleVehType);

      const ruleLogType = SpreadsheetApp.newDataValidation()
        .requireValueInList(['BBM', 'CAS_LISTRIK', 'BATTERY_RENT', 'SERVIS_OLI', 'SPAREPART'], true)
        .build();
      sheetVeh.getRange('E2:E500').setDataValidation(ruleLogType);

      // Auto resize columns for readability
      [sheetConfig, sheetCat, sheetTrx, sheetEnv, sheetSf, sheetVeh].forEach(sh => {
        const lastCol = sh.getLastColumn();
        if (lastCol > 0) {
          sh.autoResizeColumns(1, lastCol);
        }
      });

      SpreadsheetApp.flush();
      return { success: true, message: 'Database FinKeluarga berhasil diinisialisasi dengan 6 tab.' };
    } finally {
      lock.releaseLock();
    }
  }
};
