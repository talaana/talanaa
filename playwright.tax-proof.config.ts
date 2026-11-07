import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const baseURL = 'http://127.0.0.1:3021';
const apiURL = 'http://talana-backend.test';

export default defineConfig({
  testDir: './e2e/tax-proof',
  outputDir: fileURLToPath(new URL('../.audit/tax-proof-results', import.meta.url)),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 120000,
  reporter: [['list']],
  use: {
    baseURL,
    locale: 'fa-IR',
    screenshot: 'on',
    video: { mode: 'on', size: { width: 1440, height: 900 } },
    trace: 'off',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'proof',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: `node --input-type=module -e "import { createServer } from 'vite'; await (await createServer({ envFile: false, server: { host: '127.0.0.1', port: 3021, strictPort: true } })).listen();"`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      VITE_API_URL: `${apiURL}/api`,
    },
  },
});
