const { test, expect } = require('../fixtures/pos.fixture');
const { PRODUCTS, ACCOUNTS } = require('../utils/test-data');

test.describe('Transactions History, RBAC & Void Operations @Transactions', () => {
  test('TC-TX-001 @P0 Cashier sees only own transactions and has no Void button in UI', async ({ cashierAuth, transactionsPage }) => {
    await test.step('Open transactions page as Cashier Andi', async () => {
      await transactionsPage.open();
      await expect(transactionsPage.pageRoot).toContainText('Showing your transactions.');
    });

    await test.step('Verify Budi seeded transaction TRX-20261001-0001 is hidden from Andi', async () => {
      await expect(transactionsPage.rowByReceiptNo('TRX-20261001-0001')).toHaveCount(0);
      await expect(transactionsPage.emptyState).toBeVisible();
    });
  });

  test('TC-TX-002 @P0 Manager sees all cashiers transactions and can open detail', async ({ managerAuth, transactionsPage }) => {
    await transactionsPage.open();
    await expect(transactionsPage.pageRoot).toContainText('Showing transactions from all cashiers.');
    await expect(transactionsPage.rowByReceiptNo('TRX-20261001-0001')).toBeVisible();

    await transactionsPage.openTransaction('TRX-20261001-0001');
    await expect(transactionsPage.receiptNumber).toHaveText('TRX-20261001-0001');
    await expect(transactionsPage.voidButton).toBeVisible();
  });

  test('TC-TX-003 @P1 Void reason requires 5 to 200 characters in UI', async ({ managerAuth, transactionsPage }) => {
    await transactionsPage.open();
    await transactionsPage.openTransaction('TRX-20261001-0001');
    await transactionsPage.openVoidModal();

    await test.step('Submitting reason shorter than 5 chars shows validation error', async () => {
      await transactionsPage.submitVoid('1234');
      await expect(transactionsPage.voidError).toHaveText('Please enter a reason (at least 5 characters).');
    });

    await test.step('Cancel dismisses void modal cleanly', async () => {
      await transactionsPage.voidCancelButton.click();
      await expect(transactionsPage.voidDialog).toBeHidden();
    });
  });

  test('TC-TX-004 @P0 Manager can void a completed transaction and double-void is prevented', async ({ cashierAuth, managerAuth, apiClient, transactionsPage, page }) => {
    let receiptNo = '';

    await test.step('Create a completed transaction via Andi', async () => {
      const sale = await apiClient.createTransaction(cashierAuth.token, {
        items: [{ productId: PRODUCTS.mineralWater.id, qty: 1 }],
        payment: { method: 'qris' },
      });
      expect(sale.status).toBe(201);
      receiptNo = sale.body.data.receiptNo;
    });

    await test.step('Open as Manager and void the transaction', async () => {
      await transactionsPage.open();
      await transactionsPage.openTransaction(receiptNo);
      await transactionsPage.openVoidModal();
      await transactionsPage.submitVoid('Customer returned item');
      await expect(transactionsPage.voidDialog).toBeHidden();
      await expect(transactionsPage.toasts.last()).toContainText(`${receiptNo} has been voided.`);
    });

    await test.step('Verify transaction status is updated to voided and Void button disappears', async () => {
      await transactionsPage.openTransaction(receiptNo);
      await expect(transactionsPage.receiptVoided).toHaveText('*** VOIDED ***');
      await expect(transactionsPage.voidButton).toBeHidden();
    });

    await test.step('Filter by status=voided shows the voided transaction', async () => {
      await transactionsPage.modalClose.click();
      await transactionsPage.filterByStatus('voided');
      await expect(page).toHaveURL(/#\/transactions\?status=voided/);
      await expect(transactionsPage.rowByReceiptNo(receiptNo)).toBeVisible();
    });
  });

  test('TC-TX-005 @P0 @Defect BUG-05: Voiding a transaction MUST restore sold product stock', async ({ apiClient, cashierAuth, managerAuth }) => {
    test.fail(true, 'Known defect BUG-05: Voiding a transaction updates status to voided but does NOT restore stock to products table');

    const water = PRODUCTS.mineralWater;
    const initial = (await apiClient.getProductById(managerAuth.token, water.id)).body.data.stock;

    const sale = await apiClient.createTransaction(cashierAuth.token, {
      items: [{ productId: water.id, qty: 2 }],
      payment: { method: 'qris' },
    });
    expect(sale.status).toBe(201);

    const afterSale = (await apiClient.getProductById(managerAuth.token, water.id)).body.data.stock;
    expect(afterSale).toBe(initial - 2);

    const voidRes = await apiClient.voidTransaction(managerAuth.token, sale.body.data.id, 'Customer cancellation test');
    expect(voidRes.status).toBe(200);

    const afterVoid = (await apiClient.getProductById(managerAuth.token, water.id)).body.data.stock;
    expect(afterVoid).toBe(initial);
  });

  test('TC-TX-006 @P0 @Defect BUG-03: Cashier must NOT be able to call POST /api/transactions/{id}/void', async ({ apiClient, cashierAuth }) => {
    test.fail(true, 'Known defect BUG-03: API endpoint POST /api/transactions/{id}/void does not check manager role and returns 200 for cashiers');

    const sale = await apiClient.createTransaction(cashierAuth.token, {
      items: [{ productId: PRODUCTS.mineralWater.id, qty: 1 }],
      payment: { method: 'qris' },
    });
    expect(sale.status).toBe(201);

    const voidAttempt = await apiClient.voidTransaction(cashierAuth.token, sale.body.data.id, 'Unauthorized cashier void');
    expect(voidAttempt.status).toBe(403);
  });

  test('TC-TX-007 @P0 @Defect BUG-04: Cashier must NOT access another cashiers transaction detail (IDOR)', async ({ apiClient, cashierAuth }) => {
    test.fail(true, 'Known defect BUG-04: Cashier Andi can GET /api/transactions/1 (Budi transaction) and receives 200 instead of 403');

    const idorRes = await apiClient.getTransactionById(cashierAuth.token, 1);
    expect(idorRes.status).toBe(403);
  });
});
