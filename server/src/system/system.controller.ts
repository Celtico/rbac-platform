import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/roles.decorator';
import { SystemService } from './system.service';

@ApiTags('system')
@ApiBearerAuth()
// Host resource stats are sensitive: require an explicit permission instead of
// exposing them to every authenticated user. Admins pass via the master bypass.
@UseGuards(JwtAuthGuard, RolesGuard)
@Permissions('read:logsystem')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Server resource usage (CPU, memory, uptime)' })
  getStats() {
    return this.systemService.getSnapshot();
  }
}
