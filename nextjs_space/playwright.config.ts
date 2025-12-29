import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for JNX-OS Phase 5A Testing
 * Based on TESTING_GUIDE_PHASE5A.md
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Maximum time one test can run for */
  timeout: 120 * 1000,
  
  /* Test configuration */
  fullyParallel: false, // Run tests serially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to prevent race conditions
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL */
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Navigation timeout */
    navigationTimeout: 30 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run dev server before starting tests */
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
