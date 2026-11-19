const { test, expect } = require('../fixtures/pos.fixture');
const { ACCOUNTS } = require('../utils/test-data');

test.describe('Authentication & Session Management @Auth', () => {
  test('TC-AUTH-001 @P0 Cashier can log in and log out normally', async ({ loginPage, salePage, page }) => {
    await test.step('Open login page and sign in as Cashier Andi', async () => {
      await loginPage.open();
      await loginPage.login(ACCOUNTS.cashierAndi.email, ACCOUNTS.cashierAndi.password);
    });

    await test.step('Verify redirect to Sale screen and user badge', async () => {
      await salePage.waitForReady();
      await expect(page).toHaveURL(/#\/sale/);
      await expect(salePage.userName).toHaveText(ACCOUNTS.cashierAndi.name);
      await expect(salePage.userRole).toHaveText('cashier');
    });

    await test.step('Log out and verify protected route redirects back to login', async () => {
      await salePage.logout();
      await expect(page).toHaveURL(/#\/login/);
      await expect(loginPage.loginPageRoot).toBeVisible();
      await page.goto('/#/sale');
      await expect(page).toHaveURL(/#\/login/);
    });
  });

  test('TC-AUTH-002 @P0 Manager can log in and sees manager role', async ({ loginPage, salePage, page }) => {
    await test.step('Sign in as Manager', async () => {
      await loginPage.open();
      await loginPage.login(ACCOUNTS.manager.email, ACCOUNTS.manager.password);
    });

    await test.step('Verify redirect and manager role display', async () => {
      await salePage.waitForReady();
      await expect(page).toHaveURL(/#\/sale/);
      await expect(salePage.userName).toHaveText(ACCOUNTS.manager.name);
      await expect(salePage.userRole).toHaveText('manager');
    });
  });

  test('TC-AUTH-003 @P0 Empty credentials show inline validation errors', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.submitButton.click();

    await expect(loginPage.emailError).toHaveText('Email is required.');
    await expect(loginPage.passwordError).toHaveText('Password is required.');
  });

  test('TC-AUTH-004 @P1 Invalid email format is rejected client-side', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login('not-an-email', 'Password123!');

    await expect(loginPage.emailError).toHaveText('Please enter a valid email address.');
  });

  test('TC-AUTH-005 @P0 Invalid password is rejected with clear error message', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(ACCOUNTS.cashierAndi.email, 'WrongPass999!');

    await expect(loginPage.loginAlert).toBeVisible();
    await expect(loginPage.loginAlert).toHaveText('Invalid email or password.');
  });

  test('TC-AUTH-006 @P1 Account locks for 60s (HTTP 423) after 5 failed attempts', async ({ apiClient }) => {
    for (let i = 0; i < 5; i++) {
      const attempt = await apiClient.login(ACCOUNTS.cashierBudi.email, 'WrongPass!');
      expect(attempt.status).toBe(401);
    }

    const locked = await apiClient.login(ACCOUNTS.cashierBudi.email, ACCOUNTS.cashierBudi.password);
    expect(locked.status).toBe(423);
    expect(locked.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  test('TC-AUTH-007 @P0 @Defect BUG-01: Suspended account must return 403 with clear suspended message', async ({ loginPage, page }) => {
    test.fail(true, 'Known defect BUG-01: POST /api/auth/login returns HTTP 500 INTERNAL_ERROR ("Something went wrong.") instead of 403 for suspended@pos.test');

    await loginPage.open();
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/auth/login'));
    await loginPage.login(ACCOUNTS.suspended.email, ACCOUNTS.suspended.password);
    const response = await responsePromise;

    expect(response.status()).toBe(403);
    await expect(loginPage.loginAlert).toContainText(/suspend/i);
  });

  test('TC-AUTH-008 @P1 @Defect BUG-10: Login email should be case-insensitive and ignore surrounding spaces', async ({ apiClient }) => {
    test.fail(true, 'Known defect BUG-10: Login rejects uppercase and whitespace-padded email with 401 INVALID_CREDENTIALS');

    const upper = await apiClient.login('ANDI@POS.TEST', ACCOUNTS.cashierAndi.password);
    expect(upper.status).toBe(200);

    const padded = await apiClient.login('  andi@pos.test  ', ACCOUNTS.cashierAndi.password);
    expect(padded.status).toBe(200);
  });

  test('TC-AUTH-009 @P0 @Defect BUG-02: Token must stop working immediately after logout', async ({ apiClient }) => {
    test.fail(true, 'Known defect BUG-02: Logged-out Bearer token continues returning HTTP 200 on /api/auth/me instead of 401');

    const loginRes = await apiClient.login(ACCOUNTS.cashierBudi.email, ACCOUNTS.cashierBudi.password);
    expect(loginRes.status).toBe(200);

    const logoutRes = await apiClient.logout(loginRes.body.token);
    expect(logoutRes.status).toBe(204);

    const meAfterLogout = await apiClient.me(loginRes.body.token);
    expect(meAfterLogout.status).toBe(401);
  });
});

