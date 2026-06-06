import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// bcrypt cost factor (raised from 10 to 12 to keep pace with hardware).
const SALT_ROUNDS = 12;

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
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
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
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findOrCreateByGoogle(profile: {
    googleId: string;
    email: string;
    displayName: string;
  }): Promise<User> {
    // 1. Try by googleId
    let user = await this.usersRepository.findOne({
      where: { googleId: profile.googleId },
      relations: ['roles', 'roles.permissions'],
    });
    if (user) return user;

    // 2. Try by email (link existing account)
    user = await this.usersRepository.findOne({
      where: { username: profile.email },
      relations: ['roles', 'roles.permissions'],
    });
    if (user) {
      user.googleId = profile.googleId;
      return this.usersRepository.save(user);
    }

    // 3. Create new user — assign 'invitat' role by default
    const invitatRole = await this.rolesRepository.findOne({
      where: { name: 'invitat' },
    });
    const newUser = this.usersRepository.create({
      username: profile.email,
      googleId: profile.googleId,
      password: await bcrypt.hash(crypto.randomUUID(), SALT_ROUNDS),
      roles: invitatRole ? [invitatRole] : [],
    });
    return this.usersRepository.save(newUser);
  }

  findOneByUsernameWithPassword(username: string) {
    return this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username', 'password'],
      relations: ['roles', 'roles.permissions'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { roleIds, password, tenantId, ...rest } = updateUserDto;

    // Load current state (with roles) so we can guard against demoting the
    // last administrator.
    const current = await this.findOne(+id);
    if (!current) throw new NotFoundException(`User #${id} not found`);

    const user = await this.usersRepository.preload({
      id: +id,
      ...rest,
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (password) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (roleIds) {
      const newRoles = await this.rolesRepository.findBy({ id: In(roleIds) });
      const wasAdmin = this.hasAdminRole(current);
      const willBeAdmin = newRoles.some((r) => r.name === 'admin');
      if (wasAdmin && !willBeAdmin && (await this.adminCount()) <= 1) {
        throw new BadRequestException(
          "No pots treure el rol d'administrador a l'últim administrador.",
        );
      }
      user.roles = newRoles;
    }

    if (tenantId !== undefined) {
      user.tenantId = tenantId;
    }

    return this.usersRepository.save(user);
  }

  async remove(id: number, requesterId?: number) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (requesterId !== undefined && requesterId === id) {
      throw new BadRequestException('No pots eliminar el teu propi compte.');
    }

    if (this.hasAdminRole(user) && (await this.adminCount()) <= 1) {
      throw new BadRequestException(
        "No pots eliminar l'últim administrador del sistema.",
      );
    }

    return this.usersRepository.remove(user);
  }

  private hasAdminRole(user: User): boolean {
    return user.roles?.some((r) => r.name === 'admin') ?? false;
  }

  /** Number of users that currently hold the `admin` role. */
  private async adminCount(): Promise<number> {
    const users = await this.usersRepository.find({ relations: ['roles'] });
    return users.filter((u) => this.hasAdminRole(u)).length;
  }
}
