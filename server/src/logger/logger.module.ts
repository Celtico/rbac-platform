import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppLoggerService } from './app-logger.service';
import { LogsController } from './logs.controller';
import { LogEntry } from './entities/log-entry.entity';
import { jwtAsyncConfig } from '../auth/jwt.config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([LogEntry]),
    JwtModule.registerAsync(jwtAsyncConfig),
  ],
  controllers: [LogsController],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}
