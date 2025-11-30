// ==========================================
// 1. CONFIG FILE: config/sites.config.js
// ==========================================
export const siteConfigs = {
  g05: {
    baseURL: 'https://ivm108.informatik.htw-dresden.de/ewa24tests/g05/EWA_Beleg_24/#/',
    selectors: {
      // Product listing
      productCard: '.main-artikel',
      productOutOfStock: 'span.text-danger:has-text("Ausverkauft!")',
      
      // Product detail page
      addToCartButton: 'input[type="submit"][value="In den Einkaufswagen"]',
      quantityInput: 'input[type="number"][aria-label="amount"]',
      stockDisplay: 'text=Lagerbestand:',
      
      // Cart
      cartButton: 'button.btn-success:has(i.fa-bag-shopping)',
      cartBadge: '.badge.bg-danger',
      cartPopup: '.popupKorb',
      cartItem: '.korb-artikel',
      cartItemTitle: '.fw-bold.th_title-korb',
      cartItemQuantity: '.fw-bold.d-flex.align-items-center',
      increaseButton: 'button:has-text("+")',
      decreaseButton: 'button:has-text("-")',
      cartTotal: 'text=Gesamtkosten:',
      emptyCartMessage: 'text=Korb ist leer!',
      checkoutButton: 'button.btn-success:has-text("Zur Kasse")',
      closeCartButton: 'span.btn:has(i.fa-x)',
    },
    text: {
      addToCart: 'In den Einkaufswagen',
      outOfStock: 'Ausverkauft!',
      emptyCart: 'Korb ist leer!',
    },
    routes: {
      home: '/',
      itemPattern: /.*#\/item\/\d+/,
    }
  },

  
  // G31 Site - Simple Vue 3 app with inline cart
  g31: {
    baseURL: 'https://ivm108.informatik.htw-dresden.de/ewa/g31/Beleg/',
    selectors: {
      // Product listing (no separate product cards, list items)
      productCard: '.list-group-item',
      productOutOfStock: 'span:has-text("Neue Waren sind unterwegs")',
      
      // Product actions (inline, no detail page)
      addToCartButton: 'button.btn-outline-primary:has-text("In den Warenkorb")',
      quantityInput: null, // No quantity input on product page
      stockDisplay: '.badge.badge-primary.badge-pill',
      
      // Cart (sidebar, always visible)
      cartButton: null, // No cart button, cart is always visible
      cartBadge: 'aside strong', // First strong tag shows item count
      cartPopup: 'aside', // Cart is a sidebar
      cartItem: 'aside ul li',
      cartItemTitle: null, // Item text includes name
      cartItemQuantity: null, // Quantity shown in format: (2 x 10 €)
      increaseButton: null, // No increase button, must add again
      decreaseButton: 'button:has-text("Entfernen")',
      cartTotal: 'aside p:has-text("Gesamtpreis:")',
      emptyCartMessage: null, // No specific empty message
      checkoutButton: 'button:has-text("Jetzt bezahlen")',
      closeCartButton: null, // No close button, always visible
      
      // Additional G31-specific
      searchInput: '#searchInput',
      productName: null, // Part of list item text
      productPrice: null, // Part of list item text
    },
    text: {
      addToCart: 'In den Warenkorb',
      outOfStock: 'Neue Waren sind unterwegs',
      emptyCart: null, // Cart shows 0 items
      checkout: 'Jetzt bezahlen',
      remove: 'Entfernen',
    },
    routes: {
      home: '/',
      itemPattern: null, // No separate item pages
    },
    // G31-specific flags
    features: {
      hasProductDetailPage: false,
      hasCartPopup: false,
      cartAlwaysVisible: true,
      hasQuantitySelector: false,
      hasIncreaseButton: false,
      hasSearchBox: true,
    }
  }
};
