import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatOrchestratorService } from './chat-orchestrator.service';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { OdooModule } from '../odoo/odoo.module';
import { AlbumsModule } from '../albums/albums.module';
import { SystemModule } from '../system/system.module';
import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { jwtAsyncConfig } from '../auth/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatConversation, ChatMessage, User, Tenant]),
    JwtModule.registerAsync(jwtAsyncConfig),
    forwardRef(() => OdooModule),
    AlbumsModule,
    SystemModule,
    forwardRef(() => UsersModule),
    SessionsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatOrchestratorService],
})
export class ChatModule {}
