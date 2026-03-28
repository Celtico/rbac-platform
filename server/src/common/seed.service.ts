import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private permissionsService: PermissionsService,
  ) {}

  async onApplicationBootstrap() {
    const existingUsers = await this.usersService.findAll();
    if (existingUsers.length > 0) return;

    console.log('Seeding initial data...');

    const p1 = await this.permissionsService.create({ name: 'read:albums' });
    const p2 = await this.permissionsService.create({ name: 'write:albums' });
    const p3 = await this.permissionsService.create({ name: 'read:users' });
    const p4 = await this.permissionsService.create({ name: 'manage:users' });
    const p5 = await this.permissionsService.create({ name: 'read:roles' });
    const p6 = await this.permissionsService.create({ name: 'manage:roles' });

    const adminRole = await this.rolesService.create({
      name: 'admin',
      permissionIds: [p1.id, p2.id, p3.id, p4.id, p5.id, p6.id],
    });

    const userRole = await this.rolesService.create({
      name: 'user',
      permissionIds: [p1.id],
    });

    await this.usersService.create({
      username: 'celticopetit@gmail.com',
      password: 'celticopetit@gmail.com',
      roleIds: [adminRole.id],
    });

    await this.usersService.create({
      username: 'admin',
      password: 'adminpassword',
      roleIds: [adminRole.id],
    });

    await this.usersService.create({
      username: 'user',
      password: 'userpassword',
      roleIds: [userRole.id],
    });

    console.log(
      'Seeding complete. Admin: celticopetit@gmail.com/celticopetit@gmail.com, admin/adminpassword, User: user/userpassword',
    );
  }
}
