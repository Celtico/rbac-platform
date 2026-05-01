import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { DeployController } from './deploy/deploy.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AlbumsModule } from './albums/albums.module';
import { OpenAiModule } from './openai/openai.module';
import { OdooModule } from './odoo/odoo.module';
import { TenantsModule } from './tenants/tenants.module';
import { SystemModule } from './system/system.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './logger/logger.module';
import { SessionsModule } from './sessions/sessions.module';
import { ChatModule } from './chat/chat.module';
import { User } from './users/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { Permission } from './permissions/entities/permission.entity';
import { Photo } from './albums/entities/album.entity';
import { Tenant } from './tenants/entities/tenant.entity';
import { LogEntry } from './logger/entities/log-entry.entity';
import { UserSession } from './sessions/entities/user-session.entity';
import { ChatConversation } from './chat/entities/chat-conversation.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { SeedService } from './common/seed.service';
import { SessionValidationMiddleware } from './sessions/sessions.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, '..', '..', 'data', 'db.sqlite'),
      entities: [User, Role, Permission, Photo, Tenant, LogEntry, UserSession, ChatConversation, ChatMessage],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'dist'),
      exclude: ['/api'],
    }),
    LoggerModule,
    SessionsModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AlbumsModule,
    OpenAiModule,
    OdooModule,
    TenantsModule,
    SystemModule,
    AuthModule,
    ChatModule,
  ],
  controllers: [AppController, DeployController],
  providers: [AppService, SeedService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionValidationMiddleware).forRoutes('*');
  }
}
