import { defineMiddleware } from 'astro:middleware';
import { ROUTES } from '../lib/constants';
import { getAuthTokenFromCookies } from '../lib/auth-cookie';

const PROTECTED_PREFIXES = ['/account'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!isProtected) return next();

  const cookieHeader = context.request.headers.get('cookie') ?? '';
  const authToken = getAuthTokenFromCookies(cookieHeader);

  if (!authToken) {
    const loginUrl = new URL(ROUTES.authLogin, context.url.origin);
    loginUrl.searchParams.set('redirect', pathname);
    return context.redirect(loginUrl.toString());
  }

  return next();
});
