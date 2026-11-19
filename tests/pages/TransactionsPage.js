const { BasePage } = require('./BasePage');

class TransactionsPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.pageRoot = page.getByTestId('transactions-page');
    this.statusFilter = page.getByTestId('status-filter');
    this.table = page.getByTestId('transactions-table');
    this.rows = page.getByTestId('transaction-row');
    this.emptyState = page.getByTestId('transactions-empty');

    // Transaction detail modal
    this.transactionDialog = page.getByTestId('transaction-dialog');
    this.receiptNumber = page.getByTestId('receipt-number');
    this.receiptVoided = page.getByTestId('receipt-voided');
    this.voidButton = page.getByTestId('void-button');

    // Void confirmation modal
    this.voidDialog = page.getByTestId('void-dialog');
    this.voidReasonInput = page.getByTestId('void-reason');
    this.voidError = page.getByTestId('void-error');
    this.voidCancelButton = page.getByTestId('void-cancel');
    this.voidConfirmButton = page.getByTestId('void-confirm');
  }

  async open() {
    await this.goto('/#/transactions');
    await this.pageRoot.waitFor({ state: 'visible' });
  }

  rowByReceiptNo(receiptNo) {
    return this.rows.filter({ hasText: receiptNo });
  }

  async filterByStatus(status) {
    await this.statusFilter.selectOption(status);
  }

  async openTransaction(receiptNo) {
    await this.rowByReceiptNo(receiptNo).click();
    await this.transactionDialog.waitFor({ state: 'visible' });
  }

  async openVoidModal() {
    await this.voidButton.click();
    await this.voidDialog.waitFor({ state: 'visible' });
  }

  async submitVoid(reason) {
    await this.voidReasonInput.fill(reason);
    await this.voidConfirmButton.click();
  }
}

module.exports = { TransactionsPage };

