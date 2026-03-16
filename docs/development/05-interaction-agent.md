# 05 — Interaction Agent（互动 Agent）

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：Skill 执行引擎（03）、消息管线（04）
> 后续依赖：被动响应闭环（10）
> 实用化案例：体育赛事预测 Bot — 用户问"今晚 NBA 谁赢"，Bot 结合最新数据回复

---

## 一、Agent 定位

Interaction Agent 是系统中负责**实时对话互动**的执行类 Agent。当用户通过终端（Telegram 群/私聊）发来消息时，由消息管线路由到 Interaction Agent 进行理解和回复。

**它不是**：
- 闲聊机器人（有 Identity 边界，超出范围礼貌拒绝）
- Community Manager（不做群管理、不发投票、不管纪律）
- Content Creator（不做长文创作，只做实时对话回复）
- 搜索引擎（可以调 Research 数据，但核心是对话，不是数据展示）

**它是**：
- 终端用户消息的智能响应者
- 身份一致性的守护者（所有回复符合 Identity 人设）
- 对话上下文的维持者（记住之前聊了什么）
- 可跨项目复用的通用互动能力模板

### 与其他 Agent 的边界

| 场景 | 处理者 | 原因 |
|------|-------|------|
| 用户问"今晚有什么比赛" | **Interaction Agent** | 实时对话问答 |
| 用户发 /predict Lakers | **Interaction Agent** | 命令触发的问答 |
| 新人加群 | Community Manager | 成员事件，非对话 |
| 每日定时发赛事预告 | Content Creator + Publisher | 主动推送，非被动对话 |
| 群里出现广告 | Community Manager | 内容管理，非对话 |
| 运营人员说"帮我配置数据源" | Config Agent | 系统配置，非用户对话 |

---

## 二、Agent 模板定义

### 2.1 AgentTemplate 种子

```
AgentTemplate:
  id:                     'at-interaction'
  name:                   'Interaction Agent'
  nameZh:                 '互动对话 Agent'
  code:                   'interaction-agent'
  category:               'execution'
  roleType:               'responder'
  domain:                 'general'
  description:            '实时响应用户消息，理解意图，结合上下文和 Identity 生成回复'
  status:                 'active'
  isSystemPreset:         true
  isCloneable:            true

  systemPromptTemplate:   见 2.2
  instructionTemplate:    见 2.3
  outputFormat:           'text'

  supportedSkillIds:      ['skill-classify-intent', 'skill-generate-reply', 'skill-search-web', 'skill-summarize-research']
  defaultExecutorType:    'llm'
  allowedTerminalTypes:   '["telegram", "web", "api"]'

  supportedProjectTypeIds: '["pt-social-media", "pt-account-operation", "pt-facebook-page"]'

  channelStyleProfiles:   见第四节

  temperature:            0.7
  maxTokens:              1024

  requireIdentityContext: true
  requireStructuredOutput: false
  disallowDirectTerminalAction: true
```

### 2.2 System Prompt Template

```
你是一个智能对话助手，负责在社群和私聊中回应用户的消息。

核心规则：
1. 你必须严格按照 Identity（身份）信息中定义的人设、口吻和知识边界来回复
2. 如果用户的问题超出你的 Identity 知识边界，礼貌说明并建议正确的方向
3. 回复必须简洁有力，适合即时通讯场景，不要写长文
4. 如果提供了对话历史，注意保持上下文连贯
5. 如果提供了搜索/数据结果，基于真实数据回复，不要编造
6. 不要暴露你是 AI 的事实，除非用户直接追问
```

### 2.3 Instruction Template

```
回复要求：
- 控制在 200 字以内（除非问题确实需要详细解答）
- 语气和风格必须与 Identity 描述一致
- 如果是回复群消息，可以适当使用 emoji
- 如果需要引用数据，标注来源
- 不要使用 Markdown 标题格式（即时通讯场景不适合）
- 直接回答问题，不要加"好的，让我来回答"之类的开场白
```

---

## 三、Skill 清单

### 3.1 核心 Skill

| Skill | code | executionType | 触发条件 | 说明 |
|-------|------|--------------|---------|------|
| **意图分类** | CLASSIFY_INTENT | llm | 每条消息（可选） | 判断用户想要什么 |
| **上下文回复** | GENERATE_REPLY | llm | 路由到 Interaction Agent 的消息 | 生成符合人设的回复 |

### 3.2 辅助 Skill（按需调用）

| Skill | code | executionType | 触发条件 | 说明 |
|-------|------|--------------|---------|------|
| **Web 搜索** | SEARCH_WEB | external_api | 用户问题需要最新数据时 | 调 Tavily 搜索 |
| **素材汇总** | SUMMARIZE_RESEARCH | llm | 搜索结果需要整理时 | 将搜索结果压缩为可用上下文 |

### 3.3 执行策略

并非每条消息都需要调用全部 Skill。执行策略：

**快速路径（大多数消息）**：
```
用户消息 → GENERATE_REPLY（直接用对话历史 + Identity 生成回复）
```

**数据增强路径（需要外部信息）**：
```
用户消息 → CLASSIFY_INTENT（判断是否需要搜索）
  → 需要 → SEARCH_WEB → SUMMARIZE_RESEARCH → GENERATE_REPLY
  → 不需要 → GENERATE_REPLY
```

路径选择由 Router 或 Agent 自身判断。当前阶段推荐由 Agent 在 GENERATE_REPLY 中自行判断是否调用搜索，通过 Skill 的 hybrid 模式实现。

---

## 四、渠道适配

### 4.1 channelStyleProfiles

```json
{
  "telegram_bot": {
    "styleName": "Telegram 即时对话",
    "styleInstruction": "回复简洁直接，200 字以内。可用 emoji（每条 1-3 个）。支持 Markdown 加粗和斜体。不用标题格式。群里回复可以更轻松，私聊可以更详细。",
    "maxLength": 300,
    "format": "markdown"
  },
  "web_chat": {
    "styleName": "网页在线客服",
    "styleInstruction": "回复专业清晰，可以稍长（300-500 字）。使用段落分隔。语气正式但友好。可以使用列表格式。",
    "maxLength": 500,
    "format": "markdown"
  }
}
```

### 4.2 同一 Agent，不同项目表现

| 项目 | Identity | 渠道 | 回复风格 |
|------|---------|------|---------|
| 体育预测 Bot | 体育预测达人 | Telegram 群 | "🏀 今晚湖人 vs 凯尔特人，我看好绿军 -5.5。凯子主场 12 连胜，防守联盟第一。" |
| 科技资讯 Bot | 科技博主 | Telegram 频道 | "刚看到 OpenAI 发了新模型，性能提升 30%。不过价格也涨了，各位开发者钱包要注意了 😅" |
| 客服 Bot | 客服代表 | 网页聊天 | "您好，关于您提到的订单问题，我已查询到相关信息。您的订单 #12345 目前状态为..." |

---

## 五、Skill 详细定义

### 5.1 ClassifyUserIntent（意图分类）

```json
{
  "id": "skill-classify-intent",
  "name": "ClassifyUserIntent",
  "nameZh": "用户意图分类",
  "code": "CLASSIFY_INTENT",
  "category": "interaction",
  "executionType": "llm",
  "openClawSpecJson": {
    "steps": [
      "阅读用户消息内容",
      "结合对话历史理解上下文",
      "判断用户意图类别",
      "判断是否需要外部数据支持",
      "输出分类结果"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "message": { "type": "string", "description": "用户消息" },
        "conversationHistory": { "type": "array", "description": "对话历史" },
        "identityDomain": { "type": "string", "description": "Identity 的领域" }
      },
      "required": ["message"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "intent": {
          "type": "string",
          "enum": ["question", "data_query", "opinion", "greeting", "off_topic", "command", "feedback"]
        },
        "needsExternalData": { "type": "boolean" },
        "suggestedSearchQuery": { "type": "string" },
        "confidence": { "type": "number" }
      },
      "required": ["intent", "needsExternalData"]
    }
  },
  "promptTemplate": "分析以下用户消息的意图。\n\n消息：{message}\n对话历史：{conversationHistory}\n该 Bot 的领域：{identityDomain}\n\n按 JSON 输出 intent、needsExternalData、suggestedSearchQuery、confidence。",
  "estimatedDurationMs": 2000,
  "maxRetries": 1
}
```

意图分类表：

| intent | 含义 | 后续动作 |
|--------|------|---------|
| `question` | 领域内问题 | GENERATE_REPLY（可能需搜索） |
| `data_query` | 明确的数据查询 | SEARCH_WEB → GENERATE_REPLY |
| `opinion` | 征求观点 | GENERATE_REPLY |
| `greeting` | 问好/打招呼 | GENERATE_REPLY（快速路径） |
| `off_topic` | 超出领域 | GENERATE_REPLY（礼貌拒绝） |
| `command` | 命令格式 | 路由到命令处理 |
| `feedback` | 用户反馈 | GENERATE_REPLY + 记录 |

### 5.2 GenerateContextualReply（上下文回复）

```json
{
  "id": "skill-generate-reply",
  "name": "GenerateContextualReply",
  "nameZh": "上下文对话回复",
  "code": "GENERATE_REPLY",
  "category": "interaction",
  "executionType": "llm",
  "openClawSpecJson": {
    "steps": [
      "理解用户当前消息的核心问题",
      "回顾对话历史，保持上下文连贯",
      "按 Identity 人设确定回复口吻和立场",
      "如果有搜索数据，基于真实数据回复",
      "按渠道风格调整格式和篇幅",
      "确保回复在 Identity 知识边界内",
      "生成最终回复"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "message": { "type": "string" },
        "conversationHistory": { "type": "array" },
        "searchResults": { "type": "object", "description": "可选的搜索结果" }
      },
      "required": ["message"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "reply": { "type": "string" },
        "parseMode": { "type": "string", "enum": ["Markdown", "HTML", "text"] },
        "confidence": { "type": "number" }
      },
      "required": ["reply"]
    }
  },
  "promptTemplate": "用户说：{message}\n\n{conversationHistory}\n\n{searchResults}\n\n请以 Identity 身份回复，直接输出回复内容。",
  "requiredContextFields": ["identity", "channelStyle"],
  "estimatedDurationMs": 3000,
  "maxRetries": 1
}
```

---

## 六、执行流程详解

### 6.1 快速回复流程（无需搜索）

```
消息管线 Router → dispatch Interaction Agent
  │
  ↓
Agent Dispatcher:
  1. 加载 AgentTemplate(at-interaction)
  2. 加载 Identity（项目绑定）
  3. 加载渠道风格（telegram_bot）
  4. 加载对话历史（最近 5 条）
  5. 调用 Skill: GENERATE_REPLY
     │
     ↓
  Skill 执行引擎:
     → Prompt 组装（7 层）:
       System: "你是一个智能对话助手..."
       Skill Steps: "1.理解问题 2.回顾历史 3.按人设回复..."
       Identity: "体育预测达人，风格幽默、数据驱动"
       Channel: "Telegram 200字以内，可用 emoji"
       Project: "重点关注 NBA 和英超"
       Template: "用户说：{message}"
       Input: "今晚 NBA 有什么比赛？"
     → LLM Executor → OpenAI
     → 输出: "🏀 今晚 NBA 三场比赛：\n湖人 vs 凯尔特人 8:00\n勇士 vs 太阳 10:30\n..."
  │
  ↓
Response Sender → telegramTerminalBridge.replyToMessage()
```

延迟预估：~2-4 秒（LLM 调用 1 次）

### 6.2 数据增强回复流程（需要搜索）

```
消息管线 Router → dispatch Interaction Agent
  │
  ↓
Agent Dispatcher:
  1-4. 同上
  5. 调用 Skill: CLASSIFY_INTENT
     → 输出: { intent: "data_query", needsExternalData: true, suggestedSearchQuery: "Lakers vs Celtics prediction March 17 2026" }
  6. 调用 Skill: SEARCH_WEB
     → Tavily API 搜索
     → 输出: { results: [...], answer: "..." }
  7. 调用 Skill: GENERATE_REPLY（携带搜索结果）
     → 基于真实数据生成回复
     → 输出: "🏀 湖人 vs 凯尔特人预测：\n根据最新伤病报告，詹姆斯确认出战但..."
  │
  ↓
Response Sender → replyToMessage()
```

延迟预估：~5-8 秒（LLM 2 次 + 搜索 1 次）

### 6.3 超出领域的处理

```
用户: "帮我订个机票"
  → CLASSIFY_INTENT: { intent: "off_topic", needsExternalData: false }
  → GENERATE_REPLY（知道是 off_topic）
  → "哈哈，订机票不是我的强项 😄 我是体育预测达人，赛事分析和预测找我就对了！有什么比赛想了解的？"
```

---

## 七、对话上下文使用规范

### 7.1 上下文窗口

| 场景 | 历史消息数 | 说明 |
|------|-----------|------|
| 普通对话 | 最近 5 条 | 够用于维持短期上下文 |
| 深度讨论 | 最近 10 条 | 当对话主题一致且持续时 |
| 新会话 | 0 条 + contextSummary | 超过 30 分钟无消息后的新对话，用摘要代替 |

### 7.2 对话历史格式

传入 LLM 的对话历史格式：

```
之前的对话：
[用户] 今晚有什么 NBA 比赛？
[助手] 今晚有三场比赛：湖人vs凯尔特人...
[用户] 湖人凯尔特人你怎么看？   ← 当前消息
```

### 7.3 上下文摘要触发

当 Conversation.messageCount 达到 20 条时，自动触发摘要生成：

```
调用 LLM:
  "请总结以下对话的要点（3-5 句话），保留关键信息和用户偏好：\n{fullHistory}"
  → 输出写入 Conversation.contextSummary
```

后续对话使用摘要 + 最近 5 条，避免 Token 浪费。

---

## 八、错误处理

| 场景 | 处理方式 | 回复用户 |
|------|---------|---------|
| LLM 调用超时 | 重试 1 次，仍失败则标记 failed | "抱歉，我现在有点忙，稍后再来问我吧 😅" |
| LLM 返回空内容 | 标记 failed | "嗯...这个问题把我难住了，换个方式问问？" |
| 搜索 API 失败 | 跳过搜索，走快速路径 | 正常回复（但不含外部数据） |
| Identity 未配置 | 使用 Agent 默认人设 | 正常回复（但语气可能不够个性化） |
| 对话历史加载失败 | 不传历史，当作新对话 | 正常回复（但可能缺乏上下文） |

所有错误回复必须符合 Identity 人设的语气风格。

---

## 九、性能与成本

### 9.1 响应延迟目标

| 路径 | 目标延迟 | LLM 调用次数 |
|------|---------|-------------|
| 快速回复 | < 4 秒 | 1 次 |
| 数据增强 | < 8 秒 | 2 次 + 1 次 API |
| 超时上限 | 15 秒 | 超时返回错误回复 |

### 9.2 优化策略

1. **跳过意图分类**：对于简单消息直接走 GENERATE_REPLY，让模型自己判断是否需要数据
2. **搜索结果缓存**：相同关键词 5 分钟内复用缓存
3. **轻量模型意图分类**：CLASSIFY_INTENT 可以用更便宜的模型（通过 Skill 级别的模型配置覆盖）
4. **对话摘要复用**：摘要只在消息数阈值时更新，不是每条都更新

---

## 十、Agent 模板复用说明

### 10.1 复用方式

at-interaction 是**平台级通用模板**。不同项目使用时**不需要复制**，通过以下方式差异化：

| 差异化维度 | 配置位置 | 举例 |
|-----------|---------|------|
| 人设和口吻 | Identity | 体育专家 vs 科技博主 vs 客服 |
| 知识边界 | Identity.contentDirections | 体育/科技/电商 |
| 渠道风格 | AgentTemplate.channelStyleProfiles | Telegram vs 网页 |
| 项目指令 | ProjectAgentConfig.instructionOverride | "重点 NBA 和英超" |
| 模型选择 | ProjectAgentConfig.modelConfigIdOverride | GPT-4o vs GPT-4o-mini |

### 10.2 何时需要克隆

只有以下情况需要从 at-interaction 克隆新模板：

- 需要修改 `systemPromptTemplate`（核心行为规则不同）
- 需要不同的 `supportedSkillIds`（如客服版需要订单查询 Skill）
- 需要不同的 Guardrails（如严格版禁止闲聊）

克隆后保持 `sourceTemplateId: 'at-interaction'` 追溯来源。

---

## 十一、开发顺序

```
步骤 1: Agent 模板种子
  → 新增 at-interaction 到 agentTemplateSeed.ts
  → 配置 supportedSkillIds、systemPromptTemplate、channelStyleProfiles

步骤 2: Skill 种子
  → 新增 CLASSIFY_INTENT 和 GENERATE_REPLY Skill
  → 完善 openClawSpec、inputSchema、outputSchema、promptTemplate

步骤 3: Agent 调度集成
  → agentDispatcher 中实现 Interaction Agent 调度逻辑
  → 对接 Skill 执行引擎（03）
  → 对接消息管线 Router（04）

步骤 4: 对话上下文集成
  → 从 conversationManager 获取历史
  → 传入 Prompt 组装器

步骤 5: 数据增强路径
  → 意图分类 → 搜索 → 汇总 → 回复的完整链路
  → 对接数据源终端（01）

步骤 6: 错误处理与降级
  → 各环节失败时的降级回复
  → 超时控制

步骤 7: 集成测试
  → Telegram 群里 @Bot 提问 → 收到符合人设的回复
  → 私聊 Bot → 多轮对话保持上下文
  → 问超出领域的问题 → 礼貌拒绝
```

---

## 十二、验收标准

- [ ] at-interaction Agent 模板已创建，含完整 systemPrompt 和 channelStyleProfiles
- [ ] CLASSIFY_INTENT Skill 可执行，正确分类意图
- [ ] GENERATE_REPLY Skill 可执行，生成符合 Identity 人设的回复
- [ ] 群消息 @Bot → 收到回复（< 4 秒）
- [ ] 私聊消息 → 收到回复（< 4 秒）
- [ ] 需要搜索的问题 → 基于真实数据回复（< 8 秒）
- [ ] 超出领域的问题 → 礼貌拒绝
- [ ] 多轮对话 → 上下文连贯
- [ ] 不同项目/Identity → 同一 Agent 表现不同
- [ ] LLM 调用失败 → 返回降级回复而非沉默
- [ ] 所有错误提示中文
