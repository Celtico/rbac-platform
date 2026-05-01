import { Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogEntry } from './entities/log-entry.entity';
import { EventEmitter } from 'events';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly emitter = new EventEmitter();

  constructor(
    @InjectRepository(LogEntry)
    private readonly logRepo: Repository<LogEntry>,
  ) {
    this.emitter.setMaxListeners(50);
  }

  log(message: string, context?: string) {
    void this.write('log', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    void this.write('error', message, context, trace ? { trace } : undefined);
  }

  warn(message: string, context?: string) {
    void this.write('warn', message, context);
  }

  debug(message: string, context?: string) {
    void this.write('debug', message, context);
  }

  verbose(message: string, context?: string) {
    void this.write('verbose', message, context);
  }

  subscribe(listener: (entry: LogEntry) => void): () => void {
    this.emitter.on('log', listener);
    return () => this.emitter.off('log', listener);
  }

  private async write(
    level: LogEntry['level'],
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const entry = this.logRepo.create({
        level,
        message: String(message),
        context: context ?? undefined,
        metadata: metadata ?? null,
      });
      const saved = await this.logRepo.save(entry);
      this.emitter.emit('log', saved);
    } catch {
      // Fallback to console to avoid infinite loops
      console.error('[AppLoggerService] Failed to write log entry:', message);
    }
  }
}
