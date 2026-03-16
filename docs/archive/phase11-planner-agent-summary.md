# Phase 11：Workflow Planner Agent 1.0 开发完成说明

## 一、新增和修改的文件列表

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/modules/tenant/mock/planningSkillsMock.ts` | 规划类 Skill mock（5 个技能） |
| `src/modules/tenant/services/workflowPlanningValidator.ts` | 流程规划校验器 |
| `src/modules/tenant/services/plannerService.ts` | 流程规划服务层 |
| `docs/phase11-planner-agent-summary.md` | 本说明文档 |

### 修改文件

| 文件 | 说明 |
|------|------|
| `src/modules/platform/schemas/agentTemplate.ts` | AgentTemplateRoleType 新增 `planner` |
| `src/modules/platform/mock/agentTemplateMock.ts` | 新增系统预置「流程规划助手」模板 |
| `src/modules/platform/pages/WorkflowTemplates/workflowTemplateLabels.ts` | AGENT_ROLE_LABELS 新增 `planner` |
| `src/core/labels/planningDisplayLabels.ts` | 新增 AGENT_CATEGORY_LABELS、PLANNING_SKILL_LABELS、VALIDATOR_* |
| `src/modules/platform/pages/WorkflowPlanning/WorkflowPlanningWorkbench.tsx` | 升级为 Planner 交互：生成初稿、应用修改、消息输入、校验展示 |
| `src/modules/platform/pages/WorkflowPlanning/WorkflowPlanningWorkbench.module.css` | 新增 messageInput、validation 样式 |

---

## 二、Planner Agent 与 Planning Skills 说明

### Planner Agent（流程规划助手）

- **ID**：`at-workflow-planner`
- **中文名称**：流程规划助手
- **code**：`WORKFLOW_PLANNER`
- **category**：`planning`
- **roleType**：`planner`
- **执行路径**：默认 `llm`，当前以 mock 实现
- **绑定技能**：ParseSOPToStructuredSteps、GenerateWorkflowDraft、ReviseWorkflowDraft、SummarizeWorkflowChanges、SuggestNodeAgentBindings

### Planning Skills（5 个）

| code | 中文名 | 说明 |
|------|--------|------|
| ParseSOPToStructuredSteps | SOP 结构化解析 | 将自然语言 SOP 解析为结构化步骤 |
| GenerateWorkflowDraft | 生成流程草案 | 根据会话与 SOP 生成流程草案 |
| ReviseWorkflowDraft | 修订流程草案 | 根据用户反馈修订既有草案 |
| SummarizeWorkflowChanges | 生成修改摘要 | 为草案修订生成可读摘要 |
| SuggestNodeAgentBindings | 推荐节点 Agent 绑定 | 为草案节点推荐 Agent 与 Skill |

---

## 三、Planning Validator 说明

### 职责

对 `WorkflowPlanningDraft` 做结构与边界校验，确保 Planner 生成的草案不越界、可转化。

### 校验范围

- **节点结构**：节点是否存在、key 是否重复、orderIndex 是否有效、dependsOnNodeIds 是否有效
- **节点类型**：executionType、intentType 是否在允许范围内
- **Agent / Skill**：recommendedAgentTemplateId、allowedSkillIds 是否存在
- **项目边界**：是否越过 supportedProjectTypeId、supportedGoalTypeIds、supportedDeliverableModes
- **可转化性**：DraftNode 是否具备转换为 WorkflowTemplateNode 所需的基础字段

### 输出结构

```ts
{
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  normalizedSummary: string
}
```

### 前台展示

校验结果统一以中文展示，如：草案校验通过、存在无效节点类型、节点依赖配置异常等。

---

## 四、Planner Service 交互链路说明

| 方法 | 用途 | 链路 |
|------|------|------|
| `generateInitialDraftFromSession(sessionId)` | 生成初稿 | 读 session → 解析 SOP → 生成 Draft v1 → 调用 Validator → 写入助手消息 → 设为当前 Draft |
| `reviseDraftFromUserMessage(sessionId, messageId)` | 应用修改建议 | 读当前 Draft + 最新用户消息 → 修订节点 → 新版 Draft → Validator → 写入 changeSummary/riskNotes → 设为当前 |
| `validatePlanningDraftById(draftId, sessionContext?)` | 校验草案 | 读 Draft → 执行 Validator → 返回结构化结果 |
| `appendPlannerMessage(sessionId, content, relatedDraftVersion?)` | 追加助手消息 | 调用 addPlanningMessage |
| `createNextDraftVersion(sessionId, baseDraftId, revisedDraftData)` | 创建下一草案版本 | 基于 baseDraft 创建新版 → Validator → 设为当前 |

页面仅通过 Planner Service 组织规划流程，不直接实现 Planner 逻辑。

---

## 五、工作台新增交互说明

### 按钮

| 按钮 | 行为 |
|------|------|
| 生成初稿 | 调用 `generateInitialDraftFromSession`，基于 SOP 生成 Draft v1 并校验 |
| 应用修改建议 | 调用 `reviseDraftFromUserMessage`，基于最新用户消息修订草案 |
| 新建草案版本 | 保留 Phase 10 能力，手动创建新版草案 |
| 设为当前（vN） | 切换当前展示的草案版本 |

### 中栏消息区

- 支持：用户消息、流程规划助手消息、系统提示、修改摘要、风险提示
- 新增：文本输入框 + 发送按钮，用于发送用户修改建议

### 右栏草案区

- 当前版本、版本切换、修改摘要、风险提示
- 新增：校验结果摘要（中文），成功为绿色背景，失败为红色背景并列出 errors/warnings

---

## 六、中文映射文件说明

集中维护于 `src/core/labels/planningDisplayLabels.ts`：

| 映射 | 说明 |
|------|------|
| PLANNING_SESSION_STATUS_LABELS | 规划会话状态 |
| PLANNING_SOURCE_TYPE_LABELS | 规划来源类型 |
| PLANNER_EXECUTION_BACKEND_LABELS | 规划执行后端 |
| PLANNING_DRAFT_STATUS_LABELS | 草案状态 |
| PLANNING_MESSAGE_ROLE_LABELS | 消息角色 |
| PLANNING_MESSAGE_TYPE_LABELS | 消息类型 |
| PLANNING_ROLE_TYPE_LABELS | Agent 角色（含 planner） |
| AGENT_CATEGORY_LABELS | Agent 分类（含 planning） |
| PLANNING_SKILL_LABELS | 规划技能中文名 |
| PLANNING_PROJECT_TYPE_LABELS | 项目类型 |
| PLANNING_GOAL_TYPE_LABELS | 目标类型 |
| PLANNING_DELIVERABLE_LABELS | 交付模式 |
| VALIDATOR_ERROR_LABELS | 校验错误码 |
| VALIDATOR_WARNING_LABELS | 校验警告码 |

---

## 七、当前 mock / 半真实能力边界说明

- **Planner Agent**：系统预置模板已创建，执行路径以 mock 为主，可预留 LLM Executor 接口
- **Planning Skills**：mock 数据与结构已就绪，尚未实现真实技能执行
- **parseSOPToNodes**：根据 sourceText 简单解析，生成 1–5 个节点（含内容生成、人工审核、发布等）
- **reviseNodesFromFeedback**：当前仅复制节点并更新 id，尚未基于用户反馈做真实修订
- **Validator**：已实现完整校验逻辑，使用 AgentTemplate mock 与已知 Skill ID 集合
- **模板发布**：未实现，符合 Phase 11 约束
- **OpenClaw**：未接入
- **运行期监督**：未实现
