import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { ChatService } from './chat.service';
import { ChatOrchestratorService, ConversationMessage } from './chat-orchestrator.service';
import { SessionsService } from '../sessions/sessions.service';
import { isMasterAdmin } from '../auth/is-master-admin';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { decryptSecret } from '../tenants/tenant-crypto';
import { OdooConfig } from '../odoo/guards/tenant.guard';

interface JwtPayload {
  sub: number;
  username: string;
  roles: string[];
  permissions: string[];
}

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: true, credentials: true },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly orchestrator: ChatOrchestratorService,
    private readonly sessionsService: SessionsService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  afterInit(server: Server) {
    // Authenticate and authorize at the handshake so a bad/revoked token is
    // rejected BEFORE the connection is established (no connect-then-drop).
    server.use(async (client: Socket, next: (err?: Error) => void) => {
      try {
        const token = client.handshake.auth?.token as string;
        if (!token) throw new Error('No token');
        const payload = this.jwtService.verify<JwtPayload>(token);

        // Enforce session revocation on the socket too (mirrors the HTTP
        // SessionValidationMiddleware): a token whose session is missing or
        // revoked — e.g. via DeviceManager — must not be able to connect.
        const tokenHash = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');
        const session = await this.sessionsService.findByHash(tokenHash);
        if (!session || session.isRevoked) {
          throw new Error('Session missing or revoked');
        }

        client.data.userId = payload.sub;
        client.data.username = payload.username;
        client.data.roles = payload.roles ?? [];
        client.data.permissions = payload.permissions ?? [];
        client.data.tokenHash = tokenHash;
        next();
      } catch {
        this.logger.warn(`Rejected WS handshake: ${client.id}`);
        next(new Error('Autenticació invàlida. Torna a iniciar sessió.'));
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(
      `Client connected: ${client.data.username} (${client.id})`,
    );
  }

  /** Returns true (and disconnects the client) if the session is no longer valid. */
  private async sessionInvalidated(client: Socket): Promise<boolean> {
    const tokenHash: string | undefined = client.data.tokenHash;
    if (!tokenHash) return false;
    const session = await this.sessionsService.findByHash(tokenHash);
    if (!session || session.isRevoked) {
      client.emit('chat:error', {
        message: 'La sessió ha estat revocada. Torna a iniciar sessió.',
      });
      client.disconnect();
      return true;
    }
    return false;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Build a safe conversation title from the first user message: drops control
   * characters and angle brackets, collapses whitespace and caps the length.
   * Defense-in-depth: the title is attacker-controlled and broadcast to the
   * room (the frontend already escapes it when rendering).
   */
  private sanitizeTitle(raw: string): string {
    let out = '';
    for (const ch of raw ?? '') {
      const code = ch.codePointAt(0) ?? 0;
      out += code < 32 || code === 127 || ch === '<' || ch === '>' ? ' ' : ch;
    }
    return out.replace(/\s+/g, ' ').trim().slice(0, 60);
  }

  @SubscribeMessage('chat:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    void client.join(`conv:${data.conversationId}`);
  }

  @SubscribeMessage('chat:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    void client.leave(`conv:${data.conversationId}`);
  }

  @SubscribeMessage('chat:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; message: string },
  ) {
    // Re-check the session on every message so a revocation takes effect on an
    // already-open socket, not just at connection time.
    if (await this.sessionInvalidated(client)) return;

    const permissions: string[] = client.data.permissions ?? [];
    const roles: string[] = client.data.roles ?? [];
    const userId: number = client.data.userId;

    if (!isMasterAdmin({ roles }) && !permissions.includes('use:chat')) {
      client.emit('chat:error', {
        message: 'No tens permís per usar el xat. Contacta amb l\'administrador per obtenir el permís use:chat.',
      });
      return;
    }

    // Verify conversation ownership
    let conversation;
    try {
      conversation = await this.chatService.getConversation(data.conversationId, userId);
    } catch {
      client.emit('chat:error', { message: 'Conversa no trobada o accés denegat.' });
      return;
    }

    // Save user message
    const userMsg = await this.chatService.saveMessage(
      data.conversationId,
      'user',
      data.message,
    );
    this.server.to(`conv:${data.conversationId}`).emit('chat:message', {
      id: userMsg.id,
      role: 'user',
      content: userMsg.content,
      createdAt: userMsg.createdAt,
    });

    // Auto-title if this is the first message
    if (!conversation.messages || conversation.messages.length <= 1) {
      const shortTitle = this.sanitizeTitle(data.message);
      void this.chatService.updateTitle(data.conversationId, shortTitle);
      this.server.to(`conv:${data.conversationId}`).emit('chat:title_updated', {
        conversationId: data.conversationId,
        title: shortTitle,
      });
    }

    // Emit typing indicator
    this.server.to(`conv:${data.conversationId}`).emit('chat:typing', {
      conversationId: data.conversationId,
    });

    // Resolve Odoo config for this user (optional)
    const odooConfig = await this.resolveOdooConfig(userId);

    // Build conversation history (exclude the message just saved)
    const history: ConversationMessage[] = (conversation.messages ?? [])
      .filter((m) => m.id !== userMsg.id)
      .slice(-10)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Call global orchestrator
    try {
      const result = await this.orchestrator.query(
        data.message,
        permissions,
        roles,
        odooConfig,
        history,
      );

      const assistantMsg = await this.chatService.saveMessage(
        data.conversationId,
        'assistant',
        result.answer,
        result.intent,
        result.confidence,
      );

      this.server.to(`conv:${data.conversationId}`).emit('chat:message', {
        id: assistantMsg.id,
        role: 'assistant',
        content: assistantMsg.content,
        intent: assistantMsg.intent,
        confidence: assistantMsg.confidence,
        createdAt: assistantMsg.createdAt,
      });
    } catch (err) {
      this.logger.error(`Orchestrator error: ${err}`);
      client.emit('chat:error', {
        message: 'S\'ha produït un error en processar la teva pregunta. Torna-ho a intentar.',
      });
    }
  }

  private async resolveOdooConfig(userId: number): Promise<OdooConfig | null> {
    try {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: ['id', 'tenantId'],
      });
      if (user?.tenantId) {
        const tenant = await this.tenantRepo
          .createQueryBuilder('t')
          .addSelect('t.odooPassword')
          .where('t.id = :id', { id: user.tenantId })
          .getOne();
        if (tenant) {
          return {
            url: tenant.odooUrl,
            db: tenant.odooDb,
            user: tenant.odooUser,
            password: decryptSecret(tenant.odooPassword),
            tenantId: tenant.id,
            tenantName: tenant.name,
          };
        }
      }
      // Try default tenant
      const defaultTenant = await this.tenantRepo
        .createQueryBuilder('t')
        .addSelect('t.odooPassword')
        .where('LOWER(t.name) = :name', { name: 'default' })
        .getOne();
      if (defaultTenant) {
        return {
          url: defaultTenant.odooUrl,
          db: defaultTenant.odooDb,
          user: defaultTenant.odooUser,
          password: decryptSecret(defaultTenant.odooPassword),
          tenantId: defaultTenant.id,
          tenantName: defaultTenant.name,
        };
      }
    } catch {
      // Return null — Odoo routing will handle the missing config
    }
    return null;
  }
}
