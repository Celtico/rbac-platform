import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const { permissionIds, ...rest } = createRoleDto;
    const role = this.rolesRepository.create(rest);

    if (permissionIds && permissionIds.length > 0) {
      role.permissions = await this.permissionsRepository.findBy({
        id: In(permissionIds),
      });
    }

    return this.rolesRepository.save(role);
  }

  findAll() {
    return this.rolesRepository.find({ relations: ['permissions'] });
  }

  findOne(id: number) {
    return this.rolesRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const { permissionIds, ...rest } = updateRoleDto;
    const role = await this.rolesRepository.preload({
      id: +id,
      ...rest,
    });

    if (!role) throw new NotFoundException(`Role #${id} not found`);

    if (permissionIds) {
      role.permissions = await this.permissionsRepository.findBy({
        id: In(permissionIds),
      });
    }

    return this.rolesRepository.save(role);
  }

  async remove(id: number) {
    const role = await this.findOne(id);
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return this.rolesRepository.remove(role);
  }
}
