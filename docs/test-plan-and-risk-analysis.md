# Test Plan & Risk Analysis — QA Mart POS

## 1. General Information

| Field | Detail |
| :--- | :--- |
| **Application Under Test** | QA Mart POS (`https://qa-assessment.holywings.id`) |
| **API & Business Rules Reference** | `https://qa-assessment.holywings.id/docs` & `/README.md` |
| **Assessment Brief** | POS - QA Engineer Skill Test |
| **Target Platform** | Desktop Web (1440×900, Chromium) + REST API |
| **Environment** | QA Assessment / Staging (`seededBugs: "on"`) |
| **Date** | 2026-11-19 |

---

## 2. Scope of Testing

### In Scope
1. **Authentication & Session Management**: Active login (Cashier & Manager), email normalization (case-insensitive & whitespace trimming), invalid credentials, client-side validation, suspended account rejection (403), account lockout after 5 failed attempts (423 for 60s), logout & server-side token revocation (401), protected route guard.
2. **Sale Screen (Desktop)**: Product catalog display (15 seeded SKUs), category filtering, search by product name and SKU (case-insensitive), out-of-stock handling, cart operations (add, increment/decrement, direct numeric edit, remove, clear), quantity boundaries (`1–99` and `<= stock`).
3. **Promo Codes & Price Calculation**: `HEMAT10` (10% floor, min Rp50.000 inclusive, max Rp20.000), `DISKON5K` (Rp5.000 flat, min Rp25.000 inclusive), `LAMA2025` (expired), invalid codes, case-insensitivity, single-promo constraint, PPN 11% (`round((subtotal - discount) * 0.11)`), Grand Total (`subtotal - discount + tax`).
4. **Checkout, Payment & Stock**: Cash (`amountPaid >= total`, `change = amountPaid - total`), Card & QRIS (exact total, optional `amountPaid`), receipt modal accuracy, post-sale stock deduction.
5. **Transactions, RBAC & Void**: Cashier sees/opens own transactions only; Manager sees all transactions and can void with 5–200 char reason; double-void prevention (409); stock restoration on void; status filtering (`completed` / `voided`).
6. **Product Management & API Contract (REST API / Postman)**: Manager-only `POST /api/products` and `PUT /api/products/{id}`, Cashier 403 restriction, duplicate SKU 409, field validation boundaries, error format consistency, performance requirement (`< 1000 ms` per endpoint).

### Out of Scope
1. **News features mentioned in the assessment brief** (*view, share, like, comment, report news*): Not present on `https://qa-assessment.holywings.id` (the deployed application is QA Mart POS). Documented under Assumptions below.
2. **Mobile / Tablet Native Apps** (Android / iOS) and physical thermal receipt printer hardware integration.
3. **Load / Stress / DDoS testing** against the shared remote assessment environment.
4. **Password reset, self-registration, and multi-store management** (not implemented in QA Mart POS).

---

## 3. Assumptions, Dependencies & Data Needs

### Assumptions
1. **Requirement Precedence (Brief vs README/API Docs)**: The brief (`POS - QA ENGINEER SKILL TEST.md`) includes a generic News rule (*view/share/like/comment/report news*), whereas the live URL `https://qa-assessment.holywings.id`, `POS Readme.md`, and `/docs` exclusively implement **QA Mart POS**. Testing therefore treats `/docs` and `POS Readme.md` as the authoritative functional specification for all POS business rules, while fulfilling all Task A & Task B deliverables from the brief.
2. **Shared Stateful Environment**: `https://qa-assessment.holywings.id` uses a single shared database state that can be reset cleanly via `POST /api/test/reset`.
3. **Intentional Seeded Bugs**: `GET /api/health` returns `{"status":"ok","seededBugs":"on"}`, confirming that any deviation from `/docs` must be reported as a defect.
4. **Environment Classification**: Classified as **Staging / QA Assessment** for bug reporting.

### Dependencies
- Stable internet access to `https://qa-assessment.holywings.id` (Web + REST API).
- `POST /api/test/reset` availability for deterministic test isolation and cleanup.
- Node.js (v18+), Playwright (`@playwright/test`), Java runtime (for Allure HTML report generation), and Postman/Newman (for API collection execution).

### Data Needs
| Category | Test Data |
| :--- | :--- |
| **Active Cashier 1** | `andi@pos.test` / `Password123!` (`Andi Pratama`, role: `cashier`) |
| **Active Cashier 2** | `budi@pos.test` / `Password123!` (`Budi Santoso`, role: `cashier`, owns seeded `TRX-20261001-0001`) |
| **Active Manager** | `manager@pos.test` / `Password123!` (`Citra Manager`, role: `manager`) |
| **Suspended Cashier** | `suspended@pos.test` / `Password123!` (status: `suspended`) |
| **Low-Stock Boundary Item** | `SNK-003` — Roasted Peanuts 250 g (Rp15.000, stock: `3`) |
| **Out-of-Stock Item** | `GRC-004` — Granulated Sugar 1 kg (Rp17.500, stock: `0`) |
| **Promo Boundary Items** | `BEV-003` Instant Coffee Rp25.000 (`1x` = exact `DISKON5K` min; `2x` = exact `HEMAT10` min), `GRC-001` Rice 5 kg Rp75.000 (`4x` = Rp300.000 for `HEMAT10` cap test) |
| **Promo Codes** | `HEMAT10` (active), `DISKON5K` (active), `LAMA2025` (expired), `INVALIDCODE` (invalid) |

---

## 4. Risk-Based Testing Analysis

| Risk ID | Risk Area | Business / Technical Impact | Likelihood | Risk Level | Priority | Mitigation / Test Focus |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01** | **Financial Calculation Errors** (PPN 11%, promo discounts, rounding, caps, change) | Direct financial/tax compliance loss; customer overcharging or revenue leakage | High | **Critical** | **P0** | Test PPN with & without promo, exact min subtotal boundaries (`Rp25.000`, `Rp50.000`), max discount cap (`Rp20.000`), rounding down, and cash change |
| **R-02** | **Inventory Integrity** (overselling, negative stock, missing stock restore on void) | Oversold goods, corrupted inventory counts, inaccurate restocking | High | **Critical** | **P0** | Test stock decrement after sale, stock restoration after void, UI & API over-stock rejection, and out-of-stock blocking |
| **R-03** | **Broken Access Control (RBAC / IDOR)** | Cashiers voiding sales, accessing other cashiers' receipts, or modifying products | High | **Critical** | **P0** | Test both UI visibility AND direct API calls across Cashier vs Manager roles (`GET /transactions/{id}`, `POST /void`, `POST/PUT /products`) |
| **R-04** | **Session & Auth Vulnerabilities** (revocation, suspended accounts, lockout) | Stolen tokens remain valid after logout; suspended staff or server 500 crashes | High | **Critical** | **P0** | Test suspended account status code, token reuse after `POST /api/auth/logout`, 5-attempt lockout (423), and email normalization |
| **R-05** | **Client-Side State Leaks** (Clear Cart / New Sale carrying over promo/payment state) | Wrong discount silently applied to next customer; cashier unable to submit payment | Medium | **High** | **P1** | Test sequential checkouts (`New sale`) and `Clear` cart after switching payment methods & applying promos |
| **R-06** | **Catalog Search & Usability on Desktop** | Cashiers unable to locate SKUs quickly during checkout queues | Medium | **High** | **P1** | Test mixed/lowercase search by SKU & name, category filter combinations, and desktop viewport layout (`1440×900`) |
| **R-07** | **API Performance Degradation** | Checkout lag violating `< 1000 ms` SLA | Low | **Medium** | **P2** | Assert response time `< 1000 ms` across all API endpoints in Playwright & Postman |

---

## 5. Priority Classification

| Priority | Criteria | Execution Cadence |
| :--- | :--- | :--- |
| **P0 (Critical)** | Core revenue, tax/pricing, stock integrity, authentication, RBAC/security | Every build & PR (automated smoke/critical gate) |
| **P1 (High)** | Primary workflows, promo boundaries, catalog search/filter, product CRUD validation | Every release / full regression |
| **P2 (Medium)** | Secondary UI flows, state edge cases, exploratory/resilience checks | Pre-release regression |
| **P3 (Low)** | Minor UX polish, non-blocking layout/cosmetic details | As time permits |

---

## 6. Entry & Exit Criteria

### Entry Criteria
- Target application (`https://qa-assessment.holywings.id`) returns `200 OK` on `GET /api/health`.
- API documentation (`/docs`) and test credentials (`POS Readme.md`) are available and verified.
- `POST /api/test/reset` restores clean initial seed data (15 products, 1 seeded transaction).

### Exit Criteria
- 100% of planned P0 and P1 test cases executed (manual/exploratory + automated).
- All discovered defects documented with full reproduction steps, API/UI evidence, severity, and priority.
- Playwright JavaScript automation suite (POM + Fixtures) executes cleanly with Allure Report generated.
- **Release Gate Recommendation (Current Build):** **NO-GO for Production** — **12 defects** found, including **7 Critical** blockers (suspended login 500 crash, broken logout token revocation, Cashier void privilege escalation, transaction IDOR, void not restoring stock, negative stock overselling, and PPN 11% overcharging before discount).

