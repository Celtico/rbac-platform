import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('log_entries')
export class LogEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  level: 'log' | 'error' | 'warn' | 'debug' | 'verbose';

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  context: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, unknown> | null;
}
