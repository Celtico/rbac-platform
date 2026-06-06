import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { SessionsService } from './sessions.service';
import * as crypto from 'crypto';

@Injectable()
export class SessionValidationMiddleware implements NestMiddleware {
  constructor(private readonly sessionsService: SessionsService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
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
