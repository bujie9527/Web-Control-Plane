# Phase 3 自检报告：租户后台核心页面

## 1. 完成项

- **工作台**（`/tenant`）：核心指标卡、我的待办（含「去处理」链接）、预警中心、最近任务表格、快捷入口 6 个；数据来自 `tenantDashboardMock` + `tenantDashboardService`。
- **项目列表**（`/tenant/projects`）：标题/说明、操作区「新建项目」、搜索与状态筛选、表格列（项目名称、所属渠道、负责人、当前目标、状态、Agent Team、终端数、任务进度、更新时间、操作）、分页；「查看」跳转 `/tenant/projects/:id`。
- **项目详情占位页**（`/tenant/projects/:id`）：PageContainer + EmptyState，说明 Phase 4 实现。
- **7 个骨架页**：任务中心、流程中心、Agent 中心、Skills 能力库、终端中心、数据分析、系统管理；每页 PageContainer + 2～4 个 Card，内容为 mock 列表/表格或占位文案，无大面积空白。
- **路由与 Shell**：租户 index 渲染 `TenantDashboard`，子路由指向上述 9 个页面 + 项目详情占位；TenantShell 统一渲染 `<Outlet />`。

## 2. 与平台后台的区分

- 租户工作台：强调「今日工作入口」——待办、预警、最近任务、快捷入口；指标为进行中项目、待办任务、待审核、本周完成。
- 平台工作台：租户总数、活跃租户、资源消耗、平台预警、最近动态。
- 菜单顺序：工作台 → 项目中心 → 任务执行 → 流程中心 → Agent → Skills → 终端 → 数据分析 → 系统管理，体现业务流程。

## 3. 模块与分层

- `modules/tenant/schemas/`：project.ts、task.ts、tenantDashboard.ts。
- `modules/tenant/mock/`：tenantDashboardMock.ts、projectMock.ts、skeletonMock.ts。
- `modules/tenant/services/`：tenantDashboardService.ts、projectService.ts。
- `modules/tenant/pages/`：TenantDashboard、ProjectList、ProjectDetailPlaceholder、TaskCenter、WorkflowCenter、AgentCenter、SkillsCenter、TerminalCenter、AnalyticsPage、SystemSettings；复用 PageContainer、Card、Table、Pagination、StatusTag、EmptyState。

## 4. 验收结论

- 租户后台已形成业务中控基础结构。
- 用户可从工作台通过快捷入口进入项目中心、任务中心等。
- 项目列表页体现项目管理模式（渠道、负责人、目标、Agent Team、终端数、任务进度）。
- 骨架页占位明确，mock 数据体现真实业务结构。
- 构建通过，无新增 lint 报错。
