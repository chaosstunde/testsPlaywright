import { test, expect } from '@playwright/test';

test('Login über UI funktioniert (mit Mock)', async ({ page }) => {

  // 1. Login-API abfangen und erfolgreichen Login faken
  await page.route('**/assets/db/base_db.php', async route => {
    const mockResponse = {
      msgLogIn: 'Login erfolgreich',
      errorLogIn: false,
      userID: '999',
      userRolle: false
    };

    await route.fulfill({
      status: 200,
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

  // 4. Username + Passwort eingeben
  await page.fill('input[placeholder="Username"]', 'irgendwer');
  await page.fill('input[placeholder="Password"]', 'egal');

  // 5. Login absenden
  await page.click('input[value="Login"]');

  // 6. UI-Reaktion abwarten → Logout-Button muss erscheinen
  const logoutButton = page.locator('button .fa-right-from-bracket');
  await expect(logoutButton).toBeVisible({ timeout: 5000 });

  // 7. Token prüfen
  const token = await page.evaluate(() => localStorage.getItem('tokenU'));
  expect(token).toBe('999');
});
