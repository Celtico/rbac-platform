import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/roles.decorator';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Permissions('manage:tenants')
  @ApiOperation({ summary: 'Create tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @Permissions('read:tenants')
  @ApiOperation({ summary: 'List all tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Permissions('read:tenants')
  @ApiOperation({ summary: 'Get tenant by id' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(+id);
  }

  @Patch(':id')
  @Permissions('manage:tenants')
  @ApiOperation({ summary: 'Update tenant' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(+id, dto);
  }

  @Delete(':id')
  @Permissions('manage:tenants')
  @ApiOperation({ summary: 'Delete tenant' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(+id);
  }
}
