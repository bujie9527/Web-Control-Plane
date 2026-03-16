# AI Work Control Center — 收尾迭代开发规范 v1.0

本文档为 P0/P1/P2 收尾迭代的**开发计划、开发方案、文件骨架、开发规范、API 规范、函数命名**的权威依据，具体代码开发按此标准完成。

---

## 一、迭代总览

| 优先级 | 分组 | 内容 | 涉及文件数量 |
|---|---|---|---|
| P0-A | 菜单/Shell 重构 | MenuItem 增加分组支持，三个 Shell 菜单重新组织 | ~5 |
| P0-B | 终端类型工厂下线 | 删除 TerminalTypeFactory 模块，新建平台终端能力页 | 删7新5 |
| P0-C | Workflow 页面合并 | 消除重复实现，统一指向 Tenant 规范版本 | ~8 |
| P1-A | 节点执行服务 | 新建 server 侧节点执行器，打通 LLM→Terminal 链路 | 新增~4 |
| P1-B | 运行中心执行入口 | 运行详情页增加执行触发 UI | ~2 |
| P2-A | 身份库独立 | 菜单调整，Identity 脱离 Agent 中心 | ~1 |
| P2-B | 终端能力接入标准 | 新终端能力申请表单与能力注册规范 | ~3 |

---

## 二、P0-A：菜单/Shell 重构

### 2.1 MenuItem 类型扩展

- **文件：** `src/core/navigation/types.ts`（新建）
- **规范：** 统一 `MenuItem` 类型，增加 `isGroupLabel?: boolean`；`systemMenu.ts` / `platformMenu.ts` 改为从 `./types` 导入。

### 2.2 SystemShell 菜单新结构

- **文件：** `src/core/navigation/systemMenu.ts`
- 分组：AI 能力配置 | 流程资产 | 平台终端能力 | 运行监控
- 终端入口为「终端能力注册」`ROUTES.SYSTEM.PLATFORM_CAPABILITIES`，不再使用「终端类型工厂」。

### 2.3 PlatformShell 菜单

- **文件：** `src/core/navigation/platformMenu.ts`
- 仅保留：平台工作台、租户管理、平台用户、资源与配额、模板中心、平台审计、平台设置；**不包含** Agent/流程模板工厂链接。

### 2.4 TenantShell 菜单

- **文件：** `src/core/navigation/tenantMenu.ts`
- 流程中心合并为一级+二级（流程模板 / 流程规划 / 运行监控）；身份库独立为一级菜单；Agent 库、Skills 库、终端中心结构保持。

### 2.5 路由常量

- **文件：** `src/core/constants/routes.ts`
- 新增：`SYSTEM.PLATFORM_CAPABILITIES`、`SYSTEM.PLATFORM_CAPABILITIES_DETAIL(code)`。
- 废弃：`SYSTEM.TERMINAL_TYPES` 等（标注 @deprecated，路由可保留兼容）。

### 2.6 Layout 侧边栏

- **文件：** `src/components/Sidebar/Sidebar.tsx`、`Sidebar.module.css`
- `isGroupLabel === true` 的项渲染为分组标题（不可点击），样式：小字、浅色。

---

## 三、P0-B：平台终端能力（替代终端类型工厂）

### 3.1 设计原则

- 平台终端能力为**内置注册表**，仅展示与启用/停用，不提供新建/删除。
- 新能力接入通过 P2-B 的**标准申请表单**，不由本页 CRUD 创建。

### 3.2 Schema

- **文件：** `src/core/schemas/platformCapability.ts`
- 类型：`CapabilityProtocol`、`PlatformCapabilityStatus`、`CapabilityConfigField`、`PlatformCapability`、`PlatformCapabilityListParams`、`PlatformCapabilityUpdatePayload`。

### 3.3 Mock / Repository / Service

- **文件：** `src/modules/platform/mock/platformCapabilityMock.ts`、`repositories/platformCapabilityRepository.ts`、`services/platformCapabilityService.ts`
- 函数名：`mockGetCapabilities`、`mockGetCapabilityByCode`、`mockUpdateCapabilityStatus`；`fetchCapabilities`、`fetchCapabilityByCode`、`patchCapabilityStatus`；`getCapabilities`、`getCapabilityByCode`、`enableCapability`、`disableCapability`。

### 3.4 页面

- **文件：** `src/modules/platform/pages/PlatformCapabilities/PlatformCapabilityList.tsx`、`PlatformCapabilityDetail.tsx`、`PlatformCapabilities.module.css`
- 详情 Tab：`tabs/CapabilityInfoTab.tsx`、`ConnectedTerminalsTab.tsx`、`WorkflowIntegrationTab.tsx`。

### 3.5 服务端 API

- **文件：** `server/routes/platformCapabilityRoutes.ts`（或合并到现有 routes）
- `GET /api/platform-capabilities`、`GET /api/platform-capabilities/:code`、`PATCH /api/platform-capabilities/:id/status`。

### 3.6 待删除

- 整个目录：`src/modules/platform/pages/TerminalTypeFactory/`。

---

## 四、P0-C：合并重复 Workflow 页面

- 保留规范版：`TenantWorkflowPlanningList`、`TenantWorkflowPlanningWorkbench`、`TenantWorkflowPlanningNew`、`TenantWorkflowRuntimeList`、`TenantWorkflowRuntimeDetail`。
- System 路由指向上述 Tenant 版组件（加 System 权限 guard）。
- `WorkflowCenter.tsx` 改为重定向到 `ROUTES.TENANT.WORKFLOW_TEMPLATES`。
- 删除：重复的 `WorkflowPlanningList`、`SystemWorkflowPlanning*`、`SystemWorkflowRuntime*`、`WorkflowRuntimeList`、`WorkflowRuntimeDetail` 等（见规范文档「删除文件」清单）。

---

## 五、P1-A：节点执行服务

### 5.1 服务端

- **文件：** `server/domain/workflowNodeExecutor.ts`、`server/domain/nodePromptBuilder.ts`
- 主入口：`executeInstanceNode(instanceId, nodeId)`；内部分发：`dispatchNodeExecution`、`executeAgentNode`、`executePublishNode`、`requestHumanReview`、`writeExecutionLog`。
- **API：** `POST /api/workflow-instances/:instanceId/nodes/:nodeId/execute`、`GET /api/workflow-instances/:instanceId/nodes/:nodeId/status`。

### 5.2 前端

- **文件：** `src/modules/tenant/repositories/workflowNodeExecutionRepository.ts`、`services/workflowNodeExecutionService.ts`
- 函数：`triggerNodeExecution`、`fetchNodeStatus`、`executeNode`、`pollNodeUntilComplete`。

---

## 六、P1-B：运行中心执行入口

- **文件：** `src/modules/tenant/pages/WorkflowRuntime/TenantWorkflowRuntimeDetail.tsx`、`src/modules/tenant/hooks/useNodeExecution.ts`
- 节点操作：pending →「执行此节点」；running → 加载态；waiting_review →「标记通过」/「打回」；failed →「重试」。
- 展示：`resultSummary`、`workerOutputJson`、`errorSummary`；运行日志面板。

---

## 七、P2-A：身份库独立

- 仅菜单调整：`tenantMenu.ts` 中身份库为一级菜单，路径仍为 `ROUTES.TENANT.IDENTITIES`。

---

## 八、P2-B：新终端能力标准接入

- **文件：** `src/modules/platform/pages/PlatformCapabilities/NewCapabilityRequestForm.tsx`
- 表单字段：code、nameZh、description、protocolType、authType、supportedProjectTypeIds、supportedExecutionTypes、supportedIntentTypes、configFields、requestReason、documentUrl。
- **API：** `POST /api/platform-capabilities/requests`（可选，首版可仅前端表单+说明）。

---

## 九、API 规范

- 统一响应：`{ code, message, data, meta: { requestId, timestamp } }`。
- 错误码：4001 参数非法、4003 无权限、4004 资源不存在、5001 LLM 失败、5002 终端执行失败、5003 节点执行中。

---

## 十、函数命名规范

| 层级 | 前缀/风格 | 示例 |
|---|---|---|
| Repository | fetch/create/patch/remove | fetchCapabilities() |
| Service | 动词短语 | enableCapability(), executeNode() |
| Server Domain | 动词短语英文 | executeInstanceNode(), buildNodePrompt() |
| Mock | mock + 动词 | mockGetCapabilities() |
| Hook | use + 名词 | useNodeExecution() |

---

## 十一、开发约束

- 分层：page → service → repository → server API；domain 层不直接导入 route。
- 状态枚举：英文 snake_case，前台通过 labels 映射中文。
- 节点执行错误提示必须中文。
- PlatformCapability 仅 `status` 可改，无删除能力。

---

## 十二、完成标准（最小可运行验证）

1. 项目详情 → 流程任务 Tab → 创建 WorkflowInstance。
2. 运行监控 → 节点列表（pending）→ 点击「执行此节点」（内容生成）→ LLM 生成内容回显。
3. 点击「执行此节点」（发布节点）→ Facebook API 调用。
4. 运行日志中文展示；实例状态变为 completed。
