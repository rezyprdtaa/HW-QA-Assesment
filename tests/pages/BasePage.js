class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.navLogo = page.getByTestId('nav-logo');
    this.navSale = page.getByTestId('nav-sale');
    this.navTransactions = page.getByTestId('nav-transactions');
    this.userName = page.getByTestId('user-name');
    this.userRole = page.getByTestId('user-role');
    this.logoutButton = page.getByTestId('logout-button');
    this.toasts = page.getByTestId('toast');
    this.modal = page.getByTestId('modal');
    this.modalTitle = page.getByTestId('modal-title');
    this.modalClose = page.getByTestId('modal-close');
  }

  async goto(hashPath = '/#/login') {
    await this.page.goto(hashPath);
  }

  async logout() {
    await this.logoutButton.click();
  }

  async goToSale() {
    await this.navSale.click();
  }

  async goToTransactions() {
    await this.navTransactions.click();
  }
}

module.exports = { BasePage };

