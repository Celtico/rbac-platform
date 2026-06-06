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
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from 'typeorm';
import { AppLoggerService } from './app-logger.service';
import { LogEntry } from './entities/log-entry.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

const MAX_LOG_LIMIT = 500;
const STREAM_TICKET_TTL_MS = 60_000;

@ApiTags('logs')
@Controller('logs')
export class LogsController {
  // Short-lived single-use tickets for the SSE stream so the long-lived JWT
  // never has to travel in the URL query string (where it leaks into access
  // logs, proxies and browser history).
  private readonly streamTickets = new Map<string, number>(); // ticket -> expiresAt

  constructor(
    private readonly loggerService: AppLoggerService,
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

    // Clamp pagination so a client can't request an unbounded page and exhaust memory.
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), MAX_LOG_LIMIT);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const [entries, total] = await this.logRepo.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      take: safeLimit,
      skip: safeOffset,
    });

    return { entries, total, limit: safeLimit, offset: safeOffset };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('read:logsystem')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a short-lived single-use ticket for the SSE stream' })
  @Get('stream-ticket')
  getStreamTicket() {
    this.pruneTickets();
    const ticket = crypto.randomBytes(32).toString('hex');
    this.streamTickets.set(ticket, Date.now() + STREAM_TICKET_TTL_MS);
    return { ticket, expiresInMs: STREAM_TICKET_TTL_MS };
  }

  private pruneTickets() {
    const now = Date.now();
    for (const [t, exp] of this.streamTickets) {
      if (exp < now) this.streamTickets.delete(t);
    }
  }

  @Public()
  @ApiOperation({ summary: 'Stream live logs via SSE (pass ?ticket= from /stream-ticket)' })
  @ApiQuery({ name: 'ticket', required: true })
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  @Get('stream')
  streamLogs(@Query('ticket') ticket: string, @Req() req: Request, @Res() res: Response) {
    // Authorize via a single-use, short-lived ticket (issued by /stream-ticket
    // to a read:logsystem holder). The long-lived JWT never appears in the URL.
    const expiresAt = ticket ? this.streamTickets.get(ticket) : undefined;
    if (ticket) this.streamTickets.delete(ticket); // single-use
    if (!expiresAt || expiresAt < Date.now()) {
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
