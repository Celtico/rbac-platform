import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1780773266146 implements MigrationInterface {
    name = 'InitialSchema1780773266146'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "odooUrl" varchar NOT NULL, "odooDb" varchar NOT NULL, "odooUser" varchar NOT NULL, "odooPassword" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_32731f181236a46182a38c992a8" UNIQUE ("name"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "password" varchar, "googleId" varchar, "tenantId" integer, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"))`);
        await queryRunner.query(`CREATE TABLE "photos" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" varchar, "coverUrl" varchar)`);
        await queryRunner.query(`CREATE TABLE "log_entries" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "level" varchar NOT NULL, "message" text NOT NULL, "context" varchar, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "metadata" text)`);
        await queryRunner.query(`CREATE TABLE "user_sessions" ("id" varchar PRIMARY KEY NOT NULL, "userId" integer NOT NULL, "tokenHash" varchar NOT NULL, "deviceFingerprint" varchar, "browser" varchar, "os" varchar, "ipAddress" varchar, "isRevoked" boolean NOT NULL DEFAULT (0), "isNewDevice" boolean NOT NULL DEFAULT (0), "firstSeen" datetime NOT NULL, "lastSeen" datetime NOT NULL, CONSTRAINT "UQ_4b2714b01e2aafe885e7ec75efb" UNIQUE ("tokenHash"))`);
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "role" varchar NOT NULL, "content" text NOT NULL, "intent" varchar, "confidence" float, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`CREATE TABLE "chat_conversations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "title" varchar NOT NULL DEFAULT ('Nova conversa'), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("role_id" integer NOT NULL, "permission_id" integer NOT NULL, PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" integer NOT NULL, "role_id" integer NOT NULL, PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);
        await queryRunner.query(`CREATE TABLE "temporary_users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "password" varchar, "googleId" varchar, "tenantId" integer, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"), CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_users"("id", "username", "password", "googleId", "tenantId") SELECT "id", "username", "password", "googleId", "tenantId" FROM "users"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
        await queryRunner.query(`CREATE TABLE "temporary_user_sessions" ("id" varchar PRIMARY KEY NOT NULL, "userId" integer NOT NULL, "tokenHash" varchar NOT NULL, "deviceFingerprint" varchar, "browser" varchar, "os" varchar, "ipAddress" varchar, "isRevoked" boolean NOT NULL DEFAULT (0), "isNewDevice" boolean NOT NULL DEFAULT (0), "firstSeen" datetime NOT NULL, "lastSeen" datetime NOT NULL, CONSTRAINT "UQ_4b2714b01e2aafe885e7ec75efb" UNIQUE ("tokenHash"), CONSTRAINT "FK_55fa4db8406ed66bc7044328427" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_user_sessions"("id", "userId", "tokenHash", "deviceFingerprint", "browser", "os", "ipAddress", "isRevoked", "isNewDevice", "firstSeen", "lastSeen") SELECT "id", "userId", "tokenHash", "deviceFingerprint", "browser", "os", "ipAddress", "isRevoked", "isNewDevice", "firstSeen", "lastSeen" FROM "user_sessions"`);
        await queryRunner.query(`DROP TABLE "user_sessions"`);
        await queryRunner.query(`ALTER TABLE "temporary_user_sessions" RENAME TO "user_sessions"`);
        await queryRunner.query(`CREATE TABLE "temporary_chat_messages" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "role" varchar NOT NULL, "content" text NOT NULL, "intent" varchar, "confidence" float, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "FK_45745953065384cc9c4264c2a3d" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_chat_messages"("id", "conversationId", "role", "content", "intent", "confidence", "createdAt") SELECT "id", "conversationId", "role", "content", "intent", "confidence", "createdAt" FROM "chat_messages"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
        await queryRunner.query(`ALTER TABLE "temporary_chat_messages" RENAME TO "chat_messages"`);
        await queryRunner.query(`CREATE TABLE "temporary_chat_conversations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "title" varchar NOT NULL DEFAULT ('Nova conversa'), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "FK_b47ce1b8d59cd63dd1134c9d07e" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_chat_conversations"("id", "userId", "title", "createdAt", "updatedAt") SELECT "id", "userId", "title", "createdAt", "updatedAt" FROM "chat_conversations"`);
        await queryRunner.query(`DROP TABLE "chat_conversations"`);
        await queryRunner.query(`ALTER TABLE "temporary_chat_conversations" RENAME TO "chat_conversations"`);
        await queryRunner.query(`DROP INDEX "IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP INDEX "IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`CREATE TABLE "temporary_role_permissions" ("role_id" integer NOT NULL, "permission_id" integer NOT NULL, CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`INSERT INTO "temporary_role_permissions"("role_id", "permission_id") SELECT "role_id", "permission_id" FROM "role_permissions"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`ALTER TABLE "temporary_role_permissions" RENAME TO "role_permissions"`);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`DROP INDEX "IDX_87b8888186ca9769c960e92687"`);
        await queryRunner.query(`DROP INDEX "IDX_b23c65e50a758245a33ee35fda"`);
        await queryRunner.query(`CREATE TABLE "temporary_user_roles" ("user_id" integer NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`INSERT INTO "temporary_user_roles"("user_id", "role_id") SELECT "user_id", "role_id" FROM "user_roles"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`ALTER TABLE "temporary_user_roles" RENAME TO "user_roles"`);
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_b23c65e50a758245a33ee35fda"`);
        await queryRunner.query(`DROP INDEX "IDX_87b8888186ca9769c960e92687"`);
        await queryRunner.query(`ALTER TABLE "user_roles" RENAME TO "temporary_user_roles"`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" integer NOT NULL, "role_id" integer NOT NULL, PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`INSERT INTO "user_roles"("user_id", "role_id") SELECT "user_id", "role_id" FROM "temporary_user_roles"`);
        await queryRunner.query(`DROP TABLE "temporary_user_roles"`);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`DROP INDEX "IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX "IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" RENAME TO "temporary_role_permissions"`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("role_id" integer NOT NULL, "permission_id" integer NOT NULL, PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`INSERT INTO "role_permissions"("role_id", "permission_id") SELECT "role_id", "permission_id" FROM "temporary_role_permissions"`);
        await queryRunner.query(`DROP TABLE "temporary_role_permissions"`);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`ALTER TABLE "chat_conversations" RENAME TO "temporary_chat_conversations"`);
        await queryRunner.query(`CREATE TABLE "chat_conversations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "title" varchar NOT NULL DEFAULT ('Nova conversa'), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`INSERT INTO "chat_conversations"("id", "userId", "title", "createdAt", "updatedAt") SELECT "id", "userId", "title", "createdAt", "updatedAt" FROM "temporary_chat_conversations"`);
        await queryRunner.query(`DROP TABLE "temporary_chat_conversations"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" RENAME TO "temporary_chat_messages"`);
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "role" varchar NOT NULL, "content" text NOT NULL, "intent" varchar, "confidence" float, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`INSERT INTO "chat_messages"("id", "conversationId", "role", "content", "intent", "confidence", "createdAt") SELECT "id", "conversationId", "role", "content", "intent", "confidence", "createdAt" FROM "temporary_chat_messages"`);
        await queryRunner.query(`DROP TABLE "temporary_chat_messages"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" RENAME TO "temporary_user_sessions"`);
        await queryRunner.query(`CREATE TABLE "user_sessions" ("id" varchar PRIMARY KEY NOT NULL, "userId" integer NOT NULL, "tokenHash" varchar NOT NULL, "deviceFingerprint" varchar, "browser" varchar, "os" varchar, "ipAddress" varchar, "isRevoked" boolean NOT NULL DEFAULT (0), "isNewDevice" boolean NOT NULL DEFAULT (0), "firstSeen" datetime NOT NULL, "lastSeen" datetime NOT NULL, CONSTRAINT "UQ_4b2714b01e2aafe885e7ec75efb" UNIQUE ("tokenHash"))`);
        await queryRunner.query(`INSERT INTO "user_sessions"("id", "userId", "tokenHash", "deviceFingerprint", "browser", "os", "ipAddress", "isRevoked", "isNewDevice", "firstSeen", "lastSeen") SELECT "id", "userId", "tokenHash", "deviceFingerprint", "browser", "os", "ipAddress", "isRevoked", "isNewDevice", "firstSeen", "lastSeen" FROM "temporary_user_sessions"`);
        await queryRunner.query(`DROP TABLE "temporary_user_sessions"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME TO "temporary_users"`);
        await queryRunner.query(`CREATE TABLE "users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "password" varchar, "googleId" varchar, "tenantId" integer, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"))`);
        await queryRunner.query(`INSERT INTO "users"("id", "username", "password", "googleId", "tenantId") SELECT "id", "username", "password", "googleId", "tenantId" FROM "temporary_users"`);
        await queryRunner.query(`DROP TABLE "temporary_users"`);
        await queryRunner.query(`DROP INDEX "IDX_b23c65e50a758245a33ee35fda"`);
        await queryRunner.query(`DROP INDEX "IDX_87b8888186ca9769c960e92687"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP INDEX "IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX "IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "chat_conversations"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
        await queryRunner.query(`DROP TABLE "user_sessions"`);
        await queryRunner.query(`DROP TABLE "log_entries"`);
        await queryRunner.query(`DROP TABLE "photos"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}
