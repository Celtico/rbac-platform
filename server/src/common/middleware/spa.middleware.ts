import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';

@Injectable()
export class SpaMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: () => void) {
    const { url } = _req;
    if (url.indexOf('/api') === 1) {
      next();
    } else {
      res.sendFile(join(process.cwd(), '..', 'client', 'dist', 'index.html'));
    }
  }
}
