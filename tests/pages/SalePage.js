const { BasePage } = require('./BasePage');

class SalePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.salePageRoot = page.getByTestId('sale-page');
    this.searchInput = page.getByTestId('product-search');
    this.categoryTabs = page.getByTestId('category-tabs');
    this.productGrid = page.getByTestId('product-grid');
    this.productCards = page.getByTestId('product-card');
    this.productsEmpty = page.getByTestId('products-empty');

    // Cart
    this.cartCount = page.getByTestId('cart-count');
    this.cartLines = page.getByTestId('cart-line');
    this.cartEmpty = page.getByTestId('cart-empty');

    // Promo
    this.promoInput = page.getByTestId('promo-input');
    this.promoApplyButton = page.getByTestId('promo-apply');
    this.promoRemoveButton = page.getByTestId('promo-remove');
    this.promoMessage = page.getByTestId('promo-message');

    // Summary
    this.summarySubtotal = page.getByTestId('summary-subtotal');
    this.summaryDiscount = page.getByTestId('summary-discount');
    this.summaryTax = page.getByTestId('summary-tax');
    this.summaryTotal = page.getByTestId('summary-total');

    // Payment
    this.paymentCash = page.getByTestId('payment-cash');
    this.paymentCard = page.getByTestId('payment-card');
    this.paymentQris = page.getByTestId('payment-qris');
    this.amountPaidInput = page.getByTestId('amount-paid');
    this.changeAmount = page.getByTestId('change-amount');
    this.paymentError = page.getByTestId('payment-error');
    this.clearCartButton = page.getByTestId('clear-cart');
    this.payButton = page.getByTestId('pay-button');

    // Receipt Modal
    this.receiptDialog = page.getByTestId('receipt-dialog');
    this.receiptNumber = page.getByTestId('receipt-number');
    this.receiptCashier = page.getByTestId('receipt-cashier');
    this.receiptSubtotal = page.getByTestId('receipt-subtotal');
    this.receiptDiscount = page.getByTestId('receipt-discount');
    this.receiptTax = page.getByTestId('receipt-tax');
    this.receiptTotal = page.getByTestId('receipt-total');
    this.receiptPaid = page.getByTestId('receipt-paid');
    this.receiptChange = page.getByTestId('receipt-change');
    this.newSaleButton = page.getByTestId('new-sale-button');
  }

  async waitForReady() {
    await this.salePageRoot.waitFor({ state: 'visible' });
    await this.productCards.first().waitFor({ state: 'visible' });
  }

  productCardBySku(sku) {
    return this.page.locator(`[data-testid="product-card"][data-sku="${sku}"]`);
  }

  productStockBySku(sku) {
    return this.productCardBySku(sku).getByTestId('product-stock');
  }

  cartLineByProductId(productId) {
    return this.page.locator(`[data-testid="cart-line"][data-product-id="${productId}"]`);
  }

  categoryTab(slug) {
    return this.page.getByTestId(`category-${slug}`);
  }

  async selectCategory(slug) {
    await this.categoryTab(slug).click();
  }

  async search(query) {
    await this.searchInput.fill(query);
    // Debounce is 250ms in app.js; wait for network request to /api/products to settle
    await this.page.waitForResponse((res) => res.url().includes('/api/products') && res.status() === 200);
  }

  async addProductBySku(sku, times = 1) {
    const card = this.productCardBySku(sku);
    for (let i = 0; i < times; i++) {
      await card.click();
    }
  }

  async setCartItemQuantity(productId, qty) {
    const line = this.cartLineByProductId(productId);
    const input = line.getByTestId('qty-input');
    await input.fill(String(qty));
    await input.blur();
  }

  async increaseCartItem(productId) {
    await this.cartLineByProductId(productId).getByTestId('qty-increase').click();
  }

  async decreaseCartItem(productId) {
    await this.cartLineByProductId(productId).getByTestId('qty-decrease').click();
  }

  async removeCartItem(productId) {
    await this.cartLineByProductId(productId).getByTestId('remove-line').click();
  }

  async applyPromo(code) {
    await this.promoInput.fill(code);
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/cart/calculate')
    );
    await this.promoApplyButton.click();
    await responsePromise;
  }

  async removePromo() {
    await this.promoRemoveButton.click();
  }

  async selectPaymentMethod(method) {
    const target =
      method === 'cash' ? this.paymentCash :
      method === 'card' ? this.paymentCard :
      this.paymentQris;
    // The radio input is styled inside a clickable <label> pill that intercepts pointer events
    await target.locator('..').click();
  }

  async fillAmountPaid(amount) {
    await this.amountPaidInput.fill(String(amount));
  }

  async clickPay() {
    await this.payButton.click();
  }

  async clearCart(acceptConfirm = true) {
    this.page.once('dialog', async (dialog) => {
      if (acceptConfirm) await dialog.accept();
      else await dialog.dismiss();
    });
    await this.clearCartButton.click();
  }

  async startNewSale() {
    await this.newSaleButton.click();
    await this.receiptDialog.waitFor({ state: 'hidden' });
  }
}

module.exports = { SalePage };
