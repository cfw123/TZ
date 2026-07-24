import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * 原运装置燃料煤卸输煤记录（卸输煤过磅登记表）
 * 对应中文台账：序号 / 日期 / 车号 / 车型 / 货名 / 发货单位 / 收货单位 /
 *              发运数量(吨) / 实收数量(吨) / 亏吨数量(吨) / 亏吨率(%) /
 *              司磅员 / 卸车地点 / 备注
 */
@Entity({ name: 'fuel_coal_record', comment: '原运装置燃料煤卸输煤记录' })
@Index('idx_fuel_coal_record_date', ['recordDate'])
export class FuelCoalRecord {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '主键' })
  id: string;

  @Column({ type: 'int', comment: '序号' })
  sequenceNo: number;

  @Column({ type: 'date', comment: '日期' })
  recordDate: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '车号' })
  carNumber: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '车型' })
  carType: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '货名' })
  cargoName: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '发货单位' })
  shipperUnit: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '收货单位' })
  consigneeUnit: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '发运数量(吨)' })
  shippedQuantity: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '实收数量(吨)' })
  receivedQuantity: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, comment: '亏吨数量(吨)' })
  shortageQuantity: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true, comment: '亏吨率(%)' })
  shortageRate: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '司磅员' })
  weighman: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '卸车地点' })
  unloadingLocation: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '备注' })
  remark: string | null;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
