export const API_BASE = import.meta.env.PUBLIC_API_BASE ?? '/api/v1';

export const CART_TOKEN_KEY = 'cart_token';

export const ROUTES = {
  home: '/',
  products: '/products',
  cart: '/cart',
  checkout: '/checkout',
  authLogin: '/auth/login',
  authMagicLink: '/auth/magic-link',
  accountOrders: '/account/orders',
  accountAddresses: '/account/addresses',
  accountProfile: '/account',
} as const;
