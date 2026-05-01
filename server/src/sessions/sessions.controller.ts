import {
  Controller,
  Get,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: "List user's active sessions with device info" })
  async getSessions(@Req() req: Request) {
    const user = req.user as { userId: number };
    const token = req.headers.authorization?.split(' ')[1];
    return this.sessionsService.getUserSessions(user.userId, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: number };
    await this.sessionsService.revokeSession(id, user.userId);
    return { success: true };
  }

  @Delete()
  @ApiOperation({ summary: 'Revoke all sessions except current' })
  async revokeAllOtherSessions(@Req() req: Request) {
    const user = req.user as { userId: number };
    const token = req.headers.authorization?.split(' ')[1] ?? '';
    await this.sessionsService.revokeAllOtherSessions(user.userId, token);
    return { success: true };
  }
}
