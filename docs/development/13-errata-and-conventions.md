# 13 — 勘误、统一规范与补充定义

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 目的：修复文档 00-12 中发现的不一致问题，补充代码生成所需的权威清单和缺失定义

---

## 一、文档编号勘误

文档 03（Skill 执行引擎）是后插入序列的，导致文档 00 阶段表格和文档 02 交叉引用中所有 ≥04 的编号偏移了 -1。

**已修正**：文档 00 和 02 中的引用编号已更新为正确值。

---

## 二、Agent 模板权威清单

所有 Agent 模板的 ID、名称、分类在此统一定义。**后续开发以此表为准**，各文档中的不一致引用以本表覆盖。

### 2.1 已有 Agent（12 个，已在种子数据中）

| ID | code | nameZh | roleType | category |
|----|------|--------|----------|----------|
| at-base-content-creator | base-content-creator | 内容生成 Agent | creator | execution |
| at-base-reviewer | base-reviewer | 基础审核 Agent | reviewer | execution |
| at-facebook-content-creator | facebook-content-creator | Facebook 内容生成 Agent | creator | execution |
| at-content-reviewer | content-reviewer | 内容审核 Agent | reviewer | execution |
| at-publisher | publisher | 发布 Agent | publisher | execution |
| at-workflow-planner | workflow-planner | 基础流程规划助手 | planner | planning |
| at-social-workflow-planner | social-workflow-planner | 社媒运营流程规划助手 | planner | planning |
| at-website-workflow-planner | website-workflow-planner | 建站流程规划助手 | planner | planning |
| at-ai-employee-workflow-planner | ai-employee-workflow-planner | AI 员工流程规划助手 | planner | planning |
| at-performance-recorder | performance-recorder | 结果记录 Agent | recorder | execution |
| at-research-agent | research-agent | 数据采集 Agent | researcher | execution |
| at-execution-supervisor | execution-supervisor | 执行监督助手 | supervisor | coordination |

> **修正**：`at-research-search`（旧 ID）→ `at-research-agent`（统一 ID），`roleType: other` → `researcher`

### 2.2 计划新增 Agent（3 个）

| ID | code | nameZh | roleType | category | 定义文档 |
|----|------|--------|----------|----------|---------|
| at-interaction | interaction-agent | 互动对话 Agent | responder | execution | 05 |
| at-community-manager | community-manager | 社群管理 Agent | manager | coordination | 06 |
| at-config-agent | config-agent | 配置助手 | configurator | coordination | 07 |

> **修正**：`at-config-assistant`（旧 ID，文档 03）→ `at-config-agent`（统一 ID，文档 07）

### 2.3 roleType 中文映射（需同步更新 labels.ts）

| roleType | 中文 | 已有/新增 |
|----------|------|----------|
| creator | 创作者 | 已有 |
| reviewer | 审核者 | 已有 |
| publisher | 发布者 | 已有 |
| planner | 规划者 | 已有 |
| recorder | 记录者 | 已有 |
| supervisor | 监督者 | 已有 |
| researcher | 采集者 | **新增** |
| responder | 响应者 | **新增** |
| manager | 管理者 | **新增** |
| configurator | 配置者 | **新增** |

---

## 三、Skill 权威注册表

所有 Skill 的 ID、Code、名称、执行类型在此统一定义。**后续开发以此表为准**。

### 3.1 已有 Skill（16 个）

| ID | Code | nameZh | category | executionType |
|----|------|--------|----------|--------------|
| skill-content-write | CONTENT_WRITE | 内容创作 | content | llm |
| skill-content-review | CONTENT_REVIEW | 内容审核 | review | llm |
| skill-compliance-check | COMPLIANCE_CHECK | 合规检查 | review | llm |
| skill-publish | PUBLISH_CONTENT | 内容发布 | publish | external_api |
| skill-schedule | SCHEDULE_PUBLISH | 计划发布 | publish | external_api |
| skill-data-fetch | DATA_FETCH | 数据获取 | analytics | external_api |
| skill-metrics-write | METRICS_WRITE | 指标写入 | analytics | llm |
| skill-keyword-research | KEYWORD_RESEARCH | 关键词研究 | research | hybrid |
| skill-parse-sop | PARSE_SOP | SOP 解析 | planning | llm |
| skill-generate-draft | GENERATE_DRAFT | 生成流程草案 | planning | llm |
| skill-revise-draft | REVISE_DRAFT | 修订流程草案 | planning | llm |
| skill-summarize-changes | SUMMARIZE_CHANGES | 变更摘要 | planning | llm |
| skill-suggest-agent-bindings | SUGGEST_AGENT_BINDINGS | 建议 Agent 绑定 | planning | llm |
| skill-image-gen | IMAGE_GEN | 图像生成 | content | llm |
| skill-brand-check | BRAND_CHECK | 品牌调性检查 | review | llm |
| skill-fb-optimize | FB_OPTIMIZE | Facebook 优化 | publish | external_api |

> **修正**：已有 Skill 的 `executionType` 中 `tool` 统一迁移为 `external_api`（见第六节迁移方案）。

### 3.2 新增 Skill — Research Agent（文档 08）

| ID | Code | nameZh | executionType | Provider |
|----|------|--------|--------------|---------|
| skill-search-web | SEARCH_WEB | Web 搜索 | external_api | tavily |
| skill-monitor-social | MONITOR_SOCIAL | 社媒监控 | external_api | apify |
| skill-extract-article | EXTRACT_ARTICLE | 内容提取 | external_api | jina |
| skill-subscribe-rss | SUBSCRIBE_RSS | RSS 订阅 | external_api | rss |
| skill-summarize-research | SUMMARIZE_RESEARCH | 素材汇总 | llm | — |
| skill-compose-research-pack | COMPOSE_RESEARCH_PACK | 素材包组装 | llm | — |

### 3.3 新增 Skill — Interaction Agent（文档 05）

| ID | Code | nameZh | executionType |
|----|------|--------|--------------|
| skill-classify-intent | CLASSIFY_INTENT | 意图分类 | llm |
| skill-generate-reply | GENERATE_REPLY | 上下文回复 | llm |

### 3.4 新增 Skill — Community Manager Agent（文档 06）

| ID | Code | nameZh | executionType |
|----|------|--------|--------------|
| skill-welcome-member | WELCOME_MEMBER | 新人欢迎 | hybrid |
| skill-farewell-member | FAREWELL_MEMBER | 成员告别 | external_api |
| skill-create-poll | CREATE_POLL | 创建投票 | external_api |
| skill-pin-message | PIN_MESSAGE | 置顶消息 | external_api |
| skill-delete-message | DELETE_MESSAGE | 删除消息 | external_api |
| skill-generate-topic-prompt | GENERATE_TOPIC_PROMPT | 话题引导 | hybrid |
| skill-community-stats | COMMUNITY_STATS | 社群统计 | internal_api |

### 3.5 新增 Skill — Config Agent（文档 07）

| ID | Code | nameZh | executionType |
|----|------|--------|--------------|
| skill-parse-config-intent | PARSE_CONFIG_INTENT | 配置意图解析 | llm |
| skill-suggest-datasources | SUGGEST_DATASOURCES | 数据源推荐 | hybrid |
| skill-create-datasource-terminal | CREATE_DATASOURCE_TERMINAL | 创建数据源终端 | internal_api |
| skill-create-publish-terminal | CREATE_PUBLISH_TERMINAL | 创建发布终端 | internal_api |
| skill-configure-project-agent | CONFIGURE_PROJECT_AGENT | 配置项目 Agent | internal_api |
| skill-test-terminal-connection | TEST_TERMINAL_CONNECTION | 测试终端连接 | internal_api |
| skill-list-available-resources | LIST_AVAILABLE_RESOURCES | 查询可用资源 | internal_api |

### 3.6 新增 Skill — 发布（文档 02）

| ID | Code | nameZh | executionType |
|----|------|--------|--------------|
| skill-send-telegram-msg | SEND_TELEGRAM_MSG | 发送 Telegram 消息 | external_api |
| skill-send-telegram-reply | SEND_TELEGRAM_REPLY | 回复 Telegram 消息 | external_api |

### 3.7 新增 Skill — 结果汇报（文档 11）

| ID | Code | nameZh | executionType |
|----|------|--------|--------------|
| skill-summarize-report | SUMMARIZE_REPORT | AI 报告摘要 | llm |

### 3.8 内容创作 Skill 变体策略

文档 10 执行闭环引用了 `GeneratePrediction`、`GenerateEventPreview`、`GeneratePostMatchReview`。

**统一策略**：这些**不是独立 Skill**，而是同一个 `skill-content-write`（CONTENT_WRITE）通过 `inputParameters.contentType` 参数区分的不同模式：

```typescript
// 通过 contentType 参数区分
{ skillId: 'skill-content-write', inputParameters: { contentType: 'prediction' } }
{ skillId: 'skill-content-write', inputParameters: { contentType: 'event_preview' } }
{ skillId: 'skill-content-write', inputParameters: { contentType: 'post_match_review' } }
{ skillId: 'skill-content-write', inputParameters: { contentType: 'article' } }
```

`skill-content-write` 的 promptTemplate 通过 `{contentType}` 变量动态选择创作模式。

### 3.9 Skill 总计

| 分类 | 数量 |
|------|------|
| 已有 | 16 |
| 新增 | 23 |
| **总计** | **39** |

---

## 四、executionType 统一定义

### 4.1 标准枚举（4 种）

| 值 | 中文 | 说明 | 运行位置 |
|----|------|------|---------|
| `llm` | LLM 调用 | 通过 llmExecutor 调用大模型 | 服务端 |
| `external_api` | 外部 API | 调用第三方服务（Tavily/Apify/Telegram 等） | 服务端 |
| `internal_api` | 内部 API | 调用系统自身 API（创建终端/修改配置等） | 服务端 |
| `hybrid` | 混合执行 | LLM 生成 + API 执行的多步组合 | 服务端 |

### 4.2 数据迁移

现有种子数据中的 `executionType: 'tool'` 统一迁移为 `external_api`：

```sql
UPDATE Skill SET executionType = 'external_api' WHERE executionType = 'tool';
```

在 `server/domain/skillSeed.ts` 中同步更新：

```typescript
// 修改前
executionType: 'tool'
// 修改后
executionType: 'external_api'
```

---

## 五、Webhook URL 统一

所有文档统一使用：

```
POST /api/webhooks/telegram/:terminalId
```

- 复数 `webhooks`（RESTful 风格）
- 参数 `terminalId`（不使用 `botId`，因为终端是系统一等对象）

---

## 六、补充 Prisma 模型定义

### 6.1 ProjectAgentConfig（文档 03/05/07 共同依赖）

```prisma
model ProjectAgentConfig {
  id                    String   @id @default(cuid())
  projectId             String
  agentTemplateId       String
  instructionOverride   String?
  channelStyleOverride  String?  // JSON
  temperatureOverride   Float?
  maxTokensOverride     Int?
  modelConfigIdOverride String?
  customParamsJson      String?  // JSON
  isEnabled             Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  project       Project       @relation(fields: [projectId], references: [id])
  agentTemplate AgentTemplate @relation(fields: [agentTemplateId], references: [id])

  @@unique([projectId, agentTemplateId])
}
```

### 6.2 IncomingMessage（文档 04）

```prisma
model IncomingMessage {
  id                String   @id @default(cuid())
  terminalId        String
  terminalType      String   // telegram | facebook | web | api
  externalMessageId String?
  chatId            String
  chatType          String   // private | group | supergroup | channel
  fromUserId        String?
  fromUserName      String?
  messageType       String   // text | photo | video | poll_answer | member_join | member_leave | command | callback_query
  content           String?
  rawPayloadJson    String?  // JSON: 原始消息体
  status            String   @default("received")  // received | processing | dispatched | replied | ignored | failed
  agentTemplateId   String?  // 路由到的 Agent
  skillCode         String?  // 执行的 Skill
  conversationId    String?
  errorMessage      String?
  processedAt       DateTime?
  createdAt         DateTime @default(now())

  terminal     Terminal      @relation(fields: [terminalId], references: [id])
  conversation Conversation? @relation(fields: [conversationId], references: [id])
}
```

### 6.3 OutgoingMessage（文档 04）

```prisma
model OutgoingMessage {
  id                String   @id @default(cuid())
  terminalId        String
  terminalType      String
  chatId            String
  replyToMessageId  String?  // 引用的 IncomingMessage ID
  messageType       String   // text | photo | poll | pin | delete
  content           String?
  mediaUrl          String?
  rawResponseJson   String?  // JSON: 平台返回
  status            String   @default("pending")  // pending | sent | failed
  agentTemplateId   String?
  skillCode         String?
  projectId         String?
  errorMessage      String?
  sentAt            DateTime?
  createdAt         DateTime @default(now())

  terminal Terminal @relation(fields: [terminalId], references: [id])
}
```

### 6.4 Conversation（文档 04）

```prisma
model Conversation {
  id                String   @id @default(cuid())
  terminalId        String
  chatId            String
  chatType          String
  participantUserId String?
  status            String   @default("active")  // active | idle | closed
  messageCount      Int      @default(0)
  lastMessageAt     DateTime?
  summaryText       String?
  metadataJson      String?  // JSON
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  terminal Terminal          @relation(fields: [terminalId], references: [id])
  messages IncomingMessage[]

  @@unique([terminalId, chatId, participantUserId])
}
```

### 6.5 ResearchResult（文档 08，存储素材包）

```prisma
model ResearchResult {
  id              String   @id @default(cuid())
  projectId       String
  topic           String
  sourceSkillCode String   // SEARCH_WEB | MONITOR_SOCIAL | EXTRACT_ARTICLE | SUBSCRIBE_RSS
  sourceProvider  String?  // tavily | apify | jina | rss
  resultJson      String   // JSON: { keyFacts[], sources[], rawData }
  summary         String?
  quality         String?  @default("medium")  // high | medium | low
  expiresAt       DateTime?
  createdAt       DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id])
}
```

### 6.6 LLMUsageLog（文档 11，成本追踪）

```prisma
model LLMUsageLog {
  id               String   @id @default(cuid())
  projectId        String?
  agentTemplateId  String?
  skillCode        String?
  modelKey         String
  provider         String
  inputTokens      Int
  outputTokens     Int
  totalTokens      Int
  estimatedCostUsd Float
  latencyMs        Int
  success          Boolean
  errorMessage     String?
  createdAt        DateTime @default(now())
}
```

### 6.7 Skill 模型增强字段（文档 03）

```prisma
// 在已有 Skill 模型中新增：
model Skill {
  // ... 已有字段 ...
  inputSchemaJson       String?  // JSON Schema
  outputSchemaJson      String?  // JSON Schema
  executionConfigJson   String?  // JSON: { provider, method, apiEndpoint, ... }
  promptTemplate        String?  // LLM 类 Skill 的 prompt 模板
  requiredContextFields String?  // JSON array: ["identity", "channelStyle", ...]
  estimatedDurationMs   Int?
  retryable             Boolean  @default(false)
  maxRetries            Int      @default(0)
}
```

### 6.8 AgentTemplate 增强字段（文档 03）

```prisma
// 在已有 AgentTemplate 模型中新增：
model AgentTemplate {
  // ... 已有字段 ...
  channelStyleProfiles  String?  // JSON: { telegram_bot: {...}, web_chat: {...} }
}
```

### 6.9 WorkflowInstanceNode 增强字段（文档 03）

```prisma
// 在已有 WorkflowInstanceNode 模型中新增：
model WorkflowInstanceNode {
  // ... 已有字段 ...
  selectedSkillIds      String?  // JSON array
  skillExecutionLog     String?  // JSON array: [{ skillCode, status, startedAt, ... }]
  channelType           String?  // 运行时的渠道类型
  channelStyleApplied   Boolean  @default(false)
}
```

---

## 七、路由拆分策略

### 7.1 问题

`server/index.ts` 当前已 3737 行，包含所有 API 路由。计划新增 40-50 条路由后不可维护。

### 7.2 拆分方案

在 Phase 0 技术债清理中执行：

```
server/
├── index.ts              — 只保留 app 初始化 + 中间件 + 路由挂载
├── routes/
│   ├── authRoutes.ts       — /api/auth/*
│   ├── projectRoutes.ts    — /api/projects/*
│   ├── identityRoutes.ts   — /api/identities/*
│   ├── terminalRoutes.ts   — /api/terminals/*
│   ├── workflowRoutes.ts   — /api/workflow-templates/*, /api/workflow-instances/*
│   ├── planningRoutes.ts   — /api/planning-sessions/*, /api/planning-drafts/*
│   ├── agentRoutes.ts      — /api/agent-templates/*, /api/skills/*
│   ├── llmRoutes.ts        — /api/llm/*, /api/llm-providers/*, /api/llm-model-configs/*
│   ├── credentialRoutes.ts — /api/credentials/*
│   ├── facebookRoutes.ts   — /api/facebook/*
│   ├── telegramRoutes.ts   — /api/telegram/*, /api/terminals/:id/telegram/*（新增）
│   ├── dataSourceRoutes.ts — /api/data-source-*（新增）
│   ├── messageRoutes.ts    — /api/messages/*, /api/webhooks/*（新增）
│   ├── schedulerRoutes.ts  — /api/scheduled-tasks/*, /api/scheduler/*（新增）
│   ├── analyticsRoutes.ts  — /api/analytics/*, /api/projects/:id/reports/*（新增）
│   └── systemRoutes.ts     — /api/system-terminal-types/*, /api/tenants/*, /api/users/*
```

### 7.3 每个路由文件结构

```typescript
// server/routes/telegramRoutes.ts
import { Router } from 'express'

export function registerTelegramRoutes(app: Router) {
  // POST /api/telegram/verify
  app.post('/api/telegram/verify', async (req, res) => { ... })
  // ...
}
```

```typescript
// server/index.ts（简化后）
import { registerTelegramRoutes } from './routes/telegramRoutes'
import { registerDataSourceRoutes } from './routes/dataSourceRoutes'
// ...

registerTelegramRoutes(app)
registerDataSourceRoutes(app)
```

---

## 八、Skill external_api Provider 路由映射

Skill 的 `executionConfigJson.provider` 值到实际 adapter 的映射表：

```typescript
// server/services/skillExternalApiRouter.ts

const providerAdapterMap: Record<string, SkillApiAdapter> = {
  // 数据源类
  'tavily':    tavilyAdapter,
  'apify':     apifyAdapter,
  'jina':      jinaAdapter,
  'rss':       rssAdapter,
  // Telegram 类
  'telegram':  telegramAdapter,
  // Facebook 类
  'facebook':  facebookAdapter,
}

export function resolveAdapter(providerCode: string): SkillApiAdapter {
  const adapter = providerAdapterMap[providerCode]
  if (!adapter) throw new SkillExecutionError(`未知的 Provider: ${providerCode}`)
  return adapter
}
```

---

## 九、凭证存储统一策略

| 凭证类型 | 存储方式 | 理由 |
|---------|---------|------|
| LLM API Key | JSON 文件 `server/data/credentials.json` | 已有实现，暂不迁移 |
| Telegram Bot Token | JSON 文件 `server/data/telegram-credentials.json` | 与 LLM 对称，复用加密工具 |
| DataSource API Key | Prisma `DataSourceCredential` 模型 | 新建模块，直接用数据库更规范 |

**长期统一方向**：Phase 5 之后，统一迁移至 Prisma `Credential` 通用模型，淘汰 JSON 文件方案。当前阶段不做，避免影响已有功能。

---

## 十、消息管线补充规范

### 10.1 member_leave 路由决策（统一）

`member_leave` 消息**派发给 Community Manager Agent**，由 `skill-farewell-member` 处理。该 Skill 默认 `sendFarewell: false`（仅记录日志），可通过项目配置开启告别消息。

文档 04 路由规则修正为：
```
Rule: messageType in ['member_join', 'member_leave']
  → dispatch Community Manager Agent
```

### 10.2 频率限制参数

| 参数 | 默认值 | 可配置位置 |
|------|--------|-----------|
| 单用户消息频率上限 | 10 次/分钟 | 终端配置 `configJson.rateLimitPerMinute` |
| 群消息非 @Bot 消息 | 忽略 | 固定规则 |
| 群消息 @Bot 频率 | 5 次/分钟/用户 | 终端配置 |

### 10.3 auto_reply 预设文本

存储在 Terminal 的 `configJson.autoReplies` 中：

```json
{
  "autoReplies": {
    "/start": "欢迎！我是 {botName}，输入 /help 查看我能做什么。",
    "/help": "我可以：\n• 回答你的问题\n• 提供最新资讯\n• 发起投票和讨论\n\n直接发消息即可开始对话。"
  }
}
```

### 10.4 Bot ID 获取方式

从 Terminal 的 `credentialsJson.botId` 字段获取（Telegram Bot 创建时自动写入）。

### 10.5 Config Agent 确认机制

Config Agent 输出结构中增加确认状态字段：

```typescript
interface ConfigAgentOutput {
  status: 'completed' | 'awaiting_confirmation' | 'needs_clarification' | 'failed'
  message: string                    // 中文说明
  pendingActions?: ConfigAction[]    // 待确认的操作列表
  confirmationPrompt?: string        // 确认提示文案
  executedActions?: ConfigAction[]   // 已执行的操作
}

interface ConfigAction {
  actionType: string    // 'create_terminal' | 'create_datasource' | 'configure_agent' | 'test_connection'
  targetName: string    // 操作对象名称
  params: Record<string, unknown>
}
```

前端在收到 `status: 'awaiting_confirmation'` 时，显示 `pendingActions` 列表和确认/取消按钮。

---

## 十一、种子数据约定

### 11.1 命名规范

```typescript
// 文件命名
server/domain/xxxSeed.ts

// 函数命名
export async function seedXxxIfEmpty() {
  const count = await prisma.xxx.count()
  if (count > 0) return
  // ... 写入种子数据
}
```

### 11.2 调用位置

在 `server/index.ts` 启动时调用：

```typescript
await seedAgentTemplatesIfEmpty()
await seedSkillsIfEmpty()
await seedDataSourceProvidersIfEmpty()  // 新增
await seedScheduledTaskTypesIfEmpty()   // 新增（如有）
```

### 11.3 ID 策略

- Agent 模板 ID 使用 `at-` 前缀
- Skill ID 使用 `skill-` 前缀
- DataSourceProvider ID 使用 `dsp-` 前缀
- SystemTerminalType ID 使用 `stt-` 前缀

---

## 十二、API 统一返回格式

所有新增 API 必须遵循已有格式：

```typescript
// 成功
{
  code: 0,
  message: 'success',
  data: { ... },
  meta: { requestId: string, timestamp: string }
}

// 错误
{
  code: number,  // 非 0
  message: string,  // 中文错误信息
  data: null,
  meta: { requestId: string, timestamp: string }
}
```

辅助函数（已有）：

```typescript
function apiMeta() {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  }
}
```

---

## 十三、前端服务层约定

### 13.1 文件命名

```
src/modules/{shell}/services/{resource}Service.ts
src/modules/{shell}/repositories/{resource}Repository.ts
src/modules/{shell}/schemas/{resource}.ts
```

### 13.2 Service 标准方法

```typescript
// xxxService.ts
export const xxxService = {
  list(params: ListParams): Promise<PaginatedResult<Xxx>>,
  getById(id: string): Promise<Xxx>,
  create(data: CreateXxxInput): Promise<Xxx>,
  update(id: string, data: UpdateXxxInput): Promise<Xxx>,
  delete(id: string): Promise<void>,
  patchStatus(id: string, status: string): Promise<Xxx>,
}
```

### 13.3 Repository 标准方法

```typescript
// xxxRepository.ts
export const xxxRepository = {
  fetchList(params: ListParams): Promise<ApiResponse<PaginatedResult<Xxx>>>,
  fetchById(id: string): Promise<ApiResponse<Xxx>>,
  create(data: CreateXxxInput): Promise<ApiResponse<Xxx>>,
  update(id: string, data: UpdateXxxInput): Promise<ApiResponse<Xxx>>,
  remove(id: string): Promise<ApiResponse<void>>,
  patchStatus(id: string, status: string): Promise<ApiResponse<Xxx>>,
}
```

---

## 十四、P1.5 依赖关系澄清

Skill 执行引擎（P1.5）的依赖分两层：

| 层次 | 依赖 | 说明 |
|------|------|------|
| 核心引擎 | P0 | 引擎框架、prompt 组装、输出校验可独立开发 |
| 集成测试 | P1-A + P1-B | external_api 类 Skill 需要数据源和 Telegram 终端 |

文档 03 头部的「前置依赖」应理解为：核心引擎依赖 P0，完整功能验证依赖 P1。

---

## 十五、hybrid 类型 Stage 数据传递规范

```typescript
// hybrid Skill 的 executionConfigJson 结构
{
  "stages": [
    {
      "stageId": "generate",
      "type": "llm",
      "promptTemplate": "根据以下要求生成欢迎语...",
      "outputKey": "welcomeText"
    },
    {
      "stageId": "send",
      "type": "external_api",
      "provider": "telegram",
      "method": "sendMessage",
      "inputMapping": {
        "text": "{{stages.generate.output.welcomeText}}",
        "chatId": "{{context.chatId}}"
      }
    }
  ]
}
```

**解析规则**：
- `{{stages.<stageId>.output.<key>}}` — 引用前置 stage 的输出
- `{{context.<key>}}` — 引用执行上下文（chatId, terminalId, identity 等）
- `{{input.<key>}}` — 引用 Skill 输入参数
- 变量解析在 `skillExecutionEngine` 内部的 `resolveStageVariables()` 函数中完成
