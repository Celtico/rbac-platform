import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  odooUrl: string;

  @Column()
  odooDb: string;

  @Column()
  odooUser: string;

  @Column({ select: false })
  odooPassword: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
