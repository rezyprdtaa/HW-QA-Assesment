const { test, expect } = require('../fixtures/pos.fixture');
const { ACCOUNTS, PRODUCTS } = require('../utils/test-data');

test.describe('REST API Contract, Product Management, RBAC & Boundaries @API', () => {
  test('TC-API-001 @P0 Health endpoint returns ok and responds under 1000ms', async ({ apiClient }) => {
    const res = await apiClient.health();
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.durationMs).toBeLessThan(1000);
  });

  test('TC-API-002 @P0 Protected endpoints reject missing or invalid Bearer tokens with 401', async ({ apiClient }) => {
    const noToken = await apiClient.me(null);
    expect(noToken.status).toBe(401);

    const badToken = await apiClient.me('invalid-token-123');
    expect(badToken.status).toBe(401);
  });

  test('TC-API-003 @P0 Manager can create and update products; duplicate SKU returns 409', async ({ apiClient }) => {
    const mgrLogin = await apiClient.login(ACCOUNTS.manager.email, ACCOUNTS.manager.password);
    const token = mgrLogin.body.token;

    const created = await apiClient.createProduct(token, {
      sku: 'TST-101',
      name: 'Sparkling Water 500 ml',
      category: 'Beverages',
      price: 9000,
      stock: 25,
    });
    expect(created.status).toBe(201);
    expect(created.body.data.sku).toBe('TST-101');
    expect(created.durationMs).toBeLessThan(1000);

    const updated = await apiClient.updateProduct(token, created.body.data.id, {
      price: 9500,
      stock: 30,
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.price).toBe(9500);
    expect(updated.body.data.stock).toBe(30);

    const duplicate = await apiClient.createProduct(token, {
      sku: 'BEV-001',
      name: 'Duplicate SKU Product',
      category: 'Beverages',
      price: 5000,
      stock: 10,
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_SKU');
  });

  test('TC-API-004 @P0 Cashier cannot create or update products (403 Forbidden)', async ({ apiClient }) => {
    const cashierLogin = await apiClient.login(ACCOUNTS.cashierAndi.email, ACCOUNTS.cashierAndi.password);
    const token = cashierLogin.body.token;

    const createRes = await apiClient.createProduct(token, {
      sku: 'TST-999',
      name: 'Unauthorized Product',
      category: 'Beverages',
      price: 5000,
      stock: 5,
    });
    expect(createRes.status).toBe(403);

    const updateRes = await apiClient.updateProduct(token, PRODUCTS.mineralWater.id, { price: 100 });
    expect(updateRes.status).toBe(403);
  });

  test('TC-API-005 @P1 Product creation validates SKU format, name length, price and stock boundaries', async ({ apiClient }) => {
    const mgrToken = (await apiClient.login(ACCOUNTS.manager.email, ACCOUNTS.manager.password)).body.token;

    const invalidCases = [
      { label: 'price < 100', payload: { sku: 'TST-201', name: 'Too Cheap', category: 'Snacks', price: 99, stock: 5 } },
      { label: 'non-integer price', payload: { sku: 'TST-202', name: 'Float Price', category: 'Snacks', price: 1500.5, stock: 5 } },
      { label: 'negative stock', payload: { sku: 'TST-203', name: 'Negative Stock', category: 'Snacks', price: 5000, stock: -1 } },
      { label: 'name > 80 chars', payload: { sku: 'TST-204', name: 'A'.repeat(81), category: 'Snacks', price: 5000, stock: 5 } },
      { label: 'bad SKU pattern', payload: { sku: 'bad sku!', name: 'Bad SKU', category: 'Snacks', price: 5000, stock: 5 } },
      { label: 'unknown category', payload: { sku: 'TST-205', name: 'Bad Cat', category: 'Electronics', price: 5000, stock: 5 } },
    ];

    for (const c of invalidCases) {
      const res = await apiClient.createProduct(mgrToken, c.payload);
      expect(res.status, `Expected 400 for ${c.label}`).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  test('TC-API-006 @P1 Checkout rejects out-of-stock item (422) and mismatched card/qris amountPaid (400)', async ({ apiClient }) => {
    const token = (await apiClient.login(ACCOUNTS.cashierAndi.email, ACCOUNTS.cashierAndi.password)).body.token;

    const oosRes = await apiClient.createTransaction(token, {
      items: [{ productId: PRODUCTS.sugarOutOfStock.id, qty: 1 }],
      payment: { method: 'qris' },
    });
    expect(oosRes.status).toBe(422);

    const badCardRes = await apiClient.createTransaction(token, {
      items: [{ productId: PRODUCTS.mineralWater.id, qty: 1 }],
      payment: { method: 'card', amountPaid: 99999 },
    });
    expect(badCardRes.status).toBe(400);

    const badQrisRes = await apiClient.createTransaction(token, {
      items: [{ productId: PRODUCTS.mineralWater.id, qty: 1 }],
      payment: { method: 'qris', amountPaid: 100 },
    });
    expect(badQrisRes.status).toBe(400);
  });

  test('TC-API-007 @P1 Voiding an already-voided transaction returns 409 Conflict', async ({ apiClient }) => {
    const mgrToken = (await apiClient.login(ACCOUNTS.manager.email, ACCOUNTS.manager.password)).body.token;

    const first = await apiClient.voidTransaction(mgrToken, 1, 'First legitimate void reason');
    expect(first.status).toBe(200);

    const second = await apiClient.voidTransaction(mgrToken, 1, 'Second duplicate void attempt');
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('ALREADY_VOIDED');
  });

  test('TC-API-008 @P0 @Defect BUG-06: Checkout exceeding available stock must be rejected with 422 (no negative inventory)', async ({ apiClient }) => {
    test.fail(true, 'Known defect BUG-06: Ordering qty 10 of SNK-003 (stock 3) succeeds with HTTP 201 and drives stock to -7');

    const token = (await apiClient.login(ACCOUNTS.cashierAndi.email, ACCOUNTS.cashierAndi.password)).body.token;
    const res = await apiClient.createTransaction(token, {
      items: [{ productId: PRODUCTS.roastedPeanuts.id, qty: 10 }],
      payment: { method: 'qris' },
    });

    expect(res.status).toBe(422);
  });
});

