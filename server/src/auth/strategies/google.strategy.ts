import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private usersService: UsersService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email from Google'), undefined);

    try {
      const user = await this.usersService.findOrCreateByGoogle({
        googleId: profile.id,
        email,
        displayName: profile.displayName,
      });
      this.logger.log(`Google login: user ${user.id} (${user.username}), roles: ${user.roles?.map((r) => r.name).join(', ')}`);
      done(null, user);
    } catch (err) {
      this.logger.error(`Google login failed for ${email}`, err);
      done(err as Error, undefined);
    }
  }
}
