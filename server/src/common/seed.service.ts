import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { TenantsService } from '../tenants/tenants.service';
import { Permission } from '../permissions/entities/permission.entity';

// Insecure fallbacks used ONLY in non-production when the matching SEED_* env
// var is absent, to keep local dev frictionless. In production a missing env
// var aborts startup instead (see resolveSeedPassword).
const DEV_SEED_DEFAULTS: Record<string, string> = {
  'celticopetit@gmail.com': 'celticopetit@gmail.com',
  admin: 'adminpassword',
  user: 'userpassword',
};

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private permissionsService: PermissionsService,
    private tenantsService: TenantsService,
  ) {}

  /**
   * Resolve a seed user's password from its SEED_* env var. The default
   * accounts are only ever created when missing, so this is called only for a
   * fresh/empty database. In production a missing env var aborts startup
   * (fail closed) rather than creating an account with a weak default.
   */
  private resolveSeedPassword(username: string, envKey: string): string {
    const fromEnv = process.env[envKey]?.trim();
    if (fromEnv) return fromEnv;

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `[seed] Refusing to create user "${username}" with a default password in production. ` +
          `Set ${envKey} to a strong password and restart. Existing users are never modified, ` +
          `so this only affects a fresh/empty database.`,
      );
    }

    console.warn(
      `[seed] ${envKey} not set — using an INSECURE dev default for "${username}". Never use this in production.`,
    );
    return DEV_SEED_DEFAULTS[username];
  }

  async onApplicationBootstrap() {
    console.log('Checking and seeding initial data...');

    // 1. Permissions
    const permissionsToEnsure = [
      'read:photos',
      'write:photos',
      'read:users',
      'manage:users',
      'read:roles',
      'manage:roles',
      'use:ai',
      'read:tenants',
      'manage:tenants',
      'manage:deploy',
      'use:chat',
      'read:logsystem',
    ];

    const permissionEntities: Record<string, Permission> = {};
    const allPermissions = await this.permissionsService.findAll();

    for (const name of permissionsToEnsure) {
      let p = allPermissions.find((perm) => perm.name === name);
      if (!p) p = await this.permissionsService.create({ name });
      permissionEntities[name] = p;
    }

    // 2. Roles
    const allRoles = await this.rolesService.findAll();
    const adminPermissionIds = Object.values(permissionEntities).map((p) => p.id);

    let adminRole = allRoles.find((r) => r.name === 'admin');
    if (!adminRole) {
      adminRole = await this.rolesService.create({
        name: 'admin',
        permissionIds: adminPermissionIds,
      });
    } else {
      await this.rolesService.update(adminRole.id, {
        name: 'admin',
        permissionIds: adminPermissionIds,
      });
    }

    let userRole = allRoles.find((r) => r.name === 'user');
    if (!userRole) {
      userRole = await this.rolesService.create({
        name: 'user',
        permissionIds: [
          permissionEntities['read:photos'].id,
          permissionEntities['use:chat'].id,
        ],
      });
    } else {
      // Ensure use:chat is assigned to user role on update
      const userPerms = await this.rolesService.findOne(userRole.id);
      const hasChat = userPerms?.permissions?.some((p) => p.name === 'use:chat');
      if (!hasChat) {
        const currentIds = (userPerms?.permissions ?? []).map((p) => p.id);
        await this.rolesService.update(userRole.id, {
          name: 'user',
          permissionIds: [...currentIds, permissionEntities['use:chat'].id],
        });
      }
    }

    let invitatRole = allRoles.find((r) => r.name === 'invitat');
    if (!invitatRole) {
      invitatRole = await this.rolesService.create({
        name: 'invitat',
        permissionIds: [],
      });
    }

    // 3. Default tenant (from env vars)
    const odooUrl = process.env.ODOO_URL;
    let defaultTenantId: number | undefined;

    if (odooUrl) {
      const existing = await this.tenantsService.findAll();
      let defaultTenant = existing.find((t) => t.name === 'Default');
      if (!defaultTenant) {
        defaultTenant = await this.tenantsService.create({
          name: 'Default',
          odooUrl,
          odooDb: process.env.ODOO_DB ?? 'odoo_demo',
          odooUser: process.env.ODOO_USER ?? 'admin',
          odooPassword: process.env.ODOO_PASSWORD ?? 'admin',
        });
        console.log(`Created default tenant (${odooUrl})`);
      }
      defaultTenantId = defaultTenant.id;
    }

    // 4. Users
    const existingUsers = await this.usersService.findAll();

    if (!existingUsers.find((u) => u.username === 'celticopetit@gmail.com')) {
      const u = await this.usersService.create({
        username: 'celticopetit@gmail.com',
        password: this.resolveSeedPassword(
          'celticopetit@gmail.com',
          'SEED_SUPERADMIN_PASSWORD',
        ),
        roleIds: [adminRole.id],
      });
      if (defaultTenantId) {
        await this.usersService.update(u.id, { tenantId: defaultTenantId });
      }
    }

    if (!existingUsers.find((u) => u.username === 'admin')) {
      const u = await this.usersService.create({
        username: 'admin',
        password: this.resolveSeedPassword('admin', 'SEED_ADMIN_PASSWORD'),
        roleIds: [adminRole.id],
      });
      if (defaultTenantId) {
        await this.usersService.update(u.id, { tenantId: defaultTenantId });
      }
    }

    if (!existingUsers.find((u) => u.username === 'user')) {
      await this.usersService.create({
        username: 'user',
        password: this.resolveSeedPassword('user', 'SEED_USER_PASSWORD'),
        roleIds: [userRole.id],
      });
    }

    console.log('Seeding/Sync complete.');
  }
}
