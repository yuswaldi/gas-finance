/**
 * In-Memory Mock Engine for Google Apps Script Global Services
 * Used exclusively for Jest unit testing in GitHub Actions runner.
 * File: tests/mockGoogleAppsScript.js
 */

class MockRange {
  constructor(sheet, row, col, numRows = 1, numCols = 1) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }

  getValues() {
    const result = [];
    for (let r = 0; r < this.numRows; r++) {
      const rowArr = [];
      for (let c = 0; c < this.numCols; c++) {
        const val = this.sheet.getCell(this.row + r, this.col + c);
        rowArr.push(val);
      }
      result.push(rowArr);
    }
    return result;
  }

  setValues(values) {
    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        this.sheet.setCell(this.row + r, this.col + c, values[r][c]);
      }
    }
    return this;
  }

  setValue(val) {
    return this.setValues([[val]]);
  }

  setBackground() { return this; }
  setFontColor() { return this; }
  setFontWeight() { return this; }
  setHorizontalAlignment() { return this; }
  setDataValidation() { return this; }
}

class MockSheet {
  constructor(name) {
    this.name = name;
    this.grid = []; // 0-indexed [row][col]
    this.frozenRows = 0;
  }

  getLastRow() {
    return this.grid.length;
  }

  getLastColumn() {
    let max = 0;
    this.grid.forEach(row => {
      if (row && row.length > max) max = row.length;
    });
    return max;
  }

  getCell(row1, col1) {
    const r = row1 - 1;
    const c = col1 - 1;
    if (!this.grid[r]) return '';
    return this.grid[r][c] !== undefined ? this.grid[r][c] : '';
  }

  setCell(row1, col1, value) {
    const r = row1 - 1;
    const c = col1 - 1;
    while (this.grid.length <= r) {
      this.grid.push([]);
    }
    this.grid[r][c] = value;
  }

  getRange(row, col, numRows = 1, numCols = 1) {
    if (typeof row === 'string') {
      // e.g. 'E2:E1000'
      return new MockRange(this, 2, 1, 10, 1);
    }
    return new MockRange(this, row, col, numRows, numCols);
  }

  getDataRange() {
    return new MockRange(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn()));
  }

  appendRow(rowArr) {
    this.grid.push([...rowArr]);
  }

  setFrozenRows(n) {
    this.frozenRows = n;
  }

  autoResizeColumns() {}
}

class MockSpreadsheet {
  constructor() {
    this.sheets = {};
  }

  getSheetByName(name) {
    return this.sheets[name] || null;
  }

  insertSheet(name) {
    const s = new MockSheet(name);
    this.sheets[name] = s;
    return s;
  }
}

const mockSpreadsheetInstance = new MockSpreadsheet();

const MockSpreadsheetApp = {
  getActiveSpreadsheet() {
    return mockSpreadsheetInstance;
  },
  openById(id) {
    return mockSpreadsheetInstance;
  },
  flush() {},
  newDataValidation() {
    return {
      requireValueInList() { return this; },
      build() { return {}; }
    };
  }
};

const MockLock = {
  waitLock(ms) { return true; },
  releaseLock() { return true; }
};

const MockLockService = {
  getScriptLock() {
    return MockLock;
  }
};

class MockCache {
  constructor() {
    this.store = {};
  }
  get(key) {
    return this.store[key] || null;
  }
  put(key, val, ttl) {
    this.store[key] = val;
  }
  remove(key) {
    delete this.store[key];
  }
}

const mockCacheInstance = new MockCache();

const MockCacheService = {
  getUserCache() {
    return mockCacheInstance;
  }
};

module.exports = {
  MockSpreadsheetApp,
  MockLockService,
  MockCacheService,
  mockSpreadsheetInstance,
  mockCacheInstance
};
