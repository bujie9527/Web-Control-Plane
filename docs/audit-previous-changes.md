# 此前修改代码审计报告

> 对「马上实际修复开发问题，完成开发目标」一轮中涉及修改的代码进行审计，结论与建议。

---

## 一、审计范围

- **组件层**：Table、EmptyState、StatusTag、Dialog、AgentTemplateSelector
- **平台层**：skillService、agentTemplateRepository、llmCredentialMock、workflowTemplateLabels、LLMConfigCenter 相关、WorkflowCenter/WorkflowTemplateDetail/NodeAgentBindingConfig
- **租户层**：TaskCenter、Step4Resources、Step7Confirm、analyticsService、AnalyticsPage、tenantSettingsMock/Service、SystemSettings、IdentityList、ProjectList、projectDetailMock、taskCenterMock、llmProviderConnectionTestService

---

## 二、已修复问题（审计中处理）

### 2.1 Dialog 未渲染确认/取消按钮（已修）

- **问题**：IdentityList、ProjectList 传入 `confirmText`、`onConfirm`、`onCancel`，但 Dialog 仅在有 `footer` 时渲染底部，导致弹窗内无「保存/取消」按钮。
- **处理**：Dialog 在未传 `footer` 且存在 `confirmText` 或 `onConfirm` 时，自动渲染默认底部（取消 + 确认），并增加 `.cancelBtn` / `.confirmBtn` 样式；确认按钮仅调用 `onConfirm`，由调用方在回调内自行关闭弹窗。

---

## 三、结论：无问题的修改

| 修改点 | 结论 |
|--------|------|
| **Table** | `T extends object`、`title: string \| React.ReactNode`、`(record as Record<string, unknown>)[col.key]` 使用正确，与现有调用兼容。 |
| **EmptyState** | 新增 `action?: React.ReactNode` 与样式，列表页空状态可展示「新建」等操作，符合 rule-64。 |
| **StatusTag** | 新增 `status?: string` 及 statusToType 映射，与 LLMConfigCenter/SystemSettings 等使用方式一致。 |
| **skillService.deleteSkill** | 返回类型增加 `messageZh?`，删除被引用时前端可展示中文提示，符合规则。 |
| **agentTemplateRepository** | `getTemplateById` 改为 `getWorkflowTemplateById` 避免重名，引用检查用同步 map 取模板名称，逻辑正确。 |
| **llmCredentialMock** | `getLLMCredentialById` 解构去掉 `encryptedSecret`；create/update 按 schema 写 `secretMasked` 与返回类型，符合「前台不返密钥」约定。 |
| **AgentTemplateSelector / workflowTemplateLabels / NodeAgentBindingConfig** | 补充 `supervisor: '执行监督'`，与 schema 中 AgentTemplateRoleType 一致。 |
| **WorkflowCenter / WorkflowTemplateDetail** | 状态映射补充 `archived`、`deprecated`，与 WorkflowTemplateStatus 一致。 |
| **IdentityList / ProjectList** | Dialog 增加 `open`、`onClose`，类型与用法正确；配合上述 Dialog 默认 footer 后交互完整。 |
| **projectDetailMock** | `feeds` 使用 `as ResultFeedItem[]` 与 ResultFeedItem 中 `identityId?` 一致，避免 concat 类型错误。 |
| **llmProviderConnectionTestService** | `getCredentialById` 改为 `await`，与异步接口一致。 |
| **taskCenterMock** | `getTaskCenterData(_tenantId)`、新增异常/已完成示例任务，与 TaskCenter 四块列表一致。 |
| **TaskCenter 页** | 异常任务、已完成任务分卡展示，loading/空状态与运行中、待审核一致，符合 rule。 |
| **Step4Resources** | 使用 `getTerminalList(tenantId)` 异步加载终端，初始空列表后展示真实数据，符合「Step4 从 terminalService 获取」目标。 |
| **Step7Confirm** | 使用 `getTerminalList` 解析终端名称，依赖 `tenantId` 与 `form.terminalIds.length`，展示正确。 |
| **analyticsService** | 使用 `getTaskCenterData`、`getProjectList` 聚合，按 `tenantId` 过滤项目，overview/projectStats 计算正确。 |
| **AnalyticsPage** | 使用 `getAnalyticsData(tenantId)`、loading 状态，`.finally(() => setLoading(false))` 在成功/失败都会执行，loading 不会卡死。 |
| **tenantSettingsMock/Service、SystemSettings** | Mock 按 tenantId 预留扩展；页面三块数据并行加载、loading 与空数据展示正确。 |

---

## 四、建议与风险点（未改代码）

### 4.1 类型与运行时

- **Table / EmptyState 中 React 类型**：当前使用 `React.ReactNode` 且 Table 已移除 `import React`。若项目未全局注入 `React` 类型，建议改为 `import type { ReactNode } from 'react'` 并使用 `ReactNode`，避免潜在 TS 报错。
- **Dialog 默认 footer 与 onConfirm**：确认按钮仅调用 `onConfirm()`，不自动调用 `onClose()`，关闭由 IdentityList/ProjectList 在 handleSave 内 `setDialogOpen(false)` 完成，逻辑正确；若未来有页面依赖「确认后自动关」，需在 onConfirm 中显式调用 onClose。

### 4.2 健壮性与体验

- **AnalyticsPage / SystemSettings / Step4Resources**：请求失败时仅通过 `.finally` 结束 loading，未设置错误状态或 Toast，建议后续增加 `.catch` 与错误提示（如 Toast 或内联错误文案）。
- **Step4Resources 终端加载**：首次进入 Step4 时终端列表为空，加载完成后才展示，属预期；若需可加简短 loading 提示（如「加载终端列表中…」）。

### 4.3 架构与规范

- **analyticsService 项目过滤**：`getProjectList` 未传 tenantId，在 service 内用 `projectRes.items.filter(p => p.tenantId === tenantId)` 过滤，符合当前 repo 未按租户过滤的 mock 设计；后端接入后若 list 按租户过滤，此处过滤可保留为双保险或移除。
- **tenantSettingsMock**：成员/角色/审计目前未按 `_tenantId` 分租户，仅预留参数，与当前单租户 mock 一致；多租户数据时需在 mock 内按 tenantId 过滤。

---

## 五、与规范一致性

- **规则 27（中文展示）**：本次涉及文案均为中文（按钮、空状态、状态标签、错误提示 messageZh 等），符合。
- **规则 64/65（列表与详情工作台）**：Table/EmptyState/StatusTag 的增强与列表/详情使用方式一致，未破坏现有清单要求。
- **规则 58/62（凭证与密钥）**：llmCredentialMock 未向前台返回明文密钥，符合。
- **分层**：Analytics、SystemSettings、TaskCenter、Step4/Step7 均通过 service 取数，页面未直连 mock，符合 page → service → repository 分层。

---

## 六、审计结论

- **已修复**：Dialog 在仅有 confirmText/onConfirm 时无底部按钮的问题，已通过默认 footer 与样式补齐。
- **其余修改**：逻辑正确、类型与现有用法兼容、符合既定规范；未发现需要回滚或必须立即修复的缺陷。
- **建议**：在后续迭代中补充错误态与加载态提示（Analytics/SystemSettings/Step4），以及 Table/EmptyState 的 React 类型导入方式统一（若 TS 报错再改即可）。
