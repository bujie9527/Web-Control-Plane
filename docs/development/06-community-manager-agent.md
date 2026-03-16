# 06 — Community Manager Agent（社群管理 Agent）

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：Skill 执行引擎（03）、消息管线（04）、Telegram Webhook（02 第二批）
> 后续依赖：被动响应闭环（10）
> 实用化案例：体育赛事预测 Bot — 自动欢迎新人、发起赛事投票、置顶重要预测、清理广告

---

## 一、Agent 定位

Community Manager Agent 是系统中负责**社群运营管理**的协调类 Agent。它不参与对话回复，而是处理群组层面的管理事务：成员变动、内容管理、氛围营造、互动引导。

**它不是**：
- 聊天机器人（用户对话由 Interaction Agent 处理）
- 内容创作者（长文创作由 Content Creator 处理）
- 审核 Agent（内容发布前审核由 Content Reviewer 处理）
- 群主本人（它是群主的自动化助手，执行可量化的管理操作）

**它是**：
- 群组成员事件的自动响应者（入群、退群）
- 群组氛围的营造者（投票、话题引导、置顶）
- 群组纪律的维护者（广告清理、违规预警）
- 群组数据的记录者（成员增长、活跃度、互动数据）

### 与其他 Agent 的边界

| 场景 | 处理者 | 原因 |
|------|-------|------|
| 新人加群 | **Community Manager** | 成员事件，非对话 |
| 用户发问"今晚有什么比赛" | Interaction Agent | 用户对话问答 |
| 发起"今晚谁赢"投票 | **Community Manager** | 互动引导 |
| 写一篇赛事预测长文 | Content Creator | 内容创作 |
| 将预测结果发到群里 | Publisher Agent | 内容发布 |
| 置顶已发布的预测内容 | **Community Manager** | 内容管理 |
| 群里出现广告链接 | **Community Manager** | 群组纪律 |
| 统计本周群活跃度 | **Community Manager** | 数据记录 |
| 定时发送每日赛程 | Content Creator + Publisher | 定时推送，非社群管理 |

### 核心原则

Community Manager 的操作本质是**对 Telegram Bot API 的结构化调用**，大部分操作不需要 LLM 参与。LLM 只在需要生成自然语言内容时介入（如欢迎语、话题引导语）。

```
成员事件/管理触发 → 选择 Skill → 大部分直接调 API → 少部分需 LLM 生成文案 → 执行
```

---

## 二、Agent 模板定义

### 2.1 AgentTemplate 种子

```
AgentTemplate:
  id:                     'at-community-manager'
  name:                   'Community Manager Agent'
  nameZh:                 '社群管理 Agent'
  code:                   'community-manager'
  category:               'coordination'
  roleType:               'manager'
  domain:                 'general'
  description:            '负责群组成员管理、氛围营造、纪律维护、互动引导和数据统计'
  status:                 'active'
  isSystemPreset:         true
  isCloneable:            true

  systemPromptTemplate:   见 2.2
  instructionTemplate:    见 2.3
  outputFormat:           'json'

  supportedSkillIds:      [
    'skill-welcome-member',
    'skill-farewell-member',
    'skill-create-poll',
    'skill-pin-message',
    'skill-delete-message',
    'skill-generate-topic-prompt',
    'skill-community-stats'
  ]
  defaultExecutorType:    'hybrid'
  allowedTerminalTypes:   '["telegram"]'

  supportedProjectTypeIds: '["pt-social-media", "pt-account-operation"]'

  channelStyleProfiles:   见第四节

  temperature:            0.6
  maxTokens:              512

  requireIdentityContext: true
  requireStructuredOutput: true
  disallowDirectTerminalAction: false  // Community Manager 需要直接操作终端
```

### 2.2 System Prompt Template

```
你是一个社群管理助手，负责维护群组的日常运营秩序。

核心规则：
1. 你管理群组，不参与对话。成员问问题不由你回答
2. 生成的文案（欢迎语、话题引导等）必须符合 Identity 人设
3. 管理操作要果断但有礼，不要过度打扰群成员
4. 所有操作必须输出结构化 JSON，由系统执行
5. 不要生成超过 3 句话的管理消息
```

### 2.3 Instruction Template

```
社群管理指令：
- 欢迎新人时提及群的主题和规则
- 投票选项不超过 6 个
- 置顶消息前确认内容属于本群主题
- 删除消息只针对明确违规内容（广告、诈骗链接、无关推广）
- 话题引导消息应该自然，像群主在聊天而不是机器人在通知
- 统计数据输出要简洁，适合发到群里展示
```

---

## 三、触发机制

Community Manager 与 Interaction Agent 最大的区别是**触发方式不同**。

### 3.1 事件驱动触发（主要方式）

由消息管线 Router 根据消息类型自动路由：

| Telegram Update 类型 | 事件 | 触发 Skill |
|---------------------|------|-----------|
| `new_chat_members` | 新成员加入 | WelcomeNewMember |
| `left_chat_member` | 成员离开 | FarewellMember |
| 含可疑链接的 `message` | 疑似广告 | DeleteMessage（需确认） |

### 3.2 定时触发

由定时任务调度系统（09）触发：

| 定时规则 | 触发 Skill |
|---------|-----------|
| 每日 09:00 | GenerateTopicPrompt（话题引导） |
| 每周一 10:00 | CommunityStats（周报统计） |
| 赛事前 2 小时 | CreateInteractivePoll（赛事预测投票） |

### 3.3 手动触发

运营人员通过 Runtime Center 手动触发：

| 操作 | 触发 Skill |
|------|-----------|
| 置顶某条消息 | PinImportantMessage |
| 发起自定义投票 | CreateInteractivePoll |
| 查看群活跃数据 | CommunityStats |

### 3.4 消息管线路由规则

在消息管线（04）的 Router 中，Community Manager 的路由优先级**高于** Interaction Agent：

```
路由优先级（从高到低）：
1. 系统命令（/start, /help 等）→ 命令处理器
2. 成员事件（join/leave）→ Community Manager
3. 疑似违规内容 → Community Manager（评估后决定是否删除）
4. @Bot 的消息 / 私聊消息 → Interaction Agent
5. 群内普通消息 → 忽略（控制成本）
```

---

## 四、Skill 清单

### 4.1 核心 Skill（群组管理）

| Skill | code | executionType | 说明 |
|-------|------|--------------|------|
| **欢迎新成员** | WELCOME_MEMBER | hybrid | LLM 生成欢迎语 + Telegram API 发送 |
| **欢送离群** | FAREWELL_MEMBER | external_api | 可选的离群提示（大多数场景静默） |
| **发起投票** | CREATE_POLL | external_api | 调 Telegram sendPoll API |
| **置顶消息** | PIN_MESSAGE | external_api | 调 Telegram pinChatMessage API |
| **删除消息** | DELETE_MESSAGE | external_api | 调 Telegram deleteMessage API |

### 4.2 氛围与运营 Skill

| Skill | code | executionType | 说明 |
|-------|------|--------------|------|
| **话题引导** | GENERATE_TOPIC_PROMPT | hybrid | LLM 生成话题 + 发到群里 |
| **群统计** | COMMUNITY_STATS | internal_api | 从系统内统计消息数、成员数等 |

### 4.3 执行方式分布

```
7 个 Skill 中：
- 4 个是 external_api（FAREWELL_MEMBER, CREATE_POLL, PIN_MESSAGE, DELETE_MESSAGE）
- 2 个是 hybrid（WELCOME_MEMBER, GENERATE_TOPIC_PROMPT：先 LLM 生成文案，再调 API 发送）
- 1 个是 internal_api（COMMUNITY_STATS：查询系统内部统计数据）

这意味着 Community Manager 的 LLM 消耗极低，主要成本在 API 调用。
```

---

## 五、Skill 详细定义

### 5.1 WelcomeNewMember（欢迎新成员）

```json
{
  "id": "skill-welcome-member",
  "name": "WelcomeNewMember",
  "nameZh": "欢迎新成员",
  "code": "WELCOME_MEMBER",
  "category": "community",
  "executionType": "hybrid",
  "openClawSpecJson": {
    "steps": [
      "读取新成员信息（用户名、加入时间）",
      "结合 Identity 人设和群主题，生成个性化欢迎语",
      "欢迎语控制在 2-3 句话内",
      "通过 Telegram API 发送到群里",
      "记录成员加入事件"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "newMember": {
          "type": "object",
          "properties": {
            "userId": { "type": "number" },
            "firstName": { "type": "string" },
            "lastName": { "type": "string" },
            "username": { "type": "string" }
          },
          "required": ["userId"]
        },
        "chatId": { "type": "number" },
        "groupName": { "type": "string" },
        "groupTopic": { "type": "string" }
      },
      "required": ["newMember", "chatId"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "welcomeMessage": { "type": "string" },
        "sent": { "type": "boolean" },
        "messageId": { "type": "number" }
      },
      "required": ["welcomeMessage", "sent"]
    }
  },
  "promptTemplate": "有一位新成员加入了群组。\n\n群名称：{groupName}\n群主题：{groupTopic}\n新成员：{newMember.firstName}\n\n请以群管理员的身份写一段欢迎语（2-3句，友好自然，提及群主题）。直接输出欢迎语文本。",
  "requiredContextFields": ["identity", "channelStyle"],
  "estimatedDurationMs": 3000,
  "maxRetries": 1
}
```

**执行流程**：

```
new_chat_members 事件
  → Router 识别为成员事件 → 派发 Community Manager
  → 调用 WELCOME_MEMBER Skill
    → 步骤1: LLM 生成欢迎语
      Prompt: "新成员 Alex 加入了【体育预测达人群】..."
      Output: "🎉 欢迎 Alex！这里是体育预测达人的地盘，每天赛事分析+预测，一起赢！有什么想聊的直接开口 🏀"
    → 步骤2: Telegram API sendMessage(chatId, welcomeMessage)
    → 步骤3: 记录事件到 IncomingMessage / 日志
```

### 5.2 CreateInteractivePoll（发起互动投票）

```json
{
  "id": "skill-create-poll",
  "name": "CreateInteractivePoll",
  "nameZh": "创建互动投票",
  "code": "CREATE_POLL",
  "category": "community",
  "executionType": "external_api",
  "openClawSpecJson": {
    "steps": [
      "构造投票参数（问题、选项、是否匿名、是否多选）",
      "调用 Telegram sendPoll API",
      "记录投票消息 ID",
      "可选：置顶投票消息"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "chatId": { "type": "number" },
        "question": { "type": "string", "maxLength": 300 },
        "options": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 2,
          "maxItems": 10
        },
        "isAnonymous": { "type": "boolean", "default": true },
        "allowsMultipleAnswers": { "type": "boolean", "default": false },
        "pinAfterSend": { "type": "boolean", "default": false }
      },
      "required": ["chatId", "question", "options"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "pollMessageId": { "type": "number" },
        "sent": { "type": "boolean" },
        "pinned": { "type": "boolean" }
      },
      "required": ["sent"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "telegram",
    "method": "sendPoll",
    "requiresCredential": true,
    "credentialType": "telegram_bot_token"
  },
  "estimatedDurationMs": 2000,
  "maxRetries": 2
}
```

**实用示例**：

```
定时触发：赛前 2 小时
  → 调用 CREATE_POLL Skill
    question: "🏀 今晚 NBA 湖人 vs 凯尔特人，你看好谁？"
    options: ["湖人 🟡", "凯尔特人 🟢", "大小分 Over", "大小分 Under"]
    isAnonymous: false
    pinAfterSend: true
  → Telegram sendPoll API
  → 投票消息发到群里并置顶
```

### 5.3 PinImportantMessage（置顶消息）

```json
{
  "id": "skill-pin-message",
  "name": "PinImportantMessage",
  "nameZh": "置顶重要消息",
  "code": "PIN_MESSAGE",
  "category": "community",
  "executionType": "external_api",
  "openClawSpecJson": {
    "steps": [
      "验证目标消息存在",
      "调用 Telegram pinChatMessage API",
      "可选：关闭置顶通知以避免打扰"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "chatId": { "type": "number" },
        "messageId": { "type": "number" },
        "disableNotification": { "type": "boolean", "default": false }
      },
      "required": ["chatId", "messageId"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "pinned": { "type": "boolean" }
      },
      "required": ["pinned"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "telegram",
    "method": "pinChatMessage",
    "requiresCredential": true,
    "credentialType": "telegram_bot_token"
  },
  "estimatedDurationMs": 1000,
  "maxRetries": 2
}
```

### 5.4 DeleteMessage（删除消息）

```json
{
  "id": "skill-delete-message",
  "name": "DeleteMessage",
  "nameZh": "删除违规消息",
  "code": "DELETE_MESSAGE",
  "category": "community",
  "executionType": "external_api",
  "openClawSpecJson": {
    "steps": [
      "确认消息违反群规则（广告、诈骗链接、无关推广）",
      "调用 Telegram deleteMessage API",
      "可选：发送警告消息给违规用户",
      "记录删除事件"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "chatId": { "type": "number" },
        "messageId": { "type": "number" },
        "reason": {
          "type": "string",
          "enum": ["spam", "scam_link", "off_topic_promo", "manual"]
        },
        "sendWarning": { "type": "boolean", "default": false },
        "warningText": { "type": "string" }
      },
      "required": ["chatId", "messageId", "reason"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "deleted": { "type": "boolean" },
        "warningSent": { "type": "boolean" }
      },
      "required": ["deleted"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "telegram",
    "method": "deleteMessage",
    "requiresCredential": true,
    "credentialType": "telegram_bot_token"
  },
  "estimatedDurationMs": 1000,
  "maxRetries": 1
}
```

### 5.5 GenerateTopicPrompt（话题引导）

```json
{
  "id": "skill-generate-topic-prompt",
  "name": "GenerateTopicPrompt",
  "nameZh": "生成话题引导",
  "code": "GENERATE_TOPIC_PROMPT",
  "category": "community",
  "executionType": "hybrid",
  "openClawSpecJson": {
    "steps": [
      "了解群主题和当前热点（可选搜索）",
      "结合 Identity 人设生成一段话题引导文案",
      "文案应自然，像群主在发起讨论",
      "发送到群里"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "chatId": { "type": "number" },
        "groupTopic": { "type": "string" },
        "recentTopics": { "type": "array", "items": { "type": "string" } },
        "hotEvents": { "type": "string", "description": "当天热点事件概要（可选）" }
      },
      "required": ["chatId", "groupTopic"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "topicMessage": { "type": "string" },
        "sent": { "type": "boolean" },
        "messageId": { "type": "number" }
      },
      "required": ["topicMessage", "sent"]
    }
  },
  "promptTemplate": "你是一个群管理员，需要在群里发起一个讨论话题。\n\n群主题：{groupTopic}\n最近聊过的话题：{recentTopics}\n今日热点：{hotEvents}\n\n请生成一段自然的话题引导（1-2句，像群主随口聊天，不要像通知公告）。",
  "requiredContextFields": ["identity", "channelStyle"],
  "estimatedDurationMs": 3000,
  "maxRetries": 1
}
```

**实用示例**：

```
每日 09:00 定时触发
  → 调用 GENERATE_TOPIC_PROMPT Skill
    groupTopic: "体育赛事预测"
    hotEvents: "今晚 NBA 全明星赛，勇士主场对阵..."
  → LLM 生成：
    "早上好各位！🏀 今晚全明星赛大家都看好谁？我觉得东部阵容今年实力太猛了，西部得靠约基奇扛。你们觉得呢？"
  → Telegram sendMessage
```

### 5.6 CommunityStats（群统计）

```json
{
  "id": "skill-community-stats",
  "name": "CommunityStats",
  "nameZh": "社群统计报告",
  "code": "COMMUNITY_STATS",
  "category": "community",
  "executionType": "internal_api",
  "openClawSpecJson": {
    "steps": [
      "查询指定时间范围内的群消息数量",
      "统计新增/流失成员",
      "统计互动率（发言人数/总成员）",
      "统计投票参与率",
      "整理为结构化报告"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "chatId": { "type": "number" },
        "period": {
          "type": "string",
          "enum": ["daily", "weekly", "monthly"]
        },
        "sendToGroup": { "type": "boolean", "default": false }
      },
      "required": ["chatId", "period"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "totalMembers": { "type": "number" },
        "newMembers": { "type": "number" },
        "leftMembers": { "type": "number" },
        "totalMessages": { "type": "number" },
        "activeUsers": { "type": "number" },
        "interactionRate": { "type": "number", "description": "0-1，活跃人数/总人数" },
        "pollCount": { "type": "number" },
        "avgPollParticipation": { "type": "number" },
        "topContributors": {
          "type": "array",
          "items": { "type": "object" }
        }
      },
      "required": ["totalMembers", "totalMessages", "activeUsers"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "internal",
    "method": "GET /api/community/stats",
    "requiresAuth": true
  },
  "estimatedDurationMs": 2000,
  "maxRetries": 1
}
```

### 5.7 FarewellMember（成员离群）

```json
{
  "id": "skill-farewell-member",
  "name": "FarewellMember",
  "nameZh": "成员离群处理",
  "code": "FAREWELL_MEMBER",
  "category": "community",
  "executionType": "external_api",
  "openClawSpecJson": {
    "steps": [
      "记录成员离群事件",
      "根据配置决定是否发送离群提示",
      "默认静默处理，不打扰群友"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "leftMember": {
          "type": "object",
          "properties": {
            "userId": { "type": "number" },
            "firstName": { "type": "string" }
          }
        },
        "chatId": { "type": "number" },
        "sendFarewell": { "type": "boolean", "default": false }
      },
      "required": ["leftMember", "chatId"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "recorded": { "type": "boolean" },
        "farewellSent": { "type": "boolean" }
      },
      "required": ["recorded"]
    }
  },
  "estimatedDurationMs": 500,
  "maxRetries": 0
}
```

---

## 六、渠道适配

### 6.1 channelStyleProfiles

```json
{
  "telegram_bot": {
    "styleName": "Telegram 群管理",
    "styleInstruction": "管理消息简短有力。欢迎语 2-3 句，可用 emoji。话题引导要像群主随口聊，不像公告。投票问题简洁明了。警告消息措辞温和但明确。",
    "maxLength": 200,
    "format": "text"
  }
}
```

当前阶段 Community Manager 仅支持 Telegram。后续扩展其他平台时（如 Discord、WhatsApp Group），新增对应 channelStyleProfile 即可。

### 6.2 同一 Agent 不同项目表现

| 项目 | Identity | 欢迎语风格 | 话题风格 |
|------|---------|-----------|---------|
| 体育预测 Bot | 体育预测达人 | "🎉 欢迎！这里每天赛事预测，跟上不亏！" | "今晚全明星你看好谁？" |
| 科技资讯 Bot | 科技博主 | "Welcome！这里聊最新科技动态 🚀" | "GPT-5 发布了，大家觉得能用来干嘛？" |
| 投资交流群 | 投资分析师 | "欢迎加入！群内仅交流，不荐股。" | "美联储今天表态了，怎么看？" |

---

## 七、违规内容判定

### 7.1 判定策略

当前阶段使用**规则优先 + LLM 兜底**的混合策略：

**规则层（零成本，优先匹配）**：

| 规则 | 判定 | 动作 |
|------|------|------|
| 消息含已知广告域名列表 | spam | 删除 |
| 消息含诈骗关键词（"免费领""私聊转账"） | scam_link | 删除 + 警告 |
| 新成员首条消息即含链接 | spam（高概率） | 删除 |
| 转发自已知营销频道 | off_topic_promo | 删除 |

**LLM 兜底层（仅规则无法判定时调用）**：

```
如果规则层未匹配但内容可疑（如含链接但不在已知列表中）：
  → 调用 LLM 分类：是否为广告/诈骗/无关推广
  → 仅当 LLM confidence > 0.8 时执行删除
  → 否则标记为需人工审核
```

### 7.2 安全边界

- **宁可放过，不可误删**：不确定的内容不删除，标记人工审核
- **删除必须记录**：每次删除写入日志（消息内容快照、删除原因、操作时间）
- **不静默封禁**：当前阶段不做封禁能力，只做消息删除和警告
- **运营人员可回溯**：Runtime Center 可查看所有删除记录

---

## 八、执行流程详解

### 8.1 新成员入群

```
Telegram Update: new_chat_members
  │
  ↓
消息管线 Inbox → 存储 IncomingMessage (type: member_join)
  ↓
Router: 识别为成员事件 → dispatch Community Manager
  ↓
Agent Dispatcher:
  1. 加载 AgentTemplate(at-community-manager)
  2. 加载 Identity（项目绑定）
  3. 加载渠道风格（telegram_bot）
  4. 调用 Skill: WELCOME_MEMBER
     │
     ├→ LLM 生成欢迎语（~2s）
     │   Input: { firstName: "Alex", groupTopic: "体育赛事预测" }
     │   Output: "🎉 欢迎 Alex！这里是体育预测达人的地盘..."
     │
     └→ Telegram API: sendMessage(chatId, welcomeMessage)
  │
  ↓
记录事件 → IncomingMessage.status = responded
```

延迟：~3 秒

### 8.2 疑似广告处理

```
Telegram Update: message (含链接)
  │
  ↓
消息管线 Inbox → 存储
  ↓
Router:
  → 规则检查: 链接在已知广告域名列表中？
    → 是 → dispatch Community Manager → DELETE_MESSAGE
    → 否 → 链接可疑？（新成员首条含链接 / 短链接）
      → 是 → dispatch Community Manager → LLM 评估 → 决定删除或放过
      → 否 → 普通消息处理流程
```

### 8.3 定时投票发起

```
定时调度触发: "赛前 2 小时"
  │
  ↓
创建 WorkflowInstance → 执行节点
  ↓
节点绑定 Community Manager + Skill: CREATE_POLL
  ↓
Skill 执行引擎:
  → 构造投票参数:
    question: "🏀 今晚 NBA 湖人 vs 凯尔特人，你看好谁？"
    options: ["湖人 🟡", "凯尔特人 🟢", "大分 Over 218.5", "小分 Under 218.5"]
    pinAfterSend: true
  → Telegram API: sendPoll(chatId, question, options)
  → Telegram API: pinChatMessage(chatId, pollMessageId)
```

延迟：~2 秒（纯 API 调用，无 LLM）

---

## 九、数据记录与反馈

Community Manager 是群运营数据的核心采集点。所有操作都产出可统计的数据。

### 9.1 采集数据项

| 数据 | 来源 | 存储 |
|------|------|------|
| 成员加入/离开 | Webhook 事件 | IncomingMessage + 计数 |
| 消息数量 | Webhook 消息 | IncomingMessage |
| 投票参与率 | Telegram poll_answer | IncomingMessage |
| 活跃用户数 | 按发言去重统计 | 内部统计查询 |
| 删除消息数 | DELETE_MESSAGE 执行记录 | 操作日志 |
| Bot 响应数 | OutgoingMessage | OutgoingMessage |

### 9.2 统计维度

CommunityStats Skill 输出的数据，为结果汇报（11）提供基础：

```json
{
  "period": "weekly",
  "chatName": "体育预测达人群",
  "stats": {
    "totalMembers": 156,
    "newMembers": 23,
    "leftMembers": 5,
    "netGrowth": 18,
    "totalMessages": 487,
    "activeUsers": 67,
    "interactionRate": 0.43,
    "pollCount": 7,
    "avgPollParticipation": 0.38,
    "deletedMessages": 3,
    "botResponses": 45,
    "topContributors": [
      { "username": "sports_fan_01", "messageCount": 34 },
      { "username": "nba_lover", "messageCount": 28 }
    ]
  }
}
```

### 9.3 可发群的周报摘要

当 `sendToGroup: true` 时，将统计数据格式化为群友可读的消息：

```
📊 本周群数据（3/10 - 3/16）

👥 成员：156 人（+18）
💬 消息：487 条
🔥 活跃用户：67 人（43%）
🗳 投票：7 场，平均 38% 参与

🏆 本周话痨 TOP 3：
1. @sports_fan_01（34 条）
2. @nba_lover（28 条）
3. @basketball_king（25 条）

继续保持！下周更精彩 🏀
```

---

## 十、错误处理

| 场景 | 处理方式 | 对群影响 |
|------|---------|---------|
| 欢迎语 LLM 调用失败 | 使用预设默认欢迎语 | 无感知（降级到模板欢迎语） |
| Telegram API 调用失败 | 重试 2 次，仍失败记录日志 | 操作未执行，运营人员在日志中看到 |
| Bot 无管理员权限 | 捕获 403 错误，提示需要授权 | 操作未执行 + 中文提示 |
| 投票选项超出限制 | 截断到 10 个选项 | 投票仍可发出 |
| 统计查询超时 | 返回部分数据 + 错误标记 | 报告不完整但不阻塞 |

### Bot 权限需求

Community Manager 的 Skill 需要 Bot 具备**群管理员权限**，否则部分操作无法执行：

| 操作 | 所需权限 | 缺少时表现 |
|------|---------|-----------|
| 发消息 | 基础权限 | 所有 Bot 都有 |
| 置顶消息 | can_pin_messages | 403 错误 |
| 删除消息 | can_delete_messages | 403 错误 |
| 发起投票 | 基础权限 | 所有 Bot 都有 |
| 查看成员列表 | can_restrict_members | 403 错误 |

终端创建向导（02）中应检查并提示用户将 Bot 设为管理员。

---

## 十一、与 Interaction Agent 的协同

一条消息只会被路由到**一个** Agent 处理，不存在两个 Agent 同时处理同一消息的情况。

```
消息管线 Router:
  ┌─ 成员事件 ──→ Community Manager
  │
  ├─ 疑似违规 ──→ Community Manager
  │
  ├─ @Bot 消息 ──→ Interaction Agent
  │
  ├─ 私聊消息 ──→ Interaction Agent
  │
  └─ 普通群消息 ──→ 忽略
```

但存在**串联场景**：Community Manager 的操作结果可能触发 Interaction Agent。

```
例：Community Manager 删除一条消息 + 发送警告
  → 被警告用户私聊 Bot 申诉
  → Router 识别为私聊 → 派发 Interaction Agent
  → Interaction Agent 理解申诉意图，给出回应
```

这种串联通过消息管线自然串接，不需要 Agent 之间直接通信。

---

## 十二、开发顺序

```
步骤 1: Agent 模板种子
  → 新增 at-community-manager 到 agentTemplateSeed.ts
  → 配置 supportedSkillIds、systemPromptTemplate、channelStyleProfiles

步骤 2: Skill 种子
  → 新增 7 个 Community Skill 到 skillSeed.ts
  → 每个 Skill 完善 openClawSpec、inputSchema、outputSchema、executionConfigJson

步骤 3: 违规检测规则引擎
  → 实现规则层：已知域名列表、关键词匹配、新成员首条链接检测
  → LLM 兜底层接口预留

步骤 4: Telegram API 集成
  → telegramTerminalBridge 中新增 sendPoll、pinMessage、deleteMessage 方法
  → 统一错误处理（权限不足、消息不存在等）

步骤 5: 事件驱动集成
  → 消息管线 Router 中新增成员事件/违规内容路由规则
  → 连接 Community Manager 的 dispatch 逻辑

步骤 6: 定时触发集成
  → 对接定时调度系统（09）
  → 话题引导 + 投票 + 周报的定时规则

步骤 7: 统计与数据
  → CommunityStats Skill 对接 IncomingMessage 统计查询
  → 群内周报格式化输出

步骤 8: 集成测试
  → 新人入群 → 自动欢迎
  → 广告消息 → 自动删除
  → 定时投票 → 自动发起 + 置顶
  → 周报 → 数据准确
```

---

## 十三、验收标准

- [ ] at-community-manager Agent 模板已创建，含完整 systemPrompt 和 channelStyleProfiles
- [ ] WELCOME_MEMBER Skill 可执行：新人入群 → 个性化欢迎语（< 3 秒）
- [ ] CREATE_POLL Skill 可执行：发起投票 + 可选置顶
- [ ] PIN_MESSAGE Skill 可执行：置顶指定消息
- [ ] DELETE_MESSAGE Skill 可执行：删除违规消息 + 可选警告
- [ ] GENERATE_TOPIC_PROMPT Skill 可执行：生成自然的话题引导语
- [ ] COMMUNITY_STATS Skill 可执行：输出结构化统计数据
- [ ] 规则引擎正确识别已知广告域名和诈骗关键词
- [ ] Bot 无管理员权限时，给出中文提示而非静默失败
- [ ] 欢迎语 LLM 失败时，降级到默认模板
- [ ] 不同项目/Identity → 同一 Agent 欢迎语风格不同
- [ ] 周报可发送到群里，数据准确
- [ ] 所有错误提示中文
- [ ] Community Manager 不处理用户对话（由 Interaction Agent 处理）
