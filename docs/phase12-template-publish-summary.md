# Phase 12：Workflow Template Confirm & Publish 1.0 开发完成说明

## 一、新增文件列表

| 文件 | 说明 |
|------|------|
| `src/modules/tenant/schemas/workflowTemplatePublishRecord.ts` | WorkflowTemplatePublishRecord 对象定义 |
| `src/modules/tenant/services/planningDraftToTemplateConverter.ts` | Draft → Template 转换器 |
| `src/modules/tenant/services/workflowTemplateValidator.ts` | 流程模板校验器 |
| `src/modules/tenant/services/workflowTemplatePublishService.ts` | 发布服务 |
| `src/modules/tenant/mock/workflowTemplatePublishRecordMock.ts` | 发布记录 Mock |
| `src/modules/platform/pages/WorkflowPlanning/PublishTemplateDialog.tsx` | 发布弹窗组件 |
| `docs/phase12-template-publish-summary.md` | 本说明文档 |

### 修改文件

| 文件 | 说明 |
|------|------|
| `src/modules/tenant/schemas/workflowExecution.ts` | WorkflowTemplate 新增 sourcePlanningSessionId、sourcePlanningDraftId、sourceDraftVersion |
| `src/modules/tenant/mock/workflowTemplateMock.ts` | createWorkflowTemplate 支持来源字段 |
| `src/modules/tenant/mock/workflowTemplateNodeMock.ts` | 新增 addNodesFromDraftConversion |
| `src/core/labels/planningDisplayLabels.ts` | 新增 PUBLISH_SCOPE_TYPE_LABELS、PUBLISH_SCOPE_TYPE_OPTIONS |
| `src/modules/platform/pages/WorkflowPlanning/WorkflowPlanningWorkbench.tsx` | 新增「确认生成模板」按钮与发布流程 |
| `src/modules/platform/pages/WorkflowPlanning/SystemWorkflowPlanningWorkbench.tsx` | 传入 allowSystemPublish、publishedBy |
| `src/modules/tenant/pages/WorkflowPlanning/TenantWorkflowPlanningWorkbench.tsx` | 传入 tenantId、publishedBy |

---

## 二、Draft → Template 转换说明

### 转换器：planningDraftToTemplateConverter.ts

**输入**：WorkflowPlanningDraft + ConvertOptions

**输出**：ConvertedTemplate（template 数据 + nodes 数组）

### 字段映射

| DraftNode | TemplateNode |
|-----------|--------------|
| key | key |
| name | name |
| description | description |
| executionType | executionType |
| intentType | intentType |
| orderIndex | orderIndex |
| dependsOnNodeIds | dependsOnNodeIds（ID 重映射） |
| recommendedAgentTemplateId | recommendedAgentTemplateId |
| allowedSkillIds | allowedSkillIds |
| inputMapping | inputMapping |
| outputMapping | outputMapping |
| executorStrategy | executorStrategy |

### 来源追踪

Template 写入：
- sourcePlanningSessionId
- sourcePlanningDraftId
- sourceDraftVersion

---

## 三、Publish Service 说明

### workflowTemplatePublishService.publishDraftAsTemplate

**流程**：
1. Draft Validator
2. Convert Draft → Template 结构
3. Create WorkflowTemplate
4. Create WorkflowTemplateNode（addNodesFromDraftConversion）
5. Template Validator（二次校验）
6. Create PublishRecord

**参数**：draftId, scopeType, tenantId?, templateName, templateDescription?, publishedBy

**返回**：{ template, publishRecord }

---

## 四、Template Validator 说明

### workflowTemplateValidator.validateWorkflowTemplate

**校验范围**：
- 节点结构：节点存在、key 不重复、orderIndex 有效、dependsOnNodeIds 有效
- 节点类型：executionType、intentType 合法
- AgentTemplate：recommendedAgentTemplateId 存在
- Skill：allowedSkillIds 存在
- 项目边界：supportedProjectTypeId、supportedGoalTypeIds、supportedDeliverableModes 合法

**输出**：{ isValid, errors, warnings, normalizedSummary }

---

## 五、UI 发布流程说明

### 按钮

- **确认生成模板**：仅在草案校验通过（validationResult.isValid）时可用

### 弹窗流程

1. 点击「确认生成模板」→ 打开「发布流程模板」弹窗
2. 填写：模板名称（必填）、发布范围、模板说明（可选）
3. 发布范围：平台模板（system）或 租户模板（tenant）
   - 平台工作台：可选 system / tenant
   - 租户工作台：仅 tenant，且 tenantId 来自当前用户
4. 点击「确认发布」→ 调用 publishDraftAsTemplate → 刷新工作台

---

## 六、中文映射说明

| 映射 | 说明 |
|------|------|
| PUBLISH_SCOPE_TYPE_LABELS | system → 平台模板，tenant → 租户模板 |
| PUBLISH_SCOPE_TYPE_OPTIONS | 弹窗发布范围下拉选项 |
| 弹窗标题 | 发布流程模板 |
| 表单字段 | 模板名称、发布范围、模板说明 |
| 按钮 | 确认生成模板、确认发布、取消 |
| 错误提示 | 草案校验未通过、模板校验未通过、请输入模板名称等 |

---

## 七、WorkflowTemplatePublishRecord

| 字段 | 说明 |
|------|------|
| id | 记录 ID |
| planningSessionId | 规划会话 ID |
| planningDraftId | 草案 ID |
| draftVersion | 草案版本号 |
| templateId | 生成的模板 ID |
| scopeType | system / tenant |
| tenantId | 租户 ID（tenant 时） |
| publishedBy | 发布人 |
| publishedAt | 发布时间 |
