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
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.sessionsService.findByHash(tokenHash);
    if (session) {
      if (session.isRevoked) {
        throw new UnauthorizedException('La sessió ha estat revocada. Torna a iniciar sessió.');
      }
      // Update lastSeen (throttled internally)
      void this.sessionsService.touchSession(token);
    }
    // If session not found (e.g. first request before session is created), allow through

    next();
  }
}
