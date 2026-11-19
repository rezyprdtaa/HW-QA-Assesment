const { test, expect } = require('../fixtures/pos.fixture');
const { PRODUCTS, PROMOS, calculateExpectedTotals, formatRupiah } = require('../utils/test-data');

test.describe('Promo Codes, PPN 11% Calculation & Checkout Payment @Checkout', () => {
  test('TC-PAY-001 @P0 Cash checkout calculates PPN 11%, change, shows receipt, and reduces stock', async ({ cashierAuth }) => {
    const { salePage } = cashierAuth;
    const item = PRODUCTS.mineralWater; // Rp4.000, stock 100
    const expected = calculateExpectedTotals([{ price: item.price, qty: 2 }]); // sub 8000, tax 880, total 8880

    await test.step('Add 2x Mineral Water and verify summary', async () => {
      await salePage.addProductBySku(item.sku, 2);
      await expect(salePage.summarySubtotal).toHaveText(formatRupiah(expected.subtotal));
      await expect(salePage.summaryDiscount).toHaveText('-Rp0');
      await expect(salePage.summaryTax).toHaveText(formatRupiah(expected.tax));
      await expect(salePage.summaryTotal).toHaveText(formatRupiah(expected.total));
    });

    await test.step('Pay with Cash Rp10.000 and verify change', async () => {
      await salePage.fillAmountPaid(10000);
      await expect(salePage.changeAmount).toHaveText(formatRupiah(10000 - expected.total));
      await salePage.clickPay();
    });

    await test.step('Verify receipt modal details', async () => {
      await expect(salePage.receiptDialog).toBeVisible();
      await expect(salePage.receiptNumber).toHaveText(/TRX-\d{8}-\d{4}/);
      await expect(salePage.receiptSubtotal).toHaveText(formatRupiah(expected.subtotal));
      await expect(salePage.receiptTax).toHaveText(formatRupiah(expected.tax));
      await expect(salePage.receiptTotal).toHaveText(formatRupiah(expected.total));
      await expect(salePage.receiptPaid).toHaveText(formatRupiah(10000));
      await expect(salePage.receiptChange).toHaveText(formatRupiah(10000 - expected.total));
    });

    await test.step('Start new sale and verify stock decreased from 100 to 98', async () => {
      await salePage.startNewSale();
      await salePage.waitForReady();
      await expect(salePage.productStockBySku(item.sku)).toHaveText('Stock: 98');
    });
  });

  test('TC-PAY-002 @P0 Cash payment under total is rejected with clear error', async ({ cashierAuth }) => {
    const { salePage } = cashierAuth;

    await salePage.addProductBySku(PRODUCTS.rice.sku); // 75,000 + 8,250 = 83,250
    await expect(salePage.summaryTotal).toHaveText('Rp83.250');

    await salePage.fillAmountPaid(50000);
    await expect(salePage.changeAmount).toHaveText('Rp0');
    await salePage.clickPay();

    await expect(salePage.paymentError).toHaveText('Amount paid is less than the total (Rp83.250).');
    await expect(salePage.receiptDialog).toBeHidden();
  });

  test('TC-PAY-003 @P0 Card and QRIS checkouts charge exact total without cash input', async ({ cashierAuth }) => {
    const { salePage } = cashierAuth;

    await test.step('Complete Card checkout', async () => {
      await salePage.addProductBySku(PRODUCTS.icedTea.sku); // 5000 + 550 = 5550
      await salePage.selectPaymentMethod('card');
      await expect(salePage.amountPaidInput).toBeHidden();
      await salePage.clickPay();
      await expect(salePage.receiptDialog).toBeVisible();
      await expect(salePage.receiptPaid).toHaveText('Rp5.550');
      await expect(salePage.receiptChange).toHaveText('Rp0');
      await salePage.startNewSale();
    });

    await test.step('Complete QRIS checkout', async () => {
      await salePage.waitForReady();
      await salePage.addProductBySku(PRODUCTS.mineralWater.sku); // 4000 + 440 = 4440
      await salePage.selectPaymentMethod('qris');
      await expect(salePage.amountPaidInput).toBeHidden();
      await salePage.clickPay();
      await expect(salePage.receiptDialog).toBeVisible();
      await expect(salePage.receiptPaid).toHaveText('Rp4.440');
      await expect(salePage.receiptChange).toHaveText('Rp0');
    });
  });

  test('TC-PROMO-001 @P1 Invalid and expired promo codes (LAMA2025) are rejected', async ({ cashierAuth }) => {
    const { salePage } = cashierAuth;
    await salePage.addProductBySku(PRODUCTS.rice.sku);

    await test.step('Apply unknown promo code', async () => {
      await salePage.applyPromo(PROMOS.invalid.code);
      await expect(salePage.promoMessage).toHaveText('Promo code is not valid.');
    });

    await test.step('Apply expired promo code LAMA2025', async () => {
      await salePage.applyPromo(PROMOS.expired.code);
      await expect(salePage.promoMessage).toHaveText('Promo code has expired.');
    });
  });

  test('TC-PROMO-002 @P1 Removing applied promo recalculates summary back to full subtotal', async ({ cashierAuth }) => {
    const { salePage } = cashierAuth;
    await salePage.addProductBySku(PRODUCTS.rice.sku); // 75,000

    await salePage.applyPromo('HEMAT10');
    await expect(salePage.promoMessage).toHaveText('Promo HEMAT10 applied.');
    await expect(salePage.summaryDiscount).toHaveText('-Rp7.500');

    await salePage.removePromo();
    await expect(salePage.summaryDiscount).toHaveText('-Rp0');
    await expect(salePage.summaryTotal).toHaveText('Rp83.250');
  });

  test('TC-PROMO-003 @P0 @Defect BUG-07: PPN 11% must be calculated on (subtotal - discount)', async ({ cashierAuth }) => {
    test.fail(true, 'Known defect BUG-07: Tax is computed as round(subtotal * 0.11) before discount instead of round((subtotal - discount) * 0.11)');
    const { salePage } = cashierAuth;

    await salePage.addProductBySku(PRODUCTS.rice.sku); // subtotal = 75,000
    await salePage.applyPromo('HEMAT10'); // discount = 7,500
    const expected = calculateExpectedTotals([{ price: PRODUCTS.rice.price, qty: 1 }], 'HEMAT10');
    // Expected tax = round((75000 - 7500) * 0.11) = 7,425; actual is 8,250!

    await expect(salePage.summaryTax).toHaveText(formatRupiah(expected.tax));
    await expect(salePage.summaryTotal).toHaveText(formatRupiah(expected.total));
  });

  test('TC-PROMO-004 @P0 @Defect BUG-08: HEMAT10 discount must be capped at Rp20.000', async ({ cashierAuth }) => {
    test.fail(true, 'Known defect BUG-08: HEMAT10 grants uncapped 10% discount (Rp30.000 on Rp300.000) instead of max Rp20.000');
    const { salePage } = cashierAuth;

    await salePage.addProductBySku(PRODUCTS.rice.sku, 4); // subtotal = 300,000
    await salePage.applyPromo('HEMAT10');

    await expect(salePage.summaryDiscount).toHaveText('-Rp20.000');
  });

  test('TC-PROMO-005 @P1 @Defect BUG-09: Inclusive minimum subtotal boundaries (Rp50.000 HEMAT10 & Rp25.000 DISKON5K) must succeed', async ({ cashierAuth }) => {
    test.fail(true, 'Known defect BUG-09: Minimum subtotal check uses strict > instead of inclusive >=, rejecting exact Rp50.000 and Rp25.000');
    const { salePage } = cashierAuth;

    await salePage.addProductBySku(PRODUCTS.instantCoffee.sku, 2); // exact Rp50.000
    await salePage.applyPromo('HEMAT10');
    await expect(salePage.promoMessage).toHaveText('Promo HEMAT10 applied.');
    await expect(salePage.summaryDiscount).toHaveText('-Rp5.000');
  });

  test('TC-PROMO-006 @P1 @Defect BUG-12: Promo code must NOT leak into the next sale after clicking New sale', async ({ cashierAuth }) => {
    test.fail(true, 'Known defect BUG-12: resetSale(false) keeps sale.promoCode after completing a sale, auto-applying it to the next customer');
    const { salePage } = cashierAuth;

    await salePage.addProductBySku(PRODUCTS.rice.sku);
    await salePage.applyPromo('HEMAT10');
    await salePage.selectPaymentMethod('qris');
    await salePage.clickPay();
    await expect(salePage.receiptDialog).toBeVisible();
    await salePage.startNewSale();
    await salePage.waitForReady();

    await salePage.addProductBySku(PRODUCTS.rice.sku);
    await expect(salePage.summaryDiscount).toHaveText('-Rp0');
    await expect(salePage.promoMessage).toHaveText('');
  });
});
