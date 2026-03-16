# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # 安装依赖
npm run dev          # 启动前端（Vite，http://localhost:5173）
npm run dev:api      # 启动后端 LLM API 服务（Express，http://localhost:3001，热重载）
npm run dev:full     # 同时启动前端 + 后端
npm run build        # 构建生产包
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint 检查（0 warning 通过）
npm run lint:fix     # ESLint 自动修复
npm run format       # Prettier 格式化 src/ 和 server/
npm run clean        # 删除 dist 目录
```

**后端环境变量：** 将 `.env.example` 复制为 `.env`，填入 `OPENAI_API_KEY`，后端才能真实调用 LLM。

### 文档自动化命令

每次开发完成后运行以下命令，保持文档与代码同步：

```bash
npm run docs:update   # 一键：自动生成 CHANGELOG 草稿 + 同步代码索引统计
npm run docs:log      # 仅生成 CHANGELOG 草稿（从 git diff 读取变更文件）
npm run docs:index    # 仅同步 codebase-index.md 统计数字
```

**`docs:log` 流程**：读取 git 变更文件 → 按模块分组 → 在 `docs/status/CHANGELOG.md` 顶部插入草稿 → 开发者填写标题与变更说明。
**`docs:index` 流程**：扫描 src/、server/、scripts/ 目录 → 更新文件数量统计与 scripts 清单 → 更新同步日期。

---

## 系统使命与核心概念

本项目是一个**以项目为驱动、以垂直能力 Agent 为执行单元、以身份（Identity）定义内容视角、以终端为操作入口的 AI 运营控制平面**。完整使命见 [docs/architecture/00-system-mission.md](docs/architecture/00-system-mission.md)。

### 核心概念（严禁混用）

| 概念 | 定义 | 关键约束 |
|---|---|---|
| **Identity（身份）** | 内容创作的视角与立场，属于**项目层** | 不是 Agent 的属性；决定"内容从谁的角度产出"；可跨项目复用 |
| **Agent（智能体）** | 垂直能力的 AI 执行单元，按领域/平台划分 | `Agent = LLM + Skills`；不承载人格；接收 Identity 作为内容视角输入 |
| **Skills（技能）** | 完成特定任务的最短路径，Agent 的行动指令库 | 与 OpenClaw 格式兼容；4 种执行类型：`llm`/`external_api`/`internal_api`/`hybrid` |
| **Terminal（终端）** | Agent 操作真实世界的入口 | 绑定到项目的 Identity 下；系统能力边界由已接入终端决定 |

### 当前支持的项目类型

自媒体内容运营 / 账号矩阵管理 / 网站运营与 SEO / 线索获客（WhatsApp/Line 私域加粉）

### 七条核心原则（开发红线，不得违背）

1. **项目是一切执行的起点** — 所有执行必须归属于项目
2. **项目类型决定配置包** — 新业务场景新增项目类型，不改已有逻辑
3. **Identity 属于项目层，不是 Agent 的属性** — 两者严格分离
4. **Agent 能力来自 LLM + Skills，Skills 与 OpenClaw 兼容** — 可快速复用外部生态
5. **终端是执行边界，系统能力由终端决定** — 不硬编码业务能力
6. **SOP → Workflow 转换是核心 AI 价值点** — 不可绕过
7. **结果必须可向上汇报** — 产出汇报视图是系统的核心交付价值

---

## 架构概览

本项目采用"控制平面骨架"架构。主要业务模块已从 mock 迁移到 Prisma + SQLite 持久化，Facebook Pages API 已真实接入。详细系统状态见 [docs/status/](docs/status/)。

### 三控制台结构（Three-Shell Architecture）

路由入口 [src/app/routes.tsx](src/app/routes.tsx) 将系统分为三个独立 Shell：

| Shell | 路由前缀 | 角色 | 用途 |
|---|---|---|---|
| `PlatformShell` | `/platform` | `platform_admin` | 平台运营管理（租户、配额、审计） |
| `SystemShell` | `/system` | `system_admin` | 系统管理员专属（Agent 模板工厂、LLM 配置中心、Workflow 模板工厂、DataSource Provider 中心） |
| `TenantShell` | `/tenant` | `tenant_admin` / 租户成员 | 租户业务后台（项目、任务、流程、Agent、终端、消息中心） |

三个 Shell 必须从路由、菜单、布局上彻底分离，不能靠角色隐藏菜单模拟分离。

### 分层结构（Layer Architecture）

每个业务模块必须保持四层分离，页面层不得包含复杂业务逻辑：

```
page（页面展示、调用 service）
  ↓
service（业务逻辑、数据组装）
  ↓
repository（数据读写，调用 /api/* 接口）
  ↓
schema（类型定义、状态枚举）
```

### 目录结构

```
src/
  app/           # 路由入口
  core/          # 全局基础：身份/权限/常量/路由/菜单/类型/事件/审计/设计标准
    design/      # design-tokens.json（色彩/间距/圆角/阴影/组件规范）
    labels/      # 中文映射集中管理
  components/    # 通用 UI 组件（shadcn/ui 源码 + 自定义组件）
  modules/
    auth/        # 登录页
    platform/    # 平台后台（pages、services、repositories、schemas）
    system/      # 系统后台（Agent 工厂、LLM 配置中心、Skill 管理、DataSource Provider 等）
    tenant/      # 租户后台（pages、services、repositories、schemas）
server/          # Express 后端
  index.ts       # app 初始化 + 中间件 + 路由挂载
  routes/        # 按域拆分的路由文件（每个文件导出 registerXxxRoutes 函数）
  domain/        # 数据库操作 + 种子数据（xxxDb.ts / xxxSeed.ts）
  services/      # 业务逻辑层（Skill 执行引擎、消息管线等）
```

---

## 前端 UI 技术栈

| 工具 | 用途 |
|------|------|
| **React 18 + TypeScript** | 核心框架 |
| **Vite** | 构建工具 |
| **Tailwind CSS v4** | 原子化样式（替代 CSS Modules） |
| **shadcn/ui** | UI 组件库（源码复制到项目内） |
| **Lucide React** | 图标库（统一使用，禁止 emoji） |
| **Recharts** | 数据可视化图表 |
| **react-hook-form + zod** | 表单管理与校验 |
| **sonner** | Toast 通知 |
| **@tanstack/react-table** | 高级表格 |
| **date-fns** | 日期处理 |
| **cmdk** | 命令面板（预留） |

**Design Token 权威来源**：`src/core/design/design-tokens.json`（参考 [Baklib](https://www.baklib.com/) 企业级 SaaS 风格）

---

## 后端架构

### API 服务（server/）

后端是独立 Express 服务，路由按域拆分：

```
server/routes/
├── authRoutes.ts         — /api/auth/*
├── projectRoutes.ts      — /api/projects/*
├── identityRoutes.ts     — /api/identities/*
├── terminalRoutes.ts     — /api/terminals/*
├── workflowRoutes.ts     — /api/workflow-templates/*, /api/workflow-instances/*
├── planningRoutes.ts     — /api/planning-sessions/*, /api/planning-drafts/*
├── agentRoutes.ts        — /api/agent-templates/*, /api/skills/*
├── llmRoutes.ts          — /api/llm/*, /api/llm-providers/*, /api/llm-model-configs/*
├── credentialRoutes.ts   — /api/credentials/*
├── facebookRoutes.ts     — /api/facebook/*
├── telegramRoutes.ts     — /api/telegram/*, /api/webhooks/telegram/:terminalId（新增）
├── dataSourceRoutes.ts   — /api/data-source-*（新增）
├── messageRoutes.ts      — /api/messages/*, /api/webhooks/*（新增）
├── schedulerRoutes.ts    — /api/scheduled-tasks/*（新增）
├── analyticsRoutes.ts    — /api/analytics/*, /api/projects/:id/reports/*（新增）
└── systemRoutes.ts       — /api/system-terminal-types/*, /api/tenants/*, /api/users/*
```

每个路由文件导出 `registerXxxRoutes(app: Router)` 函数，在 `index.ts` 中统一挂载。

### 核心 API

- `POST /api/llm/execute` — 服务端执行 LLM 调用（密钥不暴露前端）
- `POST /api/llm/test-provider` — 测试 LLM Provider 连通性
- `GET/POST/PUT/DELETE /api/credentials` — 管理 LLM 凭证
- `POST /api/webhooks/telegram/:terminalId` — Telegram Webhook 入口（新增）

**密钥治理原则：** 前端永远不持有真实 API Key，所有 LLM 调用必须经过服务端 Executor，调用链为：`AgentTemplate → AgentLLMBinding → LLMModelConfig → LLMProvider → LLMCredential → Server Executor → OpenAI`。

### 数据层

- **ORM**：Prisma + SQLite（`server/data/app.db`）
- **种子数据**：`server/domain/*Seed.ts`，使用 `seedXxxIfEmpty()` 模式
- **凭证存储**：LLM/Telegram 用 JSON 文件（`server/data/*.json`），DataSource 用 Prisma 模型

---

## Agent 模板权威清单

### 已有 Agent（12 个）

| ID | nameZh | roleType | category |
|----|--------|----------|----------|
| at-base-content-creator | 内容生成 Agent | creator | execution |
| at-base-reviewer | 基础审核 Agent | reviewer | execution |
| at-facebook-content-creator | Facebook 内容生成 Agent | creator | execution |
| at-content-reviewer | 内容审核 Agent | reviewer | execution |
| at-publisher | 发布 Agent | publisher | execution |
| at-workflow-planner | 基础流程规划助手 | planner | planning |
| at-social-workflow-planner | 社媒运营流程规划助手 | planner | planning |
| at-website-workflow-planner | 建站流程规划助手 | planner | planning |
| at-ai-employee-workflow-planner | AI 员工流程规划助手 | planner | planning |
| at-performance-recorder | 结果记录 Agent | recorder | execution |
| at-research-agent | 数据采集 Agent | researcher | execution |
| at-execution-supervisor | 执行监督助手 | supervisor | coordination |

### 计划新增 Agent（3 个）

| ID | nameZh | roleType | category |
|----|--------|----------|----------|
| at-interaction | 互动对话 Agent | responder | execution |
| at-community-manager | 社群管理 Agent | manager | coordination |
| at-config-agent | 配置助手 | configurator | coordination |

完整注册表（含 Skill 清单）见 `docs/development/13-errata-and-conventions.md`。

---

## Skill executionType 枚举

| 值 | 中文 | 说明 |
|----|------|------|
| `llm` | LLM 调用 | 通过 llmExecutor 调用大模型 |
| `external_api` | 外部 API | 调用第三方服务（Tavily/Apify/Telegram 等） |
| `internal_api` | 内部 API | 调用系统自身 API |
| `hybrid` | 混合执行 | LLM + API 的多步组合 |

> 旧值 `tool` 已迁移为 `external_api`，禁止使用。

---

## 关键约定

- **路径别名：** `@/` 映射到 `src/`（见 [vite.config.ts](vite.config.ts)）
- **前端代理：** Vite 将 `/api` 代理到 `http://localhost:3001`，前端调用 `/api/...` 时无需写完整地址
- **API 返回格式：** 统一 `{ code, message, data, meta: { requestId, timestamp } }`
- **ID 前缀约定：** Agent 模板 `at-`、Skill `skill-`、DataSourceProvider `dsp-`、SystemTerminalType `stt-`
- **中文标签：** 所有面向用户的显示文字集中在 `src/core/labels/` 和各模块的 `labels.ts` 文件中，不散落在页面组件里
- **Mock 用户：** 登录页下拉选择，`platform_admin` 进入 `/platform`，`system_admin` 进入 `/system`，`tenant_admin` 进入 `/tenant`（见 [src/core/auth/mockUsers.ts](src/core/auth/mockUsers.ts)）
- **通用组件复用：** 新增页面前先检查 `src/components/` 中已有的 shadcn/ui 组件（Button、Card、Table、Sheet、Dialog、Badge、Tabs 等），不得随意创建新样式
- **UI 新标准：** 新增页面必须使用 Tailwind CSS + shadcn/ui + Lucide 图标 + sonner Toast + react-hook-form/zod 表单。禁止使用 `.module.css`、`style={{}}`、`alert()`、emoji 图标。详见 `.cursor/rules/02-ui-design-system.mdc`。
- **列表页标准能力：** 所有列表页必须包含完整的标准能力，详见 `.cursor/rules/14-list-page-checklist.mdc`。
- **详情工作台标准能力：** 所有详情工作台页必须包含完整的标准结构，详见 `.cursor/rules/15-detail-workbench-checklist.mdc`。
- **开发进度追踪：** 每次开发完成后必须运行 `npm run docs:update` 更新 CHANGELOG 和代码索引，详见 `.cursor/rules/99-dev-progress-tracking.mdc`。

---

## 开发计划文档索引

详细开发计划在 `docs/development/` 目录：

| 编号 | 文件 | 内容 |
|------|------|------|
| 00 | `00-development-roadmap.md` | 总路线图、阶段规划、依赖关系 |
| 01 | `01-data-source-provider-center.md` | 数据源提供商中心（Tavily/Apify/Jina/RSS） |
| 02 | `02-telegram-bot-terminal.md` | Telegram Bot 终端接入 |
| 03 | `03-skill-execution-and-agent-enhancement.md` | Skill 执行引擎与 Agent 增强 |
| 04 | `04-message-pipeline.md` | 消息管线（收取/路由/分发/发送） |
| 05 | `05-interaction-agent.md` | 互动对话 Agent |
| 06 | `06-community-manager-agent.md` | 社群管理 Agent |
| 07 | `07-config-agent.md` | 配置助手 Agent |
| 08 | `08-research-agent.md` | 数据采集 Agent |
| 09 | `09-scheduled-task-system.md` | 定时任务系统 |
| 10 | `10-execution-loop.md` | 执行闭环（主动推送+被动响应） |
| 11 | `11-result-reporting.md` | 结果汇报与数据分析 |
| 12 | `12-ui-upgrade-and-menu-restructure.md` | UI 升级与菜单重构 |
| 13 | `13-errata-and-conventions.md` | 勘误、统一规范与补充定义（权威清单） |

### 系统状态文档

系统当前状态的权威文档在 `docs/status/` 目录：
- `system-architecture.md` — 系统结构与功能说明
- `codebase-index.md` — 代码结构索引
- `completed-features.md` — 已完成功能清单
- `product-blueprint.md` — 产品蓝图与差距分析
- `CHANGELOG.md` — 动态开发进度日志

---

## 规则文件索引

`.cursor/rules/` 包含 17 个规则文件：
- `00` 核心架构 / `01` 语言协作 / `02` UI 设计 / `03` 控制台结构 / `04` 编码与 API
- `05` Identity 模型 / `06` 项目域 / `07` 流程系统 / `08` Agent 模板
- `09` Planner Agent / `10` 运行监督 / `11` Worker 执行 / `12` LLM 治理
- `13` 生命周期与安全 / `14` 列表页清单 / `15` 详情工作台清单 / `16` 服务器部署
- `99` 开发进度追踪

## Cursor Skills 索引

`.cursor/skills/` 包含以下 Skill：
- `add-module-skeleton` — 新增完整业务模块骨架
- `create-admin-list-page` — 创建后台资源列表页
- `create-agent-template` — 新增 Agent 模板
- `create-detail-workbench` — 创建工作台型详情页
- `create-page-with-shadcn` — 使用 shadcn/ui + Tailwind 创建标准页面（新增）
- `create-project-type-pack` — 新增项目类型配置包
- `create-schema-service-repository` — 创建完整数据层
- `generate-mock-service` — 生成标准 mock 数据
- `refactor-standard-layout` — 重构为标准布局

---

## 语言与协作规范

- 代码、变量名、文件名、API 字段使用英文
- 注释、文档、与用户的沟通使用**中文**
- 复杂任务必须先输出影响范围和实施计划，确认后再修改代码
- 修改前确认影响模块，不修改无关文件
- **每次开发完成后必须运行 `npm run docs:update`** 更新 CHANGELOG 和代码索引
