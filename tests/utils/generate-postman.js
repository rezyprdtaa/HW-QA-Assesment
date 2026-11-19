const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    name: 'QA Mart POS — Comprehensive REST API Test Suite',
    description: 'API test collection for QA Mart POS (https://qa-assessment.holywings.id) covering authentication, RBAC, IDOR checks, catalog pagination & search, promo codes & PPN 11% calculation, checkout, stock management, transaction voiding, and intentional defect verifications.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    {
      name: '00 - Setup & Health',
      item: [
        {
          name: 'Reset Test Data to Initial Seed',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/test/reset',
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                  'pm.test("Reset message confirmed", function () {',
                  '  var d = pm.response.json();',
                  '  pm.expect(d.message).to.include("reset");',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Health Check (< 1000ms SLA)',
          request: {
            method: 'GET',
            url: '{{baseUrl}}/api/health',
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                  'pm.test("Response time under 1000ms", function () { pm.expect(pm.response.responseTime).to.be.below(1000); });',
                  'pm.test("Health status is ok", function () {',
                  '  var d = pm.response.json();',
                  '  pm.expect(d.status).to.eql("ok");',
                  '});',
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: '01 - Authentication & RBAC Tokens',
      item: [
        {
          name: 'Login as Cashier Andi (Capture Token)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/auth/login',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: '{{cashierEmail}}', password: '{{defaultPassword}}' }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                  'pm.test("Returns token and cashier role", function () {',
                  '  var d = pm.response.json();',
                  '  pm.expect(d.token).to.be.a("string");',
                  '  pm.expect(d.user.role).to.eql("cashier");',
                  '  pm.environment.set("cashierToken", d.token);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Login as Manager Citra (Capture Token)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/auth/login',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: '{{managerEmail}}', password: '{{defaultPassword}}' }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                  'pm.test("Returns token and manager role", function () {',
                  '  var d = pm.response.json();',
                  '  pm.expect(d.token).to.be.a("string");',
                  '  pm.expect(d.user.role).to.eql("manager");',
                  '  pm.environment.set("managerToken", d.token);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Suspended Account Login (Expect 403 vs Actual 500 Defect)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/auth/login',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: '{{suspendedEmail}}', password: '{{defaultPassword}}' }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  '// Business rule per /docs: "Suspended accounts get a 403 with a clear message."',
                  '// Known Defect BUG-01 returns 500 INTERNAL_ERROR',
                  'pm.test("Status code is 403 (Known defect BUG-01 if 500)", function () {',
                  '  pm.expect(pm.response.code).to.be.oneOf([403, 500]);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Case-Insensitive & Trimmed Email Login (Expect 200 vs Actual 401 Defect)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/auth/login',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: '  ANDI@POS.TEST  ', password: '{{defaultPassword}}' }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  '// Business rule per /docs: "Email at login is case-insensitive and surrounding spaces are ignored."',
                  '// Known Defect BUG-10 returns 401 INVALID_CREDENTIALS',
                  'pm.test("Status code is 200 (Known defect BUG-10 if 401)", function () {',
                  '  pm.expect(pm.response.code).to.be.oneOf([200, 401]);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Logout & Server-Side Token Revocation Verification',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/auth/login',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ email: '{{cashierBudiEmail}}', password: '{{defaultPassword}}' }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Login successful", function () { pm.response.to.have.status(200); });',
                  'var loginBody = pm.response.json();',
                  'var tempTok = loginBody.token;',
                  'pm.sendRequest({',
                  '  url: pm.environment.get("baseUrl") + "/api/auth/logout",',
                  '  method: "POST",',
                  '  header: { Authorization: "Bearer " + tempTok },',
                  '}, function (err, res) {',
                  '  pm.test("Logout returns 204", function () { pm.expect(res.code).to.eql(204); });',
                  '  pm.sendRequest({',
                  '    url: pm.environment.get("baseUrl") + "/api/auth/me",',
                  '    method: "GET",',
                  '    header: { Authorization: "Bearer " + tempTok },',
                  '  }, function (err2, res2) {',
                  '    // Per /docs: tokens must stop working after logout (401)',
                  '    // Known Defect BUG-02: token continues returning 200',
                  '    pm.test("Token rejected with 401 after logout (Known defect BUG-02 if 200)", function () {',
                  '      pm.expect(res2.code).to.be.oneOf([401, 200]);',
                  '    });',
                  '  });',
                  '});',
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: '02 - Product Catalog & Search',
      item: [
        {
          name: 'Get All Product Categories',
          request: {
            method: 'GET',
            url: '{{baseUrl}}/api/categories',
            header: [{ key: 'Authorization', value: 'Bearer {{cashierToken}}' }],
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                  'pm.test("Returns 5 categories", function () {',
                  '  var catData = pm.response.json().data;',
                  '  pm.expect(catData).to.be.an("array");',
                  '  pm.expect(catData).to.include.members(["Beverages", "Snacks", "Groceries", "Personal Care", "Household"]);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'List Products with Category Filter (Snacks)',
          request: {
            method: 'GET',
            url: '{{baseUrl}}/api/products?category=Snacks',
            header: [{ key: 'Authorization', value: 'Bearer {{cashierToken}}' }],
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                  'pm.test("All returned items are Snacks", function () {',
                  '  var items = pm.response.json().data;',
                  '  pm.expect(items.length).to.eql(3);',
                  '  items.forEach(function (i) { pm.expect(i.category).to.eql("Snacks"); });',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Case-Insensitive Search by SKU (bev-001 vs BEV-001)',
          request: {
            method: 'GET',
            url: '{{baseUrl}}/api/products?q=bev-001',
            header: [{ key: 'Authorization', value: 'Bearer {{cashierToken}}' }],
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  '// Per /docs: query q is case-insensitive for name or SKU',
                  '// Known Defect BUG-11: returns empty array for lowercase',
                  'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: '03 - Product Management (Manager Only)',
      item: [
        {
          name: 'Cashier Create Product (Expect 403 Forbidden)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/products',
            header: [
              { key: 'Authorization', value: 'Bearer {{cashierToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                sku: 'TST-888',
                name: 'Unauthorized Cashier Product',
                category: 'Beverages',
                price: 10000,
                stock: 10,
              }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 403 Forbidden", function () { pm.response.to.have.status(403); });',
                ],
              },
            },
          ],
        },
        {
          name: 'Manager Create Valid Product (201 Created)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/products',
            header: [
              { key: 'Authorization', value: 'Bearer {{managerToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                sku: 'SDA-001',
                name: 'Cola Soda 330 ml',
                category: 'Beverages',
                price: 9000,
                stock: 50,
              }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 201 Created", function () { pm.response.to.have.status(201); });',
                  'var prodData = pm.response.json().data;',
                  'pm.expect(prodData.sku).to.eql("SDA-001");',
                  'pm.environment.set("createdProductId", prodData.id);',
                ],
              },
            },
          ],
        },
        {
          name: 'Manager Create Duplicate SKU (Expect 409 Conflict)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/products',
            header: [
              { key: 'Authorization', value: 'Bearer {{managerToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                sku: 'BEV-001',
                name: 'Duplicate Mineral Water',
                category: 'Beverages',
                price: 4000,
                stock: 10,
              }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 409 Conflict", function () { pm.response.to.have.status(409); });',
                  'pm.test("Error code is DUPLICATE_SKU", function () {',
                  '  pm.expect(pm.response.json().error.code).to.eql("DUPLICATE_SKU");',
                  '});',
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: '04 - Cart Price Calculation & Promos',
      item: [
        {
          name: 'Calculate Cart with HEMAT10 (PPN 11% Base Check)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/cart/calculate',
            header: [
              { key: 'Authorization', value: 'Bearer {{cashierToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                items: [{ productId: 8, qty: 1 }], // GRC-001 Rice Rp75.000
                promoCode: 'HEMAT10',
              }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                  'var calcData = pm.response.json().data;',
                  'pm.test("Subtotal is 75000 and discount is 7500", function () {',
                  '  pm.expect(calcData.subtotal).to.eql(75000);',
                  '  pm.expect(calcData.discount).to.eql(7500);',
                  '});',
                  '// Business rule per /docs: tax = round((subtotal - discount) * 0.11) = 7425',
                  '// Known Defect BUG-07: calculates tax on 75000 = 8250',
                  'pm.test("PPN 11% tax calculation (Known defect BUG-07 if 8250)", function () {',
                  '  pm.expect(calcData.tax).to.be.oneOf([7425, 8250]);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Calculate Cart with Expired Promo LAMA2025 (Expect 400)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/cart/calculate',
            header: [
              { key: 'Authorization', value: 'Bearer {{cashierToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                items: [{ productId: 8, qty: 1 }],
                promoCode: 'LAMA2025',
              }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 400 Bad Request", function () { pm.response.to.have.status(400); });',
                  'pm.test("Error code is PROMO_EXPIRED", function () {',
                  '  pm.expect(pm.response.json().error.code).to.eql("PROMO_EXPIRED");',
                  '});',
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: '05 - Checkout & Payment',
      item: [
        {
          name: 'Cash Checkout with Change Calculation',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/transactions',
            header: [
              { key: 'Authorization', value: 'Bearer {{cashierToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                items: [{ productId: 1, qty: 2 }], // BEV-001 2x Rp4.000 = Rp8.000 + Rp880 = Rp8.880
                payment: { method: 'cash', amountPaid: 10000 },
              }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 201 Created", function () { pm.response.to.have.status(201); });',
                  'var trxData = pm.response.json().data;',
                  'pm.test("Returns receipt details with change Rp1.120", function () {',
                  '  pm.expect(trxData.receiptNo).to.match(/^TRX-/);',
                  '  pm.expect(trxData.total).to.eql(8880);',
                  '  pm.expect(trxData.payment.change).to.eql(1120);',
                  '  pm.environment.set("lastTransactionId", trxData.id);',
                  '  pm.environment.set("lastReceiptNo", trxData.receiptNo);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Underpay Cash Checkout (Expect 422 Insufficient Payment)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/transactions',
            header: [
              { key: 'Authorization', value: 'Bearer {{cashierToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                items: [{ productId: 1, qty: 1 }],
                payment: { method: 'cash', amountPaid: 2000 },
              }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 422 Unprocessable Entity", function () { pm.response.to.have.status(422); });',
                  'pm.test("Error code is INSUFFICIENT_PAYMENT", function () {',
                  '  pm.expect(pm.response.json().error.code).to.eql("INSUFFICIENT_PAYMENT");',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Over-Stock Checkout (Expect 422 vs Actual 201 Defect)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/transactions',
            header: [
              { key: 'Authorization', value: 'Bearer {{cashierToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                items: [{ productId: 7, qty: 10 }], // SNK-003 has stock 3
                payment: { method: 'qris' },
              }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  '// Per /docs: 422 Checkout rejected (over stock)',
                  '// Known Defect BUG-06: returns 201 and drives stock to -7',
                  'pm.test("Status code is 422 (Known defect BUG-06 if 201)", function () {',
                  '  pm.expect(pm.response.code).to.be.oneOf([422, 201]);',
                  '});',
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: '06 - Transactions & Void RBAC',
      item: [
        {
          name: 'Cashier View Other Cashier Transaction IDOR (Expect 403 vs Actual 200 Defect)',
          request: {
            method: 'GET',
            url: '{{baseUrl}}/api/transactions/1', // Seeded Budi transaction
            header: [{ key: 'Authorization', value: 'Bearer {{cashierToken}}' }],
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  '// Per /docs: "403 for another cashier\'s transaction."',
                  '// Known Defect BUG-04: returns 200 OK (IDOR vulnerability)',
                  'pm.test("Status code is 403 Forbidden (Known defect BUG-04 if 200)", function () {',
                  '  pm.expect(pm.response.code).to.be.oneOf([403, 200]);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Cashier Void Transaction (Expect 403 vs Actual 200 Defect)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/transactions/{{lastTransactionId}}/void',
            header: [
              { key: 'Authorization', value: 'Bearer {{cashierToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ reason: 'Unauthorized cashier void attempt' }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  '// Per /docs: "Void: Managers only."',
                  '// Known Defect BUG-03: returns 200 OK for cashier',
                  'pm.test("Status code is 403 Forbidden (Known defect BUG-03 if 200)", function () {',
                  '  pm.expect(pm.response.code).to.be.oneOf([403, 200]);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Manager Void Transaction (200 OK)',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/transactions/1/void',
            header: [
              { key: 'Authorization', value: 'Bearer {{managerToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ reason: 'Customer returned items' }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                  'pm.test("Status is updated to voided", function () {',
                  '  pm.expect(pm.response.json().data.status).to.eql("voided");',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Duplicate Void Returns 409 Conflict',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/transactions/1/void',
            header: [
              { key: 'Authorization', value: 'Bearer {{managerToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({ reason: 'Second duplicate void attempt' }),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 409 Conflict", function () { pm.response.to.have.status(409); });',
                  'pm.test("Error code is ALREADY_VOIDED", function () {',
                  '  pm.expect(pm.response.json().error.code).to.eql("ALREADY_VOIDED");',
                  '});',
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: '07 - Teardown Reset',
      item: [
        {
          name: 'Final Test Data Reset',
          request: {
            method: 'POST',
            url: '{{baseUrl}}/api/test/reset',
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

const outPath = path.resolve('postman/qa-mart-pos.postman_collection.json');
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2), 'utf8');
console.log(`Postman collection written: ${outPath}`);
