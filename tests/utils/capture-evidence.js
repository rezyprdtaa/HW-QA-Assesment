const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { LoginPage } = require('../pages/LoginPage');
const { SalePage } = require('../pages/SalePage');
const { TransactionsPage } = require('../pages/TransactionsPage');

const EVIDENCE_DIR = path.resolve(__dirname, '../../docs/evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const BASE_URL = 'https://qa-assessment.holywings.id';

async function resetBackend() {
  await fetch(`${BASE_URL}/api/test/reset`, { method: 'POST' });
}

async function run() {
  console.log('Resetting backend data...');
  await resetBackend();

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  const salePage = new SalePage(page);
  const transactionsPage = new TransactionsPage(page);

  async function resetAndLogin(email = 'andi@pos.test', password = 'Password123!') {
    await resetBackend();
    await loginPage.open();
    await loginPage.login(email, password);
    await salePage.waitForReady();
  }

  // 1. BUG-01: Suspended login returns 500 alert "Something went wrong."
  console.log('Capturing BUG-01...');
  await loginPage.open();
  await loginPage.login('suspended@pos.test', 'Password123!');
  await loginPage.loginAlert.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'bug-01-suspended-login.png') });

  // 2. BUG-10: Login email case-sensitive
  console.log('Capturing BUG-10...');
  await loginPage.open();
  await loginPage.login('ANDI@POS.TEST', 'Password123!');
  await loginPage.loginAlert.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'bug-10-email-case-sensitive.png') });

  // 3. BUG-11: Case-sensitive product search
  console.log('Capturing BUG-11...');
  await resetAndLogin();
  await salePage.search('coffee');
  await salePage.productsEmpty.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'bug-11-case-sensitive-search.png') });

  // 4. BUG-09: Promo min boundary exclusive (2x BEV-003 = exact 50.000)
  console.log('Capturing BUG-09...');
  await resetAndLogin();
  await salePage.addProductToCart('BEV-003');
  await salePage.addProductToCart('BEV-003');
  await salePage.applyPromo('HEMAT10');
  await salePage.promoMessage.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'bug-09-promo-min-boundary.png') });

  // 5. BUG-07: PPN calculated before discount
  console.log('Capturing BUG-07...');
  await resetAndLogin();
  await salePage.addProductToCart('GRC-001');
  await salePage.applyPromo('HEMAT10');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'bug-07-ppn-before-discount.png') });

  // 6. BUG-08: HEMAT10 no cap (4x GRC-001 Rice 5kg Rp75.000 = Rp300.000 -> discount 30.000 instead of 20.000)
  console.log('Capturing BUG-08...');
  await resetAndLogin();
  for (let i = 0; i < 4; i++) {
    await salePage.addProductToCart('GRC-001');
  }
  await salePage.applyPromo('HEMAT10');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'bug-08-hemat10-no-cap.png') });

  // 7. BUG-12: Clear cart / New sale desync
  console.log('Capturing BUG-12...');
  await resetAndLogin();
  await salePage.addProductToCart('GRC-001');
  await salePage.applyPromo('HEMAT10');
  await salePage.amountPaidInput.fill('100000');
  await salePage.selectPaymentMethod('qris');
  await page.waitForTimeout(300);
  await salePage.clearCart();
  await salePage.addProductToCart('BEV-001');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'bug-12-clear-cart-desync.png') });

  // 8. BUG-05: Void stock not restored
  console.log('Capturing BUG-05...');
  await resetAndLogin();
  // Buy 2 Mineral Water (BEV-001, stock 100)
  await salePage.addProductToCart('BEV-001');
  await salePage.addProductToCart('BEV-001');
  await salePage.selectPaymentMethod('qris');
  await salePage.completePayment();
  await salePage.receiptDialog.waitFor({ state: 'visible' });
  await salePage.newSaleButton.click();
  await salePage.waitForReady();

  // Login as Manager to void
  await loginPage.open();
  await loginPage.login('manager@pos.test', 'Password123!');
  await transactionsPage.open();
  await transactionsPage.waitForReady();

  const firstTx = transactionsPage.transactionRows.first();
  await firstTx.click();
  await transactionsPage.voidButton.click();
  await transactionsPage.confirmVoid('Customer cancellation verification test');
  await page.waitForTimeout(1000);

  // Return to Sale page to see stock
  await salePage.open();
  await salePage.waitForReady();
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'bug-05-void-stock-not-restored.png') });

  // 9. BUG-06: Checkout overselling resulting in negative stock
  console.log('Capturing BUG-06...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'andi@pos.test', password: 'Password123!' })
  }).then(r => r.json());
  const token = loginRes.token;

  // Checkout 10x SNK-003 (stock is 3)
  await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ items: [{ productId: 7, qty: 10 }], payment: { method: 'qris' } })
  });

  // Now view in Sale catalog (shows stock: -7)
  await page.reload();
  await salePage.waitForReady();
  await salePage.search('SNK-003');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'bug-06-checkout-overselling-negative-stock.png') });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error capturing evidence:', err);
  process.exit(1);
});
