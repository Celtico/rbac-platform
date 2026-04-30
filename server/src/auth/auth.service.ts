import {
  Injectable,
  UnauthorizedException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
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

  async login(user: any) {
    const payload = {
      username: user.username,
      sub: user.id,
      roles: user.roles.map((r) => r.name),
      permissions: user.roles.flatMap((r) => r.permissions.map((p) => p.name)),
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        roles: payload.roles,
        permissions: payload.permissions,
      },
    };
  }
}
