import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  Header,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from 'typeorm';
import { AppLoggerService } from './app-logger.service';
import { LogEntry } from './entities/log-entry.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions, Public } from '../auth/decorators/roles.decorator';
import { isMasterAdmin } from '../auth/is-master-admin';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('logs')
@Controller('logs')
export class LogsController {
  constructor(
    private readonly loggerService: AppLoggerService,
    private readonly jwtService: JwtService,
    @InjectRepository(LogEntry)
    private readonly logRepo: Repository<LogEntry>,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('read:logsystem')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated log history' })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'context', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @Get()
  async getLogs(
    @Query('level') level?: string,
    @Query('context') context?: string,
    @Query('search') search?: string,
    @Query('limit') limit = 100,
    @Query('offset') offset = 0,
  ) {
    const where: Record<string, unknown> = {};
    if (level) where.level = level;
    if (context) where.context = context;
    if (search) where.message = Like(`%${search}%`);

    const [entries, total] = await this.logRepo.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      take: Number(limit),
      skip: Number(offset),
    });

    return { entries, total, limit: Number(limit), offset: Number(offset) };
  }

  @Public()
  @ApiOperation({ summary: 'Stream live logs via SSE (pass ?token=JWT)' })
  @ApiQuery({ name: 'token', required: true })
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  @Get('stream')
  streamLogs(@Query('token') token: string, @Req() req: Request, @Res() res: Response) {
    // Validate JWT manually (EventSource can't set Authorization header)
    try {
      const payload = this.jwtService.verify(token) as {
        permissions?: string[];
        roles?: string[];
      };
      const permissions: string[] = payload.permissions ?? [];
      if (!isMasterAdmin(payload) && !permissions.includes('read:logsystem')) {
        res.status(403).end();
        return;
      }
    } catch {
      res.status(401).end();
      return;
    }

    res.flushHeaders();
    res.write('retry: 3000\n\n');

    const unsubscribe = this.loggerService.subscribe((entry) => {
      res.write(`data: ${JSON.stringify(entry)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
      res.end();
    });
  }
}
