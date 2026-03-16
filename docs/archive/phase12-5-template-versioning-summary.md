# Phase 12.5：Template Versioning Baseline 开发完成说明

## 一、新增和修改的文件列表

### 修改文件

| 文件 | 说明 |
|------|------|
| `src/modules/tenant/schemas/workflowExecution.ts` | WorkflowTemplate 新增 versionGroupId、previousVersionTemplateId、rootTemplateId |
| `src/modules/tenant/schemas/workflowTemplatePublishRecord.ts` | 新增 versionGroupId、templateVersion、previousVersionTemplateId、rootTemplateId、changeSummary |
| `src/modules/tenant/mock/workflowTemplateMock.ts` | 支持版本字段、nextVersionGroupId、getTemplatesByVersionGroupId |
| `src/modules/tenant/mock/workflowTemplatePublishRecordMock.ts` | createPublishRecord 支持版本字段 |
| `src/modules/tenant/services/workflowTemplatePublishService.ts` | 首次发布版本化逻辑、PublishNewVersionParams 预留 |
| `src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryDetail.tsx` | 新增版本信息区块、非最新版本提示 |
| `src/modules/tenant/pages/WorkflowTemplates/TenantWorkflowTemplateDetail.tsx` | 同上 |
| `src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactory.module.css` | 新增 versionHint 样式 |
| `src/core/labels/planningDisplayLabels.ts` | 新增 TEMPLATE_VERSION_FIELD_LABELS |

### 新增文件

| 文件 | 说明 |
|------|------|
| `docs/phase12-5-template-versioning-summary.md` | 本说明文档 |

---

## 二、WorkflowTemplate 版本字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| version | number | 模板版本号 |
| isLatest | boolean | 是否为该版本组最新版本 |
| versionGroupId | string? | 版本组 ID，同组模板共享 |
| previousVersionTemplateId | string? | 上一版本模板 ID |
| rootTemplateId | string? | 根模板 ID（版本组首个模板） |
| sourcePlanningSessionId | string? | 来源规划会话 ID |
| sourcePlanningDraftId | string? | 来源草案 ID |
| sourceDraftVersion | number? | 来源草案版本号 |

---

## 三、PublishRecord 版本字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| versionGroupId | string? | 版本组 ID |
| templateVersion | number? | 发布的模板版本号 |
| previousVersionTemplateId | string? | 上一版本模板 ID |
| rootTemplateId | string? | 根模板 ID |
| changeSummary | string? | 变更摘要（可选） |

---

## 四、发布逻辑的版本化说明

### 1. 首次发布（当前已实现）

- version = 1
- isLatest = true
- versionGroupId = 新建（nextVersionGroupId）
- rootTemplateId = 当前模板 id
- previousVersionTemplateId = undefined

### 2. 基于已有模板发布新版本（预留）

- version = 上一版本 + 1
- previousVersionTemplateId = 上一版本模板 id
- versionGroupId = 继承上一版本
- rootTemplateId = 继承根模板
- 旧版本 isLatest = false
- 新版本 isLatest = true

预留结构：`PublishNewVersionParams` 接口、`publishNewVersionFromDraft` 占位（未实现）

---

## 五、详情页版本信息展示说明

### 版本信息区块

展示字段（均中文）：

- 当前版本：v{version}
- 是否最新：是 / 否
- 上一版本：previousVersionTemplateId 或 —
- 版本组：versionGroupId 或 —
- 来源草案：sourcePlanningDraftId 或 —
- 来源会话：sourcePlanningSessionId 或 —

### 非最新版本提示

当 isLatest = false 时，在版本信息上方显示：

> 当前模板不是最新版本，建议查看或切换到最新版本以获取最新功能与修复。

---

## 六、当前已预留但尚未实现的能力

| 能力 | 状态 |
|------|------|
| 基于已有模板发布新版本 | 预留 PublishNewVersionParams，未实现 publishNewVersionFromDraft |
| 版本 diff 页面 | 未实现 |
| 模板回滚 | 未实现 |
| 平台模板升级通知 | 未实现 |
| 按版本组跳转到最新版本 | 未实现（仅展示版本组 ID） |
