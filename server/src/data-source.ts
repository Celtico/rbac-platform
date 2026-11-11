import { DataSource } from 'typeorm';
import { join } from 'path';
import { User } from './users/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { Permission } from './permissions/entities/permission.entity';
import { Photo } from './albums/entities/album.entity';
import { Tenant } from './tenants/entities/tenant.entity';
import { LogEntry } from './logger/entities/log-entry.entity';
import { UserSession } from './sessions/entities/user-session.entity';
import { ChatConversation } from './chat/entities/chat-conversation.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { OdooSimRecord } from './odoo/simulated/odoo-sim-record.entity';

/**
 * Standalone DataSource for the TypeORM CLI (migration generate/run/revert).
 * Mirrors the runtime config in app.module.ts. DB_PATH overrides the database
 * file (used to generate the initial migration against an empty DB).
 */
export default new DataSource({
  type: 'sqlite',
  database:
    process.env.DB_PATH ?? join(__dirname, '..', '..', 'data', 'db.sqlite'),
  entities: [
    User,
    Role,
    Permission,
    Photo,
    Tenant,
    LogEntry,
    UserSession,
    ChatConversation,
    ChatMessage,
    OdooSimRecord,
  ],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});
