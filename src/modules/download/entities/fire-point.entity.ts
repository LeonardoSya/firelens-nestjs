import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('fire_points') // 表名
export class FirePoint {
  @PrimaryGeneratedColumn() // 自增主键列
  id: number

  @Column('decimal', { precision: 10, scale: 2 })
  latitude: number

  @Column('decimal', { precision: 10, scale: 2 })
  longitude: number

  @Column('decimal', { precision: 10, scale: 1 })
  bright_ti4: number

  @Column('decimal', { precision: 10, scale: 1 })
  scan: number

  @Column('decimal', { precision: 10, scale: 1 })
  track: number

  @Column('date')
  acq_date: Date

  @Column('varchar', { length: 4 })
  acq_time: string

  @Column('varchar', { length: 10 })
  satellite: string

  @Column('varchar', { length: 20 })
  confidence: string

  @Column('varchar', { length: 10 })
  version: string

  @Column('decimal', { precision: 10, scale: 1 })
  bright_ti5: number

  @Column('decimal', { precision: 10, scale: 1 })
  frp: number

  @Column('char', { length: 1 })
  daynight: string

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  ndvi: number

  @CreateDateColumn()
  created_at: Date
}
