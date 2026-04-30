import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OdooConfig } from '../guards/tenant.guard';

/**
 * Extracts the OdooConfig attached by TenantGuard from the request.
 *
 * Usage: `@OdooTenantConfig() config: OdooConfig`
 */
export const OdooTenantConfig = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): OdooConfig => {
    const req = ctx.switchToHttp().getRequest<{ odooConfig: OdooConfig }>();
    return req.odooConfig;
  },
);
