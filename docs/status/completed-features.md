# AI Work Control Center — 已完成功能清单

> 基线日期：2026-03-16
> 本文档按模块列出当前系统已完成的功能，含数据层、页面、API 状态。

---

## 功能成熟度标记说明

| 标记 | 含义 |
|------|------|
| **真实** | 前后端打通，Prisma 持久化，API 可用 |
| **Mock** | 仅前端 mock 数据，无后端 API |
| **骨架** | 页面结构存在，数据为占位 |
| **部分** | 主流程真实，部分子功能仍用 mock |

---

## 一、基础设施

| 功能 | 状态 | 说明 |
|------|------|------|
| 登录认证（JWT） | 真实 | 服务端签发 JWT，支持 /api/auth/login + /api/auth/me |
| Mock 快速登录 | 真实 | 三个预置用户，本地与云端均可用 |
| 三控制台架构 | 真实 | Platform/System/Tenant Shell 完全分离 |
| 路由守卫 | 真实 | Guest/Platform/Tenant/SystemAdmin 四级 Guard |
| 统一后台布局 | 真实 | ConsoleLayout + Sidebar + TopBar |
| 13 个通用 UI 组件 | 真实 | Table/Card/Drawer/Dialog/EmptyState/Pagination 等 |
| 中文标签映射体系 | 真实 | 6 个 labels 文件，覆盖 Agent/Skill/LLM/流程等 |
| 路由常量体系 | 真实 | ROUTES.PLATFORM/SYSTEM/TENANT 完整定义 |
| 统一 API 响应格式 | 真实 | { code, message, data, meta } |
| HTTPS 部署 | 真实 | Nginx + Certbot，域名 ai.667788.cool |
| Git 化部署流程 | 真实 | GitHub → 服务器 git pull → build → PM2 |

---

## 二、平台后台（PlatformShell）

| 页面/功能 | 状态 | 说明 |
|-----------|------|------|
| 平台工作台 | 真实 | 统计数据（租户数、项目数、终端数等） |
| 租户管理 | 真实 | 列表 + 详情 + CRUD + 状态切换 |
| 平台用户 | 真实 | 用户列表（来自 Prisma User 表） |
| 资源与配额 | 骨架 | 页面存在，数据为占位 |
| 模板中心 | 骨架 | 页面存在，数据为占位 |
| 平台审计 | 骨架 | 页面存在，数据为占位 |
| 平台设置 | 真实 | Facebook 集成配置（App ID/Secret/回调地址） |

---

## 三、系统控制台（SystemShell）

| 页面/功能 | 状态 | 说明 |
|-----------|------|------|
| Agent 模板工厂 | 真实 | 列表 + 新建 + 编辑 + 详情 + 克隆 + 状态切换 + 批量删除 |
| Skill 工厂 | 真实 | 列表 + 新建 + 编辑 + 详情工作台 + 状态切换 + 引用检查 |
| 流程模板工厂 | 真实 | 列表 + 新建 + 编辑 + 详情 + 克隆 + 节点管理 + 状态切换 |
| 流程规划会话 | 真实 | 列表 + 新建 + 工作台（消息/草案/上下文三栏） |
| 流程运行监控 | 真实 | 列表 + 详情（节点状态 + 监督决策 + 运行日志） |
| 模型配置中心（LLM） | 真实 | Provider 管理 + 模型配置 + Agent 绑定 + 凭证管理 + 测试连接 |
| 终端能力注册 | 真实 | 列表 + 详情工作台（凭证配置 Tab、Facebook 集成 Tab） |

---

## 四、租户后台（TenantShell）

| 页面/功能 | 状态 | 说明 |
|-----------|------|------|
| 租户工作台 | 真实 | 统计卡片 + 快捷入口 |
| 项目列表 | 真实 | 列表 + 搜索 + 筛选 + 批量删除 |
| 项目创建向导 | 真实 | 7 步向导（基础信息→目标→流程→资源→身份→推荐→确认） |
| 项目详情工作台 | 真实 | 8 Tab 工作台（概览/目标/身份/Agent/终端/流程/结果/设置） |
| 身份列表 | 真实 | 列表 + CRUD + 状态切换 |
| 身份详情工作台 | 真实 | 多 Tab（基础信息/表达规则/行为规则/平台适配/绑定项目/绑定终端） |
| Agent 库 | 真实 | 只读展示平台 Agent 资产 |
| Agent 详情 | 真实 | 只读详情页 |
| Skills 库 | 真实 | 只读展示已启用 Skill |
| Skill 详情 | 真实 | 只读详情页 |
| 终端中心 | 真实 | 列表 + 新建向导 + 详情工作台 + 测试连接 |
| Facebook 主页管理 | 真实 | OAuth 授权 + 主页绑定 + 发帖 + 定时发帖 |
| 任务中心 | 真实 | 任务列表（进行中/待审核/已完成） |
| 任务执行页 | 部分 | 任务详情 + 操作入口 |
| 租户流程模板 | 真实 | 列表 + 详情 + 编辑 |
| 租户流程规划 | 真实 | 列表 + 新建 + 工作台 |
| 租户流程运行监控 | 真实 | 列表 + 详情 |
| 数据分析 | 骨架 | 页面存在，数据为占位 |
| 系统设置 | 部分 | 基础设置 + 成员管理（部分 mock） |

---

## 五、后端 API 能力

| 资源域 | 端点数 | 状态 | 说明 |
|--------|--------|------|------|
| 认证 (auth) | 2 | 真实 | JWT 登录 + 当前用户 |
| 项目 (projects) | 14 | 真实 | CRUD + Goal/SOP/身份绑定/工作台 |
| 身份 (identities) | 6 | 真实 | CRUD + 状态 |
| 终端 (terminals) | 10 | 真实 | CRUD + 测试 + 操作 + Token 刷新 |
| 流程模板 (workflow-templates) | 13 | 真实 | CRUD + 克隆 + 节点管理 |
| 流程实例 (workflow-instances) | 7 | 真实 | CRUD + 节点执行 |
| 流程规划 (planning-sessions) | 12 | 真实 | 会话/草案/消息 CRUD |
| Agent 模板 (agent-templates) | 7 | 真实 | CRUD + 克隆 + 状态 |
| Skills | 6 | 真实 | CRUD + 状态 |
| LLM Provider | 6 | 真实 | CRUD + 状态 |
| LLM ModelConfig | 7 | 真实 | CRUD + 启用/停用/默认 |
| Agent LLM Binding | 4 | 真实 | CRUD + 设为主绑定 |
| LLM 凭证 (credentials) | 4 | 真实 | CRUD（JSON 文件存储） |
| LLM 执行 | 2 | 真实 | execute + test-provider |
| 租户 (tenants) | 6 | 真实 | CRUD + 状态 |
| 任务 (tasks) | 4 | 真实 | CRUD |
| 终端类型 (system-terminal-types) | 7 | 真实 | CRUD + 使用情况 |
| 平台能力 (platform-capabilities) | 3 | 真实 | 列表 + 详情 + 状态 |
| Facebook 集成 | 10 | 真实 | 配置 + OAuth + 主页 + 发帖 |
| 运行日志 | — | 真实 | 随实例操作写入 |
| 监督决策 | — | 真实 | 随实例操作写入 |
| 发布记录 | — | 真实 | 随发布操作写入 |

---

## 六、数据持久化

| 数据 | 存储方式 | 状态 |
|------|----------|------|
| 29 个业务模型 | SQLite + Prisma | 真实 |
| LLM 凭证 | JSON 文件（加密） | 真实 |
| Facebook Token | JSON 文件（加密） | 真实 |
| 平台集成配置 | JSON 文件 | 真实 |
| 项目类型/目标类型 | JSON 静态配置 | 真实 |
| 种子数据 | Prisma Seed 脚本 | 真实（Agent/Skill/LLM/终端类型/用户） |

---

## 七、LLM 集成

| 能力 | 状态 | 说明 |
|------|------|------|
| 服务端 LLM Executor | 真实 | Agent → Binding → ModelConfig → Provider → Credential → OpenAI |
| Provider 测试连接 | 真实 | 从 DB 读取配置，真实调用验证 |
| Planner LLM 接入 | 真实 | 流程规划助手可调用真实 LLM 生成/修订草案 |
| Worker 节点执行 | 真实 | 内容创作/审核节点可调用 LLM |
| 错误中文映射 | 真实 | llmApiErrorMapper 统一映射 |
| 执行日志 | 部分 | 前端展示使用 mock，后端写入使用真实 API |

---

## 八、第三方集成

| 平台 | 状态 | 已实现能力 |
|------|------|-----------|
| Facebook Pages | 真实 | App 配置、OAuth 授权、主页列表、发帖、定时发帖、Token 刷新、撤销授权 |
| OpenAI | 真实 | 通过服务端 Executor 调用，支持 json_object / json_schema 输出模式 |

---

## 九、仍使用 Mock 的区域

| 区域 | Mock 用途 | 优先级 |
|------|-----------|--------|
| 项目创建推荐模板 | Step3/Step6 引用 workflowTemplateMock | P1 |
| 项目终端 Tab | 引用 facebookPageBindingMock | P1 |
| 项目确认摘要 | 引用 identityMock 获取名称 | P2 |
| 租户成员 | Step1 引用 tenantMemberMock | P2 |
| LLM 执行日志前端展示 | 引用 llmExecutionLogMock | P2 |
| 数据分析页 | 骨架占位 | P2 |
| 资源与配额页 | 骨架占位 | P2 |
| 模板中心页 | 骨架占位 | P2 |
| 平台审计页 | 骨架占位 | P2 |
