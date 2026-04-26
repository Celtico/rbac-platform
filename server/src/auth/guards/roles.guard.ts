import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const request: any = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = request.user as {
      username: string;
      roles: string[];
      permissions: string[];
    };

    // Permitir acceso total a administradores maestros (admin o celticopetit@gmail.com)
    if (
      user &&
      (user.username === 'admin' || user.username === 'celticopetit@gmail.com')
    ) {
      console.log(`Bypassing RolesGuard for master admin: ${user.username}`);
      return true;
    }

    if (requiredRoles) {
      const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
      if (!hasRole) return false;
    }

    if (requiredPermissions) {
      const hasPermission = requiredPermissions.every((permission) =>
        user.permissions?.includes(permission),
      );
      if (!hasPermission) return false;
    }

    return true;
  }
}
