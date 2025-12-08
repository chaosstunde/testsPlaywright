import { test, expect } from "@playwright/test";
import { urls } from "../test-urls.js";

// Dynamische URL wie bei dir im Warenkorb
const BASE_URL = urls[process.env.TEST_TARGET || "g05"];

test.describe("Suchfunktion – Basis- und Funktionstests", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
  });

  //
  // 🔎 1. Existiert überhaupt eine Suchfunktion?
  //
  test("Die Webseite hat ein sichtbares Suchfeld", async ({ page }) => {
    const possibleSearchSelectors = [
      'input[type="search"]',
      'input[name*="search"]',
      'input[id*="search"]',
      'input[id="searchInput"]',
      'input[name="search"]',
      'input[placeholder*="Search"]',
      'input[placeholder*="Suchen"]',
      '[role="search"] input',
      '[data-testid*="search"]',
      'button[aria-label*="Search"]',
      'button[aria-label*="Suchen"]',
      'text=Suche',
      'text=Search'
    ];

    let found = false;

    for (const selector of possibleSearchSelectors) {
      const loc = page.locator(selector);
      if (await loc.first().isVisible().catch(() => false)) {
        console.log(`🔍 Suchfeld gefunden über: ${selector}`);
        found = true;
        break;
      }
    }

    expect(found, "❌ Keine Suchfunktion gefunden!").toBe(true);
  });

  //
  // 🔎 2. Test: Kann man ins Suchfeld schreiben?
  //
  test("Man kann einen Suchbegriff eingeben", async ({ page }) => {
    const searchField = page.locator(
      'input[type="search"], input[name*="search"], input[id*="search"], input[placeholder*="Suche"], input[placeholder*="Search"]'
    ).first();

    await expect(searchField).toBeVisible();

    await searchField.fill("Test");
    await expect(searchField).toHaveValue("Test");
  });

  //
  // 🔎 3. Test: Wird die Suche ausgelöst?
  //
  test("Die Suche zeigt Suchergebnisse an (falls unterstützt)", async ({ page }) => {
    const searchField = page.locator(
      'input[type="search"], input[name*="search"], input[id*="search"], input[placeholder*="Suche"], input[placeholder*="Search"]'
    ).first();

    await searchField.fill("a");

    // Enter drücken
    await searchField.press("Enter");

    // 1–2 Sekunden warten, da Vue/React manchmal verzögert
    await page.waitForTimeout(1500);

    // Ergebnis-Hinweise (abhängig vom Shop)
    const resultSelectors = [
      ".main-artikel",         // Artikel-Liste
      "text=Treffer",          // 'Treffer' Hinweise
      ".search-results",       // generische Klasse
      "text=Suchergebnisse"    // generischer Text
    ];

    let resultFound = false;

    for (const selector of resultSelectors) {
      if (await page.locator(selector).first().isVisible().catch(() => false)) {
        resultFound = true;
        break;
      }
    }

    // ⚠️ Falls der Shop KEINE echte Suche hat:
    expect(resultFound, "⚠️ Die Suche konnte keine Ergebnisse anzeigen.").toBe(true);
  });

});
