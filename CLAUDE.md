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

## 系统使命与核心概念

本项目是一个**以项目为驱动、以垂直能力 Agent 为执行单元、以身份（Identity）定义内容视角、以终端为操作入口的 AI 运营控制平面**。完整使命见 [docs/architecture/00-system-mission.md](docs/architecture/00-system-mission.md)。

### 核心概念（严禁混用）

| 概念 | 定义 | 关键约束 |
|---|---|---|
| **Identity（身份）** | 内容创作的视角与立场，属于**项目层** | 不是 Agent 的属性；决定"内容从谁的角度产出"；可跨项目复用 |
| **Agent（智能体）** | 垂直能力的 AI 执行单元，按领域/平台划分 | `Agent = LLM + Skills`；不承载人格；接收 Identity 作为内容视角输入 |
| **Skills（技能）** | 完成特定任务的最短路径，Agent 的行动指令库 | 与 OpenClaw 格式兼容，可直接复用外部生态；描述操作步骤，不描述内容视角 |
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

本项目采用"控制平面骨架"架构。当前阶段使用 **mock-first** 策略，所有数据通过 mock service/repository 提供，不接入真实第三方平台或自动化执行引擎。

### 三控制台结构（Three-Shell Architecture）

路由入口 [src/app/routes.tsx](src/app/routes.tsx) 将系统分为三个独立 Shell：

| Shell | 路由前缀 | 角色 | 用途 |
|---|---|---|---|
| `PlatformShell` | `/platform` | `platform_admin` | 平台运营管理（租户、配额、审计） |
| `SystemShell` | `/system` | `system_admin` | 系统管理员专属（Agent 模板工厂、LLM 配置中心、Workflow 模板工厂） |
| `TenantShell` | `/tenant` | `tenant_admin` / 租户成员 | 租户业务后台（项目、任务、流程、Agent） |

三个 Shell 必须从路由、菜单、布局上彻底分离，不能靠角色隐藏菜单模拟分离。

### 分层结构（Layer Architecture）

每个业务模块必须保持四层分离，页面层不得包含复杂业务逻辑：

```
page（页面展示、调用 service）
  ↓
service（业务逻辑、数据组装）
  ↓
repository（数据读写，当前为 mock，后续替换为真实 API/DB）
  ↓
schema（类型定义、状态枚举）
```

### 目录结构

```
src/
  app/           # 路由入口
  core/          # 全局基础：身份/权限/常量/路由/菜单/类型/事件/审计
  components/    # 通用 UI 组件（Layout、Table、Card、Drawer、Dialog 等）
  modules/
    auth/        # 登录页
    platform/    # 平台后台（pages、services、repositories、schemas、mock）
    tenant/      # 租户后台（pages、services、repositories、schemas、mock）
server/          # Express 后端，提供 LLM 执行 API 与凭证管理
```

### 后端 LLM API（server/）

后端是独立 Express 服务，核心职责：
- `POST /api/llm/execute` — 服务端执行 LLM 调用（密钥不暴露前端）
- `POST /api/llm/test-provider` — 测试 LLM Provider 连通性
- `GET/POST/PUT/DELETE /api/credentials` — 管理 LLM 凭证（密钥以加密形式存储在 `server/data/credentials.json`）

**密钥治理原则：** 前端永远不持有真实 API Key，所有 LLM 调用必须经过服务端 Executor，调用链为：`AgentTemplate → AgentLLMBinding → LLMModelConfig → LLMProvider → LLMCredential → Server Executor → OpenAI`。

### 关键约定

- **路径别名：** `@/` 映射到 `src/`（见 [vite.config.ts](vite.config.ts)）
- **前端代理：** Vite 将 `/api` 代理到 `http://localhost:3001`，前端调用 `/api/...` 时无需写完整地址
- **API 返回格式：** 统一 `{ code, message, data, meta: { requestId, timestamp } }`
- **中文标签：** 所有面向用户的显示文字集中在 `src/core/labels/` 和各模块的 `labels.ts` 文件中，不散落在页面组件里
- **Mock 用户：** 登录页下拉选择，`platform_admin` 进入 `/platform`，`tenant_admin` 进入 `/tenant`（见 [src/core/auth/mockUsers.ts](src/core/auth/mockUsers.ts)）
- **通用组件复用：** 新增页面前先检查 `src/components/` 中的 Table、Card、Drawer、Dialog、EmptyState、StatusTag、ListPageToolbar 是否可复用，不得随意创建新样式
- **列表页标准能力：** 所有列表页必须包含完整的标准能力，详见 `.cursor/rules/64-list-page-standard-checklist.mdc`。核心要求：工具栏（新建、搜索、状态筛选、批量操作区）、表格行操作（查看、编辑、删除含二次确认弹窗）、Checkbox 多选与批量删除、EmptyState（含新建入口）、Pagination（含总数）、加载与错误态。开发完成后必须逐项自检。
- **详情工作台标准能力：** 所有详情工作台页必须包含完整的标准结构，详见 `.cursor/rules/65-detail-workbench-checklist.mdc`。核心要求：顶部返回条（返回按钮+面包屑）、摘要条（名称、状态标签、关键字段、编辑/删除按钮）、水平 Tab 导航（state 控制、不刷页）、每个 Tab 独立子组件文件、Tab 内 Card 分区 + EmptyState。开发完成后必须逐项自检。

### 语言与协作规范

- 代码、变量名、文件名、API 字段使用英文
- 注释、文档、与用户的沟通使用**中文**
- 复杂任务必须先输出影响范围和实施计划，确认后再修改代码
- 修改前确认影响模块，不修改无关文件
