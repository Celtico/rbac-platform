import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Res,
  Body,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Public } from './decorators/roles.decorator';
import { AUTH_COOKIE, authCookieOptions } from './cookie.util';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

interface LoginResult {
  access_token: string;
  user: unknown;
  isNewDevice?: boolean;
  hasOtherActiveSessions?: boolean;
}

const OAUTH_CODE_TTL_MS = 60_000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  // Short-lived single-use codes so the OAuth redirect carries an opaque code
  // instead of the JWT + user JSON in the URL (which leak to logs/history).
  private readonly oauthCodes = new Map<
    string,
    { token: string; user: unknown; expiresAt: number }
  >();

  constructor(private authService: AuthService) {}

  // Stricter limit on login to slow credential brute-forcing: 5 attempts / minute.
  // @Public skips the global JWT guard (login is authenticated by LocalAuthGuard).
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const result = (await this.authService.login(req.user, req)) as LoginResult;
    // Dual-mode: set the HttpOnly cookie AND return the token in the body so the
    // existing header-based flow keeps working.
    res.cookie(AUTH_COOKIE, result.access_token, authCookieOptions());
    return result;
  }

  @Post('logout')
  @Public()
  @ApiOperation({ summary: 'Clear the auth cookie' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, { ...authCookieOptions(), maxAge: undefined });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  googleLogin() {
    // Passport handles the redirect
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Request() req, @Res() res: Response) {
    const result = (await this.authService.login(req.user, req)) as LoginResult;
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';

    // Set the cookie and hand the SPA a one-time code (NOT the JWT) in the URL.
    res.cookie(AUTH_COOKIE, result.access_token, authCookieOptions());
    const code = crypto.randomBytes(32).toString('hex');
    this.pruneCodes();
    this.oauthCodes.set(code, {
      token: result.access_token,
      user: result.user,
      expiresAt: Date.now() + OAUTH_CODE_TTL_MS,
    });
    res.redirect(`${clientUrl}/auth/callback?code=${code}`);
  }

  @Post('exchange')
  @Public()
  @ApiOperation({
    summary: 'Exchange a one-time OAuth code for the token + user',
  })
  exchange(@Body('code') code: string) {
    const entry = code ? this.oauthCodes.get(code) : undefined;
    if (code) this.oauthCodes.delete(code); // single-use
    if (!entry || entry.expiresAt < Date.now()) {
      throw new BadRequestException('Codi no vàlid o caducat.');
    }
    return { access_token: entry.token, user: entry.user };
  }

  private pruneCodes() {
    const now = Date.now();
    for (const [c, e] of this.oauthCodes) {
      if (e.expiresAt < now) this.oauthCodes.delete(c);
    }
  }
}
