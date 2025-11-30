import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'tests-results/results.json' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'https://ivm108.informatik.htw-dresden.de/ewa24tests/g05/EWA_Beleg_24/#/', // Live Server default address
    headless: true, // or false for debugging

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});


// // ==========================================
// // 4. PLAYWRIGHT CONFIG: playwright.config.js
// // ==========================================
// import { defineConfig } from '@playwright/test';

// export default defineConfig({
//   testDir: './tests',
//   use: {
//     ignoreHTTPSErrors: true,
//     screenshot: 'only-on-failure',
//     video: 'retain-on-failure',
//     trace: 'retain-on-failure',
//   },
//   timeout: 60000,
//   expect: {
//     timeout: 10000
//   },
//   projects: [
//     {
//       name: 'G05 Site',
//       use: { 
//         baseURL: 'https://ivm108.informatik.htw-dresden.de/ewa24tests/g05/EWA_Beleg_24/#/',
//       },
//       testMatch: '**\/cart.spec.js',
//     },
//     {
//       name: 'G09 Site',
//       use: { 
//         baseURL: 'https://ivm108.informatik.htw-dresden.de/ewa24tests/g09/beleg/frontend/',
//       },
//       testMatch: '**\/cart.spec.js',
//     },
//     {
//       name: 'G31 Site',
//       use: { 
//         baseURL: 'https://ivm108.informatik.htw-dresden.de/ewa24tests/g31/Beleg/',
//       },
//       testMatch: '**\/cart.spec.js',
//     },
//   ],
// });


// // ==========================================
// // 5. USAGE EXAMPLES
// // ==========================================

// // Run tests for specific site:
// // SITE=g05 npx playwright test
// // SITE=shopify npx playwright test
// // SITE=woocommerce npx playwright test

// // Run specific project:
// // npx playwright test --project="G05 Site"
// // npx playwright test --project="Shopify Site"

// // Run all projects:
// // npx playwright test