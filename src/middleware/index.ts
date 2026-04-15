import { defineMiddleware } from 'astro:middleware';
import { ROUTES } from '../lib/constants';

const PROTECTED_PREFIXES = ['/account', '/checkout'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!isProtected) return next();

  // Check session cookie presence server-side.
  // Full session validation happens in the page's frontmatter via the API.
  // Here we do a lightweight cookie presence check to avoid the round-trip
  // for obviously unauthenticated requests.
  const sessionCookie =
    context.cookies.get('laravel_session') ??
    context.cookies.get('storefront_session');

  if (!sessionCookie) {
    const loginUrl = new URL(ROUTES.authLogin, context.url.origin);
    loginUrl.searchParams.set('redirect', pathname);
    return context.redirect(loginUrl.toString());
  }

  return next();
});
