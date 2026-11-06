---
name: finkeluarga-core
description: Autonomous maintenance, refactoring, feature expansion, and CI/CD verification for the FinKeluarga Google Apps Script financial management architecture.
---

# FinKeluarga Core Agent Skill

## Identity: `gemini-cli-finkeluarga-specialist`
**Engine Support:** Gemini CLI 3.8 Flash High  
**Operational Scope:** Autonomous Maintenance, Refactoring, Feature Expansion, & CI/CD Verification for the FinKeluarga Architecture.

## 1. Domain Context & Baseline
* **Fixed Monthly Income:** Rp17.000.000 / month.
* **Family Composition:** 5 Members (Husband, Wife, 3 Children: Fresh Grad, Sem 5 College, 3rd Grade SMP).
* **Residence:** Vila Mutiara Cinere, Limo, Depok (Status: Paid off / Lunas).
* **Commuter Route:** Limo – Jakarta (46 km/day PP), EV Motorcycle.
* **Three-Phase Domino Effect Model:**
  * **Phase 1 (Active — Nov 2026 s/d Jun 2027):** SMA Anak 3 (Rp1.500.000), UKT Anak 2 (Rp1.000.000), Hari Tua awal (Rp900.000).
  * **Phase 2 (Jul 2027 s/d Jun 2028):** Anak 1 mandiri (+Rp400k), Uang Pangkal SMA selesai (+Rp1.5jt) -> Surplus +Rp1.9jt dialihkan ke Kuliah Anak 3 (Rp1.000.000) dan Hari Tua (+Rp900.000 -> total Rp1.800.000).
  * **Phase 3 (Mulai Jul 2028 dst.):** Anak 2 lulus kuliah (+Rp2.5jt) -> Total dana bebas +Rp4.4jt dialihkan ke Investasi Hari Tua (Rp4.300.000 / 25,3% gaji).

## 2. Inviolable Architectural Guardrails
1. **Zero External Framework / CDN:** Pure Vanilla ES6 and CSS Custom Properties. Never inject React, Vue, jQuery, Tailwind CDN, or external fonts/charts.
2. **Modular Client-Side HTML Structure:** `Stylesheet.html` and `Javascript.html` included into `index.html` via `<?!= include(...) ?>`.
3. **Concurrency Protection:** All mutations on `TRX_LEDGER`, `WEEKLY_ENVELOPES`, and `SINKING_FUNDS` MUST be wrapped in `LockService.getScriptLock()` with a minimum timeout of 10-15 seconds.
4. **Batch Spreadsheet Operations:** Avoid per-row cell operations. Use `getDataRange().getValues()` and batch `setValues()`.
5. **Clasp Folder Compliance:** Executable GAS files MUST reside in `src/`. All non-GAS files ignored via `.claspignore`.
6. **Financial Logic Preservation:** Weekly envelope limits (Kitchen/Dapur Rp1.050.000/week, Husband Office/Kantor Rp300.000/week) MUST NOT be altered without explicit user instruction.
7. **Pure Numeric Database Values:** Nominal amounts stored as pure numbers (e.g., `1500000`). Currency formatting is presentation-only.
8. **Host Environment Independence (Zero Local Tooling):** Do NOT install Node.js, npm, or `@google/clasp` on the local host. All testing (Jest) and clasp deployment runs exclusively in GitHub Actions runner (`ubuntu-latest`).
9. **Artifact Persistence in Project Directory:** All project artifacts (implementation plan, walkthroughs, specs) MUST be stored in `/var/www/gas/personal_finance/`.

## 3. Mandatory Git Commit Protocol
Every completed task MUST result in a Git commit.

Before committing:

```bash
git status
git diff
```

Verify:

* no secrets
* no `.env`
* no unrelated files

Commit messages should follow:

```text
feat: ...
fix: ...
test: ...
docs: ...
refactor: ...
chore: ...
```

Example:

```text
feat: configure auth and sales database connections
feat: add read-only authentication model
feat: configure sanctum token storage on sales database
feat: add login endpoint
test: add sanctum authentication tests
docs: document multi database architecture
```
