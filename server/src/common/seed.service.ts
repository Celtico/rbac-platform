import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { Permission } from '../permissions/entities/permission.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private permissionsService: PermissionsService,
  ) {}

  async onApplicationBootstrap() {
    console.log('Checking and seeding initial data...');

    // 1. Asegurar que los permisos existan
    const permissionsToEnsure = [
      'read:photos',
      'write:photos',
      'read:users',
      'manage:users',
      'read:roles',
      'manage:roles',
      'use:ai',
    ];

    const permissionEntities: Record<string, Permission> = {};

    const allPermissions = await this.permissionsService.findAll();

    for (const name of permissionsToEnsure) {
      let p = allPermissions.find((perm) => perm.name === name);
      if (!p) {
        p = await this.permissionsService.create({ name });
      }
      permissionEntities[name] = p;
    }

    // 2. Asegurar que los roles existan y tengan los permisos adecuados
    const allRoles = await this.rolesService.findAll();
    let adminRole = allRoles.find((r) => r.name === 'admin');
    const adminPermissionIds = Object.values(permissionEntities).map(
      (p) => p.id,
    );

    if (!adminRole) {
      adminRole = await this.rolesService.create({
        name: 'admin',
        permissionIds: adminPermissionIds,
      });
    } else {
      // Actualizar permisos del rol admin si es necesario para incluir nuevos permisos como manage:knowledge
      await this.rolesService.update(adminRole.id, {
        name: 'admin',
        permissionIds: adminPermissionIds,
      });
    }

    let userRole = allRoles.find((r) => r.name === 'user');
    const userPermissionIds = [permissionEntities['read:photos'].id];

    if (!userRole) {
      userRole = await this.rolesService.create({
        name: 'user',
        permissionIds: userPermissionIds,
      });
    }

    // 3. Asegurar que los usuarios iniciales existan
    const existingUsers = await this.usersService.findAll();

    if (!existingUsers.find((u) => u.username === 'celticopetit@gmail.com')) {
      await this.usersService.create({
        username: 'celticopetit@gmail.com',
        password: 'celticopetit@gmail.com',
        roleIds: [adminRole.id],
      });
    }

    if (!existingUsers.find((u) => u.username === 'admin')) {
      await this.usersService.create({
        username: 'admin',
        password: 'adminpassword',
        roleIds: [adminRole.id],
      });
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
