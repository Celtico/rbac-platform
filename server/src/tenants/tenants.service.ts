import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { encryptSecret, decryptSecret, isEncrypted } from './tenant-crypto';

@Injectable()
export class TenantsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  /** Encrypt any legacy plaintext Odoo passwords still stored at rest. */
  async onApplicationBootstrap() {
    const rows = await this.repo
      .createQueryBuilder('t')
      .addSelect('t.odooPassword')
      .getMany();
    let migrated = 0;
    for (const t of rows) {
      if (t.odooPassword && !isEncrypted(t.odooPassword)) {
        t.odooPassword = encryptSecret(t.odooPassword);
        await this.repo.save(t);
        migrated++;
      }
    }
    if (migrated > 0) {
      this.logger.log(
        `Encrypted ${migrated} legacy tenant password(s) at rest.`,
      );
    }
  }

  async create(dto: CreateTenantDto) {
    const entity = this.repo.create(dto);
    entity.odooPassword = encryptSecret(dto.odooPassword);
    const saved = await this.repo.save(entity);
    delete (saved as Partial<Tenant>).odooPassword;
    return saved;
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException(`Tenant #${id} not found`);
    return t;
  }

  /** Load tenant WITH the decrypted password (only for internal Odoo auth). */
  async findOneWithCredentials(id: number): Promise<Tenant> {
    const t = await this.repo
      .createQueryBuilder('t')
      .addSelect('t.odooPassword')
      .where('t.id = :id', { id })
      .getOne();
    if (!t) throw new NotFoundException(`Tenant #${id} not found`);
    t.odooPassword = decryptSecret(t.odooPassword);
    return t;
  }

  async update(id: number, dto: UpdateTenantDto) {
    const t = await this.findOne(id);
    Object.assign(t, dto);
    if (dto.odooPassword) {
      t.odooPassword = encryptSecret(dto.odooPassword);
    } else {
      // Don't overwrite the stored (encrypted) password when none is provided.
      delete (t as Partial<Tenant>).odooPassword;
    }
    const saved = await this.repo.save(t);
    delete (saved as Partial<Tenant>).odooPassword;
    return saved;
  }

  async remove(id: number) {
    const t = await this.findOne(id);
    return this.repo.remove(t);
  }
}
