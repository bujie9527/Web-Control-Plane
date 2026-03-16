# 第九阶段输出：Tenant Workflow Template 1.0

## 一、新增页面

| 路径 | 页面 | 说明 |
|------|------|------|
| `/tenant/workflow-templates` | TenantWorkflowTemplateList | 租户流程模板列表（增强：项目类型、交付模式、更新时间、编辑入口） |
| `/tenant/workflow-templates/:id` | TenantWorkflowTemplateDetail | 租户模板详情（含来源信息） |
| `/tenant/workflow-templates/:id/edit` | TenantWorkflowTemplateEdit | 租户模板编辑（受限字段） |

## 二、新增 / 修改 Service

| Service | 路径 | 说明 |
|---------|------|------|
| tenantWorkflowTemplateService | `tenant/services/tenantWorkflowTemplateService.ts` | 租户模板专用：getTenantTemplateById、updateTenantTemplate、changeTenantTemplateStatus |
| workflowTemplateFactoryService | 复用 | listWorkflowTemplates、cloneWorkflowTemplateToTenant、getWorkflowTemplateById |
| workflowNodeBuilderService | 复用 | 节点 CRUD、排序（租户编辑页通过 tenantMode 受限调用） |

## 三、新增 / 修改 Mock 数据

| Mock | 说明 |
|------|------|
| workflowTemplateNodeMock | 新增 `cloneNodesToTemplate(sourceTemplateId, targetTemplateId)`，复制节点到新模板并映射 dependsOnNodeIds |
| workflowTemplateMock | 修改 `cloneWorkflowTemplateToTenant`：复制后调用 `cloneNodesToTemplate` 同步节点 |
| workflowTemplateMock | 冻结字段未改动，复制规则符合 25-tenant-workflow-template-rules |

## 四、租户模板复制流程说明

### 4.1 触发入口

租户在 `/tenant/workflow-templates` 列表中，对 **平台模板（scopeType=system）** 点击「复制为租户模板」。

### 4.2 复制规则

| 字段 | 值 |
|------|-----|
| scopeType | tenant |
| status | draft |
| version | 1 |
| sourceTemplateId | 源模板 id |
| sourceVersion | 源模板 version |
| tenantId | 当前租户 id |

### 4.3 同步复制内容

- **WorkflowTemplateNode**：完整复制所有节点，新建 node id，remap dependsOnNodeIds
- **nodeCount**：与源模板一致
- **recommendedAgentTemplateIds**：复制
- **recommendedSkillIds**：复制
- **allowedSkillIds**（节点级）：复制
- **supportedProjectTypeId / supportedGoalTypeIds / supportedDeliverableModes**：复制（禁止租户修改）

### 4.4 复制后

租户模板成为独立对象，可进行受限编辑。

## 五、权限控制说明

### 5.1 路由权限

- `/tenant/*`：需 `TenantOnlyGuard`，即 `consoleType === 'tenant'`
- 仅租户用户可访问租户流程模板相关页面

### 5.2 模板作用域

| scopeType | 可查看 | 可复制 | 可编辑 |
|-----------|--------|--------|--------|
| system | 是 | 是 | 否 |
| tenant | 仅本租户 | 否 | 仅本租户 |

### 5.3 编辑页校验

`TenantWorkflowTemplateEdit` 进入时校验：

- `detail.scopeType === 'tenant'`
- `detail.tenantId === 当前用户 tenantId`

不满足则提示「仅可编辑本租户的模板」并返回列表。

### 5.4 可编辑字段（租户）

| 层级 | 可编辑 | 禁止编辑 |
|------|--------|----------|
| 模板 | name, description, status(draft/active/archived) | supportedProjectTypeId, supportedGoalTypeIds, supportedDeliverableModes, sourceTemplateId |
| 节点 | 节点顺序、recommendedAgentTemplateId、allowedSkillIds、executorStrategy、reviewPolicy | key, name, description, executionType, intentType, dependsOnNodeIds, allowedAgentRoleTypes |

### 5.5 模板状态与项目创建

- 租户模板状态：`draft` | `active` | `archived`
- **只有 `active` 模板** 可在项目创建时被选择（`getRecommendedTemplates` 已按 `status: 'active'` 过滤）

## 六、WorkflowNodeBuilder tenantMode

`WorkflowNodeBuilder` 新增 `tenantMode`  prop：

- 隐藏：新增节点、删除节点
- 隐藏：key、description、executionType、intentType、dependsOnNodeIds、allowedAgentRoleTypes、inputMapping、outputMapping
- 显示：节点顺序（上移/下移）、recommendedAgentTemplateId、allowedSkillIds、executorStrategy、reviewPolicy
- allowedAgentRoleTypes 在 tenantMode 下为只读展示

## 七、技术约束遵守情况

- 使用 mock 数据
- 未修改第七阶段冻结的 WorkflowTemplate 字段
- 未修改 Node Builder 的 WorkflowTemplateNode 数据结构
- 符合 `.cursor/rules/25-tenant-workflow-template-rules.mdc`
