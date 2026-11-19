class PosApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   */
  constructor(request) {
    this.request = request;
  }

  authHeader(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async resetTestData() {
    const res = await this.request.post('/api/test/reset');
    return { status: res.status(), body: await res.json() };
  }

  async health() {
    const start = Date.now();
    const res = await this.request.get('/api/health');
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }

  async login(email, password) {
    const start = Date.now();
    const res = await this.request.post('/api/auth/login', {
      data: { email, password },
    });
    return {
      status: res.status(),
      durationMs: Date.now() - start,
      body: await res.json().catch(() => null),
    };
  }

  async logout(token) {
    const start = Date.now();
    const res = await this.request.post('/api/auth/logout', {
      headers: this.authHeader(token),
    });
    return { status: res.status(), durationMs: Date.now() - start };
  }

  async me(token) {
    const start = Date.now();
    const res = await this.request.get('/api/auth/me', {
      headers: this.authHeader(token),
    });
    return {
      status: res.status(),
      durationMs: Date.now() - start,
      body: await res.json().catch(() => null),
    };
  }

  async getCategories(token) {
    const start = Date.now();
    const res = await this.request.get('/api/categories', {
      headers: this.authHeader(token),
    });
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }

  async getProducts(token, params = {}) {
    const start = Date.now();
    const res = await this.request.get('/api/products', {
      headers: this.authHeader(token),
      params,
    });
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }

  async getProductById(token, id) {
    const start = Date.now();
    const res = await this.request.get(`/api/products/${id}`, {
      headers: this.authHeader(token),
    });
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }

  async createProduct(token, payload) {
    const start = Date.now();
    const res = await this.request.post('/api/products', {
      headers: this.authHeader(token),
      data: payload,
    });
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }

  async updateProduct(token, id, payload) {
    const start = Date.now();
    const res = await this.request.put(`/api/products/${id}`, {
      headers: this.authHeader(token),
      data: payload,
    });
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }

  async calculateCart(token, payload) {
    const start = Date.now();
    const res = await this.request.post('/api/cart/calculate', {
      headers: this.authHeader(token),
      data: payload,
    });
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }

  async createTransaction(token, payload) {
    const start = Date.now();
    const res = await this.request.post('/api/transactions', {
      headers: this.authHeader(token),
      data: payload,
    });
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }

  async getTransactions(token, params = {}) {
    const start = Date.now();
    const res = await this.request.get('/api/transactions', {
      headers: this.authHeader(token),
      params,
    });
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }

  async getTransactionById(token, id) {
    const start = Date.now();
    const res = await this.request.get(`/api/transactions/${id}`, {
      headers: this.authHeader(token),
    });
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }

  async voidTransaction(token, id, reason) {
    const start = Date.now();
    const res = await this.request.post(`/api/transactions/${id}/void`, {
      headers: this.authHeader(token),
      data: { reason },
    });
    return { status: res.status(), durationMs: Date.now() - start, body: await res.json() };
  }
}

module.exports = { PosApiClient };

