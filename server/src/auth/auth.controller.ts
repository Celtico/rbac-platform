import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  async login(@Request() req) {
    return this.authService.login(req.user, req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  googleLogin() {
    // Passport handles the redirect
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.login(req.user, req);
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
    const token = encodeURIComponent(result.access_token);
    const user = encodeURIComponent(JSON.stringify(result.user));
    res.redirect(`${clientUrl}/auth/callback?token=${token}&user=${user}`);
  }
}
