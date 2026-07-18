import type { Request, CookieOptions } from 'express';

/** Name of the HttpOnly auth cookie (dual-mode alongside the Authorization header). */
export const AUTH_COOKIE = 'access_token';

/** Cookie options for the JWT: not readable by JS, 1-day life (matches the JWT). */
export function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };
}

/** Parse a single cookie value from a raw Cookie header string (no cookie-parser dep). */
export function parseCookieHeader(
  header: string | undefined | null,
  name: string,
): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

/** Read a single cookie value from an Express request. */
export function getCookie(req: Request, name: string): string | null {
  return parseCookieHeader(req.headers?.cookie, name);
}
