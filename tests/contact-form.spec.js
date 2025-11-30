import { test, expect } from '@playwright/test';

// Die Basis-URL für das Formular (Anpassung je nach Bedarf)
const CONTACT_FORM_URL = '/contact2.html';

test.describe('E2E Tests für die Formular-Validierung (novalidate)', () => {

  // Führe vor jedem Test einen Besuch der Seite durch
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5501/contact.html');
  });

  // --- HILFSFUNKTIONEN ---
  // Eine Funktion, um das Formular mit gültigen Daten zu befüllen
  async function fillValidForm(page) {
    await page.fill('#nachname', 'Müller');
    await page.fill('#vorname', 'Max');
    await page.fill('#email', 'max.mueller@web.de');
    await page.fill('#plz', '01067'); // Valide PLZ
    await page.fill('#alter', '30'); // Valides Alter
    await page.fill('#url', 'https://www.google.com'); // Valide URL
  }

  // --- TESTFÄLLE ---

  // Test 1: Prüfung leerer Pflichtfelder (Nachname, Vorname, E-Mail)
  test('sollte Fehlermeldungen für leere Pflichtfelder anzeigen', async ({ page }) => {
    // 1. Formular ohne Eingaben senden
    await page.click('button[type="submit"]');

    // 2. Erwartung: Alle notwendigen Fehlermeldungen müssen sichtbar sein (JS-Validierung)
    await expect(page.locator('#error-nachname')).toHaveText(/Nachnamen.*mindestens 2 Zeichen/);
    await expect(page.locator('#error-vorname')).toHaveText(/Vornamen.*mindestens 2 Zeichen/);
    await expect(page.locator('#error-email')).toHaveText(/E-Mail-Adresse ein/);

    // 3. Optional: Prüfung, dass optionale Felder leer sind (z.B. PLZ)
    await expect(page.locator('#error-plz')).toHaveText('');
  });

  // Test 2: Prüfung der Validierung der Postleitzahl (PLZ)
  test('sollte Fehlermeldung für ungültige PLZ anzeigen (muss 5 Ziffern sein)', async ({ page }) => {
    // 1. Pflichtfelder korrekt ausfüllen
    await fillValidForm(page);

    // 2. Ungültige PLZ eingeben (zu kurz)
    await page.fill('#plz', '1234');
    
    // 3. Formular senden (Wählt einfach den Submit-Button)
    await page.click('button[type="submit"]');
    
    // Kleiner Timeout, um die DOM-Aktualisierung durch JS sicherzustellen (trotz Auto-Waiting)
    await page.waitForTimeout(50); 

    // 4. Erwartung: PLZ-Fehlermeldung ist sichtbar, aber Pflichtfelder sind leer
    await expect(page.locator('#error-plz')).toHaveText(/5/);
    await expect(page.locator('#error-nachname')).toHaveText('');
  });

  // Test 3: Prüfung der Altersgrenze (Minimum)
  test('sollte Fehlermeldung anzeigen, wenn Alter unter dem Minimum (3) liegt', async ({ page }) => {
    await fillValidForm(page);

    // 1. Alter unter dem Minimum eingeben
    await page.fill('#alter', '2');
    await page.click('button[type="submit"]');
    await expect(page.locator('#error-alter')).toHaveText(/zwischen 3 und 120/);
    await expect(page.locator('#error-nachname')).toHaveText(''); // Prüfen, dass andere Felder weiterhin gültig sind
  });

  // Test 4: Prüfung der Altersgrenze (Maximum)
  test('sollte Fehlermeldung anzeigen, wenn Alter über dem Maximum (120) liegt', async ({ page }) => {
    await fillValidForm(page);

    // 1. Alter über dem Maximum eingeben
    await page.fill('#alter', '121');
    await page.click('button[type="submit"]');
    await expect(page.locator('#error-alter')).toHaveText(/zwischen 3 und 120/);
    await expect(page.locator('#error-nachname')).toHaveText(''); // Prüfen, dass andere Felder weiterhin gültig sind
  });

  // Test 5: Prüfung der URL-Validierung
  test('sollte Fehlermeldung für ungültiges URL-Format anzeigen', async ({ page }) => {
    await fillValidForm(page);

    // Ungültiges URL-Format eingeben
    await page.fill('#url', 'nurtext');
    
    await page.click('button[type="submit"]');

    // Erwartung: URL-Fehlermeldung ist sichtbar
    await expect(page.locator('#error-url')).toHaveText(/gültige URL/);
  });

  // Test 6: Erfolgreiche Übermittlung (Der wichtigste Test)
  // Page.route verwenden, um die Weiterleitung zur Server-Dummy-URL zu verhindern.
  test('sollte gültige Eingaben akzeptieren und keine Fehler anzeigen', async ({ page }) => {
    // Abfangen der Formularübermittlung (Dummy-Serverantwort)
    // Dies verhindert die Navigation und erlaubt es uns, den Zustand der Seite zu prüfen
    await page.route('https://example.com/submit-form', route => {
        // Sendet eine gefälschte erfolgreiche Antwort (Status 200)
        route.fulfill({ status: 200, body: 'Formular erfolgreich verarbeitet' });
    });
    
    // 1. Alle Felder mit gültigen Daten befüllen
    await fillValidForm(page);

    // 2. Formular senden
    await page.click('button[type="submit"]');
    
    // 3. Erwartung: Prüfen, dass alle Fehlermeldungen (alle Elemente mit .error-message) leer sind
    const errorLocators = page.locator('.error-message');
    const count = await errorLocators.count();

    for (let i = 0; i < count; ++i) {
        // Jeder Error-Container muss leer sein
        await expect(errorLocators.nth(i)).toHaveText('');
    }
  });

  // Test 7: Prüfung der Zurücksetzen-Funktion
  test('sollte alle Felder leeren, wenn "Zurücksetzen" geklickt wird', async ({ page }) => {
    // 1. Felder befüllen
    await page.fill('#nachname', 'Mustermann');
    await page.fill('#email', 'a@b.c');
    
    // 2. "Zurücksetzen" klicken
    await page.getByRole('button', { name: 'Zurücksetzen' }).click();
    
    // 3. Erwartung: Felder sind leer
    await expect(page.locator('#nachname')).toHaveValue('');
    await expect(page.locator('#email')).toHaveValue('');
  });
});
