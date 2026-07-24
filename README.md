# TZ · 原运装置卸输煤台账

基于 **Vue 3 + Vite** 的原运装置卸输煤过磅登记台账系统，提供 5 张中文台账的电子化录入、检索、编辑、批量保存与 CSV 导出。所有数据通过 `src/api.js`（fetch-based REST 客户端）持久化到后端 API，支持完全离线运行的浏览器端本地模拟（API 路径可指向 Vite proxy 或实际服务端）。

`db/` 目录下同时提供与前端一一对应的 **MySQL DDL** 与 **Prisma Schema**，便于后续接入真实服务端。

## 功能特性

- **五张台账电子化**：细渣提精煤、原料煤、干化污泥、燃料煤卸输煤台账，以及锅炉/气化当日消耗台账
- **RESTful 数据层**：`src/api.js` 封装 GET / POST / PUT / PATCH / DELETE，切换服务端只需替换 API_BASE
- **可编辑表格**：行内编辑单元格、`Enter` 保存单条记录、`Esc` 撤销、新增 / 修改 / 删除 / 清空操作
- **多字段检索**：顶部搜索框对所有可见列进行模糊匹配并高亮命中
- **按月分组分页**：数据按日期自动归入月份标签页，支持翻页导航
- **撤销保护**：删除 / 清空操作提供 5 分钟内的撤销窗口
- **脏标记检测**：「保存」按钮在无变更时自动灰显，防止重复提交
- **CSV 导出**：一键导出当前台账的全部数据（UTF-8 BOM 编码，Excel 友好）
- **侧边栏导航**：可折叠侧边栏，按台账类型快速切换
- **MySQL / Prisma 兼容**：同构字段定义已提供，可无缝迁移到服务端持久化

## 台账模块

| 路由 | 台账名称 | API 数据表 | 视图文件 |
| --- | --- | --- | --- |
| `/xzyjjm` | 细渣提精煤卸输煤台账 | `fine_slag_coal_rows` | `FineSlagCoal.vue` |
| `/ylyjm` | 原料煤卸输煤台账 | `raw_coal_rows` | `RawCoal.vue` |
| `/ghwng` | 干化污泥卸输煤台账 | `dried_sludge_rows` | `DriedSludge.vue` |
| `/rlm` | 燃料煤卸输煤台账 | `raw_coal_rows` ⚠ | `FuelCoal.vue` |
| `/drxhdh` | 锅炉/气化当日消耗台账 | 无（前端 TODO） | `DailyConsumption.vue` |

默认入口重定向到 `/xzyjjm`。

> ⚠ `FuelCoal.vue` 当前所有 API 调用错误地使用了 `raw_coal_rows` 表（与 RawCoal 共用同一张表会导致数据互相覆盖），需要在后端新建 `fuel_coal_rows` 表，并将 `FuelCoal.vue` 中所有 `'raw_coal_rows'` 替换为 `'fuel_coal_rows'` 后方可正常使用。

### 细渣提精煤 / 原料煤 / 燃料煤 / 干化污泥（共同字段）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `date` | string | 日期，格式 YYYY-MM-DD，唯一约束 |
| `bin` | string | 煤仓编号，枚举：207A / 207B / 混合 |
| `boilerDay` | string | 当日上煤/掺烧量（吨） |
| `boilerMonth` | string | 当月上煤/掺烧量（吨），累计值 |
| `boilerYear` | string | 当年上煤/掺烧量（吨），累计值 |
| `inbound` | string | 来煤量（吨） |
| `stockA` | string | 207A 存煤量（吨） |
| `stockB` | string | 207B 存煤量（吨） |
| `stockTotal` | string | 总存煤量 = stockA + stockB，后端自动计算 |
| `blendBurn` | string | 掺烧量（吨），仅原料煤/燃料煤台账有 |

### 锅炉/气化当日消耗台账（固定行）

锅炉表 4 行 × 14 列：批次（第一次/第二次/第三次/总计）、小计、黄陵混合煤 207A/207B、建庄大块煤 207A/207B、细渣煤 207A/207B、**污泥 207A/207B**（独立核算，不计入燃料煤 207 限额）、原料煤 207A/207B、离心煤 207A/207B。

气化表 4 行 × 4 列：批次、小计、A仓原料煤、B仓原料煤。

所有数字字段为空时视为 0；最多支持 3 位小数。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3 (`<script setup>`) |
| 构建 | Vite |
| 路由 | Vue Router 5 (`createWebHistory`) |
| 数据层 | `src/api.js`（fetch-based REST 客户端） |
| 服务端 Schema | Prisma (MySQL) / MySQL DDL |

## 目录结构

```text
.
├── db/                              服务端持久化 Schema 定义
│   ├── schema.prisma                Prisma 模型（MySQL provider）
│   ├── schema.sql                   等价的 MySQL 8.0+ DDL
│   └── entities/                    TypeScript 实体类型（4 张表）
│       ├── FineSlagUpgradedCoalRecord.ts
│       ├── FuelCoalRecord.ts
│       ├── RawCoalRecord.ts
│       └── DriedSludgeRecord.ts
├── src/
│   ├── api.js                      REST 客户端（GET/POST/PUT/PATCH/DELETE/bulkPut/clear）
│   ├── api/
│   │   └── RESTful_API.md          API 接口文档（字段定义、请求响应格式、错误码）
│   ├── App.vue                     根布局：可折叠侧边栏 + 主内容区
│   ├── main.js                     应用入口
│   ├── router/
│   │   └── index.js                5 个路由定义（懒加载视图组件）
│   └── views/                      5 张台账页面
│       ├── FineSlagCoal.vue        细渣提精煤
│       ├── RawCoal.vue             原料煤
│       ├── FuelCoal.vue            燃料煤 ⚠（API Store bug，详见台账模块说明）
│       ├── DriedSludge.vue         干化污泥
│       └── DailyConsumption.vue    锅炉/气化当日消耗（前端 TODO 无后端 API）
├── index.html
├── vite.config.js                  Vite 配置（默认 proxy 到 /api → localhost:3000）
└── package.json
```

## 快速开始

环境要求：**Node.js `^22.18.0 || >=24.12.0`**（见 `package.json#engines`）。

```sh
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173，API 请求 proxy 到 localhost:3000）
npm run dev

# 生产构建（产物输出到 dist/）
npm run build

# 本地预览构建产物
npm run preview
```

### API 代理配置

`vite.config.js` 默认将 `/api/*` 代理到 `http://localhost:3000`。若后端运行在其他地址，修改 `vite.config.js` 中的 `proxy.target`。

## 开发约定

- **API 调用规范**：所有与后端的数据交互统一经由 `src/api.js` 导出 `api` 对象，禁止在视图组件中直接使用 `fetch`。`src/api/RESTful_API.md` 记录了完整的接口契约，新增/修改接口时同步更新该文档。
- **JSDoc 注释**：视图组件中每个调用 API 的函数均在函数声明上方附有 JSDoc，注明 HTTP 方法与路径、参数说明、返回值与异常处理。
- **新增台账**：先在 `db/schema.prisma` / `db/schema.sql` 中追加模型，再在 `src/api.js` 中（如需新端点）扩展方法，最后在 `src/router/index.js` 中添加路由并新建 `src/views/*.vue`。
- **FuelCoal bug 修复**：将 `src/views/FuelCoal.vue` 中所有 `'raw_coal_rows'` 替换为 `'fuel_coal_rows'`，并确保后端存在对应表。
- **视图统一布局**：新增视图统一使用全局工具栏 + 行内编辑表格 + 月份分组标签页（参考 `FineSlagCoal.vue`）。
- **Dirty 检测**：`persist()` 执行后需同步更新 `lastSavedSignature`，使 `computeCurrentSignature()` 可正确比对变更。

## API 层说明

`src/api.js` 暴露以下方法，所有请求自动携带 `Content-Type: application/json`，响应体非 JSON 时返回原始文本：

```js
api.list(table)           // GET  /{table}           → 获取全部记录
api.get(table, id)        // GET  /{table}/{id}     → 获取单条记录
api.create(table, data)    // POST /{table}           → 新增记录
api.update(table, id, data) // PUT  /{table}/{id}    → 全量替换更新
api.patch(table, id, data)  // PATCH /{table}/{id}   → 部分更新
api.remove(table, id)     // DELETE /{table}/{id}    → 删除单条
api.bulkPut(table, items) // 循环调用 api.create()，返回创建结果数组
api.clear(table)          // 循环调用 api.remove()，清空整表
```

详细字段定义、请求响应格式、全局错误码说明见 `src/api/RESTful_API.md`。

## 服务端迁移参考

`db/schema.prisma` 与 `db/schema.sql` 描述了与前端台账一一对应的 MySQL 表结构，可直接用于：

```sh
# 初始化数据库
mysql -u root -p < db/schema.sql

# 生成 Prisma Client
npx prisma generate --schema db/schema.prisma
```

迁移前端时只需将 `src/api.js` 中的 `API_BASE` 指向实际服务端地址，视图层无需改动。

## 推荐 IDE

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（若曾安装 Vetur 请禁用）。

## 浏览器要求

需要支持 ES Modules + Fetch API 的现代浏览器（Chrome / Edge / Firefox / Safari 近 4 个大版本均可）。
