# 第一轮开发收口自检报告

**范围**：Phase 1～5 全部成果，按七维度检查并输出总结与第二阶段建议。

---

## 一、通用组件

### 1.1 检查结果：已形成统一模式

| 类型 | 组件 | 使用情况 |
|------|------|----------|
| 页面容器 | PageContainer（title + description + body） | 所有业务页统一使用 |
| 表格 | Table（columns、dataSource、rowKey、loading、emptyText） | 列表页、工作台最近任务、骨架页表格、项目详情各 Tab |
| 卡片 | Card（title、description、children） | 工作台区块、详情页区块、骨架页分组、设置/审计页 |
| 标签 | StatusTag（type=success\|warning\|error\|info\|neutral） | 列表状态列、详情摘要、预警、骨架页状态 |
| 抽屉 | Drawer（open、onClose、title、width） | 已实现，当前无页面使用，留作新建/编辑等 |
| 弹窗 | Dialog（open、onClose、title、footer） | Phase 5 新增，当前无页面使用，留作确认/轻量表单 |
| 空状态 | EmptyState（title、description） | 审计、模板、配额、用户等骨架或空数据 |
| 工具栏 | ListPageToolbar（primaryAction、children 筛选） | 租户列表、项目列表；导出 listPageStyles 供操作列样式 |

### 1.2 结论

- 页面容器、表格、卡片、标签、空状态已形成统一用法，列表页增加 ListPageToolbar 后与 05 规范一致。
- 抽屉与弹窗为基础设施占位，未在页内使用属预期，第二阶段「新建/编辑」可接入。

---

## 二、Schema / Service / Repository

### 2.1 分层情况

| 模块 | Schema | Mock | Repository | Service | 页面调用 |
|------|--------|------|-------------|---------|----------|
| 平台-租户 | tenant.ts | tenantMock | tenantRepository | tenantService | getTenantList、getTenantDetail 等 |
| 平台-工作台 | — | platformDashboardMock | 无 | platformDashboardService | getDashboardStats |
| 租户-项目 | project.ts | projectMock | projectRepository | projectService | getProjectList、getProjectDetail 等 |
| 租户-项目详情 | projectDetail.ts | projectDetailMock | 无 | projectDetailService | fetchProjectDetailWorkbench |
| 租户-工作台 | tenantDashboard.ts | tenantDashboardMock | 无 | tenantDashboardService | getTenantDashboardData |

- **已形成可扩展分层**：Tenant、Project 为「mock → repository → service → page」，repository 统一返回 ApiResponse，service 解包后返回 data。
- **聚合类未走 repository**：平台工作台、租户工作台、项目详情工作台为「mock → service → page」，符合「只读聚合可直连 mock」的简化约定；若后续需统一，可再补 repository 占位。

### 2.2 页面层逻辑

- 列表页：仅负责 setState、调 service、传 columns/rowKey；无复杂筛选构造或数据拼装，符合「页面不承担过多逻辑」。
- 详情页 / 工作台：拉取单一 detail 或 dashboard 数据并渲染，无跨模块拼装。
- **结论**：主要资源已形成可扩展的 schema → mock → repository → service 分层；页面层未直接调 mock（仅通过 service），无「页面承担过多逻辑」问题。

---

## 三、Mock Service

### 3.1 返回结构

| 层级 | 返回形态 | 说明 |
|------|----------|------|
| Mock 层 | 纯数据（如 `{ items, total }`、`Tenant \| null`） | tenantMock、projectMock、projectDetailMock、*DashboardMock 均直接返回业务数据 |
| Repository 层 | ApiResponse&lt;T&gt;（code、message、data、meta） | tenantRepository、projectRepository 对 list/detail/create/update/delete/patchStatus 统一 wrap |
| Service 层 | 解包后的 data（ListResult&lt;T&gt;、T、boolean） | 对外只暴露业务数据，code≠0 抛错 |

- **统一点**：所有经 repository 的接口均为 ApiResponse；core/types/api.ts 统一定义 ListResult、ApiResponse、PaginationMeta；platform/tenant 的 schema 仅 re-export，无重复定义。
- **未走 repository 的 mock**：dashboard、projectDetail 由 service 直调 mock，返回类型为业务 DTO，无 code/meta，与「资源型接口」区分明确，可接受。

### 3.2 主要资源 Mock 结构

| 资源 | list | detail | create | update | delete | patchStatus |
|------|------|--------|--------|--------|--------|-------------|
| Tenant | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Project | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ProjectDetail（聚合） | — | ✅ | — | — | — | — |
| TenantDashboard / PlatformDashboard | — | ✅（聚合） | — | — | — | — |
| Task / Workflow / Agent / Skill / Terminal | 骨架 mock（skeletonMock） | — | — | — | — | — |

- **结论**：主要资源 Tenant、Project 已具备六类操作占位；聚合类与骨架资源以 list/detail 或聚合结构为主，满足第一轮「可扩展基础」要求。

---

## 四、Event / Audit

### 4.1 统一命名与占位

- **事件**：`core/constants/events.ts` 中 EVENTS 常量覆盖 tenant、user、project、workflow、task、agent、skill、terminal，与 06 规范一致；当前仅占位，无事件总线调用。
- **审计**：`core/types/audit.ts` 定义 AuditLog、AuditRecordInput；`core/services/auditService.ts` 提供 `record(input)`，当前为 console.debug 占位。
- **关键资源扩展位**：06 与 phase5 计划中已列出（创建/更新租户、项目、成员、角色、Agent、Skill、Terminal、Workflow、Task 等），后续在写操作处调用 `auditService.record()` 即可。

### 4.2 结论

- 事件与审计已有统一命名与占位，关键资源预留了扩展位，满足第一轮收口要求。

---

## 五、页面统一性

### 5.1 平台后台 vs 租户后台

- **风格统一**：共用 ConsoleLayout、Sidebar、TopBar、PageContainer、Card、Table、StatusTag、EmptyState；配色与间距一致。
- **职责分离**：平台侧菜单为租户管理、用户、配额、模板、审计、设置；租户侧为工作台、项目、任务、流程、Agent、Skills、终端、分析、系统管理；Layout 标题分别为「平台控制台」「工作中控台」，租户侧 TopBar 展示 tenantName。
- **结论**：双后台统一风格、职责分离明确。

### 5.2 页面类型与模式

| 类型 | 模式 | 代表页面 |
|------|------|----------|
| 列表页 | PageContainer + ListPageToolbar + Table + Pagination | 租户列表、项目列表 |
| 工作台页 | PageContainer + 指标卡 + Card 区块（待办/预警/最近任务/快捷入口） | 平台工作台、租户工作台 |
| 工作台型详情 | PageContainer + 摘要区 + TabNav + 多 Card 内容区 | 项目详情工作台 |
| 锚点型详情 | PageContainer + 页内锚点 + 多 Card 区块 | 租户详情 |
| 设置/配置页 | PageContainer + 多 Card（配置组或说明） | 平台设置、系统管理、资源配额 |
| 骨架页 | PageContainer + 2～4 Card（表格/列表/占位文案） | 任务中心、流程中心、Agent、Skills、终端、分析、审计、模板、用户 |

- **结论**：列表页、工作台页、工作台型详情、设置页、骨架页均有清晰模式，可复现、可扩展。

---

## 六、工程结构

### 6.1 命名

- **Service**：getTenantList、getTenantDetail、getProjectList、getProjectDetail、createTenant、createProject 等，已统一为 get/create/update/delete/patchXxxStatus。
- **Repository**：fetchTenantList、fetchProjectList 等，与 service 的 get 对应，命名一致。
- **文件**：schemas、mock、repositories、services、pages 小驼峰或 kebab 统一，无混用。

### 6.2 模块边界

- **core**：types（api、audit、user、role、permission、auth）、constants（routes、events）、auth、navigation、permission、services（auditService）；不包含业务页面。
- **modules/platform**：租户、平台工作台、用户、配额、模板、审计、设置；不包含租户内项目/任务等业务。
- **modules/tenant**：工作台、项目、项目详情、任务、流程、Agent、Skills、终端、分析、系统管理；不包含平台租户管理。
- **components**：仅通用 UI，无业务耦合。

### 6.3 重复实现

- **已消除**：ListResult/ApiResponse 仅在 core 定义；列表页 actionBar/toolbar/filters 已收口到 ListPageToolbar + listPageStyles。
- **仍存在**：各页内 statusMap/statusLabel（TenantStatus、ProjectStatus 等）按页定义，未抽到 core 或模块 constants；属轻度重复，第二阶段可抽成「状态展示配置」统一引用。

### 6.4 结论

- 命名统一、模块边界清晰；重复实现已收敛，仅剩状态映射可后续统一。

---

## 七、第一轮整体成果

### 7.1 是否达到「企业级后台骨架可演示」

- **是**。具备：双后台与权限骨架、多租户基础模型、统一 Layout 与菜单、登录入口、平台租户管理（列表+详情）、租户工作台、项目列表、项目详情工作台（8 Tab）、任务/流程/Agent/Skills/终端/分析/系统管理/审计/模板/用户等骨架页；schema/service/repository 分层、ApiResponse 统一、event/audit 占位、通用组件齐全。
- 符合 07 文档「第一阶段完成时」系统层、页面层、工程层、观感层要求。

### 7.2 最适合作为演示重点

1. **路线二：租户视角** — 登录（租户账号）→ 租户工作台（指标、待办、预警、最近任务、快捷入口）→ 项目列表（筛选、表格、查看）→ 项目详情工作台（摘要 + 8 Tab：概览、目标与KPI、渠道、Agent、终端、流程与任务、结果、设置），体现「项目管理 + AI 协作中控」。
2. **路线一：平台视角** — 登录（平台账号）→ 平台工作台 → 租户列表 → 租户详情（锚点导航、基本信息、配额、成员与项目概览、审计占位）。
3. **路线三：能力视角** — 在项目详情内切换 Agent团队、终端分配、流程与任务、结果反馈 Tab，展示资源与执行、结果闭环的结构。

### 7.3 建议留到第二阶段

- 新建/编辑租户、新建/编辑项目的表单与 Drawer/Dialog 实际使用。
- 任务、流程、Agent、Skill、终端的真实 list/detail 接口与可运行骨架。
- 权限细化（菜单级、按钮级）、项目级作用域。
- 审计落地（auditService.record 在写操作处调用并持久化）。
- 真实 API 对接（repository 层替换 mock）。

---

## 八、第一轮开发完成总结

- **通用组件**：页面容器、表格、卡片、标签、抽屉、弹窗、空状态、列表页工具栏已统一并复用，模式清晰。
- **分层**：Tenant、Project 已形成 schema → mock → repository → service → page 可扩展分层；聚合类（dashboard、projectDetail）为 service → mock，页面不直连 mock。
- **Mock**：返回结构经 repository 的均为 ApiResponse；Tenant、Project 具备 list/detail/create/update/delete/patchStatus；其余为 list/detail 或骨架 mock。
- **Event / Audit**：事件命名与审计类型、record 占位已就绪，关键资源扩展位已预留。
- **页面**：双后台风格统一、职责分离；列表、工作台、工作台型详情、设置、骨架页均有清晰模式。
- **工程**：命名统一、模块边界清晰，重复实现已收口，仅状态映射可后续统一。
- **整体**：已达到企业级后台骨架可演示程度，演示重点为租户工作台 → 项目列表 → 项目详情工作台；新建/编辑、真实任务与流程、权限与审计落地建议留到第二阶段。

---

## 九、建议保留的问题清单

| 序号 | 项 | 说明 |
|------|-----|------|
| 1 | projectDetail / tenantDashboard 未经 repository | 当前 service 直调 mock，若需与资源型接口完全统一，可在第二阶段补 repository 占位。 |
| 2 | Drawer / Dialog 未在页内使用 | 新建租户、新建项目等仍为占位按钮，第二阶段接入表单时再使用。 |
| 3 | statusMap / statusLabel 按页定义 | 可抽到 core 或各模块 constants，便于统一文案与 StatusTag 类型。 |
| 4 | PlatformUsers 等未用 ListPageToolbar | 当前为 Card + EmptyState，若后续改为列表页可接入 ListPageToolbar。 |
| 5 | 写操作未调用 auditService.record | createTenant、createProject 等占位未埋审计，第二阶段接入时再调用。 |

---

## 十、第二阶段最优先的 5 个方向

1. **项目详情内的编辑与绑定** — 在项目详情工作台内，实现目标/KPI、渠道、Agent 团队、终端、流程等的「编辑/配置」占位或简单表单（Drawer/Dialog），并与 mock 或首批真实 API 联动。
2. **任务与流程可运行骨架** — 任务中心、流程中心从骨架升级为可 list/detail、可「创建/启动」占位，与 Workflow/Task schema 和 mock 对接，形成「可演示的执行链路」。
3. **真实 API 与 repository 替换** — 将 tenantRepository、projectRepository 等从 mock 换为真实 HTTP 客户端，保持 ApiResponse 与 service 接口不变。
4. **权限与审计落地** — 菜单级/按钮级权限控制；在 create/update/delete/patchStatus 等写操作处调用 auditService.record，并落库或上报。
5. **租户/项目新建与编辑表单** — 租户列表「新建租户」、项目列表「新建项目」打开 Drawer 或 Dialog，表单提交后调现有 create 接口，并刷新列表。

以上五条可作为第二阶段优先迭代顺序的参考，实际可按业务排期微调。
