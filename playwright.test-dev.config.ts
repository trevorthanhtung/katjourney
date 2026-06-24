import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for testing against an already-running dev server.
 * Does NOT start a webServer — the dev server must be running manually.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
  // No webServer — assumes dev server is already running
});
