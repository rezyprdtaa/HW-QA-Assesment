require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://qa-assessment.holywings.id';

module.exports = defineConfig({
  testDir: './tests/specs',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  /*
   * Shared-environment isolation strategy:
   * QA Mart POS exposes a single shared remote backend with POST /api/test/reset.
   * Running mutating specs concurrently would cause cross-worker state collisions
   * (stock changes, lockouts, and resets). We therefore enforce workers: 1 by default
   * while supporting PARALLEL_WORKERS overrides when running against isolated environments.
   */
  fullyParallel: false,
  workers: process.env.PARALLEL_WORKERS ? Number(process.env.PARALLEL_WORKERS) : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          application: 'QA Mart POS',
          base_url: BASE_URL,
          platform: 'Desktop Web (1440x900)',
          runtime: `Node ${process.version}`,
        },
      },
    ],
  ],

  use: {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});

