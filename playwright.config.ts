import { defineConfig, devices } from '@playwright/test';
import { urls } from './test-urls.js';      // ⭐ NEU: URLs importieren

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

// ⭐ NEU: Automatisch Projekte für jede URL erzeugen
const siteProjects = Object.entries(urls).map(([key, url]) => ({
  name: `url-${key}`,          // z.B. url-g05, url-g09, url-local, url-g12
  use: {
    ...devices['Desktop Chrome'],
    baseURL: url
  },
  metadata: {
    testedUrl: url             // erscheint in results.json
  }
}));

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html'],
    ['json', { outputFile: 'tests-results/results.json' }]
  ],
  
  use: {
    baseURL: 'https://ivm108.informatik.htw-dresden.de/ewa24tests/g05/EWA_Beleg_24/#/', 
    headless: true,
    trace: 'on-first-retry',
  },

  projects: [
    // ⭐ Dein EXISTIERENDES Projekt bleibt unverändert
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // ⭐ HIER werden NUR die neuen Projekte angehängt
    ...siteProjects
  ],

  // webServer bleibt unberührt
});
