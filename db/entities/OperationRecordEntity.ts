import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * 运行记录
 */
@Entity({ name: 'operation_record', comment: '运行记录' })
@Index('idx_operation_record_date', ['recordDate'])
@Index('idx_operation_record_date_shift', ['recordDate', 'shiftBatch'])
export class OperationRecordEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
  id: string;

  @Column({ type: 'date', comment: '记录日期' })
  recordDate: string;

  @Column({ type: 'varchar', length: 16, comment: '班次' })
  shiftBatch: string;

  @Column({ type: 'varchar', length: 32, nullable: true, comment: '运行班组' })
  runGroup: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '错峰运行执行情况' })
  executionStatus: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '锅炉运行筒仓' })
  boilerBins: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '锅炉上煤时间' })
  boilerTime: string | null;

  @Column({ type: 'int', nullable: true, comment: '锅炉上煤时长(分)' })
  boilerDuration: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '锅炉掺烧细渣量(铲)' })
  boilerBlendXz: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '锅炉当班上煤量(吨)' })
  boilerShiftTotal: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '锅炉当日上煤量(吨)' })
  boilerDayTotal: number | null;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '掺烧煤种及比例' })
  blendMix: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '气化运行筒仓' })
  gasificationBins: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '气化上煤时间' })
  gasificationTime: string | null;

  @Column({ type: 'int', nullable: true, comment: '气化上煤时长(分)' })
  gasificationDuration: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '气化当班上煤量(吨)' })
  gasificationShiftTotal: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '气化当日上煤量(吨)' })
  gasificationDayTotal: number | null;

  @Column({ type: 'varchar', length: 256, nullable: true, comment: '原因说明' })
  reason: string | null;

  @Column({ type: 'varchar', length: 256, nullable: true, comment: '备注' })
  remarks: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '汽车卸车时间' })
  truckUnloadTime: string | null;

  @Column({ type: 'int', nullable: true, comment: '汽车卸车时长(分)' })
  truckUnloadDuration: number | null;

  @Column({ type: 'int', nullable: true, comment: '汽车卸车数量(辆)' })
  truckCount: number | null;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
