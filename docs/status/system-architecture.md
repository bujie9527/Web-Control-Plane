# AI Work Control Center — 系统结构与功能说明

> 基线日期：2026-03-16
> 本文档描述系统当前的架构结构、技术栈、核心链路与模块职责。

---

## 一、系统定位

以项目为驱动、以垂直能力 Agent 为执行单元、以身份（Identity）定义内容视角、以终端为操作入口的 **AI 运营控制平面**。

核心执行链路：

```
Project（项目）
 ├── Goal（目标）+ Deliverable（交付标准）
 ├── Identity（身份）× N → Terminal（终端）
 ├── SOP → [Planner Agent] → WorkflowTemplate → WorkflowInstance
 │    └── WorkflowNode → Agent（LLM + Skills）
 └── Result → Report（可汇报）
```

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | SPA 单页应用 |
| 构建工具 | Vite 6 | 开发/生产构建 |
| 路由 | React Router 6 | 三 Shell 路由体系 |
| 后端框架 | Express.js (Node.js) | REST API 服务 |
| 运行时 | tsx (开发) / tsc + node (生产) | TypeScript 直接运行 |
| 数据库 | SQLite + Prisma ORM | 29 个 Prisma 模型 |
| 部署 | Ubuntu + Nginx + PM2 + Certbot | HTTPS，Git 化部署 |
| 流程图 | @xyflow/react | Workflow 可视化编辑 |

---

## 三、三控制台架构（Three-Shell）

系统通过路由前缀将用户分流到三个独立的控制台 Shell：

| Shell | 路由前缀 | 角色 | 职责 |
|-------|----------|------|------|
| **PlatformShell** | `/platform` | platform_admin | 租户管理、平台用户、配额、模板中心、审计、设置 |
| **SystemShell** | `/system` | system_admin | Agent 模板工厂、Skill 工厂、流程模板工厂、LLM 配置中心、终端能力注册、流程运行监控 |
| **TenantShell** | `/tenant` | tenant_admin / 租户成员 | 项目中心、任务执行、流程中心、Agent 库、Skills 库、身份库、终端中心、数据分析 |

三个 Shell 从路由、菜单、布局上彻底分离，通过 Guards 做权限隔离。

---

## 四、分层架构

每个业务模块遵循四层分离：

```
page（页面展示、调用 service）
 ↓
service（业务逻辑、数据组装）
 ↓
repository（数据读写，HTTP 调用 /api/*）
 ↓
schema（TypeScript 类型定义、状态枚举）
```

页面层不包含复杂业务逻辑，不直接访问后端 API。

---

## 五、前端模块结构

### 5.1 核心层 (`src/core/`)

| 目录 | 职责 |
|------|------|
| `auth/` | AuthContext、mockUsers，登录状态与 consoleType 判定 |
| `constants/` | 路由常量（ROUTES）、事件名称 |
| `labels/` | 中文标签映射（Agent、Skill、LLM、流程运行等） |
| `navigation/` | 三个 Shell 的菜单定义 + MenuItem 类型 |
| `permission/` | Guards（GuestGuard、PlatformOnlyGuard、TenantOnlyGuard、SystemAdminOnlyGuard） |
| `schemas/` | 跨模块共享类型（platformCapability） |
| `services/` | 审计服务 |
| `types/` | 通用类型（api、auth、role、user、permission、audit） |
| `utils/` | 工具函数（deleteConfirm） |
| `api/` | safeParseResponse 统一响应解析 |

### 5.2 通用组件 (`src/components/`)

13 个标准化 UI 组件，供全部页面复用：

| 组件 | 用途 |
|------|------|
| ConsoleLayout | 后台统一布局（侧边栏 + 顶栏 + 内容区） |
| Sidebar | 深色侧边导航，支持折叠、分组、子菜单 |
| TopBar | 顶部操作栏 |
| Table | 通用数据表格 |
| Card | 内容分区卡片 |
| Dialog | 弹窗（确认、警告） |
| Drawer | 侧滑抽屉（编辑、详情） |
| EmptyState | 空状态引导 |
| ListPageToolbar | 列表页工具栏（搜索、筛选、批量操作） |
| PageContainer | 页面容器（标题、说明、操作区） |
| Pagination | 分页 |
| StatusTag | 状态标签 |
| AgentTemplateSelector | Agent 模板选择器 |

### 5.3 业务模块 (`src/modules/`)

| 模块 | 说明 |
|------|------|
| `auth/` | 登录页 |
| `platform/` | PlatformShell + SystemShell 的全部页面、服务、数据层 |
| `tenant/` | TenantShell 的全部页面、服务、数据层、mock |
| `workflow-designer/` | 流程图可视化编辑器（基于 @xyflow/react） |

---

## 六、后端结构

### 6.1 目录划分

| 目录 | 职责 |
|------|------|
| `server/index.ts` | 主入口，注册所有 API 路由（120+ 端点） |
| `server/auth/` | 认证路由、JWT 中间件、用户种子 |
| `server/domain/` | Prisma 数据层（20+ db 文件），每个业务实体一个文件 |
| `server/llm/` | LLM 执行器、解析器、Provider 适配层 |
| `server/data/` | JSON 文件存储（凭证、平台集成配置） |
| `server/config/` | 静态配置（项目类型、目标类型、指标选项） |
| `server/services/` | 业务桥接服务（Facebook 终端） |
| `prisma/` | Prisma schema（29 模型）、迁移文件、种子脚本 |

### 6.2 LLM 调用链

```
前端 llmExecutor → POST /api/llm/execute
  → llmExecutorServer
    → llmResolverService（解析 Agent → Binding → ModelConfig → Provider → Credential）
    → openaiProviderServer（实际调用 OpenAI API）
```

密钥仅存在于服务端，前端不持有 API Key。

### 6.3 数据库模型（29 个 Prisma 模型）

**项目域**：Project, ProjectGoal, ProjectSOP, ProjectDeliverable, ProjectResourceConfig, ProjectIdentityBinding

**身份与终端**：Identity, Terminal, SystemTerminalType

**流程定义**：WorkflowTemplate, WorkflowTemplateNode

**流程运行**：WorkflowInstance, WorkflowInstanceNode, WorkflowRuntimeLog, WorkflowSupervisorDecision, WorkflowPublishRecord

**流程规划**：WorkflowPlanningSession, WorkflowPlanningDraft, WorkflowPlanningMessage

**Agent 与 Skills**：AgentTemplate, Skill

**LLM 配置**：LLMProvider, LLMModelConfig, AgentLLMBinding

**任务**：Task

**平台**：Tenant, User

---

## 七、API 概览

REST 风格，统一返回格式 `{ code, message, data, meta }`。共 120+ 端点，按资源分组：

| 资源 | 端点数 | 主要操作 |
|------|--------|----------|
| 认证 | 2 | 登录、获取当前用户 |
| 项目 | 14 | CRUD + Goal/SOP/身份绑定/工作台 |
| 身份 | 6 | CRUD + 状态切换 |
| 终端 | 10 | CRUD + 测试连接 + 操作 |
| 流程模板 | 13 | CRUD + 克隆 + 节点管理 |
| 流程实例 | 7 | CRUD + 节点执行 |
| 流程规划 | 12 | 会话/草案/消息 CRUD |
| Agent 模板 | 7 | CRUD + 克隆 + 状态 |
| Skills | 6 | CRUD + 状态 |
| LLM | 14 | Provider/ModelConfig/Binding/Credential CRUD + 执行/测试 |
| 租户 | 6 | CRUD + 状态 |
| 任务 | 4 | CRUD |
| 终端类型 | 7 | CRUD + 使用情况 |
| 平台能力 | 3 | 列表 + 详情 + 状态 |
| Facebook | 10 | 集成配置 + OAuth + 主页管理 + 发帖 |

---

## 八、部署架构

```
用户浏览器
  ↓ HTTPS
Nginx（反向代理，Certbot SSL）
  ├── 静态文件 → dist/（Vite 构建产物）
  └── /api/* → Express.js :3001（PM2 守护）
         └── SQLite + Prisma
```

- 服务器：Ubuntu Linux
- 域名：`https://ai.667788.cool`
- 部署方式：Git 化部署（`git pull` → `npm ci` → `build` → `prisma migrate` → `pm2 restart`）

---

## 九、认证与权限

| 机制 | 说明 |
|------|------|
| 认证方式 | JWT（服务端签发），Mock 用户快速登录（演示） |
| 角色 | platform_admin, platform_owner, tenant_admin, tenant_owner, project_manager, operator, reviewer, viewer |
| Guards | GuestGuard, AuthRedirect, PlatformOnlyGuard, TenantOnlyGuard, SystemAdminOnlyGuard |
| consoleType | 由 user.tenant 是否存在决定（有 tenant → tenant，无 → platform） |
