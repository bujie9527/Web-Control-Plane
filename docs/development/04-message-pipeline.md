# 04 — 消息管线（Message Pipeline）

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：Telegram Bot Webhook 接收能力（02 第二批）
> 后续依赖：Interaction Agent（05）、Community Manager Agent（06）、被动响应闭环（10）
> 实用化案例：体育赛事预测 Telegram Bot — 用户在群里提问，Bot 智能回复

---

## 一、模块定位

消息管线是系统从「只能推」进化为「能推能收」的核心基础设施。它负责接收外部消息、分类、路由到正确的 Agent，并协调回复发送。

**它不是**：
- 聊天 UI（用户在 Telegram 中聊天，不在本系统中）
- Agent 本身（Agent 只是管线调用的处理器）
- 特定终端的逻辑（管线是终端无关的抽象层）

**它是**：
- 外部消息的统一入口
- 消息分类与意图识别的调度中心
- Agent 处理结果到回复发送的协调层
- 对话上下文的管理中心

### 核心设计原则

1. **终端无关** — 管线处理标准化的 IncomingMessage，不关心消息来自 Telegram 还是未来的其他终端
2. **异步处理** — Webhook 快速响应（写入 Inbox 即返回），Agent 处理异步进行
3. **可观测** — 每条消息的完整生命周期（接收 → 分类 → 路由 → 处理 → 回复）都有记录
4. **成本控制** — 不是每条消息都调 LLM，通过规则预过滤降低成本

### 在系统中的位置

```
终端层（Telegram Webhook / 未来其他终端）
    ↓ IncomingMessage
消息管线（本模块）
    ├── Message Inbox（收件箱）
    ├── Message Preprocessor（预处理器）
    ├── Message Router（路由器）
    ├── Agent Dispatcher（Agent 调度器）
    └── Response Sender（回复发送器）
    ↓
终端层（Telegram sendMessage / 未来其他终端）
```

---

## 二、消息生命周期

一条消息从接收到回复的完整流程：

```
1. Webhook 接收 → 解析为 IncomingMessage → 写入 Inbox（状态: received）
2. Preprocessor 预处理 → 补充上下文信息 → 更新状态: preprocessed
3. Router 分类路由 → 确定处理策略（哪个 Agent / 是否忽略）→ 更新状态: routed
4. Dispatcher 调度 Agent → Agent 执行 Skill → 生成回复内容 → 更新状态: processed
5. Response Sender 发送回复 → 调用终端 API → 更新状态: responded
6. 异常时 → 更新状态: failed，记录错误原因
```

### 状态机

```
received → preprocessed → routed → processing → processed → responded
                            ↓                      ↓
                          ignored                 failed
```

| 状态 | 含义 |
|------|------|
| `received` | 已接收，等待预处理 |
| `preprocessed` | 预处理完成，等待路由 |
| `routed` | 路由完成，等待 Agent 处理 |
| `processing` | Agent 正在处理中 |
| `processed` | Agent 处理完成，等待发送回复 |
| `responded` | 回复已发送 |
| `ignored` | 被规则判定为忽略（垃圾/无关/自动过滤） |
| `failed` | 处理失败 |

---

## 三、数据模型

### 3.1 IncomingMessage（收件箱消息）

```
IncomingMessage（新增 Prisma 模型）:
  id                  String    @id
  terminalId          String    // 来源终端
  terminalType        String    // 'telegram_bot' | 未来其他
  projectId           String?   // 关联项目（通过终端绑定推导）
  tenantId            String    // 租户隔离

  // 消息来源
  chatId              String    // 外部聊天/群组 ID
  chatType            String    // 'private' | 'group' | 'supergroup' | 'channel'
  chatTitle           String?   // 群/频道名称
  fromUserId          String    // 外部用户 ID
  fromUsername         String?   // 外部用户名
  fromDisplayName      String?   // 外部用户显示名

  // 消息内容
  messageType         String    // 'text' | 'command' | 'callback' | 'member_join' | 'member_leave' | 'photo' | 'other'
  content             String?   // 文本内容
  command             String?   // 命令名（如 'predict'），messageType=command 时
  commandArgs         String?   // 命令参数
  callbackData        String?   // 按钮回调数据，messageType=callback 时
  replyToMessageId    String?   // 回复的消息外部 ID
  externalMessageId   String?   // 外部平台的消息 ID

  // 处理状态
  status              String    // received | preprocessed | routed | processing | processed | responded | ignored | failed
  routeDecision       String?   // JSON: 路由决策详情
  assignedAgentId     String?   // 分配的 Agent 模板 ID
  assignedSkillIds    String?   // JSON array: 分配的 Skill ID 列表
  processingStartedAt String?
  processingCompletedAt String?

  // 回复
  responseId          String?   // 关联的 OutgoingMessage ID
  responseContent     String?   // 回复内容（冗余存储，方便查询）
  responseSentAt      String?

  // 错误
  errorMessage        String?
  errorMessageZh      String?

  // 上下文
  conversationId      String?   // 对话会话 ID（同一用户连续对话归组）
  identityId          String?   // 应用的 Identity

  // 原始数据
  rawPayload          String?   // 原始平台数据 JSON（调试用）

  // 时间
  receivedAt          String
  createdAt           String
  updatedAt           String
```

### 3.2 OutgoingMessage（发出消息记录）

```
OutgoingMessage（新增 Prisma 模型）:
  id                  String    @id
  terminalId          String
  terminalType        String
  projectId           String?
  tenantId            String

  // 目标
  chatId              String
  chatType            String

  // 内容
  messageType         String    // 'text' | 'photo' | 'poll' | 'reply'
  content             String    // 发送的文本内容
  parseMode           String?   // 'Markdown' | 'HTML'
  replyToMessageId    String?   // 回复的外部消息 ID
  incomingMessageId   String?   // 触发此回复的 IncomingMessage ID

  // 发送状态
  status              String    // 'pending' | 'sent' | 'failed'
  externalMessageId   String?   // 平台返回的消息 ID
  sentAt              String?
  errorMessage        String?

  // 来源
  triggeredBy         String    // 'agent_response' | 'workflow_publish' | 'scheduled' | 'manual'
  agentTemplateId     String?   // 生成此消息的 Agent
  skillId             String?   // 使用的 Skill
  workflowInstanceId  String?   // 关联的流程实例
  workflowNodeId      String?   // 关联的流程节点

  // 时间
  createdAt           String
  updatedAt           String
```

### 3.3 Conversation（对话会话）

用于追踪同一用户的连续对话上下文：

```
Conversation（新增 Prisma 模型）:
  id                  String    @id
  terminalId          String
  projectId           String?
  tenantId            String
  chatId              String    // 外部聊天 ID
  externalUserId      String    // 外部用户 ID
  identityId          String?   // 应用的 Identity
  status              String    // 'active' | 'idle' | 'closed'
  messageCount        Int       @default(0)
  lastMessageAt       String?
  contextSummary      String?   // LLM 生成的对话摘要（避免每次传全部历史）
  createdAt           String
  updatedAt           String

  @@unique([terminalId, chatId, externalUserId])
```

---

## 四、管线各组件设计

### 4.1 Message Inbox（收件箱）

**职责**：接收标准化消息，持久化，返回确认。

```typescript
interface MessageInbox {
  receive(message: IncomingMessagePayload): Promise<string>  // 返回 messageId
  getById(id: string): Promise<IncomingMessage | null>
  list(params: InboxListParams): Promise<PaginatedResult<IncomingMessage>>
  updateStatus(id: string, status: string, extra?: Partial<IncomingMessage>): Promise<void>
}
```

Inbox 只做写入和状态更新，不做任何业务判断。

### 4.2 Message Preprocessor（预处理器）

**职责**：补充上下文信息，为路由做准备。

```typescript
interface MessagePreprocessor {
  preprocess(message: IncomingMessage): Promise<PreprocessResult>
}

interface PreprocessResult {
  projectId: string | null        // 从终端绑定推导
  identityId: string | null       // 从项目/终端绑定推导
  conversationId: string          // 查找或创建对话会话
  recentMessages: MessageSummary[] // 最近 N 条对话历史（用于上下文）
  terminalConfig: TerminalConfig   // 终端功能配置（autoReply、welcome 等开关）
}
```

预处理步骤：
1. 通过 `terminalId` 查找终端 → 获取 `projectId`、`identityId`
2. 查找或创建 `Conversation` 记录
3. 加载最近 5-10 条对话历史（同一 conversationId）
4. 读取终端功能配置（是否开启自动回复等）

### 4.3 Message Router（路由器）

**职责**：根据消息类型和内容，决定由谁处理以及如何处理。

```typescript
interface MessageRouter {
  route(message: IncomingMessage, context: PreprocessResult): Promise<RouteDecision>
}

interface RouteDecision {
  action: 'dispatch_agent' | 'ignore' | 'auto_reply' | 'queue_for_review'
  agentTemplateId?: string       // 分配的 Agent
  skillIds?: string[]            // 建议使用的 Skill
  priority: 'high' | 'normal' | 'low'
  reason: string                 // 路由原因（中文，调试和日志用）
  ignoreReason?: string          // 忽略原因（如有）
}
```

#### 路由规则（按优先级从高到低）

```
Rule 1: 功能开关检查
  → autoReplyEnabled === false && 非命令 → ignore（"自动回复已关闭"）

Rule 2: Bot 自己的消息
  → fromUserId === botId → ignore（"Bot 自身消息"）

Rule 3: 成员事件
  → messageType === 'member_join' → dispatch Community Manager Agent
  → messageType === 'member_leave' → dispatch Community Manager Agent（默认仅记录日志，可配置发送告别消息）

Rule 4: 命令消息
  → messageType === 'command'
  → 按 command 名称路由:
     /help    → auto_reply（返回帮助文本，不调 LLM）
     /start   → auto_reply（返回欢迎文本）
     /predict → dispatch Interaction Agent + skill-classify-intent (CLASSIFY_INTENT)
     /stats   → dispatch Interaction Agent + skill-generate-reply (GENERATE_REPLY)（Research Agent 由 Interaction Agent 按需调用）
     其他     → dispatch Interaction Agent

Rule 5: 按钮回调
  → messageType === 'callback' → dispatch 对应 Agent（按 callbackData 前缀路由）

Rule 6: 普通文本（群组中）
  → chatType === 'group' | 'supergroup'
  → 检查是否 @Bot 或回复 Bot 的消息
     → 是 → dispatch Interaction Agent
     → 否 → ignore（群里非@Bot的消息不处理，降低成本）

Rule 7: 普通文本（私聊）
  → chatType === 'private'
  → dispatch Interaction Agent

Rule 8: 默认
  → ignore（"未匹配任何路由规则"）
```

**群消息成本控制关键**：群里的消息很多，只有 @Bot 或回复 Bot 的消息才触发 Agent 处理，其他全部忽略。

### 4.4 Agent Dispatcher（Agent 调度器）

**职责**：根据路由决策调用 Agent 执行 Skill，获取处理结果。

```typescript
interface AgentDispatcher {
  dispatch(message: IncomingMessage, decision: RouteDecision, context: PreprocessResult): Promise<DispatchResult>
}

interface DispatchResult {
  success: boolean
  responseContent?: string        // 生成的回复文本
  responseParseMode?: string      // Markdown | HTML
  responseType?: 'text' | 'photo' | 'poll'
  actionsTaken?: AgentAction[]    // Agent 附加动作（如置顶、发投票）
  errorMessage?: string
  errorMessageZh?: string
  latencyMs: number
  llmCalls: number                // 本次处理调用 LLM 的次数
}

interface AgentAction {
  type: 'pin_message' | 'create_poll' | 'delete_message' | 'ban_user'
  params: Record<string, any>
  status: 'pending' | 'executed' | 'failed'
}
```

调度流程：
1. 加载 AgentTemplate
2. 加载 Identity 信息
3. 构建 Skill 执行上下文（对话历史 + 消息内容 + Identity + 渠道风格）
4. 调用 Skill 执行引擎（03 文档定义）
5. 收集执行结果
6. 如果 Agent 产生了附加动作（如置顶），也执行它们

### 4.5 Response Sender（回复发送器）

**职责**：将 Agent 处理结果通过终端发回。

```typescript
interface ResponseSender {
  send(message: IncomingMessage, result: DispatchResult): Promise<SendResult>
}

interface SendResult {
  success: boolean
  outgoingMessageId: string       // 创建的 OutgoingMessage 记录 ID
  externalMessageId?: string      // 平台返回的消息 ID
  errorMessage?: string
}
```

发送流程：
1. 创建 OutgoingMessage 记录（status: pending）
2. 根据 `terminalType` 选择终端 Bridge（如 telegramTerminalBridge）
3. 调用终端 Bridge 发送（replyToMessage 或 sendMessage）
4. 更新 OutgoingMessage 状态
5. 更新 IncomingMessage 状态为 `responded`
6. 执行 Agent 附加动作（pin、poll 等）

---

## 五、管线编排器（Pipeline Orchestrator）

各组件通过编排器串联：

```typescript
interface MessagePipelineOrchestrator {
  processMessage(messageId: string): Promise<void>
}
```

编排流程：
```
async processMessage(messageId):
  1. message = inbox.getById(messageId)
  2. context = preprocessor.preprocess(message)
     inbox.updateStatus(messageId, 'preprocessed')
  3. decision = router.route(message, context)
     inbox.updateStatus(messageId, 'routed', { routeDecision: JSON(decision) })
  4. if decision.action === 'ignore':
       inbox.updateStatus(messageId, 'ignored')
       return
  5. if decision.action === 'auto_reply':
       responseSender.send(message, { responseContent: autoReplyText })
       return
  6. inbox.updateStatus(messageId, 'processing', { assignedAgentId, assignedSkillIds })
  7. result = dispatcher.dispatch(message, decision, context)
  8. if result.success:
       inbox.updateStatus(messageId, 'processed')
       responseSender.send(message, result)
     else:
       inbox.updateStatus(messageId, 'failed', { errorMessage, errorMessageZh })
```

### 异步触发方式

Webhook Handler 写入 Inbox 后，通过以下方式触发管线处理：

**方案一（推荐，当前阶段）：同步处理**
```
Webhook Handler:
  messageId = inbox.receive(message)
  setImmediate(() => orchestrator.processMessage(messageId))
  return 200 OK
```

用 `setImmediate` 把处理推到下一个事件循环，Webhook 立即返回 200。处理在同一进程中异步执行。

**方案二（未来扩展）：消息队列**
引入 Redis/BullMQ 队列，实现真正的异步和并发控制。当前阶段不需要。

---

## 六、对话上下文管理

### 6.1 对话会话（Conversation）

同一用户在同一聊天中的连续消息归为一个对话会话。

**会话生命周期**：
- 用户发第一条消息 → 创建 Conversation（status: active）
- 每条新消息 → 更新 `lastMessageAt`，递增 `messageCount`
- 超过 30 分钟无新消息 → 标记 `idle`
- 超过 24 小时无新消息 → 标记 `closed`，下次消息创建新会话

**上下文窗口**：
- 取最近 5-10 条消息作为对话历史
- 如果对话较长，使用 `contextSummary`（LLM 定期生成的摘要）代替完整历史
- 上下文摘要在消息数达到阈值（如 20 条）时自动生成

### 6.2 上下文传递给 Agent

```typescript
interface ConversationContext {
  conversationId: string
  recentMessages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  contextSummary?: string   // 之前对话的摘要
  userProfile?: {           // 用户画像（逐步积累）
    externalUserId: string
    username: string
    interactionCount: number
    preferredTopics?: string[]
  }
}
```

Agent 在生成回复时，对话历史作为输入的一部分传入 LLM：

```
System: 你是体育预测达人...
Context: 
  之前的对话摘要: {contextSummary}
  最近消息:
    用户: 今晚 NBA 有什么比赛？
    助手: 今晚有三场比赛...
    用户: 湖人凯尔特人谁赢？   ← 当前消息
```

---

## 七、成本控制策略

消息管线最大的风险是 LLM 调用成本失控（群里消息量大）。

### 7.1 多层过滤

```
Layer 1: 功能开关（autoReplyEnabled）
  → 关闭时所有非命令消息忽略
  
Layer 2: Bot 消息过滤
  → 自己的消息不处理

Layer 3: 群消息 @检测
  → 群里未 @Bot 且未回复 Bot 的消息忽略（最关键的过滤）

Layer 4: 命令预处理
  → /help /start 等固定命令用预设文本回复，不调 LLM

Layer 5: 频率限制
  → 同一用户每分钟最多 N 次 Agent 调用（防刷）

Layer 6: 意图分类优先
  → 先用轻量模型做意图分类，无关消息快速忽略
```

### 7.2 预期成本模型

以体育 Bot 群（500 人群）为例：

| 场景 | 日均消息量 | 触发 Agent 量 | LLM 调用 | 预估日成本 |
|------|-----------|-------------|---------|-----------|
| @Bot 提问 | ~20 条 | 20 条 | 20-40 次 | ~$0.1-0.2 |
| 命令 (/predict) | ~10 条 | 10 条 | 10-20 次 | ~$0.05-0.1 |
| 新人加入 | ~5 条 | 5 条 | 5 次 | ~$0.02 |
| 群聊（不@Bot） | ~200 条 | 0 条 | 0 次 | $0 |
| **合计** | ~235 条 | ~35 条 | ~50 次 | **~$0.2-0.3/天** |

群消息过滤是成本控制的核心。

---

## 八、后端实现结构

### 8.1 目录规划

```
server/
  pipeline/
    messageInbox.ts               # 收件箱（CRUD）
    messagePreprocessor.ts        # 预处理器
    messageRouter.ts              # 路由器（规则引擎）
    agentDispatcher.ts            # Agent 调度器
    responseSender.ts             # 回复发送器
    pipelineOrchestrator.ts       # 管线编排器
    conversationManager.ts        # 对话会话管理
    routingRules.ts               # 路由规则定义
  domain/
    incomingMessageDb.ts          # IncomingMessage Prisma CRUD
    outgoingMessageDb.ts          # OutgoingMessage Prisma CRUD
    conversationDb.ts             # Conversation Prisma CRUD
```

### 8.2 API 路由

| 路由 | 方法 | 用途 | 权限 |
|------|------|------|------|
| `GET /api/messages/incoming` | GET | 收件箱列表（支持筛选） | tenant |
| `GET /api/messages/incoming/:id` | GET | 消息详情 | tenant |
| `GET /api/messages/outgoing` | GET | 发出消息列表 | tenant |
| `GET /api/messages/conversations` | GET | 对话列表 | tenant |
| `GET /api/messages/conversations/:id` | GET | 对话详情（含消息历史） | tenant |
| `GET /api/messages/stats` | GET | 消息统计（今日/本周/按状态） | tenant |
| `POST /api/messages/incoming/:id/retry` | POST | 重试失败的消息处理 | tenant |
| `POST /api/messages/incoming/:id/ignore` | POST | 手动标记忽略 | tenant |

Webhook 入口路由在 02 文档中已定义：
```
POST /api/webhook/telegram/:terminalId → telegramWebhookHandler → inbox.receive() → orchestrator
```

---

## 九、前端展示

### 9.1 消息中心页面

在租户后台新增「消息中心」页面或在现有任务中心扩展：

**消息列表视图**：
- 列表：时间、来源终端、来源用户、消息内容摘要、状态、处理 Agent、回复摘要
- 筛选：按状态、按终端、按时间范围
- 状态标签：中文映射（已回复 / 已忽略 / 处理失败 / 处理中）

**对话视图**：
- 按对话会话分组
- 类似聊天界面：左侧用户消息，右侧 Bot 回复
- 标注每条回复使用的 Agent 和 Skill

**统计面板**：
- 今日消息总量 / 触发 Agent 量 / 回复量 / 忽略量
- 平均响应时间
- 按终端/项目分布

### 9.2 中文标签映射

```typescript
const MESSAGE_STATUS_LABELS = {
  received: '已接收',
  preprocessed: '预处理中',
  routed: '已路由',
  processing: '处理中',
  processed: '已处理',
  responded: '已回复',
  ignored: '已忽略',
  failed: '处理失败',
}

const MESSAGE_TYPE_LABELS = {
  text: '文本消息',
  command: '命令',
  callback: '按钮回调',
  member_join: '新成员加入',
  member_leave: '成员离开',
  photo: '图片',
  other: '其他',
}

const ROUTE_ACTION_LABELS = {
  dispatch_agent: '分配 Agent 处理',
  ignore: '忽略',
  auto_reply: '自动回复',
  queue_for_review: '等待人工审核',
}
```

---

## 十、与其他文档的接口约定

### 与 02-Telegram Bot 终端

Webhook Handler 输出 → Inbox 输入：

```
telegramWebhookHandler.handleUpdate(terminalId, tgUpdate)
  → 解析 TgUpdate 为 IncomingMessagePayload
  → inbox.receive(payload)
  → setImmediate(() => orchestrator.processMessage(messageId))
```

IncomingMessagePayload 由 02 文档第十一节定义。

### 与 03-Skill 执行引擎

Agent Dispatcher 内部调用 Skill 执行引擎：

```
agentDispatcher.dispatch(message, decision, context)
  → skillExecutionEngine.execute({
      agentTemplateId: decision.agentTemplateId,
      skillIds: decision.skillIds,
      input: { content: message.content, command: message.command },
      context: {
        identity: context.identity,
        channelType: 'telegram_bot',
        conversationHistory: context.recentMessages,
        terminalId: message.terminalId,
        chatId: message.chatId
      }
    })
```

### 与 05-Interaction Agent

Interaction Agent 被 Dispatcher 调用时的输入输出：

```
输入:
  - 用户消息内容
  - 对话历史（最近 N 条）
  - Identity 信息
  - 渠道风格（Telegram）

输出:
  - 回复文本
  - parseMode（Markdown/HTML）
  - 附加动作（可选：发投票、置顶等）
```

### 与 06-Community Manager Agent

Community Manager 被 Dispatcher 调用时：

```
触发: messageType === 'member_join'
输入:
  - 新成员信息（username, displayName）
  - 群信息（title, memberCount）
  - Identity 信息
  
输出:
  - 欢迎消息文本
  - 是否附带群规
  - 是否附带按钮（如"查看预测"）
```

---

## 十一、开发顺序

```
步骤 1: Prisma 模型
  → IncomingMessage / OutgoingMessage / Conversation
  → 数据库迁移

步骤 2: 核心管线组件
  → messageInbox.ts（CRUD）
  → messagePreprocessor.ts（上下文补充）
  → conversationManager.ts（对话管理）

步骤 3: 路由器
  → routingRules.ts（规则定义）
  → messageRouter.ts（规则引擎）
  → 覆盖第六节的所有路由规则

步骤 4: Agent 调度器 + 回复发送器
  → agentDispatcher.ts（调用 Skill 执行引擎）
  → responseSender.ts（调用终端 Bridge）

步骤 5: 管线编排器
  → pipelineOrchestrator.ts（串联全部组件）
  → 与 telegramWebhookHandler 对接

步骤 6: API 路由
  → 消息列表 / 详情 / 对话 / 统计

步骤 7: 前端页面
  → 消息中心（列表 + 对话视图 + 统计）
  → 中文标签

步骤 8: 集成测试
  → Telegram 群里发消息 → Webhook → 管线 → Agent 回复
  → 验证成本控制（群消息过滤）
```

---

## 十二、验收标准

### 消息接收
- [ ] Telegram 群/私聊消息正确写入 Inbox
- [ ] 命令消息正确解析（command + commandArgs）
- [ ] 按钮回调正确解析（callbackData）
- [ ] 新成员加入事件正确识别

### 路由
- [ ] 群消息未 @Bot 时忽略
- [ ] 群消息 @Bot 时路由到 Interaction Agent
- [ ] 私聊消息路由到 Interaction Agent
- [ ] 命令消息按命令名路由
- [ ] 新成员事件路由到 Community Manager
- [ ] /help /start 返回预设文本不调 LLM

### Agent 调度
- [ ] Agent 接收到消息内容 + 对话历史 + Identity 上下文
- [ ] Agent 返回的回复通过终端 Bridge 发回 Telegram
- [ ] 处理失败时消息状态标记 failed，记录中文错误

### 对话管理
- [ ] 同一用户连续消息归入同一 Conversation
- [ ] 超时后自动创建新 Conversation
- [ ] 对话历史正确传递给 Agent

### 成本控制
- [ ] 群消息过滤生效（未 @Bot 的消息不触发 Agent）
- [ ] 频率限制生效（同一用户每分钟限制）
- [ ] /help /start 等固定命令不调 LLM

### 可观测性
- [ ] 消息列表页可查看所有收发消息
- [ ] 每条消息可查看完整生命周期（状态变化、路由决策、Agent 结果）
- [ ] 统计面板显示消息量、回复率、平均响应时间
