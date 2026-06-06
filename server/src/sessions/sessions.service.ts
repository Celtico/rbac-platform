import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { UserSession } from './entities/user-session.entity';
import * as crypto from 'crypto';
import type { Request } from 'express';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Desconegut';
  let os = 'Desconegut';

  // Browser detection
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  // OS detection
  if (ua.includes('Windows NT')) os = 'Windows';
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os };
}

@Injectable()
export class SessionsService {
  // Simple 60-second touch cache to avoid DB writes on every request
  private readonly touchCache = new Map<string, number>();

  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,
  ) {}

  async createSession(
    userId: number,
    token: string,
    req: Request,
  ): Promise<{ isNewDevice: boolean; hasOtherActiveSessions: boolean }> {
    const tokenHash = hashToken(token);
    const userAgent = req.headers['user-agent'] ?? '';
    const ip = this.getIp(req);
    const fingerprint = hashToken(`${userAgent}${ip}`);
    const { browser, os } = parseUserAgent(userAgent);

    // Check if this fingerprint was seen before for this user
    const knownDevice = await this.sessionRepo.findOne({
      where: { userId, deviceFingerprint: fingerprint, isRevoked: false },
    });
    const isNewDevice = !knownDevice;

    // Check for other active sessions
    const otherSessions = await this.sessionRepo.find({
      where: { userId, isRevoked: false },
    });
    const hasOtherActiveSessions = otherSessions.length > 0;

    const now = new Date();
    const session = this.sessionRepo.create({
      userId,
      tokenHash,
      deviceFingerprint: fingerprint,
      browser,
      os,
      ipAddress: ip,
      isRevoked: false,
      isNewDevice,
      firstSeen: now,
      lastSeen: now,
    });
    await this.sessionRepo.save(session);

    return { isNewDevice, hasOtherActiveSessions };
  }

  async getUserSessions(
    userId: number,
    currentToken?: string,
  ): Promise<(UserSession & { isCurrent: boolean })[]> {
    const sessions = await this.sessionRepo.find({
      where: { userId, isRevoked: false },
      order: { lastSeen: 'DESC' },
    });
    const currentHash = currentToken ? hashToken(currentToken) : null;
    return sessions.map((s) => ({
      ...s,
      isCurrent: currentHash ? s.tokenHash === currentHash : false,
    }));
  }

  async revokeSession(sessionId: string, requestingUserId: number): Promise<void> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId: requestingUserId },
    });
    if (session) {
      session.isRevoked = true;
      await this.sessionRepo.save(session);
    }
  }

  async revokeAllOtherSessions(userId: number, currentToken: string): Promise<void> {
    const currentHash = hashToken(currentToken);
    const sessions = await this.sessionRepo.find({
      where: { userId, isRevoked: false, tokenHash: Not(currentHash) },
    });
    for (const s of sessions) {
      s.isRevoked = true;
    }
    if (sessions.length > 0) {
      await this.sessionRepo.save(sessions);
    }
  }

  async findByHash(tokenHash: string): Promise<UserSession | null> {
    return this.sessionRepo.findOne({ where: { tokenHash } });
  }

  async touchSession(token: string): Promise<void> {
    const now = Date.now();
    const tokenHash = hashToken(token);
    const lastTouch = this.touchCache.get(tokenHash) ?? 0;
    if (now - lastTouch < 60_000) return;

    this.touchCache.set(tokenHash, now);
    await this.sessionRepo.update({ tokenHash }, { lastSeen: new Date() });
  }

  private getIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? 'unknown';
  }
}
