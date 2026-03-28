import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('albums')
export class Album {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  artist: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  coverUrl: string;
}
