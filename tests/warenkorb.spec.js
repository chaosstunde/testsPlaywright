import { test, expect } from '@playwright/test';

const BASE_URL = 'https://ivm108.informatik.htw-dresden.de/ewa24tests/g05/EWA_Beleg_24/#/';

test.describe('Shopping Cart Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);
    // Wait for Vue to load and products to appear
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.main-artikel', { timeout: 10000 });
  });

  test('should display cart button with initial count', async ({ page }) => {
    // Find the cart button
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    await expect(cartButton).toBeVisible();
    
    // Check if cart badge exists (shows item count)
    const cartBadge = cartButton.locator('.badge.bg-danger');
    await expect(cartBadge).toBeVisible();
    
    // Initial count should be 0 or a number
    const initialCount = await cartBadge.textContent();
    expect(parseInt(initialCount.trim())).toBeGreaterThanOrEqual(0);
  });

  test('should add item to cart from product listing', async ({ page }) => {
    // Get initial cart count
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    const cartBadge = cartButton.locator('.badge.bg-danger');
    const initialCount = parseInt(await cartBadge.textContent());
    
    // Click on first available product (not sold out)
    const availableProduct = page.locator('.main-artikel').filter({ 
      hasNot: page.locator('span.text-danger:has-text("Ausverkauft!")') 
    }).first();
    
    await availableProduct.click();
    
    // Wait for item page to load
    await page.waitForURL(/.*#\/item\/\d+/);
    await page.waitForLoadState('networkidle');
    
    // Wait for the "In den Einkaufswagen" button to be visible
    const addToCartButton = page.locator('input[type="submit"][value="In den Einkaufswagen"]');
    await expect(addToCartButton).toBeVisible({ timeout: 5000 });
    
    // Click add to cart
    await addToCartButton.click();
    
    // Wait for cart to update
    await page.waitForTimeout(1000);
    
    // Verify cart count increased
    const newCount = parseInt(await cartBadge.textContent());
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should add multiple quantities of item to cart', async ({ page }) => {
    // Navigate to first available product
    const availableProduct = page.locator('.main-artikel').filter({ 
      hasNot: page.locator('span.text-danger:has-text("Ausverkauft!")') 
    }).first();
    await availableProduct.click();
    
    await page.waitForURL(/.*#\/item\/\d+/);
    await page.waitForLoadState('networkidle');
    
    // Find quantity input and set it to 2
    const quantityInput = page.locator('input[type="number"][aria-label="amount"]');
    await quantityInput.fill('2');
    
    // Add to cart
    const addToCartButton = page.locator('input[type="submit"][value="In den Einkaufswagen"]');
    await addToCartButton.click();
    
    // Wait and verify message
    await page.waitForTimeout(1000);
    
    // Open cart to verify quantity
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    await cartButton.click();
    
    // Wait for cart popup to open
    await expect(page.locator('.popupKorb')).toBeVisible();
    
    // Verify item quantity is 2
    const firstItem = page.locator('.korb-artikel').first();
    const itemQuantity = firstItem.locator('.fw-bold.d-flex.align-items-center');
    await expect(itemQuantity).toHaveText('2');
  });

  test('should open cart popup and display items', async ({ page }) => {
    // First add an item
    const availableProduct = page.locator('.main-artikel').filter({ 
      hasNot: page.locator('span.text-danger:has-text("Ausverkauft!")') 
    }).first();
    await availableProduct.click();
    
    await page.waitForURL(/.*#\/item\/\d+/);
    await page.waitForLoadState('networkidle');
    
    const addToCartButton = page.locator('input[type="submit"][value="In den Einkaufswagen"]');
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    
    // Navigate back to home
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Open cart
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    await cartButton.click();
    
    // Verify cart popup is visible
    const cartPopup = page.locator('.popupKorb');
    await expect(cartPopup).toBeVisible();
    
    // Verify "Warenkorb" button is active (primary)
    const warenkorbButton = cartPopup.locator('span.btn-primary:has-text("Warenkorb")');
    await expect(warenkorbButton).toBeVisible();
    
    // Verify at least one item is displayed
    const cartItems = cartPopup.locator('.korb-artikel');
    await expect(cartItems.first()).toBeVisible();
    
    // Verify total price is displayed
    const totalPrice = cartPopup.locator('text=Gesamtkosten:');
    await expect(totalPrice).toBeVisible();
  });

  test('should increase item quantity in cart', async ({ page }) => {
    // Add item to cart
    const availableProduct = page.locator('.main-artikel').filter({ 
      hasNot: page.locator('span.text-danger:has-text("Ausverkauft!")') 
    }).first();
    await availableProduct.click();
    
    await page.waitForURL(/.*#\/item\/\d+/);
    await page.waitForLoadState('networkidle');
    
    const addToCartButton = page.locator('input[type="submit"][value="In den Einkaufswagen"]');
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    
    // Open cart
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    await cartButton.click();
    
    const cartPopup = page.locator('.popupKorb');
    await expect(cartPopup).toBeVisible();
    
    // Get initial quantity
    const firstItem = cartPopup.locator('.korb-artikel').first();
    const quantityDisplay = firstItem.locator('.fw-bold.d-flex.align-items-center');
    const initialQuantity = parseInt(await quantityDisplay.textContent());
    
    // Click increase button (+)
    const increaseButton = firstItem.locator('button:has-text("+")');
    await increaseButton.click();
    
    // Wait for update
    await page.waitForTimeout(1000);
    
    // Verify quantity increased
    const newQuantity = parseInt(await quantityDisplay.textContent());
    expect(newQuantity).toBe(initialQuantity + 1);
  });

  test('should decrease item quantity in cart', async ({ page }) => {
    // Add item with quantity 2
    const availableProduct = page.locator('.main-artikel').filter({ 
      hasNot: page.locator('span.text-danger:has-text("Ausverkauft!")') 
    }).first();
    await availableProduct.click();
    
    await page.waitForURL(/.*#\/item\/\d+/);
    await page.waitForLoadState('networkidle');
    
    // Set quantity to 2
    const quantityInput = page.locator('input[type="number"][aria-label="amount"]');
    await quantityInput.fill('2');
    
    const addToCartButton = page.locator('input[type="submit"][value="In den Einkaufswagen"]');
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    
    // Open cart
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    await cartButton.click();
    
    const cartPopup = page.locator('.popupKorb');
    await expect(cartPopup).toBeVisible();
    
    // Get initial quantity (should be 2)
    const firstItem = cartPopup.locator('.korb-artikel').first();
    const quantityDisplay = firstItem.locator('.fw-bold.d-flex.align-items-center');
    const initialQuantity = parseInt(await quantityDisplay.textContent());
    
    // Click decrease button (-)
    const decreaseButton = firstItem.locator('button:has-text("-")');
    await decreaseButton.click();
    
    // Wait for update
    await page.waitForTimeout(1000);
    
    // Verify quantity decreased
    const newQuantity = parseInt(await quantityDisplay.textContent());
    expect(newQuantity).toBe(initialQuantity - 1);
  });

  test('should remove item when quantity reaches 0', async ({ page }) => {
    // Add item to cart
    const availableProduct = page.locator('.main-artikel').filter({ 
      hasNot: page.locator('span.text-danger:has-text("Ausverkauft!")') 
    }).first();
    await availableProduct.click();
    
    await page.waitForURL(/.*#\/item\/\d+/);
    await page.waitForLoadState('networkidle');
    
    const addToCartButton = page.locator('input[type="submit"][value="In den Einkaufswagen"]');
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    
    // Open cart
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    await cartButton.click();
    
    const cartPopup = page.locator('.popupKorb');
    await expect(cartPopup).toBeVisible();
    
    // Count items before
    const itemsBefore = await cartPopup.locator('.korb-artikel').count();
    
    // Click decrease button until item is removed
    const firstItem = cartPopup.locator('.korb-artikel').first();
    const decreaseButton = firstItem.locator('button:has-text("-")');
    await decreaseButton.click();
    
    // Wait for removal
    await page.waitForTimeout(1500);
    
    // Verify item count decreased or cart is empty
    const itemsAfter = await cartPopup.locator('.korb-artikel').count();
    
    if (itemsBefore === 1) {
      // Cart should now show "Korb ist leer!"
      await expect(cartPopup.locator('text=Korb ist leer!')).toBeVisible();
    } else {
      expect(itemsAfter).toBe(itemsBefore - 1);
    }
  });

  test('should display correct total price calculation', async ({ page }) => {
    // Add item to cart
    const availableProduct = page.locator('.main-artikel').filter({ 
      hasNot: page.locator('span.text-danger:has-text("Ausverkauft!")') 
    }).first();
    await availableProduct.click();
    
    await page.waitForURL(/.*#\/item\/\d+/);
    await page.waitForLoadState('networkidle');
    
    const addToCartButton = page.locator('input[type="submit"][value="In den Einkaufswagen"]');
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    
    // Open cart
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    await cartButton.click();
    
    const cartPopup = page.locator('.popupKorb');
    await expect(cartPopup).toBeVisible();
    
    // Get price and quantity from first item
    const firstItem = cartPopup.locator('.korb-artikel').first();
    const priceText = await firstItem.locator('text=Preis:').locator('..').locator('.text-secondary').textContent();
    const price = parseFloat(priceText.replace('€', '').trim());
    
    const quantityText = await firstItem.locator('.fw-bold.d-flex.align-items-center').textContent();
    const quantity = parseInt(quantityText.trim());
    
    // Calculate expected total for this item
    const expectedItemTotal = (price * quantity).toFixed(2);
    
    // Verify item total is displayed correctly
    const itemTotalText = await firstItem.locator('text=Total:').locator('..').locator('.text-secondary').textContent();
    const itemTotal = parseFloat(itemTotalText.replace('€', '').trim()).toFixed(2);
    
    expect(itemTotal).toBe(expectedItemTotal);
    
    // Verify overall cart total
    const totalText = await cartPopup.locator('text=Gesamtkosten:').locator('..').locator('.text-secondary').textContent();
    const total = parseFloat(totalText.replace('€', '').trim());
    
    expect(total).toBeGreaterThan(0);
  });

  test('should close cart popup when X button is clicked', async ({ page }) => {
    // Open cart
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    await cartButton.click();
    
    // Verify popup is open
    const cartPopup = page.locator('.popupKorb');
    await expect(cartPopup).toBeVisible();
    
    // Click close button (X)
    const closeButton = cartPopup.locator('span.btn:has(i.fa-x)');
    await closeButton.click();
    
    // Verify popup is closed
    await expect(cartPopup).not.toBeVisible();
  });

  test('should navigate to checkout from cart', async ({ page }) => {
    // Add item to cart first
    const availableProduct = page.locator('.main-artikel').filter({ 
      hasNot: page.locator('span.text-danger:has-text("Ausverkauft!")') 
    }).first();
    await availableProduct.click();
    
    await page.waitForURL(/.*#\/item\/\d+/);
    await page.waitForLoadState('networkidle');
    
    const addToCartButton = page.locator('input[type="submit"][value="In den Einkaufswagen"]');
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    
    // Open cart
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    await cartButton.click();
    
    const cartPopup = page.locator('.popupKorb');
    await expect(cartPopup).toBeVisible();
    
    // Click "Zur Kasse" button
    const checkoutButton = cartPopup.locator('button.btn-success:has-text("Zur Kasse")');
    await checkoutButton.click();
    
    // Wait for checkout step to load
    await page.waitForTimeout(1000);
    
    // Verify we're now on step 2 or 3 (checkout process)
    // Should see either "Als Gast bestellen" or the address form
    const guestCheckoutBtn = cartPopup.locator('button:has-text("Als Gast bestellen")');
    const addressForm = cartPopup.locator('input[name="adresse"]');
    
    // One of these should be visible
    const step2Visible = await guestCheckoutBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const step3Visible = await addressForm.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(step2Visible || step3Visible).toBeTruthy();
  });

  test('should prevent adding more than available stock', async ({ page }) => {
    // Navigate to a product
    const availableProduct = page.locator('.main-artikel').filter({ 
      hasNot: page.locator('span.text-danger:has-text("Ausverkauft!")') 
    }).first();
    await availableProduct.click();
    
    await page.waitForURL(/.*#\/item\/\d+/);
    await page.waitForLoadState('networkidle');
    
    // Get the stock amount
    const stockText = await page.locator('text=Lagerbestand:').locator('..').locator('.text-secondary').textContent();
    const stock = parseInt(stockText.match(/\d+/)[0]);
    
    // Try to set quantity higher than stock
    const quantityInput = page.locator('input[type="number"][aria-label="amount"]');
    await quantityInput.fill((stock + 1).toString());
    
    const addToCartButton = page.locator('input[type="submit"][value="In den Einkaufswagen"]');
    await addToCartButton.click();
    
    // Should see error message or quantity should be capped at max
    await page.waitForTimeout(1000);
    
    // The input should have max attribute preventing this
    const maxAttr = await quantityInput.getAttribute('max');
    expect(parseInt(maxAttr)).toBe(stock);
  });

  test('should show empty cart message when cart is empty', async ({ page }) => {
    // Clear localStorage to ensure empty cart
    await page.evaluate(() => {
      localStorage.removeItem('tokenU');
      localStorage.removeItem('tokenOU');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Open cart
    const cartButton = page.locator('button.btn-success:has(i.fa-bag-shopping)');
    await cartButton.click();
    
    const cartPopup = page.locator('.popupKorb');
    await expect(cartPopup).toBeVisible();
    
    // Verify empty message
    const emptyMessage = cartPopup.locator('text=Korb ist leer!');
    await expect(emptyMessage).toBeVisible();
    
    // Cart count should be 0
    const cartBadge = cartButton.locator('.badge.bg-danger');
    expect(await cartBadge.textContent()).toBe('0');
  });
});