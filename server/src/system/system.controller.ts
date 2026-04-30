import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SystemService } from './system.service';

@ApiTags('system')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Server resource usage (CPU, memory, uptime)' })
  getStats() {
    return this.systemService.getSnapshot();
  }
}
