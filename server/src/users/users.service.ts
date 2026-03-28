import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, roleIds, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      ...rest,
      password: hashedPassword,
    });

    if (roleIds && roleIds.length > 0) {
      user.roles = await this.rolesRepository.findBy({ id: In(roleIds) });
    }

    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find({
      relations: ['roles', 'roles.permissions'],
    });
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
  }

  findOneByUsername(username: string) {
    return this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username', 'password'],
      relations: ['roles', 'roles.permissions'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { roleIds, password, ...rest } = updateUserDto;
    const user = await this.usersRepository.preload({
      id: +id,
      ...rest,
    });

    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (roleIds) {
      user.roles = await this.rolesRepository.findBy({ id: In(roleIds) });
    }

    return this.usersRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return this.usersRepository.remove(user);
  }
}
