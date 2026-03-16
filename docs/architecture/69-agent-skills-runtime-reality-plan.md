# Agent / Skills / Runtime 数据真实化开发规划

> 目标：删除虚假 mock，接入真实 Prisma / API，使系统完全真实可用。  
> 本文档仅提供规划、骨架、函数名、流程与标准，不写完整实现，后续由 Cursor Tab 补全。

---

## 一、总体规划

| 阶段 | 内容 | 涉及文件 |
|------|------|----------|
| **Phase A** | serverStore 改为从 Prisma 读取 Provider/Binding | `server/llm/serverStore.ts` → 新建 `server/llm/serverStoreDb.ts` |
| **Phase B** | 前端 Agent/Skills 彻底移除 mock 引用 | 替换所有 `agentTemplateMock` / `skillMock` / `planningSkillsMock` 为 repository |
| **Phase C** | Worker/Runtime 写入层改为真实 API | `workerAgentExecutionService` / `workflowSupervisorService` / `workflowSupervisorRecoveryService` 等 |
| **Phase D** | 删除或废弃 mock 文件 | 删除/标记废弃 `agentTemplateMock`、`skillMock`、`planningSkillsMock`、`workflowInstanceMock` 等 |
| **Phase E** | WorkflowInstanceNode 表扩展（可选） | Prisma migration 增加 `resultSummary`、`workerOutputJson` 等字段 |

---

## 二、Phase A：serverStore 改为从 Prisma 读取

### 2.1 目标

`llmResolverService` 当前依赖 `serverStore` 的硬编码常量。需改为从 `llmConfigDb` 异步读取 Provider、ModelConfig、AgentLLMBinding，使前端配置中心的修改能影响服务端 LLM 解析。

### 2.2 调用链

```
llmResolverService.resolveModelConfigByAgent(agentTemplateId)
  → getPrimaryBindingByAgent(agentTemplateId)   // 当前：内存常量
  → resolveByModelConfigId(modelConfigId)
    → getModelConfigById(modelConfigId)        // 当前：内存常量
    → getProviderById(providerId)              // 当前：内存常量
    → getCredentialSecret(credentialId)        // 已真实（credentialStore）
```

目标：上述 `getPrimaryBindingByAgent`、`getModelConfigById`、`getProviderById` 改为调用 `llmConfigDb`。

### 2.3 骨架与函数名

**新建文件：`server/llm/serverStoreDb.ts`**

```ts
/**
 * 服务端 LLM 数据（从 Prisma 读取，替代 serverStore 硬编码）
 */

// 类型定义：与 serverStore 一致，便于 llmResolverService 无感切换
export interface ServerProvider { ... }
export interface ServerModelConfig { ... }
export interface ServerBinding { ... }

/** 从 DB 获取 Provider（按 id） */
export async function getProviderByIdFromDb(id: string): Promise<ServerProvider | null>

/** 从 DB 获取 ModelConfig（按 id） */
export async function getModelConfigByIdFromDb(id: string): Promise<ServerModelConfig | null>

/** 从 DB 获取 Agent 的主模型绑定（primary + isEnabled） */
export async function getPrimaryBindingByAgentFromDb(agentTemplateId: string): Promise<ServerBinding | null>
```

**修改文件：`server/llm/serverStore.ts`**

```ts
// 保留 getCredentialSecret 导出
// 删除 providers / modelConfigs / bindings 常量
// 删除 getProviderById / getModelConfigById / getPrimaryBindingByAgent

// 改为 re-export serverStoreDb 的异步版本（或直接让 llmResolverService 改用 serverStoreDb）
```

**修改文件：`server/llm/llmResolverService.ts`**

```ts
// resolveModelConfigByAgent、resolveByModelConfigId 改为 async
// 调用 getPrimaryBindingByAgentFromDb、getModelConfigByIdFromDb、getProviderByIdFromDb
// 保持返回结构 ResolvedConfig | ResolveError 不变
```

**修改文件：`server/llm/llmExecutorServer.ts`**

```ts
// executeLLMServer 内部调用 llmResolverService 处，确保 await resolveModelConfigByAgent / resolveByModelConfigId
```

**修改文件：`server/llm/testProviderServer.ts`**

```ts
// testProviderConnection 内部获取 Provider 时，改为 await getProviderByIdFromDb(providerId)
```

### 2.4 数据映射标准

- `llmConfigDb.dbGetProviderById` 返回形状 → 映射为 `ServerProvider`（id, name, nameZh, providerType, baseUrl, credentialId, status）
- `llmConfigDb.dbGetModelConfigById` → `ServerModelConfig`（含 temperature, maxTokens, timeoutMs, retryCount, structuredOutputMode）
- `llmConfigDb.dbListBindings(agentTemplateId)` 过滤 `bindingType === 'primary'` 且 `isEnabled === true`，取首条 → `ServerBinding`

### 2.5 降级策略（可选）

若 Prisma 未就绪或 `llmConfigDb` 返回空，可保留一套硬编码 fallback，通过环境变量 `USE_LLM_CONFIG_DB=true` 切换。首版建议直接切 DB，不保留 fallback。

---

## 三、Phase B：前端 Agent/Skills 移除 mock 引用

### 3.1 需要替换的引用

| 当前引用 | 替换为 |
|----------|--------|
| `agentTemplateMock.getTemplateById` | `agentTemplateRepository.getTemplateById`（已存在，调 `/api/agent-templates/:id`） |
| `agentTemplateMock.listTemplates` | `agentTemplateRepository.listTemplates`（已存在） |
| `getTemplateById` from `@/modules/platform/mock/agentTemplateMock` | `agentTemplateService.getTemplateById` 或 `agentTemplateRepository.getTemplateById` |
| `listPlanningSkills` from `planningSkillsMock` | 新建 `planningSkillService.listPlanningSkills()` → 调 `skillRepository.listSkills` 过滤 category=planning |
| `getTemplateById` from `workflowTemplateNodeMock`（引用检查用） | 新建或复用 `workflowTemplateRepository.getTemplateById`，若有 API 则调真实 API |

### 3.2 骨架与函数名

**修改文件：`src/modules/tenant/services/workflowTemplateValidator.ts`**

```ts
// 删除：import { getTemplateById } from '@/modules/platform/mock/agentTemplateMock'
// 新增：import { getTemplateById } from '@/modules/platform/services/agentTemplateService'
// 注意：getTemplateById 为 async，需 await，原有同步调用处改为 async 链
```

**新建/修改：`src/modules/platform/services/planningSkillService.ts`**

```ts
/**
 * 规划用 Skill 列表（从真实 API 获取，按 category=planning 过滤）
 */
export async function listPlanningSkills(): Promise<Skill[]>
// 内部：skillRepository.listSkills({ category: 'planning', pageSize: 100 }) → 返回 items
```

**修改文件：`src/modules/tenant/services/workflowPlanningValidator.ts`**

```ts
// 删除：import { listPlanningSkills } from '../mock/planningSkillsMock'
// 新增：import { listPlanningSkills } from '@/modules/platform/services/planningSkillService'
// 若 listPlanningSkills 改为 async，调用处加 await
```

**修改文件：`src/modules/platform/repositories/agentTemplateRepository.ts`**

```ts
// 删除：import { getTemplateNodesReferencingAgent } from '@/modules/tenant/mock/workflowTemplateNodeMock'
// 新增：调用真实 API 或新建 workflowTemplateRepository.fetchNodesByTemplateId(templateId)，过滤 recommendedAgentTemplateId
// 或：保留 getTemplateNodesReferencingAgent 但改为从 workflowTemplateRepository + 过滤逻辑实现
```

**修改文件：`src/modules/platform/services/agentTemplateService.ts`（getTemplateNodesReferencingAgent 等）**

```ts
// getTemplateReferences：workflowTemplateNodes 改为从 workflowTemplateRepository 取节点列表再过滤
// 具体：若有 GET /api/workflow-templates/:id/nodes，则调之；否则需后端新增或从规划 drafts 取
```

### 3.3 流程标准

1. 所有「获取 Agent 模板」统一走 `agentTemplateService` 或 `agentTemplateRepository`，不再 import `agentTemplateMock`。
2. 所有「获取 Skill 列表」统一走 `skillService` 或 `skillRepository`；规划专用用 `planningSkillService.listPlanningSkills`。
3. 引用检查（如 Agent 被哪些模板节点引用）需有对应后端 API 或从前端已有 workflow template 数据中计算，不得继续依赖 mock 内存数据。

---

## 四、Phase C：Worker/Runtime 写入层改为真实 API

### 4.1 目标

`workerAgentExecutionService`、`workflowSupervisorService`、`workflowSupervisorRecoveryService`、`workflowExecutionService` 当前使用：

- `workflowInstanceMock`：getInstanceById, updateInstanceCurrentNode
- `workflowInstanceNodeMock`：getNodesByInstanceId, getInstanceNodeById, updateNodeStatus, updateNodeWorkerResult
- `workflowRuntimeLogMock`：appendRuntimeLog
- `workflowTemplateNodeMock`：getNodesByTemplateId

全部改为调用对应 repository → 真实 API。

### 4.2 后端 API 现状与缺口

| 能力 | 后端 API | 现状 |
|------|----------|------|
| 获取实例 | GET /api/workflow-instances/:id | 已有 |
| 获取实例节点 | GET /api/workflow-instances/:id/nodes | 已有 |
| 更新节点 | PUT /api/workflow-instance-nodes/:id | 已有，当前仅支持 status |
| 追加日志 | POST /api/workflow-instances/:id/runtime-logs | 已有 |
| 获取模板节点 | GET /api/workflow-templates/:id/nodes 或等价 | 需确认 |

**Prisma WorkflowInstanceNode 字段现状**：仅有 id, instanceId, templateNodeId, key, name, status, orderIndex, createdAt, updatedAt。  
**Worker 写入需求**：resultSummary, workerOutputJson, errorSummary, reviewSummary, retryCount, workerExecutionModel 等。

→ 需 Phase E 先做迁移扩展字段，或后端将扩展字段存入 meta JSON 列（若有）。

### 4.3 骨架与函数名

**修改文件：`src/modules/tenant/repositories/workflowInstanceRepository.ts`**

```ts
// 已有：fetchInstanceById, fetchInstanceList, updateInstance
// 确保 updateInstance 支持 status 等字段
```

**修改文件：`src/modules/tenant/repositories/workflowInstanceNodeRepository.ts`**

```ts
// 已有：fetchNodesByInstanceId, updateNode(payload: { status?: string })
// 新增：updateNode 支持扩展 payload
//   updateNode(nodeId, payload: {
//     status?: string
//     resultSummary?: string
//     workerOutputJson?: Record<string, unknown>
//     errorSummary?: string
//     reviewSummary?: string
//     retryCount?: number
//     workerExecutionModel?: string
//     workerExecutionDurationMs?: number
//     workerExecutionAgentId?: string
//     ... 其他 Worker 写入字段
//   })
```

**修改文件：`server/domain/workflowInstanceDb.ts`**

```ts
// dbUpdateInstanceNode：扩展 data 字段，支持 resultSummary、workerOutputJson 等
// 若 Prisma 无此列，需先 migration 增加；或使用 configJson 等 JSON 列存储
```

**已有：`src/modules/tenant/repositories/workflowTemplateNodeRepository.ts`**

```ts
// fetchNodesByTemplateId(templateId: string) 已存在，对应 GET /api/workflow-templates/:id/nodes
// workerAgentExecutionService 直接改用此 repository 替代 workflowTemplateNodeMock.getNodesByTemplateId
```

**修改文件：`src/modules/tenant/services/workerAgentExecutionService.ts`**

```ts
// 删除：import from workflowInstanceMock, workflowInstanceNodeMock, workflowRuntimeLogMock, workflowTemplateNodeMock
// 新增：import from workflowInstanceRepository, workflowInstanceNodeRepository, workflowRuntimeLogRepository, workflowTemplateNodeRepository

// executeWorkerNode 流程：
//   1. instance = await workflowInstanceRepo.fetchInstanceById(instanceId)
//   2. nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(instanceId)
//   3. templateNodesRes = await workflowTemplateNodeRepo.fetchNodesByTemplateId(templateId)
//   4. ... 执行 LLM ...
//   5. await workflowInstanceNodeRepo.updateNode(nodeId, { status, resultSummary, workerOutputJson, ... })
//   6. await workflowRuntimeLogRepo.appendRuntimeLog(instanceId, { eventType, messageZh, nodeId })
```

**修改文件：`src/modules/tenant/services/workflowSupervisorService.ts`**

```ts
// 同上，所有 getInstanceById / getNodesByInstanceId / appendRuntimeLog 改为 repository 调用
// 涉及：analyzeWorkflowInstance, applySupervisorDecision, dismissSupervisorDecision 等
```

**修改文件：`src/modules/tenant/services/workflowSupervisorRecoveryService.ts`**

```ts
// 同上
```

**修改文件：`src/modules/tenant/services/workflowExecutionService.ts`**

```ts
// 同上，替换 mock 为 repository
```

### 4.4 流程标准

1. 所有 Instance/Node 读操作：统一 `workflowInstanceRepository` / `workflowInstanceNodeRepository`。
2. 所有 Node 写操作：`workflowInstanceNodeRepository.updateNode`，payload 与后端 API 约定一致。
3. 所有 Runtime Log 写操作：`workflowRuntimeLogRepository.appendRuntimeLog`。
4. 模板节点读取：`workflowTemplateNodeRepository.fetchNodesByTemplateId` 或等价 API。
5. 若后端 API 不支持某字段，先在 server/domain 扩展实现，再补充前端 repository 与 service。

---

## 五、Phase D：删除或废弃 mock 文件

### 5.1 待处理 mock 文件清单

| 文件 | 处理方式 | 前提 |
|------|----------|------|
| `src/modules/platform/mock/agentTemplateMock.ts` | 删除 | Phase B 完成，无引用 |
| `src/modules/tenant/mock/skillMock.ts` | 删除 | Phase B 完成，无引用 |
| `src/modules/tenant/mock/planningSkillsMock.ts` | 删除 | Phase B 完成，planningSkillService 替代 |
| `src/modules/tenant/mock/workflowInstanceMock.ts` | 删除 | Phase C 完成，无引用 |
| `src/modules/tenant/mock/workflowInstanceNodeMock.ts` | 删除 | Phase C 完成，无引用 |
| `src/modules/tenant/mock/workflowRuntimeLogMock.ts` | 删除 | Phase C 完成，无引用 |
| `src/modules/tenant/mock/workflowSupervisorDecisionMock.ts` | 删除 | Phase C 完成，无引用 |
| `src/modules/tenant/mock/workflowTemplateNodeMock.ts` | 删除或保留 | 若 workflowTemplateNode 有真实 API 则删除；若无，暂保留但仅用于未接入真实 API 的边角路径 |

### 5.2 废弃标准

1. 全局搜索 `agentTemplateMock`、`skillMock`、`planningSkillsMock`、`workflowInstanceMock`、`workflowInstanceNodeMock`、`workflowRuntimeLogMock`，确保 0 引用。
2. 删除前运行 `npm run typecheck`、`npm run lint`，保证无报错。
3. 若某 mock 仍被部分模块引用（如测试），可先改为空实现 + `@deprecated` 注释，待测试迁移后再删。

---

## 六、Phase E：WorkflowInstanceNode 表扩展（可选）

### 6.1 目标

Prisma WorkflowInstanceNode 当前无 Worker 执行结果字段，需扩展以支持持久化。

### 6.2 迁移骨架

**修改文件：`prisma/schema.prisma`**

```prisma
model WorkflowInstanceNode {
  id             String   @id @default(cuid())
  instanceId     String
  templateNodeId String?
  key            String
  name           String
  status         String
  orderIndex     Int
  // 新增：Worker 执行结果
  resultSummary       String?
  workerOutputJson    String?   // JSON string
  errorSummary       String?
  reviewSummary      String?
  retryCount         Int       @default(0)
  workerExecutionModel      String?
  workerExecutionDurationMs Int?
  workerExecutionAgentId    String?
  selectedAgentTemplateId   String?
  recoveryStatus            String?
  lastRecoveryAction        String?
  dependsOnNodeIds          String?  // JSON array，若需
  createdAt      String
  updatedAt      String

  instance WorkflowInstance @relation(...)
}
```

**命令：**

```bash
npx prisma migrate dev --name add_workflow_instance_node_worker_fields
```

**修改文件：`server/domain/workflowInstanceDb.ts`**

```ts
// rowToInstanceNode：增加 resultSummary、workerOutputJson、errorSummary、reviewSummary 等映射
// dbUpdateInstanceNode：支持更新上述字段
```

---

## 七、实施顺序建议

1. **Phase E**（若需要）：先做 Prisma migration，否则 Worker 写入无字段可落库。
2. **Phase A**：serverStore 切 DB，保证 LLM 解析使用配置中心数据。
3. **Phase C**：Worker/Runtime 写入切真实 API，保证执行结果持久化。
4. **Phase B**：替换 Agent/Skills mock 引用，保证规划/校验使用真实数据。
5. **Phase D**：删除 mock 文件，收尾。

---

## 八、验收标准

- [ ] `llmResolverService` 不再依赖 `serverStore` 硬编码，改从 `llmConfigDb` 读取。
- [ ] 前端模型配置中心修改 Provider/Binding 后，服务端 LLM 执行能反映最新配置。
- [ ] `workerAgentExecutionService` 执行完成后，刷新页面能看见持久化的节点结果与日志。
- [ ] 无文件 import `agentTemplateMock`、`skillMock`、`planningSkillsMock`、`workflowInstanceMock`、`workflowInstanceNodeMock`、`workflowRuntimeLogMock`。
- [ ] `npm run typecheck`、`npm run lint` 通过。
- [ ] 规划工作台、流程工厂、运行中心主流程可端到端跑通（含真实 LLM 调用与持久化）。
