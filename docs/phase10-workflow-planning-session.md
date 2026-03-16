# 第十阶段输出：Workflow Planning Session 1.0

## 一、新增和修改的文件列表

### 新增文件

| 类型 | 路径 |
|------|------|
| Schema | `src/modules/tenant/schemas/workflowPlanningSession.ts` |
| Mock | `src/modules/tenant/mock/workflowPlanningSessionMock.ts` |
| Repository | `src/modules/tenant/repositories/workflowPlanningSessionRepository.ts` |
| Service | `src/modules/tenant/services/workflowPlanningSessionService.ts` |
| Labels | `src/core/labels/planningDisplayLabels.ts` |
| 平台列表 | `src/modules/platform/pages/WorkflowPlanning/WorkflowPlanningList.tsx` |
| 平台新建 | `src/modules/platform/pages/WorkflowPlanning/WorkflowPlanningNew.tsx` |
| 平台工作台 | `src/modules/platform/pages/WorkflowPlanning/WorkflowPlanningWorkbench.tsx` |
| 平台工作台样式 | `src/modules/platform/pages/WorkflowPlanning/WorkflowPlanningWorkbench.module.css` |
| 系统列表封装 | `src/modules/platform/pages/WorkflowPlanning/SystemWorkflowPlanningList.tsx` |
| 系统新建封装 | `src/modules/platform/pages/WorkflowPlanning/SystemWorkflowPlanningNew.tsx` |
| 系统工作台封装 | `src/modules/platform/pages/WorkflowPlanning/SystemWorkflowPlanningWorkbench.tsx` |
| 租户列表 | `src/modules/tenant/pages/WorkflowPlanning/TenantWorkflowPlanningList.tsx` |
| 租户新建 | `src/modules/tenant/pages/WorkflowPlanning/TenantWorkflowPlanningNew.tsx` |
| 租户工作台 | `src/modules/tenant/pages/WorkflowPlanning/TenantWorkflowPlanningWorkbench.tsx` |

### 修改文件

| 路径 | 修改内容 |
|------|----------|
| `src/core/constants/routes.ts` | 新增 WORKFLOW_PLANNING、WORKFLOW_PLANNING_NEW、WORKFLOW_PLANNING_DETAIL（system + tenant） |
| `src/app/routes.tsx` | 新增 6 条路由 |
| `src/core/navigation/systemMenu.ts` | 新增「流程规划会话」菜单 |
| `src/core/navigation/platformMenu.ts` | 新增「流程规划会话」菜单 |
| `src/core/navigation/tenantMenu.ts` | 新增「流程规划」菜单 |

---

## 二、新增对象模型说明

### WorkflowPlanningSession

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| scopeType | system \| tenant | 作用域 |
| tenantId | string? | 租户 ID（tenant 时必填） |
| title | string | 规划标题 |
| description | string? | 规划说明 |
| projectTypeId | string | 项目类型 |
| goalTypeId | string | 目标类型 |
| deliverableMode | string | 交付模式 |
| sourceType | PlanningSourceType | 来源类型 |
| sourceText | string? | SOP 或目标原文 |
| plannerAgentTemplateId | string? | 规划 Agent 模板 |
| plannerExecutionBackend | PlannerExecutionBackend | 执行后端 |
| currentDraftId | string? | 当前草案 ID |
| status | PlanningSessionStatus | 状态 |
| createdBy | string | 创建人 |
| createdAt / updatedAt | string | 时间戳 |

### WorkflowPlanningDraft

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| sessionId | string | 所属会话 |
| version | number | 草案版本号 |
| summary | string? | 草案摘要 |
| parsedSOP | string? | 解析后 SOP |
| nodes | WorkflowPlanningDraftNode[] | 节点列表 |
| suggestedAgentTemplateIds | string[]? | 推荐 Agent |
| suggestedSkillIds | string[]? | 推荐 Skill |
| changeSummary | string? | 修改摘要 |
| riskNotes | string? | 风险提示 |
| status | PlanningDraftStatus | 状态 |
| createdAt | string | 创建时间 |

### WorkflowPlanningDraftNode

结构与 WorkflowTemplateNode 兼容，包含：id、key、name、description、executionType、intentType、orderIndex、dependsOnNodeIds、recommendedAgentTemplateId、allowedAgentRoleTypes、allowedSkillIds、inputMapping、outputMapping、executorStrategy、reviewPolicy。

### WorkflowPlanningMessage

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| sessionId | string | 所属会话 |
| role | user \| assistant \| system | 角色 |
| content | string | 内容 |
| relatedDraftVersion | number? | 关联草案版本 |
| messageType | PlanningMessageType | 消息类型 |
| createdAt | string | 创建时间 |

---

## 三、页面与路由说明

### 平台（System）侧

| 路径 | 页面 | 说明 |
|------|------|------|
| /system/workflow-planning | SystemWorkflowPlanningList | 规划列表 |
| /system/workflow-planning/new | SystemWorkflowPlanningNew | 新建规划 |
| /system/workflow-planning/:id | SystemWorkflowPlanningWorkbench | 规划工作台（三栏） |

### 租户侧

| 路径 | 页面 | 说明 |
|------|------|------|
| /tenant/workflow-planning | TenantWorkflowPlanningList | 规划列表 |
| /tenant/workflow-planning/new | TenantWorkflowPlanningNew | 新建规划 |
| /tenant/workflow-planning/:id | TenantWorkflowPlanningWorkbench | 规划工作台（三栏） |

### 工作台三栏布局

- **左栏**：规划上下文（项目类型、目标类型、交付模式、来源类型、SOP 原文、当前状态、当前草案版本、可用 Agent/Skill 数量）
- **中栏**：消息会话（用户、助手、系统消息）
- **右栏**：当前草案（修改摘要、风险提示、节点列表、新建草案版本、设为当前草案）

---

## 四、中文映射文件说明

**路径**：`src/core/labels/planningDisplayLabels.ts`

**映射内容**：

| 枚举 | 映射常量 |
|------|----------|
| PlanningSessionStatus | PLANNING_SESSION_STATUS_LABELS |
| PlanningSourceType | PLANNING_SOURCE_TYPE_LABELS |
| PlannerExecutionBackend | PLANNER_EXECUTION_BACKEND_LABELS |
| PlanningDraftStatus | PLANNING_DRAFT_STATUS_LABELS |
| PlanningMessageRole | PLANNING_MESSAGE_ROLE_LABELS |
| PlanningMessageType | PLANNING_MESSAGE_TYPE_LABELS |
| executionType | DRAFT_EXECUTION_TYPE_LABELS（复用 EXECUTION_TYPE_LABELS） |
| intentType | DRAFT_INTENT_TYPE_LABELS（复用 INTENT_TYPE_LABELS） |

---

## 五、当前 Mock 交互流程说明

1. **新建规划**：填写表单 → `createPlanningSession` → 跳转至工作台
2. **列表**：`listPlanningSessions` 按 scopeType、tenantId、status 等筛选
3. **工作台**：`getPlanningSessionById`、`listPlanningDrafts`、`listPlanningMessages` 加载数据
4. **新建草案**：`createPlanningDraft` 创建新版本 → `addPlanningMessage` 写入系统提示 → 刷新
5. **设为当前草案**：`setCurrentDraft` 更新会话的 currentDraftId
6. **种子数据**：首次调用时自动注入一条 tenant 规划会话（含 1 个草案、2 条消息）

---

## 六、已预留但尚未实现的第十一阶段扩展点

| 扩展点 | 说明 | 预留方式 |
|--------|------|----------|
| Planner Agent 接入 | 真实 LLM/Planner Agent | plannerAgentTemplateId、plannerExecutionBackend |
| Draft 发布为模板 | 草案 → 正式 WorkflowTemplate | DraftNode 结构与 WorkflowTemplateNode 兼容 |
| 消息输入与发送 | 用户输入并发送消息 | addPlanningMessage 已实现，UI 未接输入框 |
| 助手自动回复 | 基于 SOP 生成草案 | 当前无自动逻辑 |
| 版本对比与差异 | 草案版本间差异 | relatedDraftVersion 已预留 |
| 项目导入 sourceType | 从项目导入 SOP | sourceType.project_import 已定义 |
