import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  Inject,
  forwardRef,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Resolve roles/permissions FRESH from the DB on every request instead of
  // trusting the (up-to-1-day-old) token payload, so revoking a role/permission
  // takes effect immediately. Also rejects tokens whose user no longer exists.
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuari no trobat.');
    }
    const roles = user.roles?.map((r) => r.name) ?? [];
    const permissions = [
      ...new Set(
        user.roles?.flatMap((r) => r.permissions?.map((p) => p.name) ?? []) ??
          [],
      ),
    ];
    return {
      userId: user.id,
      username: user.username,
      roles,
      permissions,
    };
  }
}
