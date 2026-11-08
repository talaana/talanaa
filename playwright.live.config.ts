import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const baseURL = 'http://127.0.0.1:3017';
const apiURL = 'http://talana-backend.test';

const mobile = {
  ...devices['Pixel 7'],
  viewport: { width: 390, height: 844 },
};

export default defineConfig({
  testDir: './e2e/live',
  outputDir: fileURLToPath(new URL('../.audit/e2e-live-results', import.meta.url)),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: [
    ['html', { outputFolder: fileURLToPath(new URL('../.audit/e2e-live-report', import.meta.url)), open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL,
    locale: 'fa-IR',
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    launchOptions: {
      args: ['--host-resolver-rules=MAP *.localhost 127.0.0.1'],
    },
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: mobile,
      testMatch: /(main-landing|end-user|tenant-panel|superadmin)[\\/].*\.spec\.ts|landing-builder[\\/]render\.spec\.ts/,
      dependencies: ['desktop'],
    },
  ],
  webServer: {
    command: `node --input-type=module -e "import { createServer } from 'vite'; await (await createServer({ envFile: false, server: { host: '127.0.0.1', port: 3017, strictPort: true } })).listen();"`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 30000,
    env: {
      VITE_API_URL: `${apiURL}/api`,
      DISABLE_HMR: 'true',
    },
  },
});
