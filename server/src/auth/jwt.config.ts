import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

/**
 * Shared async config for every JwtModule.register in the app.
 *
 * The secret is read from JWT_SECRET (via the global ConfigModule) and the app
 * fails to boot if it is missing — never fall back to a hardcoded value, as a
 * known secret lets anyone forge admin tokens.
 */
export const jwtAsyncConfig: JwtModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow<string>('JWT_SECRET'),
    signOptions: { expiresIn: '1d' },
  }),
};