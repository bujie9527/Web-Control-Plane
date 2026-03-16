# AI Work Control Center — 代码结构索引

> 基线日期：2026-03-16（由 docs:index 自动同步）
> 本文档为代码目录树 + 每个目录/关键文件的用途说明。

---

## 一、顶层目录结构

```
e:\Web Control Plane\
├── src/                    # 前端源码
├── server/                 # Express 后端
├── prisma/                 # Prisma schema 与迁移
├── scripts/                # 部署与运维脚本
├── docs/                   # 文档体系
├── .cursor/                # Cursor IDE 规则与技能
├── index.html              # Vite 入口 HTML
├── vite.config.ts          # Vite 构建配置（@/ 别名映射 src/）
├── tsconfig.json           # TypeScript 根配置
├── tsconfig.app.json       # 前端 TS 配置
├── tsconfig.server.json    # 后端 TS 配置
├── package.json            # 依赖与脚本
├── CLAUDE.md               # AI 协作指南（Cursor/Claude 读取）
├── .env / .env.example     # 环境变量（OPENAI_API_KEY 等）
├── .gitignore              # Git 忽略规则
├── .gitattributes          # Git 属性（.sh 强制 LF）
└── ecosystem.config.cjs    # PM2 生产配置
```

---

## 二、前端源码 `src/`

### 2.1 入口

| 文件 | 说明 |
|------|------|
| `main.tsx` | React 应用入口，挂载 AuthProvider + RouterProvider |
| `index.css` | 全局样式 |
| `app/routes.tsx` | 路由定义：三 Shell + Guards + 所有页面路由 |

### 2.2 核心层 `src/core/`

```
core/
├── api/
│   └── safeParseResponse.ts       # 统一 API 响应解析（code/message/data/meta）
├── auth/
│   ├── AuthContext.tsx             # 认证上下文（user/consoleType/login/logout）
│   └── mockUsers.ts               # Mock 用户数据（platform_admin/tenant_admin）
├── constants/
│   ├── routes.ts                  # 路由常量（ROUTES.PLATFORM/SYSTEM/TENANT）
│   └── events.ts                  # 事件名称常量
├── labels/
│   ├── agentTemplateLabels.ts     # Agent 模板中文标签映射
│   ├── llmConfigCenterLabels.ts   # LLM 配置中文标签
│   ├── planningDisplayLabels.ts   # 流程规划中文标签
│   ├── skillLabels.ts             # Skill 中文标签
│   ├── terminalTypeLabels.ts      # 终端类型中文标签
│   └── workflowRuntimeLabels.ts   # 流程运行中文标签
├── navigation/
│   ├── types.ts                   # MenuItem 类型（支持分组标题）
│   ├── platformMenu.ts            # 平台后台菜单
│   ├── systemMenu.ts              # 系统控制台菜单（含分组）
│   ├── tenantMenu.ts              # 租户后台菜单（含子菜单）
│   └── breadcrumb.ts              # 面包屑配置
├── permission/
│   ├── Guards.tsx                  # 路由守卫（Guest/Platform/Tenant/SystemAdmin）
│   └── constants.ts               # 权限常量（isSystemAdmin 判断）
├── schemas/
│   └── platformCapability.ts      # 平台能力类型定义
├── services/
│   └── auditService.ts            # 审计日志服务
├── types/
│   ├── api.ts                     # API 通用类型（ApiResponse/PaginatedResult）
│   ├── auth.ts                    # 认证类型（AuthState/ConsoleType）
│   ├── role.ts                    # 角色枚举
│   ├── user.ts                    # 用户类型
│   ├── permission.ts              # 权限类型
│   ├── audit.ts                   # 审计类型
│   └── deleteResult.ts            # 删除结果类型
└── utils/
    └── deleteConfirm.ts           # 删除确认工具函数
```

### 2.3 通用组件 `src/components/`

```
components/
├── AgentTemplateSelector/  # Agent 模板选择器（用于节点绑定）
├── Card/                   # 内容分区卡片
├── Dialog/                 # 弹窗（确认/警告/危险操作）
├── Drawer/                 # 侧滑抽屉（编辑/新建）
├── EmptyState/             # 空状态引导（含操作按钮）
├── Layout/                 # ConsoleLayout 后台统一布局
├── ListPageToolbar/        # 列表页工具栏（搜索+筛选+批量操作）
├── PageContainer/          # 页面容器（标题+说明+操作区）
├── Pagination/             # 分页组件
├── Sidebar/                # 深色侧边导航
├── StatusTag/              # 状态标签（中文映射）
├── Table/                  # 通用数据表格
└── TopBar/                 # 顶部操作栏
```

每个组件包含 `.tsx` 组件文件 + `.module.css` 样式文件。

### 2.4 业务模块 `src/modules/`

#### auth/

```
auth/
├── LoginPage.tsx           # 登录页（JWT 登录 + Mock 快速登录）
└── LoginPage.module.css
```

#### platform/（含 PlatformShell + SystemShell）

```
platform/
├── PlatformShell.tsx               # 平台后台 Shell
├── SystemShell.tsx                  # 系统控制台 Shell
├── pages/
│   ├── PlatformDashboard.tsx       # 平台工作台
│   ├── PlatformSettings.tsx        # 平台设置（含 Facebook 集成配置）
│   ├── PlatformUsers.tsx           # 平台用户管理
│   ├── PlatformAudit.tsx           # 平台审计日志
│   ├── TenantList.tsx              # 租户列表
│   ├── TenantDetail.tsx            # 租户详情
│   ├── ResourceQuota.tsx           # 资源与配额
│   ├── TemplateCenter.tsx          # 模板中心
│   ├── AgentFactory/               # Agent 模板工厂（List/New/Detail/Edit）
│   ├── SkillFactory/               # Skill 工厂（List/New/Detail/Edit）
│   ├── SkillFactoryDetail/         # Skill 工厂详情工作台（多 Tab）
│   ├── WorkflowTemplates/          # 流程模板工厂（List/New/Detail/Edit）
│   ├── WorkflowPlanning/           # 流程规划会话（List/New/Workbench）
│   ├── LLMConfigCenter/            # 模型配置中心（三分区页面）
│   └── PlatformCapabilities/       # 终端能力注册（List/Detail/Tabs）
├── services/                       # 14 个 service（全部调真实 API）
├── repositories/                   # 27 个 repository（全部调 /api/*）
└── schemas/                        # 6 个 schema 文件
```

#### tenant/

```
tenant/
├── TenantShell.tsx                 # 租户后台 Shell
├── pages/
│   ├── TenantDashboard.tsx         # 租户工作台
│   ├── ProjectList.tsx             # 项目列表
│   ├── ProjectCreationWizard/      # 项目创建向导（7 步）
│   ├── ProjectDetail/              # 项目详情工作台（8 Tab）
│   ├── TaskCenter.tsx              # 任务中心
│   ├── TaskExecutionPage.tsx       # 任务执行页
│   ├── WorkflowCenter/             # 流程中心
│   ├── WorkflowTemplates/          # 租户流程模板（List/Detail/Edit）
│   ├── WorkflowPlanning/           # 租户流程规划（List/New/Workbench）
│   ├── WorkflowRuntime/            # 流程运行监控（List/Detail）
│   ├── AgentCenter/                # Agent 库（只读展示平台 Agent）
│   ├── AgentLibraryDetail.tsx      # Agent 详情
│   ├── IdentityList.tsx            # 身份列表
│   ├── IdentityDetail/             # 身份详情工作台（多 Tab）
│   ├── SkillsCenter/               # Skills 库（只读展示已启用 Skill）
│   ├── SkillsCenterDetail.tsx      # Skill 详情
│   ├── TerminalCenter/             # 终端中心
│   ├── TerminalNewWizard.tsx       # 终端新建向导
│   ├── TerminalDetailWorkbench.tsx # 终端详情工作台
│   ├── FacebookPageAuth/           # Facebook 主页授权
│   ├── AnalyticsPage.tsx           # 数据分析
│   ├── SystemSettings.tsx          # 租户系统设置
│   └── SkeletonPages.tsx           # 骨架占位页
├── services/                       # 35+ service 文件
│   ├── adapters/                   # LLM 适配器（contentCreator/contentReviewer）
│   ├── parsers/                    # LLM 输出解析器
│   └── providers/                  # Provider 封装（openaiProvider）
├── repositories/                   # 26 个 repository（全部调 /api/*）
├── schemas/                        # 24 个 schema 文件
├── mock/                           # 33 个 mock 文件（渐进替换中）
└── projectTypes/                   # 项目类型配置包
    ├── index.ts
    ├── facebook-page/              # Facebook 主页运营
    ├── social-media/               # 自媒体内容运营
    ├── seo/                        # 网站运营与 SEO
    ├── lead-gen/                   # 线索获客
    └── matrix/                     # 账号矩阵管理
```

#### workflow-designer/

```
workflow-designer/
├── components/
│   ├── WorkflowGraphEditor.tsx     # 流程图编辑器主组件
│   ├── WorkflowNode.tsx            # 流程节点组件
│   └── NodeInspector.tsx           # 节点属性检查面板
├── utils/
│   └── graphAdapter.ts             # 数据 → 图形适配
└── index.ts
```

---

## 三、后端源码 `server/`

```
server/
├── index.ts                        # Express 主入口（120+ API 路由）
├── staticServe.ts                  # 生产环境静态文件服务
├── auth/
│   ├── authRoutes.ts               # /api/auth 登录路由
│   ├── authDb.ts                   # 用户数据库操作
│   ├── jwtMiddleware.ts            # JWT 验证中间件
│   └── userSeed.ts                 # 用户种子数据
├── domain/
│   ├── prismaClient.ts             # Prisma 客户端实例
│   ├── projectDb.ts                # 项目 CRUD
│   ├── projectSubdomainDb.ts       # Goal/Deliverable/SOP/ResourceConfig
│   ├── projectWorkbenchDb.ts       # 项目工作台聚合数据
│   ├── identityTerminalDb.ts       # 身份与终端 CRUD
│   ├── agentTemplateDb.ts          # Agent 模板 CRUD
│   ├── agentTemplateSeed.ts        # Agent 模板种子
│   ├── skillDb.ts                  # Skill CRUD
│   ├── skillSeed.ts                # Skill 种子
│   ├── llmConfigDb.ts              # LLM Provider/ModelConfig/Binding CRUD
│   ├── llmConfigSeed.ts            # LLM 配置种子
│   ├── workflowTemplateDb.ts       # 流程模板与节点 CRUD
│   ├── workflowInstanceDb.ts       # 流程实例与节点 CRUD
│   ├── workflowNodeExecutor.ts     # 节点执行器（LLM 调用）
│   ├── workflowRuntimeLogDb.ts     # 运行日志
│   ├── workflowSupervisorDecisionDb.ts  # 监督决策
│   ├── workflowPublishRecordDb.ts  # 发布记录
│   ├── planningSessionDb.ts        # 规划会话/草案/消息
│   ├── tenantDb.ts                 # 租户 CRUD
│   ├── systemTerminalTypeDb.ts     # 系统终端类型 CRUD
│   ├── systemTerminalTypeSeed.ts   # 终端类型种子
│   └── statsDb.ts                  # 统计数据聚合
├── llm/
│   ├── llmExecutorServer.ts        # LLM 执行入口
│   ├── llmResolverService.ts       # Agent → ModelConfig → Provider 解析
│   ├── testProviderServer.ts       # Provider 测试连接
│   ├── serverStore.ts              # LLM 内存数据（旧）
│   ├── serverStoreDb.ts            # LLM 从 Prisma 读取（新）
│   ├── llmApiErrorMapper.ts        # 错误中文映射
│   └── providers/
│       └── openaiProviderServer.ts # OpenAI API 封装
├── data/
│   ├── credentials.json            # LLM 凭证存储
│   ├── credentialStore.ts          # 凭证 CRUD
│   ├── platform-integrations.json  # 平台集成配置
│   ├── platformIntegrationStore.ts # 集成配置读写
│   ├── facebookCredentialStore.ts  # Facebook Token 存储
│   └── plannerStrategyProfiles.ts  # 规划策略数据
├── config/
│   ├── projectTypes.json           # 项目类型静态配置
│   ├── goalTypes.json              # 目标类型配置
│   └── goalMetricOptions.json      # 指标选项配置
└── services/
    └── facebookTerminalBridge.ts   # Facebook 终端桥接服务
```

---

## 四、Prisma `prisma/`

```
prisma/
├── schema.prisma           # 数据模型定义（37 个模型）
├── seed.ts                 # 种子脚本（调用各 *Seed.ts）
└── migrations/             # 数据库迁移文件
```

---

## 五、脚本 `scripts/`

| 文件 | 说明 |
|------|------|
| `deploy-update.sh` | 服务端更新脚本（git pull → npm ci → build → migrate → pm2 restart） |
| `README-deploy.md` | 部署脚本说明 |

---

## 六、文档 `docs/`

| 目录 | 说明 |
|------|------|
| `status/` | 系统状态基线文档（本文档所在） |
| `architecture/` | 架构设计文档（系统使命、领域模型、执行模型等） |
| `deployment/` | 部署指南与更新规则 |
| `integrations/` | 第三方集成文档（Facebook Pages API） |
| `archive/` | 历史归档文档 |
