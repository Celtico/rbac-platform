import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  create(dto: CreateTenantDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException(`Tenant #${id} not found`);
    return t;
  }

  /** Load tenant WITH password (only for internal Odoo auth). */
  async findOneWithCredentials(id: number): Promise<Tenant> {
    const t = await this.repo
      .createQueryBuilder('t')
      .addSelect('t.odooPassword')
      .where('t.id = :id', { id })
      .getOne();
    if (!t) throw new NotFoundException(`Tenant #${id} not found`);
    return t;
  }

  async update(id: number, dto: UpdateTenantDto) {
    const t = await this.findOne(id);
    Object.assign(t, dto);
    return this.repo.save(t);
  }

  async remove(id: number) {
    const t = await this.findOne(id);
    return this.repo.remove(t);
  }
}
