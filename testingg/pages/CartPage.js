export class CartPage {
  constructor(page, config) {
    this.page = page;
    this.config = config;
    this.selectors = config.selectors;
    this.text = config.text;
  }

  // Navigation
  async goto() {
    await this.page.goto(this.config.baseURL);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForProducts() {
    await this.page.waitForSelector(this.selectors.productCard, { timeout: 10000 });
  }

  // Product actions
  async getAvailableProducts() {
    return this.page.locator(this.selectors.productCard).filter({
      hasNot: this.page.locator(this.selectors.productOutOfStock)
    });
  }

  async clickFirstAvailableProduct() {
    // Skip for sites without product detail pages
    if (this.config.features?.hasProductDetailPage === false) {
      return; // Products are added directly from listing
    }
    
    const products = await this.getAvailableProducts();
    await products.first().click();
    await this.page.waitForURL(this.config.routes.itemPattern);
    await this.page.waitForLoadState('networkidle');
  }

  async setQuantity(quantity) {
    // Skip if no quantity input available
    if (!this.selectors.quantityInput) {
      return;
    }
    
    const input = this.page.locator(this.selectors.quantityInput);
    await input.fill(quantity.toString());
  }

  async addToCart() {
    const button = this.page.locator(this.selectors.addToCartButton).first();
    await button.click();
    await this.page.waitForTimeout(1000); // Wait for cart update
  }

  // Cart actions
  async getCartButton() {
    return this.page.locator(this.selectors.cartButton);
  }

  async getCartCount() {
    const badge = this.page.locator(this.selectors.cartBadge);
    const text = await badge.textContent();
    return parseInt(text.trim());
  }

  async openCart() {
    // Skip if cart is always visible
    if (this.config.features?.cartAlwaysVisible) {
      return; // Cart already visible
    }
    
    const cartButton = await this.getCartButton();
    await cartButton.click();
    await this.page.locator(this.selectors.cartPopup).waitFor({ state: 'visible' });
  }

  async closeCart() {
    // Skip if no close button or cart always visible
    if (!this.selectors.closeCartButton || this.config.features?.cartAlwaysVisible) {
      return;
    }
    
    const closeButton = this.page.locator(this.selectors.closeCartButton);
    await closeButton.click();
  }

  async getCartPopup() {
    return this.page.locator(this.selectors.cartPopup);
  }

  async getCartItems() {
    return this.page.locator(this.selectors.cartItem);
  }

  async getFirstCartItemQuantity() {
    const firstItem = await this.getCartItems();
    const quantityEl = firstItem.first().locator(this.selectors.cartItemQuantity);
    const text = await quantityEl.textContent();
    return parseInt(text.trim());
  }

  async increaseQuantity(itemIndex = 0) {
    // Some sites don't have increase button, need to add item again
    if (!this.selectors.increaseButton || this.config.features?.hasIncreaseButton === false) {
      await this.addToCart(); // Add same item again
      return;
    }
    
    const items = await this.getCartItems();
    const increaseBtn = items.nth(itemIndex).locator(this.selectors.increaseButton);
    await increaseBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async decreaseQuantity(itemIndex = 0) {
    const items = await this.getCartItems();
    const decreaseBtn = items.nth(itemIndex).locator(this.selectors.decreaseButton);
    await decreaseBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async isCartEmpty() {
    const emptyMsg = this.page.locator(this.selectors.emptyCartMessage);
    return await emptyMsg.isVisible({ timeout: 2000 }).catch(() => false);
  }

  async getCartTotal() {
    const totalEl = this.page.locator(this.selectors.cartTotal);
    const text = await totalEl.textContent();
    const match = text.match(/[\d,.]+/);
    return match ? parseFloat(match[0].replace(',', '.')) : 0;
  }

  async proceedToCheckout() {
    const checkoutBtn = this.page.locator(this.selectors.checkoutButton);
    await checkoutBtn.click();
    await this.page.waitForTimeout(1000);
  }

  // Utility methods
  async clearLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }
}