-- =====================================================================
-- 原运装置 4 个台账表 DDL (MySQL 8.0+)
-- 字段与 4 张中文台账图片 1:1 对应（每张图 14 列，内容相同，仅台账名称不同）
-- 卸输煤过磅登记表：序号 / 日期 / 车号 / 车型 / 货名 / 发货单位 / 收货单位 /
-- 发运数量(吨) / 实收数量(吨) / 亏吨数量(吨) / 亏吨率(%) / 司磅员 / 卸车地点 / 备注
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `raw_coal_record`;
DROP TABLE IF EXISTS `fuel_coal_record`;
DROP TABLE IF EXISTS `fine_slag_upgraded_coal_record`;
DROP TABLE IF EXISTS `dried_sludge_record`;

-- ---------------------------------------------------------------------
-- Table 1: 原运装置原料煤卸输煤记录
-- ---------------------------------------------------------------------
CREATE TABLE `raw_coal_record` (
  `id`                 BIGINT        NOT NULL AUTO_INCREMENT                              COMMENT '主键',
  `sequence_no`        INT           NOT NULL                                             COMMENT '序号',
  `record_date`        DATE          NOT NULL                                             COMMENT '日期',
  `car_number`         VARCHAR(64)   DEFAULT NULL                                         COMMENT '车号',
  `car_type`           VARCHAR(64)   DEFAULT NULL                                         COMMENT '车型',
  `cargo_name`         VARCHAR(128)  DEFAULT NULL                                         COMMENT '货名',
  `shipper_unit`       VARCHAR(128)  DEFAULT NULL                                         COMMENT '发货单位',
  `consignee_unit`     VARCHAR(128)  DEFAULT NULL                                         COMMENT '收货单位',
  `shipped_quantity`   DECIMAL(12,2) DEFAULT NULL                                         COMMENT '发运数量(吨)',
  `received_quantity`  DECIMAL(12,2) DEFAULT NULL                                         COMMENT '实收数量(吨)',
  `shortage_quantity`  DECIMAL(12,2) DEFAULT NULL                                         COMMENT '亏吨数量(吨)',
  `shortage_rate`      DECIMAL(8,4)  DEFAULT NULL                                         COMMENT '亏吨率(%)',
  `weighman`           VARCHAR(64)   DEFAULT NULL                                         COMMENT '司磅员',
  `unloading_location` VARCHAR(128)  DEFAULT NULL                                         COMMENT '卸车地点',
  `remark`             VARCHAR(500)  DEFAULT NULL                                         COMMENT '备注',
  `created_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP                   COMMENT '创建时间',
  `updated_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_raw_coal_record_date` (`record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='原运装置原料煤卸输煤记录';

-- ---------------------------------------------------------------------
-- Table 2: 原运装置燃料煤卸输煤记录
-- ---------------------------------------------------------------------
CREATE TABLE `fuel_coal_record` (
  `id`                 BIGINT        NOT NULL AUTO_INCREMENT                              COMMENT '主键',
  `sequence_no`        INT           NOT NULL                                             COMMENT '序号',
  `record_date`        DATE          NOT NULL                                             COMMENT '日期',
  `car_number`         VARCHAR(64)   DEFAULT NULL                                         COMMENT '车号',
  `car_type`           VARCHAR(64)   DEFAULT NULL                                         COMMENT '车型',
  `cargo_name`         VARCHAR(128)  DEFAULT NULL                                         COMMENT '货名',
  `shipper_unit`       VARCHAR(128)  DEFAULT NULL                                         COMMENT '发货单位',
  `consignee_unit`     VARCHAR(128)  DEFAULT NULL                                         COMMENT '收货单位',
  `shipped_quantity`   DECIMAL(12,2) DEFAULT NULL                                         COMMENT '发运数量(吨)',
  `received_quantity`  DECIMAL(12,2) DEFAULT NULL                                         COMMENT '实收数量(吨)',
  `shortage_quantity`  DECIMAL(12,2) DEFAULT NULL                                         COMMENT '亏吨数量(吨)',
  `shortage_rate`      DECIMAL(8,4)  DEFAULT NULL                                         COMMENT '亏吨率(%)',
  `weighman`           VARCHAR(64)   DEFAULT NULL                                         COMMENT '司磅员',
  `unloading_location` VARCHAR(128)  DEFAULT NULL                                         COMMENT '卸车地点',
  `remark`             VARCHAR(500)  DEFAULT NULL                                         COMMENT '备注',
  `created_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP                   COMMENT '创建时间',
  `updated_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_fuel_coal_record_date` (`record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='原运装置燃料煤卸输煤记录';

-- ---------------------------------------------------------------------
-- Table 3: 原运装置细渣提精煤卸输煤记录
-- ---------------------------------------------------------------------
CREATE TABLE `fine_slag_upgraded_coal_record` (
  `id`                 BIGINT        NOT NULL AUTO_INCREMENT                              COMMENT '主键',
  `sequence_no`        INT           NOT NULL                                             COMMENT '序号',
  `record_date`        DATE          NOT NULL                                             COMMENT '日期',
  `car_number`         VARCHAR(64)   DEFAULT NULL                                         COMMENT '车号',
  `car_type`           VARCHAR(64)   DEFAULT NULL                                         COMMENT '车型',
  `cargo_name`         VARCHAR(128)  DEFAULT NULL                                         COMMENT '货名',
  `shipper_unit`       VARCHAR(128)  DEFAULT NULL                                         COMMENT '发货单位',
  `consignee_unit`     VARCHAR(128)  DEFAULT NULL                                         COMMENT '收货单位',
  `shipped_quantity`   DECIMAL(12,2) DEFAULT NULL                                         COMMENT '发运数量(吨)',
  `received_quantity`  DECIMAL(12,2) DEFAULT NULL                                         COMMENT '实收数量(吨)',
  `shortage_quantity`  DECIMAL(12,2) DEFAULT NULL                                         COMMENT '亏吨数量(吨)',
  `shortage_rate`      DECIMAL(8,4)  DEFAULT NULL                                         COMMENT '亏吨率(%)',
  `weighman`           VARCHAR(64)   DEFAULT NULL                                         COMMENT '司磅员',
  `unloading_location` VARCHAR(128)  DEFAULT NULL                                         COMMENT '卸车地点',
  `remark`             VARCHAR(500)  DEFAULT NULL                                         COMMENT '备注',
  `created_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP                   COMMENT '创建时间',
  `updated_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_fine_slag_record_date` (`record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='原运装置细渣提精煤卸输煤记录';

-- ---------------------------------------------------------------------
-- Table 4: 原运装置干化污泥卸输煤记录
-- ---------------------------------------------------------------------
CREATE TABLE `dried_sludge_record` (
  `id`                 BIGINT        NOT NULL AUTO_INCREMENT                              COMMENT '主键',
  `sequence_no`        INT           NOT NULL                                             COMMENT '序号',
  `record_date`        DATE          NOT NULL                                             COMMENT '日期',
  `car_number`         VARCHAR(64)   DEFAULT NULL                                         COMMENT '车号',
  `car_type`           VARCHAR(64)   DEFAULT NULL                                         COMMENT '车型',
  `cargo_name`         VARCHAR(128)  DEFAULT NULL                                         COMMENT '货名',
  `shipper_unit`       VARCHAR(128)  DEFAULT NULL                                         COMMENT '发货单位',
  `consignee_unit`     VARCHAR(128)  DEFAULT NULL                                         COMMENT '收货单位',
  `shipped_quantity`   DECIMAL(12,2) DEFAULT NULL                                         COMMENT '发运数量(吨)',
  `received_quantity`  DECIMAL(12,2) DEFAULT NULL                                         COMMENT '实收数量(吨)',
  `shortage_quantity`  DECIMAL(12,2) DEFAULT NULL                                         COMMENT '亏吨数量(吨)',
  `shortage_rate`      DECIMAL(8,4)  DEFAULT NULL                                         COMMENT '亏吨率(%)',
  `weighman`           VARCHAR(64)   DEFAULT NULL                                         COMMENT '司磅员',
  `unloading_location` VARCHAR(128)  DEFAULT NULL                                         COMMENT '卸车地点',
  `remark`             VARCHAR(500)  DEFAULT NULL                                         COMMENT '备注',
  `created_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP                   COMMENT '创建时间',
  `updated_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_dried_sludge_record_date` (`record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='原运装置干化污泥卸输煤记录';

SET FOREIGN_KEY_CHECKS = 1;
