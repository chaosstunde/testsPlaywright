import { test, expect } from '@playwright/test';

test('Login über UI schlägt fehl (mit Mock)', async ({ page }) => {

  // 1. Login-API abfangen und FEHLGESCHLAGENEN Login faken
  await page.route('**/assets/db/base_db.php', async route => {
    // Mock the response to simulate bad credentials
    const mockResponse = {
      msgLogIn: 'Falscher Benutzername oder Passwort', // Specific error message
      errorLogIn: true, // Crucial: Set the error flag to true
      userID: null,     // UserID should be null
      userRolle: false
    };

    await route.fulfill({
      status: 200, // Still use 200 if the API handles the error internally
      contentType: 'application/json',
      body: JSON.stringify(mockResponse)
    });
  });

  // 2. Seite öffnen
  await page.goto(
    'https://ivm108.informatik.htw-dresden.de/ewa24tests/g05/EWA_Beleg_24/#/'
  );

  // 3. Login-Popup öffnen
  await page.click('button .fa-user');

  // 4. Ungültigen Username + Passwort eingeben
  await page.fill('input[placeholder="Username"]', 'falsch');
  await page.fill('input[placeholder="Password"]', 'falsch');

  // 5. Login absenden
  await page.click('input[value="Login"]');

  // 6. UI-Reaktion abwarten
  
  // a) Prüfen, ob der Login-Button (der zum Popup führt) weiterhin sichtbar ist,
  //    da der Logout-Button NICHT erscheinen darf.
  const loginButton = page.locator('button .fa-user');
  await expect(loginButton).toBeVisible(); 
  
  // b) Prüfen, ob die Fehlermeldung im Popup angezeigt wird.
  const errorMessageLocator = page.locator('.popupLog .text-secondary.fw-bold', { hasText: 'Falscher Benutzername oder Passwort' });
  await expect(errorMessageLocator).toBeVisible({ timeout: 5000 });

  // 7. Token prüfen: Es darf KEIN Token gespeichert werden
  const token = await page.evaluate(() => localStorage.getItem('tokenU'));
  expect(token).toBeNull();
});