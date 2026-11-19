
# QA Mart POS — Complete E2E & API Test Automation Suite


> **Take-Home Assessment:** POS - QA Engineer Skill Test  
> **Target Application:** QA Mart POS ([https://qa-assessment.holywings.id](https://qa-assessment.holywings.id))  
> **Official Specifications:** [API & Business Rules Documentation](https://qa-assessment.holywings.id/docs)  
> **Technology Stack:** Playwright (JavaScript), Page Object Model (POM), Custom Fixtures, Allure Reporting, Postman / Newman (v2.1 Collection), ExcelJS, python-docx

---

## 📑 Table of Contents

7. [Executive Summary & Test Results](#-executive-summary--test-results)
8. [Complete Deliverables Matrix](#-complete-deliverables-matrix)
9. [Project Directory Architecture](#-project-directory-architecture)
10. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
11. [Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
12. [How to Run the Automation Test Suite](#-how-to-run-the-automation-test-suite)
    - [A. Running Playwright Web UI Tests](#a-running-playwright-web-ui-tests)
    - [B. Generating & Viewing Allure HTML Report](#b-generating--viewing-allure-html-report)
    - [C. Viewing Playwright Native HTML Report](#c-viewing-playwright-native-html-report)
    - [D. Running Postman API Collection via Newman CLI](#d-running-postman-api-collection-via-newman-cli)
    - [E. Importing into Postman Desktop GUI](#e-importing-into-postman-desktop-gui)
    - [F. Regenerating Documentation & Evidence](#f-regenerating-documentation--evidence)
13. [Engineering Strategies & Best Practices](#-engineering-strategies--best-practices)
    - [1. Strategy for Parallel Execution](#1-strategy-for-parallel-execution)
    - [2. Strategy for Data Cleanup & State Isolation](#2-strategy-for-data-cleanup--state-isolation)
    - [3. Strategy for Timeouts & Auto-Waiting](#3-strategy-for-timeouts--auto-waiting)
    - [4. Strategy for Retries & Diagnostics](#4-strategy-for-retries--diagnostics)
    - [5. Strategy for Eliminating Flaky Tests](#5-strategy-for-eliminating-flaky-tests)
    - [6. Testing Contract for Known Defects (`test.fail`)](#6-testing-contract-for-known-defects-testfail)
14. [Summary of Discovered Defects (12 Bugs)](#-summary-of-discovered-defects-12-bugs)
15. [Troubleshooting & Frequently Asked Questions (FAQ)](#-troubleshooting--frequently-asked-questions-faq)

---

## 📊 Executive Summary & Test Results

- **Application Under Test:** QA Mart POS (`https://qa-assessment.holywings.id`)
- **Environment Status:** Staging / QA Assessment (`{"status":"ok","seededBugs":"on"}`)
- **Total Playwright Test Cases:** **40 tests** across 5 functional specifications
  - `auth.spec.js` (9 tests) — Session, lockout, email normalization, logout token revocation
  - `sale-catalog-cart.spec.js` (7 tests) — Catalog rendering, search, category filters, cart operations
  - `promo-calculation-payment.spec.js` (9 tests) — Promo codes (`HEMAT10`, `DISKON5K`), PPN 11%, cash/card/QRIS, receipt modal
  - `transactions-void-rbac.spec.js` (7 tests) — History visibility, Cashier vs Manager permissions, void stock restore
  - `api-business-rules.spec.js` (8 tests) — API schema validation, RBAC, IDOR, stock integrity, SLA `< 1000ms`
- **Playwright Test Pass Rate:** **100% (40/40 passed)**
  - 28 core requirement tests passed with zero regressions.
  - 12 defect verification tests confirmed the exact server/client defects using Playwright's `test.fail()` contract.
- **Newman / Postman API Test Pass Rate:** **100% (25 requests, 40 assertions passed)**
- **Discovered Defects:** **12 defects** (7 Critical, 4 Major, 1 Medium)
- **Release Recommendation:** **NO-GO for Production** — Critical financial/tax calculation errors, privilege escalation, transaction IDOR, and inventory stock loss.

---

## 📦 Complete Deliverables Matrix

All deliverables required by the assessment brief have been generated, verified, and placed in the project directory:

| Deliverable                                | Format           | File Path                                                                                                                                                                       | Description                                                                                        |
| :----------------------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------- |
| **Task A: Test Plan & Risk Analysis**      | Word (`.docx`)   | [Test-Plan-and-Risk-Analysis.docx](file:///C:/Users/LOQ15/.gemini/antigravity/scratch/qa-mart-pos-assessment/docs/Test-Plan-and-Risk-Analysis.docx)                             | Formal test plan with scope, assumptions, test data matrix, 7-point Risk Matrix, and exit criteria |
| **Task A: Test Plan & Risk Analysis**      | Markdown (`.md`) | [test-plan-and-risk-analysis.md](file:///C:/Users/LOQ15/.gemini/antigravity/scratch/qa-mart-pos-assessment/docs/test-plan-and-risk-analysis.md)                                 | Markdown version of the test plan for VCS review                                                   |
| **Task A: Test Cases Spreadsheet**         | Excel (`.xlsx`)  | [qa-mart-pos-test-cases-and-defects.xlsx](file:///C:/Users/LOQ15/.gemini/antigravity/scratch/qa-mart-pos-assessment/docs/qa-mart-pos-test-cases-and-defects.xlsx)               | 3-sheet workbook: Executive Summary, 40 Test Cases (P0–P3), and Defect Reports                     |
| **Task A & B: Bug Reports (With Images)**  | Word (`.docx`)   | [Bug-Reports-and-Findings-with-Screenshots.docx](file:///C:/Users/LOQ15/.gemini/antigravity/scratch/qa-mart-pos-assessment/docs/Bug-Reports-and-Findings-with-Screenshots.docx) | 12 Bug Reports in exact 11-field brief format with embedded live evidence screenshots              |
| **Task A & B: Bug Reports (Markdown)**     | Markdown (`.md`) | [bug-reports.md](file:///C:/Users/LOQ15/.gemini/antigravity/scratch/qa-mart-pos-assessment/docs/bug-reports.md)                                                                 | Full 11-field bug descriptions with step-by-step reproductions                                     |
| **Evidence: Visual Screenshots (12 Bugs)** | PNG Images       | [docs/evidence/](file:///C:/Users/LOQ15/.gemini/antigravity/scratch/qa-mart-pos-assessment/docs/evidence/)                                                                      | 12 high-resolution screenshots covering all UI bugs and API Inspector security cards               |
| **Task B: Playwright Test Suite**          | JavaScript       | `tests/specs/*.spec.js`                                                                                                                                                         | 40 automated desktop tests with POM, fixtures, and Allure integration                              |
| **Task B: Allure HTML Report**             | HTML Report      | Generated via `npm run allure:generate`                                                                                                                                         | Interactive Allure report with execution charts, behaviors, and step logs (generated on demand)   |
| **API Competency: Postman Collection**     | Postman v2.1     | [qa-mart-pos.postman_collection.json](file:///C:/Users/LOQ15/.gemini/antigravity/scratch/qa-mart-pos-assessment/postman/qa-mart-pos.postman_collection.json)                    | 25 API requests covering all endpoints, RBAC, and contract assertions                              |
| **API Competency: Postman Environment**    | Postman JSON     | [qa-mart-pos.postman_environment.json](file:///C:/Users/LOQ15/.gemini/antigravity/scratch/qa-mart-pos-assessment/postman/qa-mart-pos.postman_environment.json)                  | Environment config with token variables and base URL                                               |

---

## 🏛 Project Directory Architecture

```
qa-mart-pos-assessment/
├── .env.example                               # Environment template (BASE_URL, CI flags)
├── package.json                               # npm test scripts & dependencies
├── playwright.config.js                       # Playwright configuration (1440x900, Allure reporter)
├── README.md                                  # Complete execution and architecture guide
│
├── docs/                                      # Assessment Documentation Deliverables
│   ├── Test-Plan-and-Risk-Analysis.docx       # Word document: Formal Test Plan & Risk Analysis
│   ├── test-plan-and-risk-analysis.md         # Markdown document: Test Plan & Risk Analysis
│   ├── Bug-Reports-and-Findings-with-Screenshots.docx # Word document: 12 Bug Reports with embedded images
│   ├── bug-reports.md                         # Markdown document: 12 Bug Reports (11-field format)
│   ├── qa-mart-pos-test-cases-and-defects.xlsx# Excel workbook: 40 Test Cases & Defect Sheets
│   └── evidence/                              # 12 Live Environment Evidence Screenshots
│       ├── bug-01-suspended-login.png
│       ├── bug-02-logout-token-not-revoked.png
│       ├── bug-03-cashier-void-privilege-escalation.png
│       ├── bug-04-idor-cashier-access-other-receipt.png
│       ├── bug-05-void-stock-not-restored.png
│       ├── bug-06-checkout-overselling-negative-stock.png
│       ├── bug-07-ppn-before-discount.png
│       ├── bug-08-hemat10-no-cap.png
│       ├── bug-09-promo-min-boundary.png
│       ├── bug-10-email-case-sensitive.png
│       ├── bug-11-case-sensitive-search.png
│       └── bug-12-clear-cart-desync.png
│
├── postman/                                   # API Testing Competency Deliverables
│   ├── qa-mart-pos.postman_collection.json    # Postman v2.1 API Collection with test scripts
│   └── qa-mart-pos.postman_environment.json   # Staging Environment with variable chaining
│
├── tests/
│   ├── fixtures/
│   │   └── pos.fixture.js                     # Custom fixtures: API client, state reset, auth injection
│   ├── pages/                                 # Page Object Model (POM) Layer
│   │   ├── BasePage.js                        # Base page wrapper with navigation & shared UI helpers
│   │   ├── LoginPage.js                       # Login page locators and actions
│   │   ├── SalePage.js                        # Catalog, cart, promo calculation, payment & receipt modal
│   │   └── TransactionsPage.js                # Transaction history, detail modal, void confirmation
│   ├── specs/                                 # Playwright Test Specifications
│   │   ├── auth.spec.js                       # Authentication, session, lockout & token revocation (9 tests)
│   │   ├── sale-catalog-cart.spec.js          # Catalog display, search, category & cart boundaries (7 tests)
│   │   ├── promo-calculation-payment.spec.js  # Promo rules, PPN 11%, cash/card/qris & receipts (9 tests)
│   │   ├── transactions-void-rbac.spec.js     # History, cashier vs manager visibility & void rules (7 tests)
│   │   └── api-business-rules.spec.js         # API contracts, RBAC, IDOR, stock integrity & SLAs (8 tests)
│   └── utils/
│       ├── api-client.js                      # High-level REST API client for fixtures & setup
│       ├── test-data.js                       # Seeded accounts, products, promo rules & math formulas
│       ├── generate-excel.js                  # Node script generating the Excel spreadsheet
│       ├── generate-postman.js                # Node script generating the Postman collection
│       ├── capture-evidence.js                # Playwright script capturing UI bug screenshots
│       ├── capture-api-evidence.js            # Playwright script generating API vulnerability cards
│       ├── generate_test_plan_docx.py         # Python script generating the Test Plan Word docx
│       └── generate_bug_reports_docx.py       # Python script generating the Bug Reports Word docx
```

> **Note on `.gitignore`:** Generated test artifacts (`allure-results/`, `allure-report/`, `playwright-report/`, `test-results/`, `node_modules/`, `.env`) are excluded from version control via `.gitignore` to keep the repository lightweight and clean. They are generated automatically upon test execution (`npm test` and `npm run allure:generate`).

---


## 💻 Prerequisites & System Requirements

Before running the test automation, ensure your machine has the following installed:

1. **Node.js** (v18.0.0 or higher)  
   Check via terminal:
   ```bash
   node -v
   npm -v
   ```
2. **Java Runtime (JRE / JDK 8+)** _(Required for Allure Report)_  
   Check via terminal:
   ```bash
   java -version
   ```
   _(If Java is not installed, Playwright tests and Newman will still run normally, and you can view the standard Playwright HTML report via `npm run report:html`)_.
3. **Python 3.8+** _(Only required if regenerating Word `.docx` documents)_  
   Check via terminal:
   ```bash
   python --version
   ```
4. **Internet Connection** to reach the target site: `https://qa-assessment.holywings.id`.

---

## ⚙️ Step-by-Step Installation & Setup

1. **Open your terminal** and navigate to the project directory:

   ```bash
   cd C:\Users\LOQ15\.gemini\antigravity\scratch\qa-mart-pos-assessment
   ```

2. **Install Node.js dependencies:**

   ```bash
   npm install
   ```

3. **Install Playwright Chromium browser binaries:**

   ```bash
   npx playwright install chromium
   ```

4. _(Optional)_ **Verify target backend connectivity:**
   ```bash
   node -e "fetch('https://qa-assessment.holywings.id/api/health').then(r => r.json()).then(console.log)"
   # Output should be: { status: 'ok', seededBugs: 'on' }
   ```

---

## 🚀 How to Run the Automation Test Suite

### A. Running Playwright Web UI Tests

#### 1. Run all 40 tests (Headless mode - Default):

```bash
npm test
```

_Expected Output:_ **40 passed** (with 12 known defects handled gracefully via `test.fail`).

#### 2. Run all tests with browser visible (Headed mode):

```bash
npm run test:headed
```

#### 3. Run tests using Playwright's Interactive UI Mode (Best for Debugging):

```bash
npm run test:ui
```

_This opens Playwright's visual dashboard where you can time-travel, inspect DOM locators, and view network requests interactively._

#### 4. Run individual test suites selectively:

```bash
# Run Authentication & Session tests only (9 tests)
npm run test:auth

# Run Sale Screen, Catalog, Cart & Promo Calculation tests (16 tests)
npm run test:sale

# Run Transactions, History & Void RBAC tests (7 tests)
npm run test:tx

# Run API Business Rules, IDOR & Stock Integrity tests (8 tests)
npm run test:api
```

---

### B. Generating & Viewing Allure HTML Report

The suite includes **Allure Report** integration as required by Task B of the brief.

#### 1. Run the entire test suite and build the Allure report in one command:

```bash
npm run test:allure
```

#### 2. Or manually generate and open the report from existing results:

```bash
# Generate HTML report into allure-report/
npm run allure:generate

# Start a local web server to open the interactive Allure report:
npm run allure:open
```

_This automatically opens your default browser at `http://localhost:<port>` showing detailed test metrics, execution timelines, behavioral categories, and severity breakdown._

#### 3. Clean up previous Allure results:

```bash
npm run allure:clean
```

---

### C. Viewing Playwright Native HTML Report

In addition to Allure, Playwright's built-in HTML report is always available:

```bash
npm run report:html
```

---

### D. Running Postman API Collection via Newman CLI

The complete API collection (`postman/qa-mart-pos.postman_collection.json`) tests the REST API layer, status codes, response schemas, and defect expectations.

Run the collection in your terminal with Newman:

```bash
npm run test:postman
```

_Or via npx command:_

```bash
npx newman run postman/qa-mart-pos.postman_collection.json -e postman/qa-mart-pos.postman_environment.json --reporters cli
```

_Expected Output:_ **25 executed requests, 40 passed assertions, 0 failed assertions.**

---

### E. Importing into Postman Desktop GUI

If you want to view or run the collection inside the **Postman desktop app**:

1. Open the **Postman** application.
2. Click **Import** (top left).
3. Drag & drop both files:
   - `postman/qa-mart-pos.postman_collection.json`
   - `postman/qa-mart-pos.postman_environment.json`
4. Select the imported environment **"QA Mart POS - Assessment Environment"** in the top-right environment selector.
5. Click on the collection name and click **Run collection** to run all requests interactively.

---

### F. Regenerating Documentation & Evidence

All documentation and visual evidence scripts are automated and can be re-run at any time:

```bash
# 1. Regenerate all 12 live evidence screenshots (docs/evidence/*.png):
npm run evidence:capture

# 2. Regenerate Excel spreadsheet & Word documents (.docx):
npm run docs:generate
```

---

## 🎯 Engineering Strategies & Best Practices

Task B requires explaining the strategy for parallel execution, data cleanup, timeouts, retries, and handling flaky tests. Below is the detailed architecture implemented in this test kit:

### 1. Strategy for Parallel Execution

- **The Challenge:** QA Mart POS runs against a single shared backend database with mutable inventory, global transaction sequences, and account lockouts. If multiple test workers execute checkouts or call `POST /api/test/reset` concurrently, cross-worker state collisions occur (e.g., worker A expects stock = 100 while worker B's reset or sale changes it mid-test).
- **Our Strategy:**
  - **Safe Default (`workers: 1`):** In `playwright.config.js`, `fullyParallel: false` and `workers: 1` are set by default to guarantee 100% deterministic test execution against the shared assessment server.
  - **Dynamic Scaling (`PARALLEL_WORKERS`):** The configuration accepts a `process.env.PARALLEL_WORKERS` override. In staging/CI environments with containerized or ephemeral databases, tests can run across `N` parallel shards by setting `PARALLEL_WORKERS=4`.
  - **Domain Segmentation:** Tests are segmented into independent feature specs (`auth`, `sale`, `promo`, `transactions`, `api`), avoiding inter-spec dependencies.

### 2. Strategy for Data Cleanup & State Isolation

- **Automatic Pre-Test Reset Hook:** A Playwright auto-fixture (`resetState` in `tests/fixtures/pos.fixture.js`) automatically triggers `POST /api/test/reset` before every test. This guarantees that:
  - Product stock always starts at known initial seed levels (e.g., `BEV-001` = 100, `SNK-003` = 3, `GRC-004` = 0).
  - Only the single seeded transaction (`TRX-20261001-0001`) exists initially.
  - Locked accounts (`ACCOUNT_LOCKED`) are cleared before the next test runs.
- **Direct Auth Injection (`authenticatePage`):** To avoid flaky, repetitive UI login clicks before every sale test, the fixture logs in via the fast API endpoint (`POST /api/auth/login`) in `< 50ms` and injects `pos_token` and `pos_user` into `localStorage`, navigating directly to `#/sale`.

### 3. Strategy for Timeouts & Auto-Waiting

- **Layered Timeout Hierarchy:**
  - **Global Test Timeout:** `30_000 ms` in `playwright.config.js`.
  - **Expect Timeout:** `10_000 ms` for UI assertion auto-waiting.
  - **Action & Navigation Timeouts:** `actionTimeout: 10_000 ms`, `navigationTimeout: 20_000 ms`.
- **Zero Fixed Sleeps:** Never use arbitrary `page.waitForTimeout(3000)`. All waits use Playwright's web-first assertions (`toBeVisible()`, `toHaveText()`) or explicit network response promises (`waitForResponse`).
- **Debounce Synchronization:** For debounced UI inputs (e.g., the 250ms search debounce in `app.js`), the Page Object explicitly awaits the corresponding `/api/products` network response instead of guessing sleep durations.

### 4. Strategy for Retries & Diagnostics

- **Local vs CI Retries:**
  - **Local Runs:** `retries: 0` for fast feedback and immediate debugging.
  - **CI / Pipeline Runs:** `retries: 2` (configured via `process.env.CI ? 2 : 0`) to absorb transient network jitter without failing pipeline builds.
- **Trace & Artifact Capture:** `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, and `video: 'retain-on-failure'`. When a retry occurs, Playwright automatically records a full execution trace and video to diagnose the root cause.

### 5. Strategy for Eliminating Flaky Tests

- **Stable Accessibility & Data-TestID Locators:** All page elements are queried via `data-testid` (e.g., `login-email`, `product-card`, `promo-input`, `pay-button`, `receipt-total`) or accessibility roles (`getByRole`), completely avoiding fragile CSS hierarchy or auto-generated classes.
- **Single-Page App (SPA) Hash Navigation:** Handled explicitly using router-ready waits (`waitForReady()`) ensuring all components and product cards are rendered before initiating interactions.

### 6. Testing Contract for Known Defects (`test.fail`)

Instead of commenting out tests for known defects or letting them fail the build, tests for the 12 discovered bugs are decorated with `test.fail(true, 'Known defect BUG-XX: ...')`. This adheres to standard QA engineering practices:

- Playwright expects the assertion to fail; if the bug is present, the test run passes.
- If a developer fixes the bug in the backend, the test will immediately fail ("expected failure, but passed"), alerting the team that the defect can be closed!

---


## 🐛 Summary of Discovered Defects (12 Bugs)

| Bug ID     | Title                                                                                         | Module                   | Platform  | Severity                      | Priority | Automated Test            |
| :---       | :---                                                                                          | :---                     | :---      | :---                          | :---     | :---                      |
| **BUG-01** | Suspended account login returns HTTP 500 `INTERNAL_ERROR` instead of 403 with clear message   | Authentication           | Web / API | Critical                      | Critical | `TC-AUTH-007`             |
| **BUG-02** | Logout does not revoke Bearer token server-side (continues returning 200 OK)                  | Authentication / Session | API       | Critical                      | Critical | `TC-AUTH-009`             |
| **BUG-03** | Privilege Escalation: Cashier can void transactions via `POST /api/transactions/{id}/void`    | Transactions / RBAC      | API       | Critical                      | Critical | `TC-TX-006`               |
| **BUG-04** | IDOR: Cashier can access other cashiers' transaction details via `GET /api/transactions/{id}` | Transactions / RBAC      | API       | Critical                      | Critical | `TC-TX-007`               |
| **BUG-05** | Voiding a transaction does not restore sold product stock back to inventory                   | Inventory / Void         | Web / API | Critical                      | Critical | `TC-TX-005`               |
| **BUG-06** | Checkout allows ordering quantity exceeding stock, causing negative inventory (`-7`)          | Checkout / Inventory     | API       | Critical                      | Critical | `TC-API-008`              |
| **BUG-07** | PPN 11% is calculated on gross subtotal before discount instead of `(subtotal - discount)`    | Cart / Price Calc        | Web / API | Critical                      | Critical | `TC-PROMO-003`            |
| **BUG-08** | `HEMAT10` promo code ignores maximum discount cap of Rp20.000                                 | Promo Codes              | Web / API | Critical                      | High     | `TC-PROMO-004`            |
| **BUG-09** | Promo minimum subtotal validation is exclusive (`>`) instead of inclusive (`>=`)              | Promo Codes              | Web / API | Major                         | High     | `TC-PROMO-005`            |
| **BUG-10** | Login email is case-sensitive and fails when surrounded by whitespace                         | Authentication           | Web / API | Major                         | High     | `TC-AUTH-008`             |
| **BUG-11** | Product search (`q`) is case-sensitive for both product name and SKU                          | Catalog / Search         | Web / API | Major                         | High     | `TC-SALE-006`             |
| **BUG-12** | Promo code leaks into next sale after `New sale`, and `Clear` cart causes UI/state desync     | Sale Screen / Cart       | Web       | Major                         | Medium   | `TC-SALE-007 / PROMO-006` |

_Detailed reproduction steps and embedded visual evidence are available in [Bug-Reports-and-Findings-with-Screenshots.docx](file:///C:/Users/LOQ15/.gemini/antigravity/scratch/qa-mart-pos-assessment/docs/Bug-Reports-and-Findings-with-Screenshots.docx) and [bug-reports.md](file:///C:/Users/LOQ15/.gemini/antigravity/scratch/qa-mart-pos-assessment/docs/bug-reports.md)._

---

## ❓ Troubleshooting & Frequently Asked Questions (FAQ)

### 1. `npm run allure:open` or `allure:generate` fails with `Java not found`

- **Cause:** Allure CLI requires Java Runtime Environment (JRE) to compile the HTML report.
- **Solution:** Install OpenJDK (JRE 8 or higher) and ensure `java` is in your system PATH. Alternatively, you can always view the standard Playwright HTML report which requires no Java:
  ```bash
  npm run report:html
  ```

### 2. Can I run tests in parallel?

- **Answer:** By default, `workers: 1` is configured because the remote assessment environment uses a single shared database state. Running multiple workers simultaneously can cause checkouts in one test to mutate the stock expected by another test. If running against an isolated local environment, you can scale workers:
  ```bash
  npx playwright test --workers=4
  ```

### 3. How do I manually reset the test environment?

- You can trigger a database reset at any time via cURL or browser:
  ```bash
  curl -X POST https://qa-assessment.holywings.id/api/test/reset
  ```

### 4. PowerShell Execution Policy error on Windows (`npm run ... cannot be loaded`)

- **Solution:** Open PowerShell as Administrator and run:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

---

_Submitted by Senior QA Automation Engineer Candidate for the POS - QA Engineer Skill Test._
