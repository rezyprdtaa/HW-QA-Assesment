const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function generateWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'QA Engineer Candidate';
  wb.created = new Date();

  // Color palette
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F497D' } };
  const headerFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  const p0Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8D7DA' } }; // light red
  const p1Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3CD' } }; // light yellow
  const p2Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1E7DD' } }; // light green

  // Sheet 1: Summary & Risk Analysis
  const wsSummary = wb.addWorksheet('Summary & Risks', { views: [{ showGridLines: true }] });
  wsSummary.columns = [
    { header: 'Item', key: 'item', width: 32 },
    { header: 'Details / Description', key: 'detail', width: 85 },
  ];
  wsSummary.getRow(1).fill = headerFill;
  wsSummary.getRow(1).font = headerFont;

  const summaryData = [
    ['Application Under Test', 'QA Mart POS (https://qa-assessment.holywings.id)'],
    ['Target Platform', 'Desktop Web (1440x900, Chromium) + REST API'],
    ['Test Framework', 'Playwright (JavaScript) + Page Object Model + Custom Fixtures'],
    ['Test Reporting', 'Allure Report (allure-playwright) + Playwright HTML'],
    ['API Testing Tool', 'Postman Collection v2.1 + Newman CLI + Playwright APIRequestContext'],
    ['Total Test Cases', '40 test cases (28 passing core cases + 12 defect verification cases)'],
    ['Test Case Coverage', 'Positive, Negative, Boundary, Exploratory, Auth, State Changes, Data Validation, API Contract'],
    ['Total Defects Identified', '12 defects (7 Critical, 4 Major, 1 Medium)'],
    ['Release Recommendation', 'NO-GO for Production — critical financial (tax overcharge), security (IDOR & cashier void), and inventory (negative stock & void stock loss) defects found.'],
    ['', ''],
    ['Key Risk 1: Financial & Tax Calculation', 'PPN 11% calculated before discount (overcharging customers); HEMAT10 max discount cap of Rp20.000 ignored; promo min subtotal boundary is exclusive (> instead of >=).'],
    ['Key Risk 2: Broken Access Control (RBAC)', 'Cashier can call POST /api/transactions/{id}/void directly (privilege escalation); Cashier can view other cashiers transactions (IDOR).'],
    ['Key Risk 3: Inventory Corruption', 'Voiding a transaction does not restore stock; checkout allows purchasing more than stock available, driving stock into negative integers (-7).'],
    ['Key Risk 4: Authentication & Session', 'Suspended account crashes login with HTTP 500 INTERNAL_ERROR; token is not revoked on logout; login rejects uppercase & whitespace-padded email.'],
    ['Key Risk 5: Usability & State Management', 'Product search is case-sensitive; Clear Cart desyncs radio buttons and payment state; promo code leaks into next sale.'],
  ];
  summaryData.forEach((row) => wsSummary.addRow(row));

  // Sheet 2: Test Cases
  const wsTC = wb.addWorksheet('Test Cases', { views: [{ showGridLines: true }] });
  wsTC.columns = [
    { header: 'Test Case ID', key: 'id', width: 16 },
    { header: 'Module', key: 'module', width: 18 },
    { header: 'Test Scenario / Title', key: 'title', width: 45 },
    { header: 'Type', key: 'type', width: 16 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Preconditions', key: 'preconditions', width: 35 },
    { header: 'Test Steps', key: 'steps', width: 55 },
    { header: 'Expected Result', key: 'expected', width: 50 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Related Defect', key: 'defect', width: 14 },
  ];
  wsTC.getRow(1).fill = headerFill;
  wsTC.getRow(1).font = headerFont;

  const testCasesData = [
    // Auth
    ['TC-AUTH-001', 'Auth', 'Cashier login and logout normally', 'Positive', 'P0', 'Cashier account active', '1. Go to #/login\n2. Enter andi@pos.test / Password123!\n3. Click Log in\n4. Verify #/sale and user badge\n5. Click Log out', 'Redirects to #/sale, shows Andi Pratama / Cashier; logout redirects to #/login and blocks protected route', 'PASS', '-'],
    ['TC-AUTH-002', 'Auth', 'Manager login and role badge', 'Positive', 'P0', 'Manager account active', '1. Go to #/login\n2. Enter manager@pos.test / Password123!\n3. Click Log in', 'Redirects to #/sale, displays Citra Manager / Manager', 'PASS', '-'],
    ['TC-AUTH-003', 'Auth', 'Empty credentials validation', 'Boundary', 'P0', 'On #/login', '1. Leave email & password empty\n2. Click Log in', 'Displays inline errors: Email is required and Password is required', 'PASS', '-'],
    ['TC-AUTH-004', 'Auth', 'Invalid email format validation', 'Negative', 'P1', 'On #/login', '1. Enter not-an-email\n2. Click Log in', 'Displays client error: Please enter a valid email address.', 'PASS', '-'],
    ['TC-AUTH-005', 'Auth', 'Invalid password rejection', 'Negative', 'P0', 'On #/login', '1. Enter andi@pos.test\n2. Enter WrongPass999!\n3. Click Log in', 'Displays alert: Invalid email or password.', 'PASS', '-'],
    ['TC-AUTH-006', 'Auth', 'Lockout after 5 failed attempts (HTTP 423)', 'Security', 'P1', 'Clean account state', '1. Submit wrong password 5 times for budi@pos.test\n2. Submit 6th login attempt', '6th attempt returns HTTP 423 ACCOUNT_LOCKED (locked for 60 seconds)', 'PASS', '-'],
    ['TC-AUTH-007', 'Auth', 'Suspended account rejection (HTTP 403)', 'Negative', 'P0', 'Account suspended@pos.test', '1. Enter suspended@pos.test / Password123!\n2. Click Log in', 'Returns HTTP 403 with clear message stating account is suspended', 'FAIL (Defect)', 'BUG-01'],
    ['TC-AUTH-008', 'Auth', 'Case-insensitive & whitespace email login', 'Exploratory', 'P1', 'Active cashier account', '1. Login with ANDI@POS.TEST\n2. Login with padded   andi@pos.test  ', 'Both return HTTP 200 OK with valid auth token', 'FAIL (Defect)', 'BUG-10'],
    ['TC-AUTH-009', 'Auth', 'Token revocation after logout', 'Security', 'P0', 'Logged in token', '1. Call POST /api/auth/logout with Bearer token\n2. Call GET /api/auth/me with same token', 'Subsequent API call returns HTTP 401 Unauthorized', 'FAIL (Defect)', 'BUG-02'],

    // Catalog & Cart
    ['TC-SALE-001', 'Sale / Catalog', 'Display 15 products and disable out-of-stock', 'Positive', 'P0', 'Cashier logged in', '1. Navigate to #/sale\n2. Count product cards\n3. Check GRC-004 Granulated Sugar', '15 product cards visible; GRC-004 button is disabled with text Out of stock', 'PASS', '-'],
    ['TC-SALE-002', 'Sale / Catalog', 'Category filtering and All restore', 'Positive', 'P1', 'Cashier logged in', '1. Click Snacks category tab\n2. Verify 3 snack products\n3. Click All tab', 'Snacks displays 3 products; All restores 15 products', 'PASS', '-'],
    ['TC-SALE-003', 'Sale / Catalog', 'Search by exact name and SKU', 'Positive', 'P1', 'Cashier logged in', '1. Search Coffee\n2. Search BEV-001\n3. Search NonExistentXYZ', 'Coffee shows Instant Coffee; BEV-001 shows Mineral Water; invalid shows No products found.', 'PASS', '-'],
    ['TC-SALE-004', 'Sale / Cart', 'Add, increment, stock clamp, remove by 0', 'Boundary', 'P0', 'SNK-003 has stock 3', '1. Add SNK-003\n2. Click + up to 3\n3. Click + at 3\n4. Type 10 into qty input and blur\n5. Type 0 into qty input and blur', 'Quantity increments to 3; exceeding 3 shows warning toast and clamps to 3; 0 removes item', 'PASS', '-'],
    ['TC-SALE-005', 'Sale / Cart', 'Remove button removes line', 'Positive', 'P1', '2 items in cart', '1. Add BEV-001 and BEV-002\n2. Click Remove on BEV-001', 'BEV-001 is removed; BEV-002 remains in cart', 'PASS', '-'],
    ['TC-SALE-006', 'Sale / Catalog', 'Case-insensitive search for name and SKU', 'Exploratory', 'P1', 'Cashier logged in', '1. Search coffee (lowercase)\n2. Search COFFEE (uppercase)\n3. Search bev-001 (lowercase SKU)', 'All queries return matching products', 'FAIL (Defect)', 'BUG-11'],
    ['TC-SALE-007', 'Sale / Cart', 'Clear cart resets promo, method & amount paid', 'State Change', 'P2', 'Items in cart + promo + QRIS', '1. Add item, apply promo, select QRIS, fill amount paid\n2. Click Clear and accept confirm', 'Cart emptied; promo reset; payment method reset to Cash; amount paid reset', 'FAIL (Defect)', 'BUG-12'],

    // Promo & Payment
    ['TC-PAY-001', 'Payment', 'Cash checkout calculates PPN, change, reduces stock', 'Positive', 'P0', 'Mineral Water stock 100', '1. Add 2x BEV-001 (Rp8.000)\n2. Verify subtotal Rp8.000, PPN Rp880, total Rp8.880\n3. Pay Cash Rp10.000\n4. Verify change Rp1.120 and receipt modal\n5. Click New sale and check stock', 'Receipt shows TRX number and breakdown; BEV-001 stock reduces from 100 to 98', 'PASS', '-'],
    ['TC-PAY-002', 'Payment', 'Cash payment under total rejected', 'Negative', 'P0', 'Cart total Rp83.250', '1. Add GRC-001 (total Rp83.250)\n2. Fill Amount paid Rp50.000\n3. Click Pay', 'Pay blocked with error: Amount paid is less than the total (Rp83.250).', 'PASS', '-'],
    ['TC-PAY-003', 'Payment', 'Card and QRIS exact total checkout', 'Positive', 'P0', 'Cashier logged in', '1. Add BEV-002, select Card, click Pay\n2. Add BEV-001, select QRIS, click Pay', 'Both checkouts succeed without cash input, displaying exact total and Change Rp0', 'PASS', '-'],
    ['TC-PROMO-001', 'Promo', 'Invalid and expired promo (LAMA2025) rejected', 'Negative', 'P1', 'Items in cart', '1. Apply INVALIDCODE\n2. Apply LAMA2025', 'INVALIDCODE shows Promo code is not valid; LAMA2025 shows Promo code has expired.', 'PASS', '-'],
    ['TC-PROMO-002', 'Promo', 'Remove promo restores full total', 'Positive', 'P1', 'GRC-001 in cart', '1. Apply HEMAT10 (discount Rp7.500)\n2. Click Remove promo button', 'Discount returns to Rp0 and total returns to Rp83.250', 'PASS', '-'],
    ['TC-PROMO-003', 'Promo / Tax', 'PPN 11% calculated on (subtotal - discount)', 'Data Validation', 'P0', 'GRC-001 in cart', '1. Add GRC-001 (Rp75.000)\n2. Apply HEMAT10 (discount Rp7.500)\n3. Check PPN 11% value', 'Tax must equal round((75.000 - 7.500) * 0.11) = Rp7.425; total = Rp74.925', 'FAIL (Defect)', 'BUG-07'],
    ['TC-PROMO-004', 'Promo', 'HEMAT10 max discount cap of Rp20.000', 'Boundary', 'P0', 'Subtotal Rp300.000', '1. Add 4x GRC-001 (Rp300.000)\n2. Apply HEMAT10\n3. Check Discount', 'Discount must be capped at Rp20.000', 'FAIL (Defect)', 'BUG-08'],
    ['TC-PROMO-005', 'Promo', 'Inclusive minimum subtotal boundary', 'Boundary', 'P1', 'Exact min subtotal', '1. Add 2x BEV-003 (exact Rp50.000), apply HEMAT10\n2. Add 1x BEV-003 (exact Rp25.000), apply DISKON5K', 'Both promos apply successfully (min subtotal is inclusive)', 'FAIL (Defect)', 'BUG-09'],
    ['TC-PROMO-006', 'Promo', 'Promo code must not leak to next customer', 'State Change', 'P1', 'Completed promo sale', '1. Complete sale with HEMAT10\n2. Click New sale\n3. Add item for next customer', 'Cart starts with Rp0 discount and no promo code applied', 'FAIL (Defect)', 'BUG-12'],

    // Transactions & Void
    ['TC-TX-001', 'Transactions', 'Cashier sees only own transactions & no void button', 'Authorization', 'P0', 'Cashier Andi logged in', '1. Open #/transactions\n2. Check visible transactions list\n3. Verify Budi transaction TRX-20261001-0001 is hidden', 'Displays Showing your transactions; Budis transaction is hidden; no Void button in receipt modal', 'PASS', '-'],
    ['TC-TX-002', 'Transactions', 'Manager sees all transactions & void button', 'Authorization', 'P0', 'Manager logged in', '1. Open #/transactions\n2. Open TRX-20261001-0001 detail modal', 'Displays Showing transactions from all cashiers; opens Budis transaction; Void button is visible', 'PASS', '-'],
    ['TC-TX-003', 'Transactions', 'Void reason 5-200 characters validation', 'Boundary', 'P1', 'Manager opening transaction', '1. Click Void transaction\n2. Enter 1234 (4 chars) and submit\n3. Click Cancel', 'Shows error: Please enter a reason (at least 5 characters); Cancel closes modal', 'PASS', '-'],
    ['TC-TX-004', 'Transactions', 'Manager voids transaction & double-void blocked', 'State Change', 'P0', 'Completed transaction', '1. Open completed transaction\n2. Submit void with valid reason\n3. Re-open transaction\n4. Filter by voided', 'Toast confirms void; receipt shows *** VOIDED ***; Void button hidden; filter shows voided tx', 'PASS', '-'],
    ['TC-TX-005', 'Inventory / Void', 'Voiding transaction restores product stock', 'State Change', 'P0', 'Sale of 2x BEV-001 completed', '1. Note initial stock (100)\n2. Complete sale (stock drops to 98)\n3. Manager voids transaction\n4. Check stock of BEV-001', 'Stock must be restored from 98 back to 100', 'FAIL (Defect)', 'BUG-05'],
    ['TC-TX-006', 'Transactions / RBAC', 'Cashier cannot void via API (403 Forbidden)', 'Security', 'P0', 'Cashier Bearer token', '1. Create transaction via Andi\n2. Call POST /api/transactions/{id}/void with Andis token', 'Returns HTTP 403 Forbidden', 'FAIL (Defect)', 'BUG-03'],
    ['TC-TX-007', 'Transactions / RBAC', 'Cashier cannot view other cashier tx via API (IDOR)', 'Security', 'P0', 'Cashier Andi token', '1. Call GET /api/transactions/1 (Budis transaction) with Andis token', 'Returns HTTP 403 Forbidden', 'FAIL (Defect)', 'BUG-04'],

    // API Contract
    ['TC-API-001', 'API Contract', 'Health status ok and response time under 1000ms', 'Non-functional', 'P0', 'API available', '1. Call GET /api/health', 'Returns HTTP 200 {status: "ok"}; latency < 1000 ms', 'PASS', '-'],
    ['TC-API-002', 'API Contract', 'Missing/invalid token returns 401', 'Security', 'P0', 'API available', '1. Call GET /api/auth/me without token\n2. Call with invalid token', 'Both return HTTP 401 Unauthorized', 'PASS', '-'],
    ['TC-API-003', 'Product API', 'Manager CRUD product; duplicate SKU returns 409', 'Positive / Boundary', 'P0', 'Manager token', '1. POST /api/products (TST-101)\n2. PUT /api/products/{id}\n3. POST /api/products with duplicate SKU BEV-001', 'Create returns 201; Update returns 200; duplicate returns 409 DUPLICATE_SKU', 'PASS', '-'],
    ['TC-API-004', 'Product API', 'Cashier cannot create or update products (403)', 'Security', 'P0', 'Cashier token', '1. POST /api/products with Cashier token\n2. PUT /api/products/1 with Cashier token', 'Both return HTTP 403 Forbidden', 'PASS', '-'],
    ['TC-API-005', 'Product API', 'Product creation field boundary validation', 'Boundary', 'P1', 'Manager token', '1. Test price < 100, float price, negative stock, name > 80 chars, invalid SKU format, invalid category', 'All return HTTP 400 VALIDATION_ERROR with field details', 'PASS', '-'],
    ['TC-API-006', 'Checkout API', 'Rejects out-of-stock (422) & mismatched card amount (400)', 'Negative', 'P1', 'Cashier token', '1. Checkout GRC-004 (stock 0)\n2. Checkout card with amountPaid != total', 'Out-of-stock returns 422; mismatched card returns 400', 'PASS', '-'],
    ['TC-API-007', 'Transactions API', 'Double void via API returns 409 Conflict', 'Negative', 'P1', 'Manager token', '1. Void transaction 1 once\n2. Void transaction 1 again', 'Second call returns HTTP 409 ALREADY_VOIDED', 'PASS', '-'],
    ['TC-API-008', 'Checkout API', 'Checkout exceeding available stock rejected with 422', 'Boundary', 'P0', 'SNK-003 stock = 3', '1. Call POST /api/transactions with qty 10 for SNK-003\n2. Check stock', 'Returns HTTP 422; stock is NOT decremented into negative numbers', 'FAIL (Defect)', 'BUG-06'],
  ];

  testCasesData.forEach((row) => {
    const r = wsTC.addRow(row);
    if (row[4] === 'P0') r.getCell('priority').fill = p0Fill;
    else if (row[4] === 'P1') r.getCell('priority').fill = p1Fill;
    else r.getCell('priority').fill = p2Fill;
  });

  // Sheet 3: Defect Reports (Exact Assessment Table Format)
  const wsBugs = wb.addWorksheet('Defect Reports', { views: [{ showGridLines: true }] });
  wsBugs.columns = [
    { header: 'FIELD', key: 'field', width: 25 },
    { header: 'DESCRIPTION', key: 'desc', width: 95 },
  ];
  wsBugs.getRow(1).fill = headerFill;
  wsBugs.getRow(1).font = headerFont;

  const bugs = [
    {
      id: 'BUG-01',
      title: 'BUG-01 — Suspended account login returns HTTP 500 INTERNAL_ERROR instead of 403',
      module: 'Authentication (/api/auth/login & #/login)',
      env: 'Staging / QA Assessment',
      platform: 'Web / API',
      severity: 'Critical',
      priority: 'Critical',
      preconditions: 'Account suspended@pos.test / Password123! exists with status suspended.',
      steps: '1. Open https://qa-assessment.holywings.id/#/login\n2. Enter suspended@pos.test and Password123!\n3. Click Log in',
      expected: 'API returns HTTP 403 with a clear message stating the account is suspended (per /docs: "Suspended accounts get a 403 with a clear message."); UI displays the message.',
      actual: 'API returns HTTP 500 with {"error":{"code":"INTERNAL_ERROR","message":"Something went wrong."}}. UI displays generic alert "Something went wrong."',
      evidence: 'Automated test TC-AUTH-007; screenshot docs/evidence/bug-01-suspended-login.png',
    },
    {
      id: 'BUG-02',
      title: 'BUG-02 — Logout does not revoke Bearer token server-side',
      module: 'Authentication / Session (/api/auth/logout)',
      env: 'Staging / QA Assessment',
      platform: 'API',
      severity: 'Critical',
      priority: 'Critical',
      preconditions: 'User budi@pos.test is logged in and possesses a valid Bearer token.',
      steps: '1. Login as budi@pos.test via POST /api/auth/login and capture token\n2. Call POST /api/auth/logout with token (returns 204)\n3. Call GET /api/auth/me and GET /api/products with same token',
      expected: 'Per /docs: "Tokens are valid for 1 hour and must stop working after logout." Subsequent API calls must return HTTP 401 Unauthorized.',
      actual: 'Both GET /api/auth/me and GET /api/products continue returning HTTP 200 OK with full user and product data.',
      evidence: 'Automated test TC-AUTH-009; Postman test Auth -> Verify Token Revoked After Logout',
    },
    {
      id: 'BUG-03',
      title: 'BUG-03 — Cashier can void transactions via API (Privilege Escalation)',
      module: 'Transactions / Authorization (RBAC)',
      env: 'Staging / QA Assessment',
      platform: 'API',
      severity: 'Critical',
      priority: 'Critical',
      preconditions: 'Cashier andi@pos.test is logged in; completed transaction exists.',
      steps: '1. Login as Cashier andi@pos.test via POST /api/auth/login\n2. Submit POST /api/transactions/{id}/void with Cashier token and body {"reason": "Cashier void test"}',
      expected: 'Per /docs: "Void: Managers only." API must reject Cashier with HTTP 403 Forbidden.',
      actual: 'API returns HTTP 200 OK and voids the transaction. Manager role is only checked in UI, not in API.',
      evidence: 'Automated test TC-TX-006; Postman test Transactions & RBAC -> Cashier Void Forbidden',
    },
    {
      id: 'BUG-04',
      title: 'BUG-04 — Cashier can access other cashiers transaction details via API (IDOR)',
      module: 'Transactions / Authorization (RBAC)',
      env: 'Staging / QA Assessment',
      platform: 'API',
      severity: 'Critical',
      priority: 'Critical',
      preconditions: 'Transaction 1 (TRX-20261001-0001) belongs to Cashier Budi. Cashier Andi is logged in.',
      steps: '1. Login as Cashier andi@pos.test\n2. Call GET /api/transactions/1 with Andis token',
      expected: 'Per /docs: "GET /api/transactions/{id}: 403 for another cashiers transaction." Server must return HTTP 403 Forbidden.',
      actual: 'Server returns HTTP 200 OK with Budis full receipt details.',
      evidence: 'Automated test TC-TX-007; Postman test Transactions & RBAC -> IDOR Cashier Access Other Cashier Tx',
    },
    {
      id: 'BUG-05',
      title: 'BUG-05 — Voiding a transaction does not restore sold product stock',
      module: 'Inventory / Transactions Void',
      env: 'Staging / QA Assessment',
      platform: 'Web / API',
      severity: 'Critical',
      priority: 'Critical',
      preconditions: 'BEV-001 Mineral Water stock = 100. Cashier and Manager accounts available.',
      steps: '1. Cashier sells 2x BEV-001 (stock drops 100 -> 98)\n2. Manager voids transaction via UI (or API) with valid reason\n3. Inspect BEV-001 stock on #/sale or GET /api/products/1',
      expected: 'Per /docs: "A completed sale reduces stock by the quantity sold. A voided sale puts the stock back." Stock must return to 100.',
      actual: 'Transaction status becomes voided, but stock remains 98. Inventory is permanently lost.',
      evidence: 'Automated test TC-TX-005; screenshot docs/evidence/bug-05-void-stock-not-restored.png',
    },
    {
      id: 'BUG-06',
      title: 'BUG-06 — Checkout allows ordering quantity exceeding available stock (Negative Inventory)',
      module: 'Checkout / Inventory (/api/transactions)',
      env: 'Staging / QA Assessment',
      platform: 'API',
      severity: 'Critical',
      priority: 'Critical',
      preconditions: 'SNK-003 Roasted Peanuts has stock = 3. Cashier logged in.',
      steps: '1. Call POST /api/transactions with qty 10 for SNK-003 and QRIS payment\n2. Check SNK-003 stock via GET /api/products/7',
      expected: 'Per /docs: "Quantity per line: 1-99, and never more than the stock available." & 422 Checkout rejected. API must return HTTP 422.',
      actual: 'API returns HTTP 201 Created and reduces stock from 3 to -7.',
      evidence: 'Automated test TC-API-008; Postman test Checkout -> Over-Stock Rejected 422',
    },
    {
      id: 'BUG-07',
      title: 'BUG-07 — PPN 11% tax is calculated on gross subtotal before discount instead of (subtotal - discount)',
      module: 'Cart / Price Calculation',
      env: 'Staging / QA Assessment',
      platform: 'Web / API',
      severity: 'Critical',
      priority: 'Critical',
      preconditions: 'Cashier on #/sale.',
      steps: '1. Add 1x GRC-001 Rice (Rp75.000)\n2. Apply promo code HEMAT10 (discount Rp7.500)\n3. Inspect PPN 11% and Total in cart summary',
      expected: 'Per /docs: "tax = round((subtotal - discount) * 0.11)" -> round(67.500 * 0.11) = Rp7.425; total = Rp74.925.',
      actual: 'Server computes tax = round(75.000 * 0.11) = Rp8.250 (before discount) and total = Rp75.750, overcharging customer by Rp825.',
      evidence: 'Automated test TC-PROMO-003; screenshot docs/evidence/bug-07-ppn-before-discount.png',
    },
    {
      id: 'BUG-08',
      title: 'BUG-08 — HEMAT10 promo code ignores Rp20.000 maximum discount cap',
      module: 'Promo Codes (/api/cart/calculate & /api/transactions)',
      env: 'Staging / QA Assessment',
      platform: 'Web / API',
      severity: 'Critical',
      priority: 'High',
      preconditions: 'Cashier on #/sale.',
      steps: '1. Add 4x GRC-001 Rice (subtotal Rp300.000)\n2. Apply promo code HEMAT10\n3. Observe Discount amount',
      expected: 'Per /docs: "HEMAT10: Maximum discount Rp20.000". Discount on Rp300.000 must be capped at Rp20.000.',
      actual: 'Discount is Rp30.000 (uncapped 10%), causing direct revenue leakage.',
      evidence: 'Automated test TC-PROMO-004; screenshot docs/evidence/bug-08-hemat10-no-cap.png',
    },
    {
      id: 'BUG-09',
      title: 'BUG-09 — Promo minimum subtotal validation is exclusive (>) instead of inclusive (>=)',
      module: 'Promo Codes',
      env: 'Staging / QA Assessment',
      platform: 'Web / API',
      severity: 'Major',
      priority: 'High',
      preconditions: 'Cashier on #/sale.',
      steps: '1. Add 2x BEV-003 (exact Rp50.000) and apply HEMAT10\n2. Add 1x BEV-003 (exact Rp25.000) and apply DISKON5K',
      expected: 'Per /docs: Minimum subtotal Rp50.000 (inclusive) and Rp25.000 (inclusive). Both promos must apply.',
      actual: 'Both are rejected with HTTP 400 PROMO_MIN_SUBTOTAL. Promos only apply when subtotal is strictly greater than minimum.',
      evidence: 'Automated test TC-PROMO-005; screenshot docs/evidence/bug-09-promo-min-boundary.png',
    },
    {
      id: 'BUG-10',
      title: 'BUG-10 — Login email is case-sensitive and fails with surrounding whitespace',
      module: 'Authentication (/api/auth/login & #/login)',
      env: 'Staging / QA Assessment',
      platform: 'Web / API',
      severity: 'Major',
      priority: 'High',
      preconditions: 'Account andi@pos.test is active.',
      steps: '1. Login with ANDI@POS.TEST / Password123!\n2. Login with   andi@pos.test   / Password123!',
      expected: 'Per /docs: "Email at login is case-insensitive and surrounding spaces are ignored." Both succeed with HTTP 200.',
      actual: 'Both fail with HTTP 401 INVALID_CREDENTIALS.',
      evidence: 'Automated test TC-AUTH-008; Postman test Auth -> Case-Insensitive & Trimmed Email Login',
    },
    {
      id: 'BUG-11',
      title: 'BUG-11 — Product search (q) is case-sensitive for both product name and SKU',
      module: 'Catalog / Search (GET /api/products?q=)',
      env: 'Staging / QA Assessment',
      platform: 'Web / API',
      severity: 'Major',
      priority: 'High',
      preconditions: 'Cashier on #/sale.',
      steps: '1. Search coffee (lowercase)\n2. Search COFFEE (uppercase)\n3. Search bev-001 (lowercase SKU)',
      expected: 'Per /docs: "Query: q (case-insensitive, name or SKU)". All 3 searches return matching products.',
      actual: 'All 3 return 0 products ("No products found."). Only exact-case queries (Coffee, BEV-001) return results.',
      evidence: 'Automated test TC-SALE-006; screenshot docs/evidence/bug-11-case-sensitive-search.png',
    },
    {
      id: 'BUG-12',
      title: 'BUG-12 — Promo code leaks across sales after New sale / Clear, and Clear causes payment UI desync',
      module: 'Sale Screen / Cart State (#/sale)',
      env: 'Staging / QA Assessment',
      platform: 'Web',
      severity: 'Major',
      priority: 'Medium',
      preconditions: 'Cashier on #/sale.',
      steps: 'Scenario A: Complete sale with HEMAT10, click New sale, add item for next customer.\nScenario B: Add item, apply promo, select QRIS, fill amount paid, click Clear and confirm, add item.',
      expected: 'Both New sale and Clear cleanly reset promoCode, method (to Cash), and amountPaid in both internal state and DOM.',
      actual: 'Scenario A: HEMAT10 remains in sale.promoCode and auto-applies to next customer.\nScenario B: QRIS radio stays checked while Cash box reappears; stale Amount paid 100.000 stays visible while internal state is empty, disabling Pay button.',
      evidence: 'Automated tests TC-SALE-007 & TC-PROMO-006; screenshot docs/evidence/bug-12-clear-cart-desync.png',
    },
  ];

  bugs.forEach((b) => {
    wsBugs.addRow(['Bug ID & Title', b.title]);
    wsBugs.addRow(['Module', b.module]);
    wsBugs.addRow(['Environment', b.env]);
    wsBugs.addRow(['Platform', b.platform]);
    wsBugs.addRow(['Severity', b.severity]);
    wsBugs.addRow(['Priority', b.priority]);
    wsBugs.addRow(['Preconditions', b.preconditions]);
    wsBugs.addRow(['Steps to Reproduce', b.steps]);
    wsBugs.addRow(['Expected Result', b.expected]);
    wsBugs.addRow(['Actual Result', b.actual]);
    wsBugs.addRow(['Attachment / Evidence', b.evidence]);
    wsBugs.addRow(['', '']); // spacer
  });

  const outPath = path.resolve('docs/qa-mart-pos-test-cases-and-defects.xlsx');
  await wb.xlsx.writeFile(outPath);
  console.log(`Excel report generated: ${outPath}`);
}

generateWorkbook().catch(console.error);

