const { test: base, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { SalePage } = require('../pages/SalePage');
const { TransactionsPage } = require('../pages/TransactionsPage');
const { PosApiClient } = require('../utils/api-client');
const { ACCOUNTS } = require('../utils/test-data');

/**
 * Authenticates via API and injects session into localStorage so UI tests
 * start directly in an authenticated, deterministic state without repeating login clicks.
 */
async function authenticatePage(page, apiClient, account) {
  const res = await apiClient.login(account.email, account.password);
  expect(res.status, `API login failed for ${account.email}`).toBe(200);
  await page.goto('/#/login');
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('pos_token', token);
      localStorage.setItem('pos_user', JSON.stringify(user));
    },
    { token: res.body.token, user: res.body.user }
  );
  await page.goto('/#/sale');
  return res.body.token;
}

const test = base.extend({
  apiClient: async ({ request }, use) => {
    const client = new PosApiClient(request);
    await use(client);
  },

  /**
   * Automatic state isolation fixture: resets remote test data BEFORE each test
   * so every test starts from the deterministic initial seed (15 products, 1 seeded transaction).
   */
  resetState: [
    async ({ apiClient }, use) => {
      const res = await apiClient.resetTestData();
      expect(res.status).toBe(200);
      await use();
    },
    { auto: true },
  ],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  salePage: async ({ page }, use) => {
    await use(new SalePage(page));
  },

  transactionsPage: async ({ page }, use) => {
    await use(new TransactionsPage(page));
  },

  cashierAuth: async ({ page, apiClient }, use) => {
    const token = await authenticatePage(page, apiClient, ACCOUNTS.cashierAndi);
    const salePage = new SalePage(page);
    await salePage.waitForReady();
    await use({ page, salePage, token, account: ACCOUNTS.cashierAndi });
  },

  managerAuth: async ({ page, apiClient }, use) => {
    const token = await authenticatePage(page, apiClient, ACCOUNTS.manager);
    const salePage = new SalePage(page);
    await salePage.waitForReady();
    await use({ page, salePage, token, account: ACCOUNTS.manager });
  },
});

module.exports = { test, expect };

