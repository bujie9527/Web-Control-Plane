# Phase 2：平台后台核心页面 — 实施计划

**目标**：完成平台后台 8 个核心页面骨架，形成可演示的「平台治理控制台」。重点打磨租户列表与租户详情，其余为骨架级。

**依据**：`docs/architecture/02、03、05、06、07`，`.cursor/rules/02、03、05、06`。

---

## 1. 本阶段页面拆分方案

| 序号 | 页面 | 类型 | 路由 | 说明 |
|------|------|------|------|------|
| 1 | 平台工作台 | 骨架级 | `/platform` | 已有占位，本阶段升级为指标卡 + 预警 + 最近动态骨架 |
| 2 | 租户列表页 | **重点打磨** | `/platform/tenants` | 标准列表页：标题、说明、搜索、筛选、表格、分页、状态标签、行操作、打开详情 |
| 3 | 租户详情页 | **重点打磨** | `/platform/tenants/:id` | 工作台型详情：基本信息、套餐与配额、成员概览、项目概览、操作日志占位 |
| 4 | 平台用户页 | 骨架级 | `/platform/users` | 平台管理员/角色/登录信息骨架，卡片或简单列表 |
| 5 | 资源与配额页 | 骨架级 | `/platform/quota` | 模型资源、调用额度、存储额度、套餐策略骨架，分组卡片 |
| 6 | 模板中心页 | 骨架级 | `/platform/templates` | Agent/Skill/流程/菜单模板骨架，Tab 或分组 |
| 7 | 平台审计页 | 骨架级 | `/platform/audit` | 操作/安全/事件日志骨架，简单表格或列表 |
| 8 | 平台设置页 | 骨架级 | `/platform/settings` | 基础设置、认证、通知、系统参数骨架，配置分组卡片 |

**路由约定**：
- 租户详情使用独立路由 `/platform/tenants/:id`，从列表「查看」跳转；详情页内不承载租户内业务（如项目内任务），仅平台视角的「该租户的基本信息、配额、成员数、项目数、操作记录」。

---

## 2. 重点页面与骨架页面的差异化实现策略

### 2.1 重点打磨页（租户列表、租户详情）

- **租户列表页**
  - **结构**：严格按 05-page-layout-spec「标准列表页」：标题区、说明区、操作区（如「新建租户」占位）、筛选区（搜索 + 状态/套餐筛选）、表格区、分页区、抽屉区（详情/编辑占位）。
  - **表格**：列完整（租户名称、状态、套餐、成员数、项目数、资源使用、创建时间、操作）；状态用统一状态标签；行操作「查看」「编辑」「更多」；点击「查看」可打开详情抽屉或跳转详情页（本阶段建议跳转详情页以体现工作台型）。
  - **数据**：通过 platform tenant 的 mock service（list + 分页 + 筛选），页面只调 service，不写拼装逻辑。
  - **复用**：使用通用 Table 容器、StatusTag、PageContainer、筛选区组件（若已有则复用）。

- **租户详情页**
  - **结构**：工作台型，非单表详情。顶部摘要区（租户名称、状态、套餐、创建时间等）；下方为区块：基本信息、套餐与配额、成员概览、项目概览、操作日志占位。
  - **数据**：通过 tenant detail mock（单条详情 + 成员数/项目数汇总），页面只调 service。
  - **边界**：不出现「该租户下的项目列表」「该租户下的任务」等租户内业务；仅「项目数」等汇总与平台视角信息。

### 2.2 骨架级页面（平台工作台 + 其余 5 个）

- **共同策略**：
  - 统一使用 **PageContainer**（标题 + 说明）+ 内容区。
  - 内容区用**卡片分组**或**简单表格/列表**占位，信息结构清晰、可扩展，但不实现复杂交互。
  - 数据用 **mock 一次性结构**（如平台工作台用一条「统计 + 最近动态」mock），不强制走完整 list/detail 接口形态。
- **平台工作台**：指标卡（租户总数、活跃租户、资源消耗概览）+ 预警区（条列占位）+ 最近动态（列表占位），数据 mock 一条即可。
- **平台用户 / 资源与配额 / 模板中心 / 平台审计 / 平台设置**：每页 2～4 个分组卡片或 Tab，每组有标题 + 简短说明 + 占位内容（EmptyState 或简单列表），不实现真实 CRUD。

---

## 3. 计划新增或复用的组件

### 3.1 复用（已有）

- **PageContainer**：所有页面统一使用，标题区 + 说明区 + 内容区。
- **EmptyState**：骨架页占位、空表格提示。
- **ConsoleLayout / Sidebar / TopBar**：不改动，平台路由已在 Phase 1 挂好。

### 3.2 计划新增（通用，放 `components/`）

| 组件 | 用途 | 说明 |
|------|------|------|
| **StatusTag** | 状态标签 | 统一 success/warning/error/info/neutral 颜色，供列表与详情使用 |
| **Table**（或 **DataTable**） | 表格容器 | 表头 + 行 + 支持自定义列配置，操作列固定右侧，空状态插槽 |
| **Pagination** | 分页 | 页码、每页条数、总数，与 06-api-contract-spec 的 meta.pagination 对应 |
| **Card**（若尚未有） | 卡片 | 分组区块、指标卡容器，平台工作台与骨架页使用 |
| **Drawer** | 详情/编辑抽屉 | 从右侧滑出，可放「租户详情简要」或编辑表单占位（本阶段列表可先「查看」跳转详情页，抽屉可作为扩展位预留） |

### 3.3 可选 / 后续

- **FilterBar**：搜索 + 筛选器组合，若与 Table 强绑定可先内聚在列表页内，再抽成通用。
- **MetricCard**：平台工作台指标卡，可用通用 Card + 数字 + 文案实现，不单独建组件亦可。

---

## 4. 涉及的模块与文件范围

### 4.1 目录假设（与 03-module-boundaries 一致）

- **`src/modules/platform/`**：平台后台页面与平台相关 service/mock/schema。
- **`src/components/`**：通用 StatusTag、Table、Pagination、Card、Drawer。
- **`src/core/`**：仅常量/类型若需跨模块复用可放 core；平台专属类型放 `modules/platform` 更合适。

### 4.2 建议文件结构（仅列出本阶段新增/修改）

```
src/
├── components/
│   ├── StatusTag/
│   │   ├── StatusTag.tsx
│   │   └── StatusTag.module.css
│   ├── Table/                    # 或 DataTable
│   │   ├── Table.tsx
│   │   └── Table.module.css
│   ├── Pagination/
│   │   ├── Pagination.tsx
│   │   └── Pagination.module.css
│   ├── Card/
│   │   ├── Card.tsx
│   │   └── Card.module.css
│   └── Drawer/
│       ├── Drawer.tsx
│       └── Drawer.module.css
├── modules/
│   └── platform/
│       ├── PlatformShell.tsx     # 修改：子路由指向具体页面组件
│       ├── pages/
│       │   ├── PlatformDashboard.tsx   # 平台工作台
│       │   ├── TenantList.tsx           # 租户列表（重点）
│       │   ├── TenantDetail.tsx         # 租户详情（重点）
│       │   ├── PlatformUsers.tsx
│       │   ├── ResourceQuota.tsx
│       │   ├── TemplateCenter.tsx
│       │   ├── PlatformAudit.tsx
│       │   └── PlatformSettings.tsx
│       ├── services/
│       │   ├── tenantService.ts         # 租户 list/detail 等，调 repository
│       │   └── platformDashboardService.ts  # 工作台统计等
│       ├── schemas/
│       │   └── tenant.ts                # Tenant 类型、列表参数、分页结果等
│       ├── mock/
│       │   ├── tenantMock.ts            # 租户 list/detail mock 数据与方法
│       │   └── platformDashboardMock.ts
│       └── (可选) repositories/
│           └── tenantRepository.ts      # 封装 list/detail 请求，当前读 mock
├── app/
│   └── routes.tsx                # 修改：platform 子路由指向上述 pages，新增 /platform/tenants/:id
```

- **不涉及**：租户后台（`modules/tenant` 仅已有 Shell）、auth、core 中与平台无关部分。
- **路由**：在 `app/routes.tsx` 中为 platform 增加 `Route path="tenants/:id" element={<TenantDetail />}`，列表页「查看」跳转 `/platform/tenants/:id`。

---

## 5. Mock 数据设计建议

### 5.1 租户（Tenant）— 重点

- **列表**：至少 5～8 条，字段：id、name、code、status（active/suspended/expired）、plan（如基础版/专业版）、memberCount、projectCount、quotaUsage（可简化为百分比或文案）、createdAt。支持按 keyword、status、plan 筛选，分页 page/pageSize/total。
- **详情**：单条扩展信息：基本信息（同上）+ 配额明细（可 mock 一段文案或键值）+ 成员概览（仅数量或前几条占位）+ 项目概览（仅数量或前几条占位）+ 操作日志（列表占位 3～5 条，字段：时间、操作、结果）。

### 5.2 平台工作台

- 一条统计：`{ totalTenants, activeTenants, resourceSummary, alerts[], recentActivities[] }`。alerts 与 recentActivities 各 3～5 条占位，文案具备「平台运营」感（如「租户 xxx 已开通」「配额预警」）。

### 5.3 其余骨架页

- **平台用户**：2～3 条平台管理员占位 + 角色列表占位。
- **资源与配额**：分组键值或简单表格，如「模型资源」「调用额度」「存储额度」「套餐策略」各一段 mock。
- **模板中心**：Agent/Skill/流程/菜单模板各一个分组，每组 1～2 条占位或仅标题+说明。
- **平台审计**：5～10 条日志占位（时间、操作类型、操作人、结果）。
- **平台设置**：2～4 个配置分组，每组若干 key-value 占位。

### 5.4 接口形态（与 06 一致）

- 列表：`{ code, message, data: { items, total? }, meta: { pagination: { page, pageSize, total } } }`。
- 详情：`{ code, message, data: { ...entity } }`。
- mock 层可先返回上述形状，repository/service 再封装，便于后续替换为真实 API。

---

## 6. 风险点

| 风险 | 应对 |
|------|------|
| 租户详情页混入「租户内业务」 | 严格限定为平台视角：基本信息、套餐与配额、成员/项目**概览（数量或占位列表）**、操作日志；不提供「进入该租户后台」「该租户项目列表」等业务操作，仅占位或链接说明。 |
| 列表页逻辑写进页面 | 列表页只做：调 tenantService.list、传筛参、渲染 Table+StatusTag+Pagination；筛选变更、分页变更仅改参数再请求。表格列配置可抽成常量，不写复杂转换。 |
| 重复造轮子 | 先实现 StatusTag、Table、Pagination、Card，再在各页复用；若发现与现有实现重复，优先删重复、保留一处。 |
| 平台工作台过于「业务化」 | 强调平台运营：租户数、资源、预警、动态；不出现「我的任务」「项目进度」等租户侧概念。 |
| 路由与菜单不一致 | 新增 `/platform/tenants/:id` 后，菜单仍只有「租户管理」，从列表进入详情；不在侧栏为「租户详情」单独建菜单。 |

---

## 7. 实施顺序建议（供确认后执行）

1. **通用组件**：StatusTag → Card → Table → Pagination → Drawer（可选）。
2. **core/schema 与 mock**：Tenant 类型与列表/详情 mock 数据，tenantRepository + tenantService。
3. **平台工作台**：PlatformDashboard 页 + platformDashboardMock，指标卡 + 预警 + 动态。
4. **租户列表页**：TenantList 页，接 tenantService.list，表格 + 筛选 + 分页 + 状态标签，查看跳转详情。
5. **租户详情页**：TenantDetail 页，接 tenantService.detail，工作台型布局。
6. **骨架页**：PlatformUsers、ResourceQuota、TemplateCenter、PlatformAudit、PlatformSettings，每页 PageContainer + 分组卡片/简单列表 + mock。
7. **路由**：在 `app/routes.tsx` 与 `PlatformShell` 中挂载上述页面及 `/platform/tenants/:id`。
8. **自检**：双后台分离、平台治理视角、无租户业务混入、页面结构符合 05、mock 有业务感。

---

请确认或调整本计划后，再进入 Phase 2 的代码实现。
