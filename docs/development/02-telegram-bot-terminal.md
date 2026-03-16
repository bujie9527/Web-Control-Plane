# 02 — Telegram Bot 终端（双向通信）

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：Phase 0 技术债清理
> 后续依赖：消息管线（04）、Interaction Agent（05）、Community Manager Agent（06）、执行闭环（10）

---

## 一、模块定位

Telegram Bot 终端是系统中的**第一个双向终端**。

与 Facebook 终端（目前只能发帖）不同，Telegram Bot 既能主动发送内容，也能接收用户消息并响应。这使它成为后续所有互动类 Agent（Interaction Agent、Community Manager Agent）的物理载体。

**它不是**：
- 聊天机器人前端（前端是 Telegram App 本身）
- 对话引擎（对话理解和生成由 Interaction Agent 负责）
- 社群规则执行器（社群管理由 Community Manager Agent 负责）

**它是**：
- Agent 操作 Telegram 的执行入口
- 消息的收发通道（双向）
- 项目级终端实例，绑定 Identity 和 Project

### 核心设计原则

1. **终端只负责收发，不负责理解** — 消息理解和回复生成由 Agent 负责
2. **一个 Bot 可管多个群/频道** — channels[] 列表管理，不需要每个群一个终端
3. **分批开发** — 先发送能力，再接收能力，再管理能力
4. **复用已有终端架构** — 遵循 Terminal → credentialsJson/configJson 模式

### 在系统中的位置

```
租户后台 → 终端中心
  ├── Facebook Page 终端（已有）  — 单向：发布
  ├── Telegram Bot 终端（本模块）— 双向：发布 + 接收 + 管理
  ├── 数据源终端（01 规划）       — 单向：采集
  └── 未来终端...
```

### 与 Facebook 终端的模式对比

| 维度 | Facebook Page 终端 | Telegram Bot 终端 |
|------|-------------------|------------------|
| 认证方式 | OAuth 2.0（复杂） | Bot Token（极简） |
| 实体关系 | 一个 Page = 一个终端 | 一个 Bot = 一个终端，管多个群/频道 |
| 通信方向 | 单向（发帖） | 双向（发送 + Webhook 接收） |
| Token 生命周期 | 需定期刷新 | 永久有效（除非 revoke） |
| 平台级配置 | 需要（App ID/Secret） | 不需要 |
| 凭证存储 | facebookCredentialStore | telegramCredentialStore |
| Bridge 服务 | facebookTerminalBridge | telegramTerminalBridge |

---

## 二、Telegram Bot API 基础

### API 调用方式

所有调用均为 HTTPS 请求：
```
https://api.telegram.org/bot{token}/{method}
```

无需 SDK，纯 HTTP 调用。支持 GET 和 POST，推荐 POST + JSON body。

### 消息接收方式

Telegram Bot 有两种接收消息的方式：

| 方式 | 说明 | 适用场景 |
|------|------|---------|
| **Webhook** | Telegram 主动推送 Update 到我们的服务器 | 生产环境（推荐） |
| **Long Polling** | 我们主动轮询 getUpdates | 开发调试 |

本系统采用 **Webhook** 模式：
- 优势：实时、不占服务器轮询资源
- 要求：服务器必须有 HTTPS 公网地址（已满足：`https://ai.667788.cool`）
- 注册：`POST /setWebhook` 传入回调 URL

### 关键 API 方法清单

| 方法 | 用途 | 开发批次 |
|------|------|---------|
| `getMe` | 验证 Token，获取 Bot 信息 | 第一批 |
| `getChat` | 获取群/频道信息 | 第一批 |
| `getChatMemberCount` | 获取成员数 | 第一批 |
| `sendMessage` | 发送文本消息（支持 Markdown/HTML） | 第一批 |
| `sendPhoto` | 发送图片 + 描述 | 第一批 |
| `sendPoll` | 发送投票 | 第一批 |
| `pinChatMessage` | 置顶消息 | 第一批 |
| `setWebhook` | 注册 Webhook 回调地址 | 第二批 |
| `deleteWebhook` | 删除 Webhook | 第二批 |
| `getWebhookInfo` | 查看 Webhook 状态 | 第二批 |
| `answerCallbackQuery` | 响应按钮回调 | 第二批 |
| `deleteMessage` | 删除消息 | 第三批 |
| `banChatMember` | 封禁成员 | 第三批（预留） |
| `restrictChatMember` | 限制成员权限 | 第三批（预留） |

---

## 三、数据模型

### 3.1 SystemTerminalType 种子

```
SystemTerminalType:
  id:                       'stt-telegram-bot'
  name:                     'Telegram Bot'
  nameZh:                   'Telegram Bot'
  code:                     'telegram_bot'
  typeCategory:             'api'
  icon:                     'telegram'
  description:              'Telegram Bot API，支持频道发布、群组管理、互动对话'
  authSchema:               '{ "properties": { "botToken": { "type": "string", "title": "Bot Token" } } }'
  configSchema:             '{ "properties": { "channels": { "type": "array" }, "webhookEnabled": { "type": "boolean" } } }'
  supportedProjectTypeIds:  '["pt-social-media", "pt-account-operation"]'
  capabilityTags:           '["post_content", "receive_message", "reply_message", "send_poll", "pin_message", "community_manage"]'
  status:                   'active'
  isSystemPreset:           true
```

### 3.2 Terminal 实例

```
Terminal:
  id:               cuid()
  tenantId:         当前租户
  name:             "体育赛事预测 Bot" （用户命名或自动填充 Bot 名称）
  type:             'telegram_bot'
  typeCategory:     'api'
  identityId:       可选，绑定身份
  status:           'active' | 'inactive' | 'error'
  credentialsJson:  见 3.3
  configJson:       见 3.4
  linkedProjectIds: JSON array
  lastTestedAt:     最后测试时间
  lastTestResult:   'success' | 'failed' | 'unknown'
  lastTestMessage:  测试结果描述
```

### 3.3 凭证结构（credentialsJson）

```json
{
  "botToken": "（加密存储，服务端读取，前端不可见）",
  "botTokenMasked": "710xxxx:AAHxxxx...xxxx",
  "botId": "7101234567",
  "botUsername": "sports_predict_bot"
}
```

- `botToken` 通过 AES-256-GCM 加密，存储在 `server/data/telegram-credentials.json`
- 前端只返回 `botTokenMasked` 和 `botUsername`
- 加密模式复用 `CREDENTIAL_ENCRYPT_KEY` 环境变量

### 3.4 配置结构（configJson）

```json
{
  "channels": [
    {
      "chatId": "-1001234567890",
      "chatTitle": "体育赛事预测群",
      "chatType": "supergroup",
      "memberCount": 358,
      "botIsAdmin": true,
      "addedAt": "2026-03-16T10:00:00Z"
    },
    {
      "chatId": "@sports_predict_channel",
      "chatTitle": "体育预测频道",
      "chatType": "channel",
      "memberCount": 1200,
      "botIsAdmin": true,
      "addedAt": "2026-03-16T10:00:00Z"
    }
  ],
  "webhook": {
    "url": "https://ai.667788.cool/api/webhook/telegram/{terminalId}",
    "active": false,
    "lastSetAt": null,
    "pendingUpdates": 0
  },
  "features": {
    "autoReplyEnabled": false,
    "welcomeEnabled": false,
    "moderationEnabled": false
  }
}
```

### 3.5 Telegram 凭证存储

文件：`server/data/telegram-credentials.json`

```json
{
  "credentials": [
    {
      "id": "tg-cred-xxx",
      "terminalId": "terminal-xxx",
      "botId": "7101234567",
      "botUsername": "sports_predict_bot",
      "botToken": "（AES-256-GCM 加密密文）",
      "tokenMasked": "710xxxx:AAHxxxx...xxxx",
      "status": "active",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

## 四、后端实现结构

### 4.1 目录规划

```
server/
  services/
    telegramProvider.ts             # Telegram Bot API 全部方法封装
    telegramTerminalBridge.ts       # 终端桥接服务（创建/测试/频道管理）
    telegramWebhookHandler.ts       # Webhook 接收与解析（第二批）
  data/
    telegramCredentialStore.ts      # Bot Token 加密存储
    telegram-credentials.json       # 凭证数据文件（不入 Git）
```

### 4.2 telegramProvider.ts — API 封装

职责：封装所有 Telegram Bot API 调用，不含业务逻辑。

```typescript
// 概念接口定义
interface TelegramProvider {
  // 基础
  getMe(botToken: string): Promise<TgBotInfo>
  getChat(botToken: string, chatId: string): Promise<TgChatInfo>
  getChatMemberCount(botToken: string, chatId: string): Promise<number>

  // 发送
  sendMessage(botToken: string, chatId: string, text: string, options?: SendMessageOptions): Promise<TgMessage>
  sendPhoto(botToken: string, chatId: string, photo: string, options?: SendPhotoOptions): Promise<TgMessage>
  sendPoll(botToken: string, chatId: string, question: string, pollOptions: string[]): Promise<TgMessage>

  // 消息管理
  replyToMessage(botToken: string, chatId: string, replyToId: number, text: string): Promise<TgMessage>
  pinMessage(botToken: string, chatId: string, messageId: number): Promise<boolean>
  deleteMessage(botToken: string, chatId: string, messageId: number): Promise<boolean>

  // Webhook（第二批）
  setWebhook(botToken: string, url: string): Promise<boolean>
  deleteWebhook(botToken: string): Promise<boolean>
  getWebhookInfo(botToken: string): Promise<TgWebhookInfo>
}

interface SendMessageOptions {
  parseMode?: 'Markdown' | 'HTML'
  replyToMessageId?: number
  replyMarkup?: TgInlineKeyboard | TgReplyKeyboard
  disableWebPagePreview?: boolean
  disableNotification?: boolean
}

interface TgBotInfo {
  id: number
  username: string
  firstName: string
  canJoinGroups: boolean
  canReadAllGroupMessages: boolean
}

interface TgChatInfo {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  description?: string
}

interface TgMessage {
  messageId: number
  chat: TgChatInfo
  date: number
  text?: string
}
```

所有方法内部统一处理：
- HTTP 调用 `https://api.telegram.org/bot{token}/{method}`
- 错误码映射为中文（见第九节）
- 超时处理（默认 10s）
- 返回结构化结果

### 4.3 telegramTerminalBridge.ts — 终端桥接

职责：业务层桥接，处理终端创建、验证、频道管理等业务逻辑。

```typescript
// 概念接口定义
interface TelegramTerminalBridge {
  // 创建流程
  verifyBotToken(botToken: string): Promise<VerifyResult>
  createTerminal(tenantId: string, botToken: string, name?: string): Promise<Terminal>

  // 频道管理
  addChannel(terminalId: string, chatId: string): Promise<ChannelInfo>
  removeChannel(terminalId: string, chatId: string): Promise<void>
  refreshChannelInfo(terminalId: string): Promise<ChannelInfo[]>

  // 测试连接
  testConnection(terminalId: string): Promise<TestResult>

  // 发送操作（供 Agent Skill 调用）
  publishMessage(terminalId: string, chatId: string, content: PublishContent): Promise<PublishResult>
  publishPoll(terminalId: string, chatId: string, question: string, options: string[]): Promise<PublishResult>
  replyToMessage(terminalId: string, chatId: string, replyToId: number, text: string): Promise<PublishResult>
  pinMessage(terminalId: string, chatId: string, messageId: number): Promise<boolean>

  // 统计
  getChannelStats(terminalId: string): Promise<ChannelStats[]>

  // Webhook 管理（第二批）
  setupWebhook(terminalId: string): Promise<boolean>
  removeWebhook(terminalId: string): Promise<boolean>
  getWebhookStatus(terminalId: string): Promise<WebhookStatus>
}

interface PublishContent {
  text: string
  parseMode?: 'Markdown' | 'HTML'
  imageUrl?: string
  replyMarkup?: any
}

interface PublishResult {
  success: boolean
  messageId?: number
  chatId: string
  publishedAt: string
  errorMessage?: string
  errorMessageZh?: string
}

interface ChannelStats {
  chatId: string
  chatTitle: string
  chatType: string
  memberCount: number
  botIsAdmin: boolean
}
```

### 4.4 telegramCredentialStore.ts — 凭证存储

复用 Facebook 凭证存储模式：

```typescript
interface TelegramCredentialStore {
  saveBotCredential(payload: SaveBotCredentialPayload): Promise<void>
  getBotToken(terminalId: string): Promise<string>        // 解密后的真实 Token
  getBotSummary(terminalId: string): Promise<BotSummary>  // 不含真实 Token
  revokeBotCredential(terminalId: string): Promise<void>
  listBotSummaries(): Promise<BotSummary[]>
}

interface BotSummary {
  terminalId: string
  botId: string
  botUsername: string
  tokenMasked: string
  status: 'active' | 'revoked'
}
```

### 4.5 telegramWebhookHandler.ts — Webhook 处理（第二批）

职责：接收 Telegram 推送的 Update，解析为标准 IncomingMessage 格式，推入消息管线。

```typescript
interface TelegramWebhookHandler {
  handleUpdate(terminalId: string, update: TgUpdate): Promise<void>
}

// Telegram Update 结构（简化）
interface TgUpdate {
  update_id: number
  message?: TgMessage          // 普通消息
  callback_query?: TgCallback  // 按钮回调
  my_chat_member?: TgMemberUpdate  // Bot 被加入/移出群
  chat_member?: TgMemberUpdate     // 群成员变动
}
```

处理流程：
1. 解析 Update 类型（消息 / 命令 / 回调 / 成员变动）
2. 转换为标准 IncomingMessage 格式（见 04-消息管线文档定义）
3. 写入 Message Inbox
4. 返回 200（Telegram 要求 Webhook 在 60 秒内响应，越快越好）

**Webhook Handler 不做业务处理**，只做「接收 → 标准化 → 入队」。

---

## 五、API 路由

### 5.1 终端管理路由

| 路由 | 方法 | 用途 | 批次 |
|------|------|------|------|
| `POST /api/telegram/verify` | POST | 验证 Bot Token，返回 Bot 信息 | 第一批 |
| `POST /api/telegram/terminals` | POST | 验证 Token + 创建终端实例 | 第一批 |
| `GET /api/terminals/:id/telegram/channels` | GET | 获取 Bot 管理的群/频道列表 | 第一批 |
| `POST /api/terminals/:id/telegram/channels` | POST | 添加群/频道（验证 Bot 是否在该群中） | 第一批 |
| `DELETE /api/terminals/:id/telegram/channels/:chatId` | DELETE | 从管理列表移除群/频道 | 第一批 |
| `POST /api/terminals/:id/telegram/channels/refresh` | POST | 刷新所有频道信息（成员数等） | 第一批 |
| `GET /api/terminals/:id/telegram/stats` | GET | 获取统计数据 | 第一批 |

### 5.2 消息操作路由

| 路由 | 方法 | 用途 | 批次 |
|------|------|------|------|
| `POST /api/terminals/:id/actions/send-message` | POST | 发送文本消息到指定 chatId | 第一批 |
| `POST /api/terminals/:id/actions/send-photo` | POST | 发送图片消息 | 第一批 |
| `POST /api/terminals/:id/actions/send-poll` | POST | 发送投票 | 第一批 |
| `POST /api/terminals/:id/actions/reply` | POST | 回复特定消息 | 第一批 |
| `POST /api/terminals/:id/actions/pin` | POST | 置顶消息 | 第一批 |
| `POST /api/terminals/:id/actions/delete-message` | POST | 删除消息 | 第三批 |
| `POST /api/terminals/:id/telegram/test-post` | POST | 发送测试消息 | 第一批 |

### 5.3 Webhook 路由（第二批）

| 路由 | 方法 | 用途 | 批次 |
|------|------|------|------|
| `POST /api/webhook/telegram/:terminalId` | POST | Webhook 回调入口（Telegram 推送 Update） | 第二批 |
| `POST /api/terminals/:id/telegram/webhook/setup` | POST | 向 Telegram 注册 Webhook | 第二批 |
| `DELETE /api/terminals/:id/telegram/webhook` | DELETE | 删除 Webhook | 第二批 |
| `GET /api/terminals/:id/telegram/webhook/status` | GET | 查看 Webhook 状态 | 第二批 |

### 5.4 Webhook 安全

Webhook 回调入口需要验证请求确实来自 Telegram：
- Telegram 支持 `secret_token` 参数：注册 Webhook 时设置，Telegram 推送时携带在 `X-Telegram-Bot-Api-Secret-Token` Header 中
- 服务端验证该 Header，不匹配则拒绝
- `secret_token` 由系统生成并存储在终端 configJson 中

---

## 六、前端实现结构

### 6.1 终端创建向导适配

当前 `TerminalNewWizard` 已有分流逻辑（按 authType）。Telegram Bot 走 `manual` 路径，但定制表单：

**步骤一：选择终端类型**
从 SystemTerminalType 列表选择 "Telegram Bot"

**步骤二：配置 Bot Token**
- 输入框：Bot Token（password 类型）
- 帮助说明：「在 Telegram 中搜索 @BotFather，发送 /newbot 创建 Bot，复制 Token 填入」
- 「验证」按钮 → 调 `POST /api/telegram/verify`
- 验证成功后显示：Bot 用户名、Bot ID、是否可加群、是否可读群消息
- 自动填充终端名称为 Bot 用户名

**步骤三：添加群/频道**
- 说明：「将 Bot 添加为群组管理员或频道管理员，然后在下方输入群/频道 ID」
- 输入框：chatId（支持 @username 或数字 ID）
- 「添加」按钮 → 验证 Bot 在该群/频道中 → 显示群名称和成员数
- 可添加多个群/频道
- 此步骤可跳过（后续在终端详情中管理）

**步骤四：测试连接**
- 「发送测试消息」按钮 → 向第一个群/频道发送测试消息
- 成功后显示确认

### 6.2 终端详情工作台适配

在 `TerminalDetailWorkbench` 中，针对 `type === 'telegram_bot'` 定制以下 Tab：

**Tab 1：概览**
- Bot 信息卡片：用户名、Bot ID、Token 状态
- 群/频道列表卡片：每个群显示名称、类型、成员数、Bot 是否管理员
- 操作：「发测试消息」「刷新频道信息」
- Webhook 状态卡片（第二批）：状态、URL、待处理更新数

**Tab 2：频道管理**
- 已添加群/频道列表（带删除按钮）
- 添加新群/频道入口
- 每个群/频道可配置：是否启用自动回复、是否启用新人欢迎

**Tab 3：配置与凭证**
- Bot Token 掩码显示
- 「重新配置 Token」按钮（需要确认）
- Webhook 配置区域（第二批）
- 功能开关：自动回复、新人欢迎、内容管理

**Tab 4：关联项目**
- 已绑定项目列表

**Tab 5：绑定身份**
- 已绑定 Identity 列表
- 绑定/解绑操作

**Tab 6：执行日志**
- 发送记录列表（消息内容摘要、目标群/频道、发送时间、状态）
- 接收记录列表（第二批，来自 Webhook 的消息统计）

### 6.3 前端文件结构

```
src/modules/tenant/pages/TerminalCenter/
  tabs/
    OverviewTab.tsx            # 扩展 telegram_bot 显示逻辑
    ConfigCredentialsTab.tsx   # 扩展 telegram_bot 配置区域
    ChannelManagementTab.tsx   # 新增：频道管理 Tab（Telegram 专用）

src/modules/tenant/schemas/
  telegram.ts                  # Telegram 相关类型定义

src/modules/tenant/services/
  telegramService.ts           # Telegram 终端业务服务

src/modules/tenant/repositories/
  telegramRepository.ts        # Telegram API 调用

src/core/labels/
  terminalTypeLabels.ts        # 补充 Telegram 相关标签
```

---

## 七、与执行链路的集成

### 7.1 流程节点调用（主动推送）

当流程节点的 `intentType === 'publish'` 且关联终端类型为 `telegram_bot` 时：

```
WorkflowInstanceNode
  → Publisher Agent 的 Skill: SendTelegramMessage
  → terminalService.sendMessage(terminalId, chatId, content)
  → telegramTerminalBridge.publishMessage()
  → telegramProvider.sendMessage()
  → Telegram API
```

publishMessage 的输入：
```json
{
  "terminalId": "xxx",
  "chatId": "-1001234567890",
  "content": {
    "text": "## 今日赛事预告\n\n...",
    "parseMode": "Markdown",
    "imageUrl": null
  }
}
```

### 7.2 Webhook 消息处理（被动响应，第二批）

```
Telegram 推送 Update
  → POST /api/webhook/telegram/:terminalId
  → telegramWebhookHandler.handleUpdate()
  → 转换为 IncomingMessage 标准格式
  → 写入 Message Inbox（04-消息管线定义）
  → Message Router 异步处理
  → Agent 生成回复
  → telegramTerminalBridge.replyToMessage()
  → Telegram API
```

### 7.3 定时任务触发（配合 08-定时调度）

```
定时触发器（每天 08:00）
  → 创建 WorkflowInstance（每日赛事预告流程）
  → Research Node → Content Node → Review Node → Publish Node
  → Publisher Agent → telegramTerminalBridge.publishMessage()
```

---

## 八、一个 Bot 管多群/频道的设计说明

### 为什么不是一个群一个终端？

- 实际运营中，一个 Bot 通常加入多个群（如中文群、英文群、VIP 群）
- 同一个 Bot Token 管理所有群，不应重复创建终端
- 不同群可以有不同的配置（是否自动回复、是否开启欢迎）

### channels 管理机制

- 添加群/频道时，系统调用 `getChat` 验证 Bot 是否在该群中
- 如果 Bot 不在群中，提示用户先将 Bot 添加为群管理员
- 每个群/频道独立配置功能开关
- 发送消息时必须指定目标 chatId

### 群/频道的区别

| 类型 | Telegram 概念 | Bot 能力 |
|------|-------------|---------|
| 频道 (channel) | 广播式，只有管理员能发 | 发消息、编辑、删除、置顶 |
| 群组 (group/supergroup) | 多人聊天 | 发消息、回复、接收消息、管理成员 |
| 私聊 (private) | 1:1 对话 | 全部能力 |

Bot 在频道中只能发布内容，在群组中可以参与互动。系统应根据 chatType 自动适配可用操作。

---

## 九、错误处理与中文映射

### Telegram API 错误码映射

| 错误码/场景 | 英文原文 | 中文映射 |
|------------|---------|---------|
| 401 Unauthorized | Unauthorized | Bot Token 无效或已被撤销 |
| 400 chat not found | Bad Request: chat not found | 找不到该群/频道，请确认 Chat ID 正确 |
| 403 bot was blocked | Forbidden: bot was blocked by the user | Bot 已被用户屏蔽 |
| 403 bot is not a member | Forbidden: bot is not a member | Bot 不是该群成员，请先将 Bot 加入群组 |
| 403 not enough rights | Forbidden: not enough rights to send | Bot 没有发送消息的权限，请设置为管理员 |
| 403 need admin rights | Forbidden: need administrator rights | 此操作需要管理员权限 |
| 429 Too Many Requests | Too Many Requests: retry after N | 请求过于频繁，请 N 秒后重试 |
| 网络超时 | timeout | Telegram API 请求超时，请稍后重试 |
| 网络不可达 | ECONNREFUSED / ENOTFOUND | 无法连接 Telegram 服务器，请检查网络 |

错误映射集中维护在 `server/services/telegramProvider.ts` 内的映射表中。

### 测试连接结果

| 场景 | 中文提示 |
|------|---------|
| Token 有效，Bot 正常 | "Telegram Bot 连接成功：@{username}" |
| Token 无效 | "Bot Token 验证失败，请检查 Token 是否正确" |
| Bot 无法加群 | "Bot 设置不允许加入群组，请在 @BotFather 中开启 Group Privacy" |
| 指定群不存在 | "找不到群/频道 {chatId}，请确认 ID 正确" |
| Bot 不在群中 | "Bot 不是 {chatTitle} 的成员，请先将 Bot 添加到群组" |
| Bot 不是管理员 | "Bot 在 {chatTitle} 中不是管理员，部分功能受限" |

---

## 十、开发批次与交付标准

### 第一批：基础发送能力

**范围**：
- telegramProvider.ts（getMe, getChat, getChatMemberCount, sendMessage, sendPhoto, sendPoll, replyToMessage, pinMessage）
- telegramCredentialStore.ts
- telegramTerminalBridge.ts（创建、验证、频道管理、发送、测试）
- API 路由（管理 + 消息操作）
- SystemTerminalType 种子
- 前端：创建向导 + 详情工作台（概览、频道管理、配置凭证 Tab）
- 标签更新

**验收标准**：
- [ ] 输入 Bot Token 验证成功，显示 Bot 信息
- [ ] 创建 Telegram Bot 终端实例
- [ ] 添加群/频道到管理列表，显示群名称和成员数
- [ ] 向指定群/频道发送文本消息
- [ ] 向指定群/频道发送图片消息
- [ ] 向指定群/频道发送投票
- [ ] 回复特定消息
- [ ] 置顶消息
- [ ] 发送测试消息成功
- [ ] 凭证加密存储，前端只显示掩码
- [ ] 错误提示全部中文
- [ ] 终端详情工作台 Telegram 信息正确显示

### 第二批：Webhook 接收能力

**范围**：
- telegramProvider.ts 补充（setWebhook, deleteWebhook, getWebhookInfo）
- telegramWebhookHandler.ts
- Webhook API 路由
- Webhook 安全验证（secret_token）
- 前端：Webhook 状态显示、配置开关
- 与消息管线（04）对接

**验收标准**：
- [ ] 向 Telegram 注册 Webhook 成功
- [ ] 收到用户消息，正确解析并写入 Inbox
- [ ] 收到命令消息（/xxx），正确分类
- [ ] 收到新成员加入事件，正确识别
- [ ] 收到按钮回调，正确处理
- [ ] Webhook secret_token 验证生效
- [ ] 前端显示 Webhook 状态
- [ ] 可启用/停用 Webhook

### 第三批：群管理能力

**范围**：
- telegramProvider.ts 补充（deleteMessage, banChatMember, restrictChatMember）
- API 路由补充
- 前端：管理操作入口

**验收标准**：
- [ ] 删除指定消息
- [ ] 封禁成员（预留）
- [ ] 限制成员权限（预留）

---

## 十一、与其他开发文档的接口约定

### 与 04-消息管线 的接口

Webhook Handler 输出的标准消息格式（由 03 文档定义，此处约定字段）：

```
IncomingMessage:
  id:               唯一 ID
  terminalId:       来源终端 ID
  terminalType:     'telegram_bot'
  projectId:        关联项目（通过终端绑定推导）
  chatId:           Telegram chat ID
  chatType:         'private' | 'group' | 'supergroup' | 'channel'
  fromUserId:       发送者 Telegram user ID
  fromUsername:      发送者用户名
  messageType:      'text' | 'command' | 'callback' | 'member_join' | 'member_leave' | 'photo' | 'other'
  command:          命令名（如 'predict'），仅 messageType=command 时有值
  commandArgs:      命令参数
  content:          消息文本内容
  replyToMessageId: 回复的消息 ID（如有）
  callbackData:     按钮回调数据（仅 messageType=callback）
  rawUpdate:        原始 Telegram Update JSON（用于调试）
  receivedAt:       接收时间
  processStatus:    'pending'
```

### 与 05-Interaction Agent 的接口

Interaction Agent 通过以下方式调用终端发送回复：

```
Agent Skill: SendTelegramReply
  输入: terminalId, chatId, replyToMessageId, replyText, parseMode
  调用: telegramTerminalBridge.replyToMessage()
  输出: PublishResult
```

### 与 06-Community Manager Agent 的接口

Community Manager Agent 通过以下 Skill 调用终端：

```
Skill: SendWelcomeMessage  → telegramTerminalBridge.publishMessage()
Skill: CreatePoll          → telegramTerminalBridge.publishPoll()
Skill: PinMessage          → telegramTerminalBridge.pinMessage()
Skill: DeleteMessage       → telegramTerminalBridge.deleteMessage()（第三批）
```

### 与 10-执行闭环 的接口

主动推送流程的 Publish 节点通过 workflowNodeExecutor 调用：

```
workflowNodeExecutor
  → 判断终端类型为 telegram_bot
  → telegramTerminalBridge.publishMessage(terminalId, chatId, content)
  → 返回 PublishResult
  → 写入 WorkflowInstanceNode.resultSummary
```
