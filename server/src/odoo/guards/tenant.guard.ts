import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export interface OdooConfig {
  url: string;
  db: string;
  user: string;
  password: string;
  tenantId?: number;
  tenantName?: string;
}

/**
 * Runs after JwtAuthGuard.
 * Resolves the user's Tenant from the DB and attaches an OdooConfig
 * to `req.odooConfig`. Falls back to env-var defaults when the user
 * has no tenant assigned (useful for the built-in admin accounts).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user: { userId: number; username: string };
      odooConfig: OdooConfig;
    }>();

    const { userId, username } = req.user ?? {};

    // Try to load the user's tenant (with password via explicit query)
    const user = await this.users.findOne({
      where: { id: userId },
      select: ['id', 'tenantId'],
    });

    if (user?.tenantId) {
      const tenant = await this.tenants
        .createQueryBuilder('t')
        .addSelect('t.odooPassword')
        .where('t.id = :id', { id: user.tenantId })
        .getOne();

      if (tenant) {
        req.odooConfig = {
          url: tenant.odooUrl,
          db: tenant.odooDb,
          user: tenant.odooUser,
          password: tenant.odooPassword,
          tenantId: tenant.id,
          tenantName: tenant.name,
        };
        this.logger.debug(`Tenant resolved: ${tenant.name} for user ${username}`);
        return true;
      }
    }

    // Fall back to the "Default" tenant in the DB
    const defaultTenant = await this.tenants
      .createQueryBuilder('t')
      .addSelect('t.odooPassword')
      .where('LOWER(t.name) = :name', { name: 'default' })
      .getOne();

    if (defaultTenant) {
      req.odooConfig = {
        url: defaultTenant.odooUrl,
        db: defaultTenant.odooDb,
        user: defaultTenant.odooUser,
        password: defaultTenant.odooPassword,
        tenantId: defaultTenant.id,
        tenantName: defaultTenant.name,
      };
      this.logger.debug(`No tenant for user ${username} — using Default tenant from DB (${defaultTenant.odooUrl})`);
      return true;
    }

    // Last resort: env-var defaults
    const fallbackUrl = process.env.ODOO_URL;
    if (!fallbackUrl) {
      throw new ForbiddenException(
        'No Odoo tenant configured for this user. Ask an admin to assign a tenant.',
      );
    }

    this.logger.debug(`No tenant for user ${username} — using env-var defaults (${fallbackUrl})`);
    req.odooConfig = {
      url: fallbackUrl,
      db: process.env.ODOO_DB ?? 'odoo_demo',
      user: process.env.ODOO_USER ?? 'admin',
      password: process.env.ODOO_PASSWORD ?? 'admin',
      tenantName: 'default',
    };
    return true;
  }
}
