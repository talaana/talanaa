import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const baseURL = 'http://127.0.0.1:3017';

export default defineConfig({
  testDir: './e2e',
  testIgnore: '**/live/**',
  outputDir: fileURLToPath(new URL('../.audit/frontend-e2e-fixed', import.meta.url)),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL,
    serviceWorkers: 'block',
    // Request routing cannot intercept speculative DNS/preconnects in index.html.
    launchOptions: {
      args: ['--host-resolver-rules=MAP *.localhost 127.0.0.1, MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost', '--no-proxy-server'],
    },
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // The Vite API disables .env loading; strictPort is the CLI --strictPort equivalent.
    command: `node --input-type=module -e "import { createServer } from 'vite'; await (await createServer({ envFile: false, server: { host: '127.0.0.1', port: 3017, strictPort: true } })).listen();"`,
    env: { VITE_API_URL: `${baseURL}/api`, DISABLE_HMR: 'true' },
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});