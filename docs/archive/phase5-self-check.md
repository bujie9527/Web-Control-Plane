# Phase 5 自检报告：通用基础设施补齐与结构清理

## 完成项

### 一、Core 类型与合约
- **core/types/api.ts**：ApiResponse、ListResult、PaginationMeta 统一定义。
- **platform/schemas/tenant.ts**、**tenant/schemas/project.ts**：删除本地 ListResult/ApiResponse，改为从 `@/core/types/api` 引用并 re-export。

### 二、核心 Schema 补齐
- **core/types**：audit.ts（AuditLog、AuditRecordInput）、user.ts、role.ts、permission.ts。
- **tenant/schemas**：agent.ts、agentTeam.ts、skill.ts、terminal.ts、workflow.ts（与 04 领域模型对齐）。

### 三、通用组件
- **ListPageToolbar**：primaryAction + children（筛选区），含 actionBar、toolbar、filters、primaryBtn、search、select、queryBtn、actions、linkBtn 样式。
- **Dialog**：open、onClose、title、width、footer、children，居中弹窗，轻量场景用。

### 四、Service / Repository 分层
- **租户 Project**：新增 projectRepository（fetchProjectList、fetchProjectDetail、createProject、updateProject、deleteProject、patchProjectStatus）；projectService 改为经 repository 调 mock，对外 getProjectList、getProjectDetail、createProject、updateProject、deleteProject、patchProjectStatus。
- **租户 projectMock**：新增 createProject、updateProject、deleteProject、patchProjectStatus（内存写入/更新/删除/状态）。
- **平台 Tenant**：tenantMock 新增 createTenant、updateTenant、deleteTenant、patchTenantStatus；tenantRepository、tenantService 暴露对应方法。

### 五、Event / Audit 占位
- **core/constants/events.ts**：EVENTS 常量（tenant、user、project、workflow、task、agent、skill、terminal）。
- **core/services/auditService.ts**：record(input) 占位，console.debug 输出。
- **core/types/audit.ts**：AuditLog、AuditRecordInput。

### 六、列表页统一
- **TenantList**、**ProjectList**：改用 ListPageToolbar + listPageStyles；删除 TenantList.module.css、ProjectList.module.css。

### 七、占位与清理
- **PlatformAudit**：操作/安全/事件日志 Card 补充「预留：创建租户、更新状态…」等结构化说明。
- **SystemSettings**：菜单权限 Card 补充「扩展点：core/types/role、permission」。
- **ProjectDetailPlaceholder**、**ProjectDetailPlaceholder.module.css**：已删除（路由已使用 ProjectDetailWorkbench）。

## 验收
- 项目结构清晰，命名一致，列表页风格统一。
- 通用组件 ListPageToolbar、Dialog 可复用；ApiResponse/ListResult 仅 core 一处定义。
- Tenant、Project 具备 list/detail/create/update/delete/patchStatus 占位；租户 project 分层与平台 tenant 一致。
- Event、Audit 占位就绪，后续写操作可调用 auditService.record()。
- 构建通过，无新增 lint 报错。
