export const NAV = {
  logo: "nav-logo",
  shopLink: "nav-shop-link",
  techLink: "nav-tech-link",
  arLink: "nav-ar-link",
  accountLink: "nav-account-link",
  cartButton: "nav-cart-button",
  cartCount: "nav-cart-count",
  mobileMenuToggle: "nav-mobile-toggle",
};

export const HERO = {
  shopNow: "hero-shop-now-button",
  watchFilm: "hero-watch-film-button",
  scrollHint: "hero-scroll-hint",
};

export const TIERS = {
  card: (tier) => `tier-card-${tier}`,
};

export const TEARDOWN = {
  section: "teardown-section",
  hotspot: (key) => `teardown-hotspot-${key}`,
};

export const PRODUCT = {
  card: (id) => `product-card-${id}`,
  addToCart: "pdp-add-to-cart-button",
  buyNow: "pdp-buy-now-button",
  tryOn: "pdp-try-on-button",
  thumb: (i) => `pdp-thumb-${i}`,
};

export const CART = {
  drawer: "cart-drawer",
  closeButton: "cart-close-button",
  item: (id) => `cart-item-${id}`,
  removeItem: (id) => `cart-remove-${id}`,
  incQty: (id) => `cart-inc-${id}`,
  decQty: (id) => `cart-dec-${id}`,
  total: "cart-total",
  checkoutButton: "cart-checkout-button",
};

export const AR = {
  startButton: "ar-start-button",
  stopButton: "ar-stop-button",
  canvas: "ar-canvas",
  sizeSlider: "ar-size-slider",
  yOffsetSlider: "ar-y-slider",
};

export const AUTH = {
  loginTab: "auth-login-tab",
  registerTab: "auth-register-tab",
  emailInput: "auth-email-input",
  passwordInput: "auth-password-input",
  nameInput: "auth-name-input",
  submitButton: "auth-submit-button",
  logoutButton: "auth-logout-button",
};

export const FOOTER = {
  newsletterInput: "footer-newsletter-input",
  newsletterSubmit: "footer-newsletter-submit",
};

export const SUPPORT = {
  widget: "support-widget",
  toggle: "support-toggle",
};
