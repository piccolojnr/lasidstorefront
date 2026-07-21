const publicApiBase = import.meta.env.PUBLIC_API_BASE?.trim() || '/api/v1';
const serverApiBase = import.meta.env.PUBLIC_SERVER_API_BASE?.trim();

export const API_BASE = publicApiBase;

export const SERVER_API_BASE =
  serverApiBase || (publicApiBase.startsWith('http://') || publicApiBase.startsWith('https://')
    ? publicApiBase
    : '');

export const CART_TOKEN_KEY = 'cart_token';

export const ROUTES = {
  home: '/',
  products: '/products',
  collections: '/collections',
  cart: '/cart',
  checkout: '/checkout',
  authLogin: '/auth/login',
  authMagicLink: '/auth/magic-link',
  accountOrders: '/account/orders',
  accountAddresses: '/account/addresses',
  accountProfile: '/account',
  accountWishlist: '/account/wishlist',
  // Customer care
  about: '/about',
  contact: '/contact',
  faqs: '/faqs',
  shippingAndDelivery: '/shipping-and-delivery',
  returnsAndExchanges: '/returns-and-exchanges',
  // Legal
  privacyPolicy: '/privacy-policy',
  termsOfService: '/terms-of-service',
} as const;
