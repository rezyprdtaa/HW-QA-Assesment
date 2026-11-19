const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EVIDENCE_DIR = path.resolve(__dirname, '../../docs/evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const BASE_URL = 'https://qa-assessment.holywings.id';

async function resetBackend() {
  await fetch(`${BASE_URL}/api/test/reset`, { method: 'POST' });
}

function generateEvidenceHtml({ bugId, title, severity, endpoint, method, expectedStatus, actualStatus, requestHeaders, requestBody, responseBody, explanation }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${bugId} Evidence</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; }
    body { background: #0f172a; color: #f8fafc; padding: 32px; display: flex; justify-content: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; width: 1000px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); overflow: hidden; }
    .header { background: #0f172a; padding: 20px 28px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; }
    .title-group { display: flex; align-items: center; gap: 12px; }
    .badge-id { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 14px; }
    .badge-sev { background: #ef4444; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 14px; }
    .title { font-size: 18px; font-weight: 600; color: #f1f5f9; }
    .url-bar { background: #0f172a; margin: 20px 28px; padding: 12px 18px; border-radius: 8px; border: 1px solid #334155; display: flex; align-items: center; gap: 12px; }
    .method { font-weight: 700; font-size: 14px; padding: 4px 10px; border-radius: 4px; }
    .method.POST { background: #10b981; color: white; }
    .method.GET { background: #3b82f6; color: white; }
    .url { font-size: 14px; color: #94a3b8; font-family: monospace; }
    .status-group { margin-left: auto; display: flex; align-items: center; gap: 12px; }
    .status-actual { background: #ef4444; color: white; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 700; }
    .status-expected { color: #94a3b8; font-size: 13px; }
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 0 28px 24px 28px; }
    .pane { background: #0f172a; border: 1px solid #334155; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
    .pane-header { background: #1e293b; padding: 10px 16px; border-bottom: 1px solid #334155; font-size: 13px; font-weight: 600; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px; }
    .pane-body { padding: 16px; font-family: "Consolas", monospace; font-size: 12.5px; line-height: 1.5; color: #e2e8f0; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
    .header-row { color: #38bdf8; }
    .footer-callout { background: #450a0a; border-top: 1px solid #dc2626; padding: 16px 28px; color: #fca5a5; font-size: 13px; line-height: 1.5; }
    .highlight-red { color: #f87171; font-weight: bold; }
    .highlight-green { color: #4ade80; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title-group">
        <span class="badge-id">${bugId}</span>
        <span class="badge-sev">${severity}</span>
        <span class="title">${title}</span>
      </div>
      <div style="font-size: 12px; color: #64748b;">Target: qa-assessment.holywings.id</div>
    </div>

    <div class="url-bar">
      <span class="method ${method}">${method}</span>
      <span class="url">${endpoint}</span>
      <div class="status-group">
        <span class="status-expected">Expected: <strong style="color: #4ade80;">${expectedStatus}</strong></span>
        <span class="status-actual">Actual: ${actualStatus}</span>
      </div>
    </div>

    <div class="content-grid">
      <div class="pane">
        <div class="pane-header">Request (Headers & Body)</div>
        <div class="pane-body"><span class="header-row">${requestHeaders}</span>\n\n${requestBody ? requestBody : '(No Request Body)'}</div>
      </div>
      <div class="pane">
        <div class="pane-header">Actual Server Response</div>
        <div class="pane-body">${responseBody}</div>
      </div>
    </div>

    <div class="footer-callout">
      <strong>Vulnerability Analysis:</strong> ${explanation}
    </div>
  </div>
</body>
</html>`;
}

async function run() {
  console.log('Resetting backend data...');
  await resetBackend();

  console.log('Launching browser to render API evidence...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

  // 1. Capture BUG-02 Evidence: Token Not Revoked After Logout
  console.log('Generating BUG-02 Evidence...');
  await resetBackend();
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'budi@pos.test', password: 'Password123!' })
  }).then(r => r.json());
  const budiToken = loginRes.token;

  // Logout
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${budiToken}` }
  });
  const logoutStatus = `${logoutRes.status} ${logoutRes.statusText}`;

  // Call GET /api/auth/me using logged-out token
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${budiToken}` }
  });
  const meBody = await meRes.json();

  const bug02Html = generateEvidenceHtml({
    bugId: 'BUG-02',
    title: 'Logout Does Not Revoke Bearer Token Server-Side',
    severity: 'CRITICAL',
    method: 'GET',
    endpoint: `${BASE_URL}/api/auth/me`,
    expectedStatus: 'HTTP 401 Unauthorized',
    actualStatus: `HTTP ${meRes.status} OK (Session Still Active)`,
    requestHeaders: `Authorization: Bearer ${budiToken.slice(0, 30)}...\nHost: qa-assessment.holywings.id\nAccept: application/json`,
    requestBody: `// Context:\n// 1. POST /api/auth/logout executed successfully (${logoutStatus})\n// 2. Client now requests protected endpoint using the logged-out token:`,
    responseBody: JSON.stringify(meBody, null, 2),
    explanation: 'Per /docs: "Tokens are valid for 1 hour and must stop working after logout." The server returned HTTP 200 OK with full user session data. Stolen or logged-out tokens remain perpetually valid, enabling session hijacking.'
  });

  await page.setContent(bug02Html);
  await page.waitForTimeout(400);
  await page.locator('.card').screenshot({ path: path.join(EVIDENCE_DIR, 'bug-02-logout-token-not-revoked.png') });

  // 2. Capture BUG-03 Evidence: Cashier Privilege Escalation (Void)
  console.log('Generating BUG-03 Evidence...');
  await resetBackend();
  const andiLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'andi@pos.test', password: 'Password123!' })
  }).then(r => r.json());
  const andiToken = andiLogin.token;

  // Andi voids seeded transaction 1
  const voidRes = await fetch(`${BASE_URL}/api/transactions/1/void`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${andiToken}`
    },
    body: JSON.stringify({ reason: 'Cashier unauthorized void exploit' })
  });
  const voidBody = await voidRes.json();

  const bug03Html = generateEvidenceHtml({
    bugId: 'BUG-03',
    title: 'Privilege Escalation: Cashier Can Void Transactions via API',
    severity: 'CRITICAL',
    method: 'POST',
    endpoint: `${BASE_URL}/api/transactions/1/void`,
    expectedStatus: 'HTTP 403 Forbidden',
    actualStatus: `HTTP ${voidRes.status} OK (Transaction Voided)`,
    requestHeaders: `Authorization: Bearer ${andiToken.slice(0, 30)}... [User: Andi Pratama, Role: cashier]\nContent-Type: application/json`,
    requestBody: JSON.stringify({ reason: 'Cashier unauthorized void exploit' }, null, 2),
    responseBody: JSON.stringify(voidBody, null, 2),
    explanation: 'Per /docs: "Void: Managers only. Body: reason (string, 5-200 chars). 403 for cashier." The backend failed to check user role, allowing any cashier to void transactions by sending a direct API request.'
  });

  await page.setContent(bug03Html);
  await page.waitForTimeout(400);
  await page.locator('.card').screenshot({ path: path.join(EVIDENCE_DIR, 'bug-03-cashier-void-privilege-escalation.png') });

  // 3. Capture BUG-04 Evidence: IDOR Cashier Viewing Other Cashier's Receipt
  console.log('Generating BUG-04 Evidence...');
  await resetBackend();
  const andiLogin2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'andi@pos.test', password: 'Password123!' })
  }).then(r => r.json());
  const andiToken2 = andiLogin2.token;

  // Transaction 1 belongs to Cashier Budi Santoso (cashierId: 2)
  const tx1Res = await fetch(`${BASE_URL}/api/transactions/1`, {
    headers: { 'Authorization': `Bearer ${andiToken2}` }
  });
  const tx1Body = await tx1Res.json();

  const bug04Html = generateEvidenceHtml({
    bugId: 'BUG-04',
    title: 'IDOR: Cashier Can Access Other Cashier\'s Transaction Detail',
    severity: 'CRITICAL',
    method: 'GET',
    endpoint: `${BASE_URL}/api/transactions/1`,
    expectedStatus: 'HTTP 403 Forbidden',
    actualStatus: `HTTP ${tx1Res.status} OK (Receipt Leaked)`,
    requestHeaders: `Authorization: Bearer ${andiToken2.slice(0, 30)}... [Requester: Andi Pratama, ID: 1]\nHost: qa-assessment.holywings.id`,
    requestBody: `// Context:\n// Requester is Cashier Andi Pratama (id: 1).\n// Target transaction 1 belongs to Cashier Budi Santoso (cashierId: 2).`,
    responseBody: JSON.stringify(tx1Body, null, 2),
    explanation: 'Per /docs: "GET /api/transactions/{id}: Transaction detail. 403 for another cashier\'s transaction." The backend lacks object-level authorization (IDOR), exposing financial transactions across different cashiers.'
  });

  await page.setContent(bug04Html);
  await page.waitForTimeout(400);
  await page.locator('.card').screenshot({ path: path.join(EVIDENCE_DIR, 'bug-04-idor-cashier-access-other-receipt.png') });

  await browser.close();
  console.log('All API evidence captured successfully!');
}

run().catch(err => {
  console.error('Error generating API evidence:', err);
  process.exit(1);
});
