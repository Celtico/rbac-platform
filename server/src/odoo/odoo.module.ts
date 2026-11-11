import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OdooController } from './odoo.controller';
import { OdooService } from './odoo.service';
import { OdooClientService } from './odoo-client.service';
import { OdooOrchestratorService } from './odoo-orchestrator.service';
import { TenantGuard } from './guards/tenant.guard';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { OdooSimRecord } from './simulated/odoo-sim-record.entity';
import { SimulatedOdooService } from './simulated/simulated-odoo.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant, OdooSimRecord])],
  controllers: [OdooController],
  providers: [
    OdooService,
    OdooClientService,
    SimulatedOdooService,
    OdooOrchestratorService,
    TenantGuard,
  ],
  exports: [OdooOrchestratorService, OdooClientService],
})
export class OdooModule {}
