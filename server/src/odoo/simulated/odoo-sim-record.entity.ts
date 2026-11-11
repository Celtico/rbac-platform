import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * One record of the simulated Odoo (see `SimulatedOdooService`).
 *
 * Every Odoo model shares this table: `model` is the Odoo model name
 * (`sale.order`, `res.partner`…), `recordId` the record's id inside that model
 * and `data` its fields as JSON, already in the shape Odoo returns them
 * (many2one as `[id, name]`, empty values as `false`).
 */
@Entity('odoo_sim_records')
@Index('IDX_odoo_sim_records_model_record', ['model', 'recordId'], {
  unique: true,
})
export class OdooSimRecord {
  @PrimaryGeneratedColumn()
  pk: number;

  @Column()
  model: string;

  @Column()
  recordId: number;

  @Column({ type: 'simple-json' })
  data: Record<string, unknown>;
}
