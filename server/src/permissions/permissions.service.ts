import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  create(createPermissionDto: CreatePermissionDto) {
    const permission = this.permissionsRepository.create(createPermissionDto);
    return this.permissionsRepository.save(permission);
  }

  findAll() {
    return this.permissionsRepository.find();
  }

  findOne(id: number) {
    return this.permissionsRepository.findOneBy({ id });
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.permissionsRepository.preload({
      id: +id,
      ...updatePermissionDto,
    });
    if (!permission) throw new NotFoundException(`Permission #${id} not found`);
    return this.permissionsRepository.save(permission);
  }

  async remove(id: number) {
    const permission = await this.findOne(id);
    if (!permission) throw new NotFoundException(`Permission #${id} not found`);
    return this.permissionsRepository.remove(permission);
  }
}
