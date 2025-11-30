import { test, expect, request } from '@playwright/test';

test('Server-Login funktioniert', async ({ request }) => {
  // Anfrage an die Login-API
  const response = await request.post('https://ivm108.informatik.htw-dresden.de/ewa24tests/g05/EWA_Beleg_24/assets/db/base_db.php', {
    data: {
      username: 'testuser',
      password: '123'
    }
  });

  // Antwort prüfen
  expect(response.status()).toBe(200); // HTTP 200 = alles ok
  const body = await response.json();
  expect(body.errorLogIn).toBe(false);  // Login erfolgreich?
  expect(body.userID).toBeDefined();    // User-ID vorhanden?
});
