import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table of the simulated Odoo (`SimulatedOdooService`): every record of every
 * simulated model, as JSON. It starts empty; the service seeds the demo
 * dataset on boot.
 */
export class SimulatedOdoo1794420000000 implements MigrationInterface {
  name = 'SimulatedOdoo1794420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "odoo_sim_records" ("pk" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "model" varchar NOT NULL, "recordId" integer NOT NULL, "data" text NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_odoo_sim_records_model_record" ON "odoo_sim_records" ("model", "recordId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_odoo_sim_records_model_record"`);
    await queryRunner.query(`DROP TABLE "odoo_sim_records"`);
  }
}
