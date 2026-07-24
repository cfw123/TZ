# TZ · 原运装置卸输煤台账

基于 **Vue 3 + Vite** 的原运装置卸输煤过磅登记台账系统，提供 4 张中文台账的电子化录入、检索、编辑、批量保存与 CSV 导出，所有数据默认落地浏览器本地数据库（IndexedDB / Dexie），支持完全离线运行。

`db/` 目录下同时提供与前端一一对应的 **MySQL DDL** 与 **Prisma Schema**，便于后续接入服务端。

## 功能特性

- **四张台账电子化**：原料煤、燃料煤、细渣提精煤、干化污泥卸输煤过磅登记表
- **离线优先**：数据持久化在浏览器 IndexedDB（[Dexie](https://dexie.org/) 封装），刷新 / 关闭浏览器后数据仍在
- **实时响应**：通过 `liveQuery` 订阅数据库变更，任意视图的修改会即时反映到所有打开的台账
- **可编辑表格**：行内编辑单元格、`Enter` 保存单条记录、`Esc` 撤销、新增 / 修改 / 删除 / 清空操作
- **多字段检索**：顶部搜索框对所有可见列进行模糊匹配并高亮命中
- **日期排序**：点击表头日期列可在升序 / 降序之间切换
- **CSV 导出**：一键导出当前台账的全部数据
- **侧边栏导航**：可折叠侧边栏，按台账类型快速切换
- **MySQL / Prisma 兼容**：同构字段定义已提供，可无缝迁移到服务端持久化

## 台账模块

| 路由 | 台账名称 | 数据表 (Dexie) |
| --- | --- | --- |
| `/xzyjjm` | 细渣提精煤卸输煤台账 | `fine_slag_coal_rows` |
| `/ylyjm` | 原料煤卸输煤台账 | `raw_coal_rows` |
| `/ghwng` | 干化污泥卸输煤台账 | `dried_sludge_rows` |
| `/rlm` | 燃料煤卸输煤台账 | `fuel_coal_rows` |

默认入口重定向到 `/xzyjjm`。

### 共同字段（与原始纸质台账 1:1 对应）

每张台账的核心字段包括：序号、日期、车号、车型、货名、发货单位、收货单位、发运数量(吨)、实收数量(吨)、亏吨数量(吨)、亏吨率(%)、司磅员、卸车地点、备注，以及系统字段 `__id`、`updatedAt`。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3 (`<script setup>`) |
| 构建 | Vite 8 |
| 路由 | Vue Router 5 (`createWebHistory`) |
| 本地存储 | Dexie 4 (IndexedDB) |
| 数据库响应式 | Dexie `liveQuery` |
| 服务端 Schema | Prisma (MySQL) / MySQL DDL |

## 目录结构

```text
.
├── db/                        服务端持久化所需的 Schema 定义
│   ├── schema.prisma          Prisma 模型（MySQL provider，可切换 PG / SQL Server）
│   ├── schema.sql             等价的 MySQL 8.0+ DDL
│   └── entities/              Prisma 实体导出
├── public/                    静态资源
├── src/
│   ├── App.vue                根布局：可折叠侧边栏 + 主内容区
│   ├── main.js                应用入口
│   ├── router/                路由配置
│   ├── db/
│   │   ├── dexie.js           Dexie 数据库与表结构定义（Schema v1 / v2）
│   │   └── useLiveRows.js     响应式订阅工具（基于 liveQuery）
│   └── views/                 四张台账页面（FuelCoal / RawCoal / FineSlagCoal / DriedSludge）
├── index.html
├── vite.config.js
└── jsconfig.json              @/* 路径别名配置
```

## 快速开始

环境要求：**Node.js `^22.18.0 || >=24.12.0`**（见 `package.json#engines`）。

```sh
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建（产物输出到 dist/）
npm run build

# 本地预览构建产物
npm run preview
```

## 开发约定

- `@/*` 指向 `src/*`，可通过 `import { db } from '@/db/dexie'` 等方式引用。
- 新增台账：先在 `src/db/dexie.js` 中追加 `db.version(N).stores({...})`，再新建 `src/views/*.vue` 与 `src/router/index.js` 中的路由配置。
- Dexie Schema 一旦上线禁止原地修改，必须以新 `version()` 形式升级，并在 `useLiveRows` 等订阅处保持向后兼容。
- 视图统一使用全局工具栏 + 行内编辑表格的布局（参考 `src/views/FuelCoal.vue`）。

## 数据存储位置

应用的所有用户数据保存在浏览器 IndexedDB 中的数据库 **`TZDB_v1`** 下，包含以下对象表：

- `dried_sludge_rows`（Schema v1 引入）
- `fine_slag_coal_rows`、`raw_coal_rows`、`fuel_coal_rows`（Schema v2 引入）

每张表使用复合索引 `[date+bin]` 以支持按日期与煤仓的高效查询。清空浏览器站点数据会同时清空本系统所有台账，请定期通过 **导出 CSV** 备份。

## 服务端迁移参考

`db/schema.prisma` 与 `db/schema.sql` 描述了与前端台账一一对应的 MySQL 表结构（4 张表，14 个业务字段完全一致），可直接用于：

```sh
# 初始化数据库
mysql -u root -p < db/schema.sql

# 生成 Prisma Client
npx prisma generate --schema db/schema.prisma
```

需要将前端从 IndexedDB 迁移到服务端时，建议在 `src/db/` 下新增一个 `api/` 适配层并替换 `useLiveRows` 的实现，视图层无需改动。

## 推荐 IDE

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（若曾安装 Vetur 请禁用）。

## 浏览器要求

需要支持 IndexedDB 的现代浏览器（Chrome / Edge / Firefox / Safari 近 4 个大版本均可）。建议开启浏览器 DevTools 的 **Vue.js devtools** 扩展以便调试。
# TZ
