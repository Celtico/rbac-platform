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
    const { user } = context.switchToHttp().getRequest();

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
