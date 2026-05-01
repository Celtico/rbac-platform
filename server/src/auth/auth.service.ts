import {
  Injectable,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SessionsService } from '../sessions/sessions.service';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private sessionsService: SessionsService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsernameWithPassword(
      username,
    );
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, req?: Request) {
    const payload = {
      username: user.username,
      sub: user.id,
      roles: user.roles.map((r) => r.name),
      permissions: user.roles.flatMap((r) => r.permissions.map((p) => p.name)),
    };
    const access_token = this.jwtService.sign(payload);

    let isNewDevice = false;
    let hasOtherActiveSessions = false;

    if (req) {
      try {
        const result = await this.sessionsService.createSession(user.id, access_token, req);
        isNewDevice = result.isNewDevice;
        hasOtherActiveSessions = result.hasOtherActiveSessions;
      } catch {
        // Non-critical — continue login even if session tracking fails
      }
    }

    return {
      access_token,
      isNewDevice,
      hasOtherActiveSessions,
      user: {
        id: user.id,
        username: user.username,
        roles: payload.roles,
        permissions: payload.permissions,
      },
    };
  }
}
