const { test, expect } = require('../fixtures/pos.fixture');
const { PRODUCTS } = require('../utils/test-data');

test.describe('Sale Screen — Catalog, Search & Cart Operations @Sale', () => {
  test('TC-SALE-001 @P0 Displays all 15 seeded products and disables out-of-stock item', async ({ cashierAuth }) => {
    const { salePage } = cashierAuth;

    await expect(salePage.productCards).toHaveCount(15);
    const oosCard = salePage.productCardBySku(PRODUCTS.sugarOutOfStock.sku);
    await expect(oosCard).toBeDisabled();
    await expect(oosCard.getByTestId('product-stock')).toHaveText('Out of stock');
  });

  test('TC-SALE-002 @P1 Category filter narrows product list and All restores catalog', async ({ cashierAuth }) => {
    const { salePage } = cashierAuth;

    await test.step('Filter by Snacks category', async () => {
      await salePage.selectCategory('snacks');
      await expect(salePage.productCards).toHaveCount(3);
      await expect(salePage.productCardBySku(PRODUCTS.potatoChips.sku)).toBeVisible();
    });

    await test.step('Return to All category', async () => {
      await salePage.selectCategory('all');
      await expect(salePage.productCards).toHaveCount(15);
    });
  });

  test('TC-SALE-003 @P1 Search by exact-case product name and SKU works', async ({ cashierAuth }) => {
    const { salePage } = cashierAuth;

    await test.step('Search by product name "Coffee"', async () => {
      await salePage.search('Coffee');
      await expect(salePage.productCards).toHaveCount(1);
      await expect(salePage.productCardBySku(PRODUCTS.instantCoffee.sku)).toBeVisible();
    });

    await test.step('Search by SKU "BEV-001"', async () => {
      await salePage.search('BEV-001');
      await expect(salePage.productCards).toHaveCount(1);
      await expect(salePage.productCardBySku(PRODUCTS.mineralWater.sku)).toBeVisible();
    });

    await test.step('Search with no matches displays empty state', async () => {
      await salePage.search('NonExistentItemXYZ');
      await expect(salePage.productsEmpty).toHaveText('No products found.');
    });
  });

  test('TC-SALE-004 @P0 Add, update quantity, enforce stock boundary, and remove cart items', async ({ cashierAuth }) => {
    const { salePage } = cashierAuth;
    const peanuts = PRODUCTS.roastedPeanuts; // Initial stock = 3

    await test.step('Add item and increment up to available stock (3)', async () => {
      await salePage.addProductBySku(peanuts.sku);
      await expect(salePage.cartCount).toHaveText('1 item');
      await salePage.increaseCartItem(peanuts.id);
      await salePage.increaseCartItem(peanuts.id);
      await expect(salePage.cartLineByProductId(peanuts.id).getByTestId('qty-input')).toHaveValue('3');
    });

    await test.step('Exceeding available stock shows toast warning and caps at 3', async () => {
      await salePage.increaseCartItem(peanuts.id);
      await expect(salePage.toasts.last()).toContainText(`Only 3 ${peanuts.name} left in stock.`);
      await expect(salePage.cartLineByProductId(peanuts.id).getByTestId('qty-input')).toHaveValue('3');
    });

    await test.step('Direct input above stock clamps to 3, and 0 removes item', async () => {
      await salePage.setCartItemQuantity(peanuts.id, 10);
      await expect(salePage.cartLineByProductId(peanuts.id).getByTestId('qty-input')).toHaveValue('3');
      await salePage.setCartItemQuantity(peanuts.id, 0);
      await expect(salePage.cartEmpty).toBeVisible();
    });
  });

  test('TC-SALE-005 @P1 Remove button removes individual cart line', async ({ cashierAuth }) => {
    const { salePage } = cashierAuth;

    await salePage.addProductBySku(PRODUCTS.mineralWater.sku);
    await salePage.addProductBySku(PRODUCTS.icedTea.sku);
    await expect(salePage.cartLines).toHaveCount(2);

    await salePage.removeCartItem(PRODUCTS.mineralWater.id);
    await expect(salePage.cartLines).toHaveCount(1);
    await expect(salePage.cartLineByProductId(PRODUCTS.icedTea.id)).toBeVisible();
  });

  test('TC-SALE-006 @P1 @Defect BUG-11: Product search must be case-insensitive for name and SKU', async ({ cashierAuth }) => {
    test.fail(true, 'Known defect BUG-11: GET /api/products?q= is case-sensitive; lowercase "coffee" and "bev-001" return 0 results');
    const { salePage } = cashierAuth;

    await salePage.search('coffee');
    await expect(salePage.productCards).toHaveCount(1);
    await expect(salePage.productCardBySku(PRODUCTS.instantCoffee.sku)).toBeVisible();

    await salePage.search('bev-001');
    await expect(salePage.productCards).toHaveCount(1);
    await expect(salePage.productCardBySku(PRODUCTS.mineralWater.sku)).toBeVisible();
  });

  test('TC-SALE-007 @P2 @Defect BUG-12: Clear cart must reset promo input, payment method radio, and amount paid UI', async ({ cashierAuth }) => {
    test.fail(true, 'Known defect BUG-12: Clear cart leaves stale promo code, keeps QRIS checked while showing Cash box, and retains stale Amount paid DOM text');
    const { salePage } = cashierAuth;

    await salePage.addProductBySku(PRODUCTS.rice.sku);
    await salePage.applyPromo('HEMAT10');
    await expect(salePage.promoMessage).toContainText('Promo HEMAT10 applied.');

    await salePage.fillAmountPaid(100000);
    await salePage.selectPaymentMethod('qris');
    await salePage.clearCart(true);

    await expect(salePage.cartEmpty).toBeVisible();
    await expect(salePage.promoInput).toHaveValue('');
    await expect(salePage.paymentCash).toBeChecked();
    await expect(salePage.amountPaidInput).toHaveValue('');
  });
});

