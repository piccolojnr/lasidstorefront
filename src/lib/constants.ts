declare global {
  interface Window {
    __LASID_RUNTIME_CONFIG__?: {
      publicApiBase?: string;
    };
  }
}

function getRuntimePublicApiBase() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.__LASID_RUNTIME_CONFIG__?.publicApiBase?.trim() ?? '';
}

const publicApiBase =
  getRuntimePublicApiBase() || import.meta.env.PUBLIC_API_BASE?.trim() || '/api/v1';

const serverApiBase =
  (typeof process !== 'undefined' ? process.env.API_BASE?.trim() : '') ||
  (typeof process !== 'undefined' ? process.env.PUBLIC_API_BASE?.trim() : '') ||
  import.meta.env.API_BASE?.trim() ||
  import.meta.env.PUBLIC_API_BASE?.trim() ||
  '';

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
} as const;
