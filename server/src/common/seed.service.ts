import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { TenantsService } from '../tenants/tenants.service';
import { Permission } from '../permissions/entities/permission.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private permissionsService: PermissionsService,
    private tenantsService: TenantsService,
  ) {}

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
      'write:odoo',
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
        password: 'celticopetit@gmail.com',
        roleIds: [adminRole.id],
      });
      if (defaultTenantId) {
        await this.usersService.update(u.id, { tenantId: defaultTenantId });
      }
    }

    if (!existingUsers.find((u) => u.username === 'admin')) {
      const u = await this.usersService.create({
        username: 'admin',
        password: 'adminpassword',
        roleIds: [adminRole.id],
      });
      if (defaultTenantId) {
        await this.usersService.update(u.id, { tenantId: defaultTenantId });
      }
    }

    if (!existingUsers.find((u) => u.username === 'user')) {
      await this.usersService.create({
        username: 'user',
        password: 'userpassword',
        roleIds: [userRole.id],
      });
    }

    console.log('Seeding/Sync complete.');
  }
}
