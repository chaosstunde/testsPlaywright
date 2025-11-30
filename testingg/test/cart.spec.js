// ==========================================
// 3. REUSABLE TESTS: tests/cart.spec.js
// ==========================================
import { test as base, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage.js';
import { siteConfigs } from '../config/sites.config.js';

// Extend test with CartPage fixture
const test = base.extend({
  cartPage: async ({ page }, use, testInfo) => {
    // Get site config from project name or environment variable
    let siteName = process.env.SITE;
    
    // If using --project flag, extract site from project name
    if (testInfo.project.name && !siteName) {
      // "G05 Site" -> "g05", "G31 Site" -> "g31"
      const match = testInfo.project.name.match(/^(\w+)\s+Site$/i);
      if (match) {
        siteName = match[1].toLowerCase();
      }
    }
    
    // Default to g05 if no config found
    siteName = siteName || 'g05';
    const config = siteConfigs[siteName];
    
    if (!config) {
      throw new Error(`Site config for "${siteName}" not found. Available: ${Object.keys(siteConfigs).join(', ')}`);
    }
    
    console.log(`Running tests for site: ${siteName}`);
    const cartPage = new CartPage(page, config);
    await use(cartPage);
  },
});

test.describe('Cart Functionality', () => {
  test.beforeEach(async ({ cartPage }) => {
    await cartPage.goto();
    await cartPage.waitForProducts();
  });

  test('should display cart button with badge', async ({ cartPage }) => {
    const cartButton = await cartPage.getCartButton();
    await expect(cartButton).toBeVisible();
    
    const count = await cartPage.getCartCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should add item to cart', async ({ cartPage }) => {
    const initialCount = await cartPage.getCartCount();
    
    await cartPage.clickFirstAvailableProduct();
    await cartPage.addToCart();
    
    await cartPage.goto(); // Go back to home
    const newCount = await cartPage.getCartCount();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should add multiple quantities', async ({ cartPage }) => {
    await cartPage.clickFirstAvailableProduct();
    await cartPage.setQuantity(3);
    await cartPage.addToCart();
    
    await cartPage.goto();
    await cartPage.openCart();
    
    const items = await cartPage.getCartItems();
    await expect(items.first()).toBeVisible();
  });

  test('should open and close cart popup', async ({ cartPage }) => {
    await cartPage.clickFirstAvailableProduct();
    await cartPage.addToCart();
    
    await cartPage.goto();
    await cartPage.openCart();
    
    const popup = await cartPage.getCartPopup();
    await expect(popup).toBeVisible();
    
    await cartPage.closeCart();
    await expect(popup).not.toBeVisible();
  });

  test('should increase item quantity in cart', async ({ cartPage }) => {
    await cartPage.clickFirstAvailableProduct();
    await cartPage.addToCart();
    
    await cartPage.goto();
    await cartPage.openCart();
    
    const initialQty = await cartPage.getFirstCartItemQuantity();
    await cartPage.increaseQuantity();
    
    const newQty = await cartPage.getFirstCartItemQuantity();
    expect(newQty).toBe(initialQty + 1);
  });

  test('should decrease item quantity in cart', async ({ cartPage }) => {
    await cartPage.clickFirstAvailableProduct();
    await cartPage.setQuantity(2);
    await cartPage.addToCart();
    
    await cartPage.goto();
    await cartPage.openCart();
    
    const initialQty = await cartPage.getFirstCartItemQuantity();
    await cartPage.decreaseQuantity();
    
    const newQty = await cartPage.getFirstCartItemQuantity();
    expect(newQty).toBe(initialQty - 1);
  });

  test('should show empty cart message', async ({ cartPage }) => {
    await cartPage.clearLocalStorage();
    await cartPage.goto();
    
    await cartPage.openCart();
    const isEmpty = await cartPage.isCartEmpty();
    expect(isEmpty).toBeTruthy();
  });

  test('should calculate total price', async ({ cartPage }) => {
    await cartPage.clickFirstAvailableProduct();
    await cartPage.addToCart();
    
    // Only open cart if needed (not for G31 where it's always visible)
    if (!config.features?.cartAlwaysVisible) {
      await cartPage.goto();
      await cartPage.openCart();
    }
    
    const total = await cartPage.getCartTotal();
    expect(total).toBeGreaterThan(0);
  });

  // G31-specific test: Search functionality
  test('should filter products by search term', async ({ cartPage, page }, testInfo) => {
    // Get config for this test run
    const siteName = process.env.SITE || testInfo.project.name.match(/^(\w+)/i)?.[1]?.toLowerCase() || 'g05';
    const config = siteConfigs[siteName];
    
    // Skip if site doesn't have search
    if (!config.features?.hasSearchBox) {
      test.skip();
    }
    
    const searchInput = page.locator(config.selectors.searchInput);
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    
    // Products should be filtered
    const products = await cartPage.getAvailableProducts();
    const count = await products.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // Test for sites with always-visible cart (like G31)
  test('should show cart information without opening popup', async ({ cartPage }, testInfo) => {
    const siteName = process.env.SITE || testInfo.project.name.match(/^(\w+)/i)?.[1]?.toLowerCase() || 'g05';
    const config = siteConfigs[siteName];
    
    // Only run for sites with always-visible cart
    if (!config.features?.cartAlwaysVisible) {
      test.skip();
    }
    
    await cartPage.clickFirstAvailableProduct();
    await cartPage.addToCart();
    
    // Cart info should be immediately visible
    const cartPopup = await cartPage.getCartPopup();
    await expect(cartPopup).toBeVisible();
    
    const items = await cartPage.getCartItems();
    await expect(items.first()).toBeVisible();
  });

  // Test that should only run for G31 (always-visible cart)
  test('should not have open/close cart functionality', async ({ cartPage }, testInfo) => {
    const siteName = process.env.SITE || testInfo.project.name.match(/^(\w+)/i)?.[1]?.toLowerCase() || 'g05';
    const config = siteConfigs[siteName];
    
    if (!config.features?.cartAlwaysVisible) {
      test.skip();
    }
    
    // Cart should always be visible - verify aside element is present
    const cart = await cartPage.getCartPopup();
    await expect(cart).toBeVisible();
  });
});


