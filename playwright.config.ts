import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Read environment variables from .env file (ES Module safe).
// `quiet: true` suppresses dotenv's random promotional "tip" lines
// (e.g. "injected env... [www.dotenvx.com]") that otherwise print on
// every test run — cosmetic noise, not needed for a demo or CI log.
dotenv.config({ path: path.resolve(import.meta.dirname, '.env'), quiet: true });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  use: {
    // API base URL configured for API request context
    baseURL: process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com',
    
    // UI tracing & failure captures
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Base URL for UI tests when navigating relative routes
        baseURL: process.env.UI_BASE_URL || 'https://automationintesting.online',
      },
    },
  ],
});