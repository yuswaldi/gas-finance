/**
 * FinKeluarga — Global Configuration & Domain Constants
 * File: src/Config.js
 */

const CONFIG = {
  APP_NAME: 'FinKeluarga',
  VERSION: '2.0.0',
  MONTHLY_INCOME: 17000000,

  // Fallback ID if running as standalone script; if bound, getActiveSpreadsheet() is used.
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',

  // Tab / Sheet Names
  SHEETS: {
    SYS_CONFIG: 'SYS_CONFIG',
    MST_CATEGORIES: 'MST_CATEGORIES',
    TRX_LEDGER: 'TRX_LEDGER',
    WEEKLY_ENVELOPES: 'WEEKLY_ENVELOPES',
    SINKING_FUNDS: 'SINKING_FUNDS',
    VEHICLE_LOG: 'VEHICLE_LOG'
  },

  // Cache & Concurrency Parameters
  CACHE: {
    BOOTSTRAP_KEY: 'BOOTSTRAP_PAYLOAD',
    TTL_SECONDS: 600 // 10 minutes
  },
  LOCK: {
    TIMEOUT_MS: 15000 // 15 seconds waitLock
  },

  // Financial Domino Phases
  PHASES: {
    PHASE_1: {
      key: 'PHASE_1',
      name: 'Fase 1: Transisi & SMA Anak 3',
      period: 'Nov 2026 s/d Jun 2027',
      description: 'Fokus tabungan masuk SMA Anak 3 (Rp1.5jt/bln), cadangan UKT Anak 2 (Rp1jt/bln), & Hari Tua awal (Rp900k/bln).'
    },
    PHASE_2: {
      key: 'PHASE_2',
      name: 'Fase 2: Tabungan Kuliah & Peningkatan Hari Tua',
      period: 'Jul 2027 s/d Jun 2028',
      description: 'Anak 1 mandiri & SMA lunas. Surplus Rp1.9jt/bln dialihkan ke Tabungan Kuliah Anak 3 (Rp1jt) & Hari Tua (Rp1.8jt).'
    },
    PHASE_3: {
      key: 'PHASE_3',
      name: 'Fase 3: Kemandirian Kuliah & Akselerasi Pensiun',
      period: 'Mulai Jul 2028 dst.',
      description: 'Anak 2 lulus kuliah. Total surplus Rp4.4jt/bln dialihkan ke Investasi Hari Tua mencapai Rp4.3jt/bln (25.3% gaji).'
    }
  },

  // Weekly Envelope Budgets
  WEEKLY_LIMITS: {
    DAPUR: 1050000,  // CAT-A01: Belanja Dapur & Sembako (Rp1.050.000 / minggu)
    KANTOR: 300000   // CAT-B01: Operasional Kerja Suami (Rp300.000 / minggu)
  },

  // Master Categories Seeding Data (18 Sub-Categories totaling Rp17.000.000)
  CATEGORIES_SEED: [
    // Group A: Rumah Tangga (Cinere)
    {
      id: 'CAT-A01',
      group_code: 'A',
      group_name: 'A. Rumah Tangga',
      sub_category: 'Belanja Dapur & Sembako',
      is_weekly: true,
      weekly_limit: 1050000,
      phase_1: 4200000,
      phase_2: 4200000,
      phase_3: 4200000
    },
    {
      id: 'CAT-A02',
      group_code: 'A',
      group_name: 'A. Rumah Tangga',
      sub_category: 'Listrik & Air PDAM Cinere',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 800000,
      phase_2: 800000,
      phase_3: 800000
    },
    {
      id: 'CAT-A03',
      group_code: 'A',
      group_name: 'A. Rumah Tangga',
      sub_category: 'Pemeliharaan Rumah Cinere & PBB',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 400000,
      phase_2: 400000,
      phase_3: 400000
    },
    {
      id: 'CAT-A04',
      group_code: 'A',
      group_name: 'A. Rumah Tangga',
      sub_category: 'Internet Rumah & Pulsa Keluarga',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 450000,
      phase_2: 450000,
      phase_3: 450000
    },

    // Group B: Komuter & Operasional Kerja (Cinere-Jakarta)
    {
      id: 'CAT-B01',
      group_code: 'B',
      group_name: 'B. Komuter & Kantor',
      sub_category: 'Operasional Kerja Suami (Amplop Kantor)',
      is_weekly: true,
      weekly_limit: 300000,
      phase_1: 1200000,
      phase_2: 1200000,
      phase_3: 1200000
    },
    {
      id: 'CAT-B02',
      group_code: 'B',
      group_name: 'B. Komuter & Kantor',
      sub_category: 'Energi EV Komuter (Sewa Baterai & Cas)',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 275000,
      phase_2: 275000,
      phase_3: 275000
    },
    {
      id: 'CAT-B03',
      group_code: 'B',
      group_name: 'B. Komuter & Kantor',
      sub_category: 'Servis EV, Cuci & Parkir Komuter',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 175000,
      phase_2: 175000,
      phase_3: 175000
    },

    // Group C: Pendidikan & Kebutuhan Anak
    {
      id: 'CAT-C01',
      group_code: 'C',
      group_name: 'C. Pendidikan & Anak',
      sub_category: 'Anak 1 - Subsidi Transisi Fresh Graduate',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 400000,
      phase_2: 0,
      phase_3: 0
    },
    {
      id: 'CAT-C02',
      group_code: 'C',
      group_name: 'C. Pendidikan & Anak',
      sub_category: 'Anak 2 - Uang Saku & Transport Kuliah',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 1500000,
      phase_2: 1500000,
      phase_3: 0
    },
    {
      id: 'CAT-C03',
      group_code: 'C',
      group_name: 'C. Pendidikan & Anak',
      sub_category: 'Anak 3 - SPP Sekolah & Les',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 1250000,
      phase_2: 1250000,
      phase_3: 1250000
    },
    {
      id: 'CAT-C04',
      group_code: 'C',
      group_name: 'C. Pendidikan & Anak',
      sub_category: 'BPJS Kesehatan Mandiri 5 Jiwa',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 500000,
      phase_2: 500000,
      phase_3: 500000
    },

    // Group D: Tabungan & Investasi
    {
      id: 'CAT-D01',
      group_code: 'D',
      group_name: 'D. Tabungan & Investasi',
      sub_category: 'Sinking Fund - Masuk SMA Anak 3',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 1500000,
      phase_2: 0,
      phase_3: 0
    },
    {
      id: 'CAT-D02',
      group_code: 'D',
      group_name: 'D. Tabungan & Investasi',
      sub_category: 'Sinking Fund - Cadangan UKT Kuliah Anak 2',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 1000000,
      phase_2: 1000000,
      phase_3: 0
    },
    {
      id: 'CAT-D03',
      group_code: 'D',
      group_name: 'D. Tabungan & Investasi',
      sub_category: 'Sinking Fund - Tabungan Kuliah Anak 3',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 0,
      phase_2: 1000000,
      phase_3: 1000000
    },
    {
      id: 'CAT-D04',
      group_code: 'D',
      group_name: 'D. Tabungan & Investasi',
      sub_category: 'Investasi Dana Hari Tua',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 900000,
      phase_2: 1800000,
      phase_3: 4300000
    },
    {
      id: 'CAT-D05',
      group_code: 'D',
      group_name: 'D. Tabungan & Investasi',
      sub_category: 'Dana Darurat Keluarga',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 750000,
      phase_2: 750000,
      phase_3: 750000
    },

    // Group E: Sosial & Sedekah
    {
      id: 'CAT-E01',
      group_code: 'E',
      group_name: 'E. Sosial & Sedekah',
      sub_category: 'Zakat, Infaq & Sedekah Subuh',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 1500000,
      phase_2: 1500000,
      phase_3: 1500000
    },
    {
      id: 'CAT-E02',
      group_code: 'E',
      group_name: 'E. Sosial & Sedekah',
      sub_category: 'Kas RT Lingkungan Cinere & Sosial',
      is_weekly: false,
      weekly_limit: 0,
      phase_1: 200000,
      phase_2: 200000,
      phase_3: 200000
    }
  ],

  // Initial Sinking Funds Master Seed
  SINKING_FUNDS_SEED: [
    {
      id: 'SF-01',
      name: 'Dana Masuk SMA Anak 3',
      target_amount: 12000000,
      current_balance: 3000000,
      monthly_contrib: 1500000,
      target_date: '2027-06-30',
      account_info: 'Bank Jago - Kantong SMA Anak 3',
      status: 'ACTIVE'
    },
    {
      id: 'SF-02',
      name: 'Cadangan UKT Kuliah Anak 2',
      target_amount: 8000000,
      current_balance: 2000000,
      monthly_contrib: 1000000,
      target_date: '2028-06-30',
      account_info: 'Bank BCA - Rek Cadangan UKT',
      status: 'ACTIVE'
    },
    {
      id: 'SF-03',
      name: 'Tabungan Kuliah Anak 3',
      target_amount: 25000000,
      current_balance: 0,
      monthly_contrib: 1000000,
      target_date: '2030-07-31',
      account_info: 'Bibit - Reksa Dana Pasar Uang',
      status: 'PAUSED' // Akan aktif otomatis di Fase 2
    },
    {
      id: 'SF-04',
      name: 'Investasi Dana Hari Tua',
      target_amount: 150000000,
      current_balance: 15000000,
      monthly_contrib: 900000,
      target_date: '2036-12-31',
      account_info: 'Sukuk Ritel / SBN & Reksadana Saham',
      status: 'ACTIVE'
    },
    {
      id: 'SF-05',
      name: 'Dana Darurat Likuid (6 Bulan Ops)',
      target_amount: 50000000,
      current_balance: 18500000,
      monthly_contrib: 750000,
      target_date: '2028-12-31',
      account_info: 'Bank Mandiri - Rekening Darurat',
      status: 'ACTIVE'
    }
  ]
};
