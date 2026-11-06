/**
 * Unit Tests for FinKeluarga Financial Calculations & Domain Engine
 * File: tests/finance.test.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const {
  MockSpreadsheetApp,
  MockLockService,
  MockCacheService,
  mockSpreadsheetInstance
} = require('./mockGoogleAppsScript');

// Setup VM sandbox with GAS globals and load backend files
const sandbox = {
  SpreadsheetApp: MockSpreadsheetApp,
  LockService: MockLockService,
  CacheService: MockCacheService,
  console: console,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  JSON: JSON
};

vm.createContext(sandbox);

function loadFile(relPath) {
  const code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  vm.runInContext(code, sandbox);
}

// Load src files in proper order
loadFile('src/Config.js');
loadFile('src/Database.js');
loadFile('src/FinanceService.js');

describe('FinKeluarga Financial Domain & Architecture Tests', () => {

  test('1. Total 18 kategori harus tepat Rp17.000.000 di setiap Fase (Fase 1, 2, 3)', () => {
    const categories = sandbox.CONFIG.CATEGORIES_SEED;
    expect(categories.length).toBe(18);

    let sumPhase1 = 0;
    let sumPhase2 = 0;
    let sumPhase3 = 0;

    categories.forEach(cat => {
      sumPhase1 += cat.phase_1;
      sumPhase2 += cat.phase_2;
      sumPhase3 += cat.phase_3;
    });

    expect(sumPhase1).toBe(17000000);
    expect(sumPhase2).toBe(17000000);
    expect(sumPhase3).toBe(17000000);
  });

  test('2. Preservasi batas kuota amplop mingguan (Dapur Rp1.050.000, Kantor Rp300.000)', () => {
    expect(sandbox.CONFIG.WEEKLY_LIMITS.DAPUR).toBe(1050000);
    expect(sandbox.CONFIG.WEEKLY_LIMITS.KANTOR).toBe(300000);

    const catDapur = sandbox.CONFIG.CATEGORIES_SEED.find(c => c.id === 'CAT-A01');
    expect(catDapur.is_weekly).toBe(true);
    expect(catDapur.weekly_limit).toBe(1050000);

    const catKantor = sandbox.CONFIG.CATEGORIES_SEED.find(c => c.id === 'CAT-B01');
    expect(catKantor.is_weekly).toBe(true);
    expect(catKantor.weekly_limit).toBe(300000);
  });

  test('3. Three-Phase Domino Effect budget shifts', () => {
    const cats = sandbox.CONFIG.CATEGORIES_SEED;
    const catAnak1 = cats.find(c => c.id === 'CAT-C01');
    const catSmaAnak3 = cats.find(c => c.id === 'CAT-D01');
    const catKuliahAnak3 = cats.find(c => c.id === 'CAT-D03');
    const catHariTua = cats.find(c => c.id === 'CAT-D04');
    const catAnak2Saku = cats.find(c => c.id === 'CAT-C02');
    const catUktAnak2 = cats.find(c => c.id === 'CAT-D02');

    // Fase 1 Check
    expect(catAnak1.phase_1).toBe(400000);
    expect(catSmaAnak3.phase_1).toBe(1500000);
    expect(catKuliahAnak3.phase_1).toBe(0);
    expect(catHariTua.phase_1).toBe(900000);

    // Fase 2 Shift: Anak 1 bekerja (+400k) & SMA lunas (+1.5jt) => +1.9jt surplus
    expect(catAnak1.phase_2).toBe(0);
    expect(catSmaAnak3.phase_2).toBe(0);
    expect(catKuliahAnak3.phase_2).toBe(1000000);
    expect(catHariTua.phase_2).toBe(1800000); // 900k + 900k surplus

    // Fase 3 Shift: Anak 2 lulus kuliah (+1.5jt saku + 1jt UKT => +2.5jt surplus)
    expect(catAnak2Saku.phase_3).toBe(0);
    expect(catUktAnak2.phase_3).toBe(0);
    expect(catHariTua.phase_3).toBe(4300000); // 1.8jt + 2.5jt = 4.3jt
    // 4.300.000 / 17.000.000 = ~25.29% (~25.3%)
    const pctGajiHariTua = (catHariTua.phase_3 / 17000000) * 100;
    expect(pctGajiHariTua).toBeCloseTo(25.3, 1);
  });

  test('4. Formula Analitik Efisiensi Komuter Cinere-Jakarta (46 km/hari)', () => {
    const monthlyKm = 46 * 22; // 1.012 km
    expect(monthlyKm).toBe(1012);

    const bbmPcx = (monthlyKm / 40) * 14000; // ~354.200
    const oliPcx = 60000;
    const totalPcxCost = bbmPcx + oliPcx; // 414.200
    expect(totalPcxCost).toBe(414200);

    const evCost = 200000 + 75000; // Sewa baterai + cas rumah = 275.000
    const monthlySavings = totalPcxCost - evCost;
    expect(monthlySavings).toBe(139200);
  });

  test('5. ISO-8601 Week Index Calculator', () => {
    const testDate = new Date('2026-11-06T12:00:00Z');
    const res = sandbox.FinanceService.getIsoWeekInfo(testDate);
    expect(res.weekIndex).toMatch(/^\d{4}-W\d{2}$/);
    expect(res.periodYm).toBe('2026-11');
  });

  test('6. Inisialisasi Database Sekali Klik (Database.setupDatabase)', () => {
    const setupRes = sandbox.Database.setupDatabase();
    expect(setupRes.success).toBe(true);

    // Verify 6 tabs created
    const expectedSheets = [
      'SYS_CONFIG',
      'MST_CATEGORIES',
      'TRX_LEDGER',
      'WEEKLY_ENVELOPES',
      'SINKING_FUNDS',
      'VEHICLE_LOG'
    ];

    expectedSheets.forEach(sName => {
      const sh = mockSpreadsheetInstance.getSheetByName(sName);
      expect(sh).not.toBeNull();
      expect(sh.getLastRow()).toBeGreaterThan(0);
    });

    // Verify SYS_CONFIG initial active phase is PHASE_1
    const activePhase = sandbox.FinanceService.getActivePhaseKey();
    expect(activePhase).toBe('PHASE_1');
  });

  test('7. Mutasi Transaksi dengan Concurrency Lock (createTransaction)', () => {
    const trxPayload = {
      date: '2026-11-06',
      trxType: 'EXPENSE',
      categoryId: 'CAT-A01',
      amount: 150000,
      actor: 'Istri',
      sourceWallet: 'Rekening Operasional Dapur',
      notes: 'Belanja sayur dan beras'
    };

    const res = sandbox.FinanceService.createTransaction(trxPayload);
    expect(res.success).toBe(true);
    expect(res.trxId).toMatch(/^TRX-/);

    const trxSheet = mockSpreadsheetInstance.getSheetByName('TRX_LEDGER');
    expect(trxSheet.getLastRow()).toBeGreaterThan(1);
  });

  test('8. Switch Phase Dinamis (Fase 1 ke Fase 2)', () => {
    const switchRes = sandbox.FinanceService.switchPhase('PHASE_2');
    expect(switchRes.success).toBe(true);
    expect(switchRes.activePhase).toBe('PHASE_2');

    const newActive = sandbox.FinanceService.getActivePhaseKey();
    expect(newActive).toBe('PHASE_2');

    const sfSheet = mockSpreadsheetInstance.getSheetByName('SINKING_FUNDS');
    const sfRows = sfSheet.getDataRange().getValues();
    // In Phase 2: SF-01 (SMA) should be COMPLETED, SF-03 (Kuliah) ACTIVE, SF-04 setoran 1.800.000
    const rowSf01 = sfRows.find(r => r[0] === 'SF-01');
    expect(rowSf01[7]).toBe('COMPLETED');

    const rowSf03 = sfRows.find(r => r[0] === 'SF-03');
    expect(rowSf03[7]).toBe('ACTIVE');

    const rowSf04 = sfRows.find(r => r[0] === 'SF-04');
    expect(rowSf04[4]).toBe(1800000);
  });

});
