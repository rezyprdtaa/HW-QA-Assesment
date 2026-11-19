const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.loginPageRoot = page.getByTestId('login-page');
    this.emailInput = page.getByTestId('login-email');
    this.passwordInput = page.getByTestId('login-password');
    this.submitButton = page.getByTestId('login-submit');
    this.emailError = page.getByTestId('login-email-error');
    this.passwordError = page.getByTestId('login-password-error');
    this.loginAlert = page.getByTestId('login-error');
  }

  async open() {
    await this.goto('/#/login');
    await this.loginPageRoot.waitFor({ state: 'visible' });
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

module.exports = { LoginPage };

