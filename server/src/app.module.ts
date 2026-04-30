import { Module } from '@nestjs/common';
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
import { User } from './users/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { Permission } from './permissions/entities/permission.entity';
import { Photo } from './albums/entities/album.entity';
import { Tenant } from './tenants/entities/tenant.entity';
import { SeedService } from './common/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, '..', '..', 'data', 'db.sqlite'),
      entities: [User, Role, Permission, Photo, Tenant],
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
    UsersModule,
    RolesModule,
    PermissionsModule,
    AlbumsModule,
    OpenAiModule,
    OdooModule,
    TenantsModule,
    SystemModule,
    AuthModule,
  ],
  controllers: [AppController, DeployController],
  providers: [AppService, SeedService],
})
export class AppModule {}
