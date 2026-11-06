/**
 * FinKeluarga — Business Logic & Financial Service Engine
 * File: src/FinanceService.js
 */

const FinanceService = {
  /**
   * Helper kalkulasi ISO-8601 Week Index (Format: YYYY-Www, misal: 2026-W45)
   */
  getIsoWeekInfo(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    // Normalisasi ke jam 12:00 UTC untuk menghindari isu DST
    const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNr = (target.getUTCDay() + 6) % 7; // Senin = 0, Minggu = 6
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.getTime();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
    const year = new Date(firstThursday).getUTCFullYear();
    const weekStr = weekNumber < 10 ? '0' + weekNumber : '' + weekNumber;

    const ymYear = d.getFullYear();
    const ymMonth = d.getMonth() + 1;
    const periodYm = `${ymYear}-${ymMonth < 10 ? '0' + ymMonth : ymMonth}`;

    return {
      weekIndex: `${year}-W${weekStr}`,
      periodYm: periodYm,
      dateIso: d.toISOString().split('T')[0]
    };
  },

  /**
   * Generate ID unik berbasis timestamp dengan resolusi milidetik dan random pad
   */
  generateId(prefix) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${prefix}-${y}${m}${d}-${hh}${mm}${ss}-${ms}`;
  },

  /**
   * Format angka nominal Rupiah murni ke string representasi IDR
   */
  formatRupiah(amount) {
    const val = Number(amount) || 0;
    return 'Rp' + val.toLocaleString('id-ID');
  },

  /**
   * Mengambil fase finansial aktif saat ini dari SYS_CONFIG
   */
  getActivePhaseKey() {
    const rows = Database.readAll(CONFIG.SHEETS.SYS_CONFIG);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === 'ACTIVE_PHASE') {
        return rows[i][1] || 'PHASE_1';
      }
    }
    return 'PHASE_1';
  },

  /**
   * Beralih ke fase finansial baru (Fase 1, 2, atau 3) dan menyesuaikan status sinking funds
   */
  switchPhase(newPhaseKey) {
    if (!CONFIG.PHASES[newPhaseKey]) {
      throw new Error(`Fase finansial tidak valid: ${newPhaseKey}`);
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(CONFIG.LOCK.TIMEOUT_MS);
      const sheet = Database.getSheet(CONFIG.SHEETS.SYS_CONFIG, true);
      const data = sheet.getDataRange().getValues();
      let found = false;
      const now = new Date();

      for (let r = 1; r < data.length; r++) {
        if (data[r][0] === 'ACTIVE_PHASE') {
          sheet.getRange(r + 1, 2, 1, 2).setValues([[newPhaseKey, now]]);
          found = true;
          break;
        }
      }

      if (!found) {
        sheet.appendRow(['ACTIVE_PHASE', newPhaseKey, now]);
      }

      // Penyesuaian status Sinking Funds otomatis saat transisi fase
      const sfSheet = Database.getSheet(CONFIG.SHEETS.SINKING_FUNDS, false);
      if (sfSheet && sfSheet.getLastRow() > 1) {
        const sfData = sfSheet.getDataRange().getValues();
        for (let r = 1; r < sfData.length; r++) {
          const fundId = sfData[r][0];
          if (newPhaseKey === 'PHASE_2') {
            // SF-01 (SMA Anak 3) selesai
            if (fundId === 'SF-01') sfSheet.getRange(r + 1, 8).setValue('COMPLETED');
            // SF-03 (Kuliah Anak 3) aktif
            if (fundId === 'SF-03') sfSheet.getRange(r + 1, 8).setValue('ACTIVE');
            // SF-04 (Hari Tua) setoran naik ke Rp1.800.000
            if (fundId === 'SF-04') sfSheet.getRange(r + 1, 5).setValue(1800000);
          } else if (newPhaseKey === 'PHASE_3') {
            if (fundId === 'SF-01') sfSheet.getRange(r + 1, 8).setValue('COMPLETED');
            // SF-02 (UKT Anak 2) selesai
            if (fundId === 'SF-02') sfSheet.getRange(r + 1, 8).setValue('COMPLETED');
            if (fundId === 'SF-03') sfSheet.getRange(r + 1, 8).setValue('ACTIVE');
            // SF-04 (Hari Tua) setoran naik ke Rp4.300.000
            if (fundId === 'SF-04') sfSheet.getRange(r + 1, 5).setValue(4300000);
          } else if (newPhaseKey === 'PHASE_1') {
            if (fundId === 'SF-01') sfSheet.getRange(r + 1, 8).setValue('ACTIVE');
            if (fundId === 'SF-02') sfSheet.getRange(r + 1, 8).setValue('ACTIVE');
            if (fundId === 'SF-03') sfSheet.getRange(r + 1, 8).setValue('PAUSED');
            if (fundId === 'SF-04') sfSheet.getRange(r + 1, 5).setValue(900000);
          }
        }
      }

      // Bersihkan cache agar payload UI memuat perubahan seketika
      this.clearCache();
      return { success: true, activePhase: newPhaseKey };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Menghapus cache bootstrap di memori
   */
  clearCache() {
    try {
      const cache = CacheService.getUserCache();
      if (cache) {
        cache.remove(CONFIG.CACHE.BOOTSTRAP_KEY);
      }
    } catch (e) {
      // Abaikan jika cache tidak tersedia pada konteks tertentu
    }
  },

  /**
   * Mengambil snapshot komprehensif data sistem untuk Web App (1 single roundtrip)
   */
  getBootstrapData() {
    // 1. Cek UserCache terlebih dahulu
    try {
      const cache = CacheService.getUserCache();
      if (cache) {
        const cachedPayload = cache.get(CONFIG.CACHE.BOOTSTRAP_KEY);
        if (cachedPayload) {
          return JSON.parse(cachedPayload);
        }
      }
    } catch (e) {
      // Lanjutkan membaca langsung jika cache error
    }

    const activePhaseKey = this.getActivePhaseKey();
    const activePhaseInfo = CONFIG.PHASES[activePhaseKey] || CONFIG.PHASES.PHASE_1;
    const nowInfo = this.getIsoWeekInfo();

    // 2. Baca Master Kategori
    const catRows = Database.readAll(CONFIG.SHEETS.MST_CATEGORIES);
    const categories = [];
    const categoryMap = {};

    catRows.forEach(r => {
      const catId = r[0];
      const isWeekly = Boolean(r[4]);
      const weeklyLimit = Number(r[5]) || 0;
      let monthlyBudget = 0;
      if (activePhaseKey === 'PHASE_1') monthlyBudget = Number(r[6]) || 0;
      else if (activePhaseKey === 'PHASE_2') monthlyBudget = Number(r[7]) || 0;
      else if (activePhaseKey === 'PHASE_3') monthlyBudget = Number(r[8]) || 0;

      const catObj = {
        id: catId,
        groupCode: r[1],
        groupName: r[2],
        subCategory: r[3],
        isWeekly: isWeekly,
        weeklyLimit: weeklyLimit,
        monthlyBudget: monthlyBudget
      };
      categories.push(catObj);
      categoryMap[catId] = catObj;
    });

    // 3. Baca Transaksi Ledger
    const trxRows = Database.readAll(CONFIG.SHEETS.TRX_LEDGER);
    let monthTotalSpent = 0;
    let monthTotalIncome = 0;
    const currentWeekSpentMap = {};

    // Inisialisasi weekly categories spent = 0
    categories.filter(c => c.isWeekly).forEach(c => {
      currentWeekSpentMap[c.id] = 0;
    });

    const recentTransactions = [];

    // Iterasi dari transaksi paling akhir (terbaru)
    for (let i = trxRows.length - 1; i >= 0; i--) {
      const row = trxRows[i];
      const trxId = row[0];
      const rawDate = row[1];
      const periodYm = row[2];
      const weekIndex = row[3];
      const trxType = row[4];
      const catId = row[5];
      const amount = Number(row[6]) || 0;
      const actor = row[7];
      const wallet = row[8];
      const notes = row[9];
      const createdAt = row[10];

      // Agregasi bulan berjalan
      if (periodYm === nowInfo.periodYm) {
        if (trxType === 'EXPENSE') monthTotalSpent += amount;
        else if (trxType === 'INCOME') monthTotalIncome += amount;
      }

      // Agregasi amplop minggu berjalan
      if (weekIndex === nowInfo.weekIndex && trxType === 'EXPENSE' && currentWeekSpentMap[catId] !== undefined) {
        currentWeekSpentMap[catId] += amount;
      }

      // Ambil 15 transaksi terbaru untuk feed aktivitas
      if (recentTransactions.length < 15) {
        let dateStr = '';
        if (rawDate instanceof Date) {
          dateStr = rawDate.toISOString().split('T')[0];
        } else {
          dateStr = String(rawDate).split('T')[0];
        }

        recentTransactions.push({
          id: trxId,
          date: dateStr,
          periodYm: periodYm,
          weekIndex: weekIndex,
          type: trxType,
          categoryId: catId,
          categoryName: categoryMap[catId] ? categoryMap[catId].subCategory : 'Lain-lain',
          amount: amount,
          actor: actor,
          wallet: wallet,
          notes: notes,
          createdAt: createdAt
        });
      }
    }

    // 4. Kalkulasi Status Amplop Mingguan (Dapur & Kantor)
    const envelopes = [];
    categories.filter(c => c.isWeekly).forEach(c => {
      const spent = currentWeekSpentMap[c.id] || 0;
      const quota = c.weeklyLimit;
      const remaining = Math.max(0, quota - spent);
      const percentage = quota > 0 ? Math.min(100, Math.round((spent / quota) * 100)) : 0;

      let statusColor = 'ok'; // < 75%
      if (percentage >= 90) statusColor = 'alert';
      else if (percentage >= 75) statusColor = 'warn';

      envelopes.push({
        categoryId: c.id,
        categoryName: c.subCategory,
        weekIndex: nowInfo.weekIndex,
        quotaAmount: quota,
        spentAmount: spent,
        remainingAmount: remaining,
        percentage: percentage,
        statusColor: statusColor
      });
    });

    // 5. Baca Sinking Funds
    const sfRows = Database.readAll(CONFIG.SHEETS.SINKING_FUNDS);
    const sinkingFunds = sfRows.map(r => {
      const target = Number(r[2]) || 0;
      const current = Number(r[3]) || 0;
      const monthly = Number(r[4]) || 0;
      const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      let targetDateStr = '';
      if (r[5] instanceof Date) {
        targetDateStr = r[5].toISOString().split('T')[0];
      } else {
        targetDateStr = String(r[5]).split('T')[0];
      }

      return {
        id: r[0],
        name: r[1],
        targetAmount: target,
        currentBalance: current,
        monthlyContrib: monthly,
        targetDate: targetDateStr,
        accountInfo: r[6],
        status: r[7],
        percentage: pct
      };
    });

    // 6. Baca Vehicle Log & Komuter Analytics
    const vehRows = Database.readAll(CONFIG.SHEETS.VEHICLE_LOG);
    let evTotalMonthlyCost = 0;
    const recentVehLogs = [];

    for (let i = vehRows.length - 1; i >= 0; i--) {
      const r = vehRows[i];
      const rawDate = r[1];
      const vType = r[2];
      const odo = Number(r[3]) || 0;
      const lType = r[4];
      const cost = Number(r[5]) || 0;
      const notes = r[6];

      let dStr = '';
      if (rawDate instanceof Date) dStr = rawDate.toISOString().split('T')[0];
      else dStr = String(rawDate).split('T')[0];

      if (dStr.startsWith(nowInfo.periodYm) && vType === 'EV_MOTOR') {
        evTotalMonthlyCost += cost;
      }

      if (recentVehLogs.length < 5) {
        recentVehLogs.push({
          id: r[0],
          date: dStr,
          vehicleType: vType,
          odometer: odo,
          logType: lType,
          cost: cost,
          notes: notes
        });
      }
    }

    // Baseline komuter Cinere-Jakarta:
    // 46 km/hari * 22 hari = ~1012 km/bulan
    // PCX 40 km/L * Rp14.000 + Oli Rp60.000 = ~Rp414.200/bulan
    const iceBaselineMonthly = 414200;
    const currentEvCost = evTotalMonthlyCost > 0 ? evTotalMonthlyCost : 275000;
    const estimatedMonthlySavings = Math.max(0, iceBaselineMonthly - currentEvCost);

    const payload = {
      appName: CONFIG.APP_NAME,
      version: CONFIG.VERSION,
      monthlyIncome: CONFIG.MONTHLY_INCOME,
      activePhase: activePhaseInfo,
      allPhases: CONFIG.PHASES,
      currentWeekIndex: nowInfo.weekIndex,
      currentPeriodYm: nowInfo.periodYm,
      monthTotalSpent: monthTotalSpent,
      monthTotalIncome: monthTotalIncome,
      envelopes: envelopes,
      categories: categories,
      sinkingFunds: sinkingFunds,
      recentTransactions: recentTransactions,
      vehicleAnalytics: {
        commuterRoute: 'Cinere (Limo) - Jakarta PP (46 km/hari)',
        monthlyKmEstimate: 1012,
        iceBaselineMonthly: iceBaselineMonthly,
        currentEvCost: currentEvCost,
        estimatedMonthlySavings: estimatedMonthlySavings,
        recentLogs: recentVehLogs
      }
    };

    // Simpan ke CacheService selama TTL 10 menit
    try {
      const cache = CacheService.getUserCache();
      if (cache) {
        cache.put(CONFIG.CACHE.BOOTSTRAP_KEY, JSON.stringify(payload), CONFIG.CACHE.TTL_SECONDS);
      }
    } catch (e) {
      // Abaikan error cache
    }

    return payload;
  },

  /**
   * Mencatat transaksi baru dengan validasi dan LockService concurrency protection
   */
  createTransaction(payload) {
    if (!payload) throw new Error('Data transaksi kosong.');
    const amount = Number(payload.amount);
    if (!amount || amount <= 0) throw new Error('Nominal transaksi harus lebih dari Rp0.');
    if (!payload.categoryId) throw new Error('Kategori wajib dipilih.');
    const actor = payload.actor || 'Istri';
    const trxType = payload.trxType || 'EXPENSE';

    const dateInput = payload.date ? new Date(payload.date) : new Date();
    const weekInfo = this.getIsoWeekInfo(dateInput);
    const trxId = this.generateId('TRX');
    const now = new Date();

    const rowData = [
      trxId,
      dateInput,
      weekInfo.periodYm,
      weekInfo.weekIndex,
      trxType,
      payload.categoryId,
      amount,
      actor,
      payload.sourceWallet || 'Rekening Operasional Dapur',
      payload.notes || '',
      now
    ];

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(CONFIG.LOCK.TIMEOUT_MS);
      // 1. Simpan ke TRX_LEDGER
      const trxSheet = Database.getSheet(CONFIG.SHEETS.TRX_LEDGER, true);
      trxSheet.appendRow(rowData);

      // 2. Jika tipe SINKING_TRANSFER, mutasikan saldo target di SINKING_FUNDS
      if (trxType === 'SINKING_TRANSFER' && payload.sinkingFundId) {
        const sfSheet = Database.getSheet(CONFIG.SHEETS.SINKING_FUNDS, false);
        if (sfSheet && sfSheet.getLastRow() > 1) {
          const sfData = sfSheet.getDataRange().getValues();
          for (let r = 1; r < sfData.length; r++) {
            if (sfData[r][0] === payload.sinkingFundId) {
              const currentBal = Number(sfData[r][3]) || 0;
              sfSheet.getRange(r + 1, 4).setValue(currentBal + amount);
              break;
            }
          }
        }
      }

      SpreadsheetApp.flush();
      // 3. Invalidasi Cache
      this.clearCache();

      return {
        success: true,
        trxId: trxId,
        message: 'Transaksi berhasil disimpan.'
      };
    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Mencatat log operasional dan servis kendaraan (komuter EV)
   */
  recordVehicleLog(payload) {
    if (!payload) throw new Error('Data log kendaraan kosong.');
    const cost = Number(payload.cost) || 0;
    const dateInput = payload.date ? new Date(payload.date) : new Date();
    const logId = this.generateId('VHC');

    const rowData = [
      logId,
      dateInput,
      payload.vehicleType || 'EV_MOTOR',
      Number(payload.odometer) || 0,
      payload.logType || 'BATTERY_RENT',
      cost,
      payload.notes || ''
    ];

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(CONFIG.LOCK.TIMEOUT_MS);
      const vehSheet = Database.getSheet(CONFIG.SHEETS.VEHICLE_LOG, true);
      vehSheet.appendRow(rowData);
      SpreadsheetApp.flush();
      this.clearCache();
      return { success: true, logId: logId, message: 'Log kendaraan berhasil dicatat.' };
    } finally {
      lock.releaseLock();
    }
  }
};
