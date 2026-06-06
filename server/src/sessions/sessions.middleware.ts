import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { SessionsService } from './sessions.service';
import { AUTH_COOKIE, getCookie } from '../auth/cookie.util';
import * as crypto from 'crypto';

@Injectable()
export class SessionValidationMiddleware implements NestMiddleware {
  constructor(private readonly sessionsService: SessionsService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Accept the token from the Authorization header OR the HttpOnly cookie so
    // session revocation applies regardless of which auth transport is used.
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : getCookie(req, AUTH_COOKIE);
    if (!token) {
      return next();
    }

    // Never block the authentication endpoints themselves: a client may still
    // hold a stale/revoked token in storage, and re-login must always work.
    // (req.path is "/" here because the middleware is route-mounted; the full
    // path lives in originalUrl.)
    const url = req.originalUrl;
    if (url.includes('/auth/login') || url.includes('/auth/google')) {
      return next();
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.sessionsService.findByHash(tokenHash);
    // Fail closed: a bearer token must map to a live, non-revoked session.
    // Every issued token gets a session at login, so a missing one means the
    // session was deleted/never registered (or the token is forged/stale).
    if (!session) {
      throw new UnauthorizedException(
        'Sessió no vàlida. Torna a iniciar sessió.',
      );
    }
    if (session.isRevoked) {
      throw new UnauthorizedException(
        'La sessió ha estat revocada. Torna a iniciar sessió.',
      );
    }
    // Update lastSeen (throttled internally)
    void this.sessionsService.touchSession(token);

    next();
  }
}
