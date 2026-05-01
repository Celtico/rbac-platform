import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppLoggerService } from './app-logger.service';
import { LogsController } from './logs.controller';
import { LogEntry } from './entities/log-entry.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([LogEntry]),
    JwtModule.register({
      secret: 'SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [LogsController],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}
