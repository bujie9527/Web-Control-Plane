# 10 — 执行闭环（主动推送 + 被动响应）

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：Research Agent（08）、Telegram 终端（02）、定时调度（09）、Interaction Agent（05）、Community Manager（06）、消息管线（04）
> 后续依赖：结果汇报（11）
> 实用化案例：体育赛事预测 Bot 完整运转一天 — 从早间采集到晚间复盘 + 全天候群互动

---

## 一、文档定位

前面的文档 01-09 分别定义了各个模块的独立能力。本文档的目标是**把所有模块串起来**，定义两条完整的执行链路，确保端到端可运转。

本文档不再重复各模块的内部设计细节，只关注：
1. 模块之间怎么串联
2. 数据怎么在模块间流动
3. 异常时怎么降级
4. 完整运转一天是什么样子

---

## 二、两条核心链路

系统的运营能力由两条链路构成，二者独立运行、互不阻塞：

### 链路 A：主动推送（Proactive Push）

```
定时调度（09）
  → Research Agent（08）采集素材
    → Content Creator 基于素材创作内容
      → Content Reviewer 审核
        → Publisher Agent 发布到 Telegram
```

**特征**：系统主动、定时驱动、链式流程、产出可预期

### 链路 B：被动响应（Reactive Response）

```
用户消息 → Telegram Webhook（02）
  → 消息管线（04）接收 + 路由
    → Interaction Agent（05）理解 + 回复
    → Community Manager（06）管理 + 维护
```

**特征**：用户触发、事件驱动、实时响应、不可预期

### 二者的关系

```
        ┌──────────────────────────────────────────────┐
        │              项目运营上下文                     │
        │   Identity + Terminal + Agent + 数据源         │
        │                                              │
        │   ┌─ 链路 A ─────────────────────────────┐   │
        │   │ 定时 → 采集 → 创作 → 审核 → 发布      │   │
        │   │        ↕ 素材复用                     │   │
        │   │ 链路 B ─────────────────────────────  │   │
        │   │ 消息 → 路由 → 理解 → 回复             │   │
        │   └─────────────────────────────────────┘   │
        │                    ↓                         │
        │            数据沉淀（11）                      │
        └──────────────────────────────────────────────┘
```

两条链路共享：
- 同一个项目上下文（Identity、Terminal、Agent 配置）
- 同一个 Research Agent 的素材库（链路 A 采集的数据可供链路 B 使用）
- 同一个 Telegram 终端（链路 A 往里发，链路 B 从里收）

---

## 三、链路 A 详解：主动推送闭环

### 3.1 流程模板

主动推送通过 WorkflowTemplate 定义，标准内容管线模板包含以下节点：

```
WorkflowTemplate: "内容生产管线"
  │
  Node 1: 素材采集（Research）
  │  executionType: agent_task
  │  intentType: research
  │  agent: Research Agent
  │  skills: SEARCH_WEB, SUBSCRIBE_RSS, SUMMARIZE_RESEARCH, COMPOSE_RESEARCH_PACK
  │  输出: ResearchResult
  │
  Node 2: 内容创作（Create）
  │  executionType: agent_task
  │  intentType: create
  │  agent: Content Creator
  │  skills: CONTENT_WRITE（通过 contentType 参数区分：article / prediction / event_preview）
  │  输入: Node1.ResearchResult
  │  输出: ContentDraft
  │
  Node 3: 内容审核（Review）
  │  executionType: agent_task
  │  intentType: review
  │  agent: Content Reviewer
  │  skills: ReviewContent
  │  输入: Node2.ContentDraft
  │  输出: ReviewResult (approved / revise)
  │  失败策略: 退回 Node2 修改（最多 2 次）
  │
  Node 4: 发布（Publish）
     executionType: agent_task
     intentType: publish
     agent: Publisher Agent
     skills: SendTelegramMessage
     输入: Node3.approved ContentDraft
     输出: PublishResult (messageId, timestamp)
```

### 3.2 数据流动

```
定时调度触发
  │
  ↓ inputParameters: { topic, contentType, targetChannels }
  │
WorkflowInstance 创建
  │
  ↓
Node 1: Research Agent
  │ 输入: { topic: "NBA today", contentType: "prediction" }
  │ 执行: SEARCH_WEB → SUBSCRIBE_RSS → SUMMARIZE_RESEARCH → COMPOSE_RESEARCH_PACK
  │ 输出写入: node1.resultJson = ResearchResult
  │       {
  │         topic: "NBA 3/17 赛事",
  │         keyFacts: [...15条],
  │         suggestedAngles: ["湖人连胜分析", "凯尔特人主场优势", "伤病影响预测"],
  │         dataHighlights: ["湖人近 5 场 4 胜 1 负", "凯尔特人主场 12 连胜"]
  │       }
  │
  ↓ node1.resultJson 作为 node2 的输入
  │
Node 2: Content Creator
  │ 输入: ResearchResult + Identity(体育预测达人) + ChannelStyle(telegram)
  │ 执行: CONTENT_WRITE (contentType: 'prediction')
  │ Prompt 组装（7层）:
  │   System: "你是内容创作专家..."
  │   Skill: "基于素材写预测文章..."
  │   Identity: "体育预测达人，风格幽默数据驱动"
  │   Channel: "Telegram 300字以内，可用 emoji"
  │   Project: "重点 NBA 和英超"
  │   Template: "素材: {researchResult}"
  │   Input: 实际素材数据
  │ 输出写入: node2.resultJson = ContentDraft
  │       {
  │         title: "🏀 今晚 NBA 预测：湖人 vs 凯尔特人",
  │         content: "今晚焦点战！湖人近5场4胜1负状态火热...",
  │         tags: ["NBA", "湖人", "凯尔特人", "预测"],
  │         parseMode: "Markdown"
  │       }
  │
  ↓ node2.resultJson 作为 node3 的输入
  │
Node 3: Content Reviewer
  │ 输入: ContentDraft + Identity 边界约束
  │ 执行: ReviewContent
  │ 审核维度: 事实准确性、人设一致性、格式合规、敏感内容
  │ 输出写入: node3.resultJson = ReviewResult
  │       {
  │         reviewResult: "approved",
  │         score: 0.92,
  │         notes: "数据引用准确，语气符合人设"
  │       }
  │
  │ 如果 revise:
  │   → 退回 Node2，携带修改建议
  │   → Content Creator 修改后重新提交
  │   → 最多重试 2 次，仍不通过标记人工审核
  │
  ↓ approved → node4
  │
Node 4: Publisher Agent
  │ 输入: ContentDraft + targetChannels
  │ 执行: SendTelegramMessage
  │ → telegramTerminalBridge.sendMessage(chatId, content, parseMode)
  │ 输出写入: node4.resultJson = PublishResult
  │       {
  │         published: true,
  │         messageId: 12345,
  │         chatId: -1001234567890,
  │         publishedAt: "2026-03-17T10:00:30Z"
  │       }
  │
  ↓
WorkflowInstance status = completed
```

### 3.3 时间线

| 步骤 | 预估耗时 | LLM 调用 | API 调用 |
|------|---------|---------|---------|
| 素材采集 | 15-25s | 2 次（汇总+组装） | 3-4 次（Tavily+RSS+Apify） |
| 内容创作 | 5-10s | 1 次 | 0 |
| 内容审核 | 3-5s | 1 次 | 0 |
| 发布 | 1-2s | 0 | 1 次（Telegram） |
| **总计** | **25-40s** | **4 次** | **4-5 次** |

### 3.4 不同内容类型的管线变体

同一流程模板通过 inputParameters 控制产出不同类型的内容：

| contentType | 使用的创作 Skill | 素材深度 | 内容长度 | 触发时机 |
|-------------|----------------|---------|---------|---------|
| `event_preview` | CONTENT_WRITE (contentType: event_preview) | 基本搜索 | 150-200字 | 每日 10:00 |
| `prediction` | CONTENT_WRITE (contentType: prediction) | 深度研究 | 200-400字 | 赛前 1 小时 |
| `post_match_review` | CONTENT_WRITE (contentType: post_match_review) | 赛后数据 | 200-300字 | 赛后 1 小时 |
| `news_summary` | CONTENT_WRITE (contentType: article) | RSS + 搜索 | 150-250字 | 有重大新闻时 |

---

## 四、链路 B 详解：被动响应闭环

### 4.1 消息处理全流程

```
用户在 Telegram 群里发消息
  │
  ↓
Telegram → Webhook POST /api/webhooks/telegram/{terminalId}
  │
  ↓
webhookHandler 解析 Update
  │
  ├→ 消息类型判定
  │   ├ new_chat_members → 成员事件
  │   ├ left_chat_member → 成员事件
  │   ├ 含消息文本 → 普通消息
  │   └ poll_answer → 投票事件
  │
  ↓
消息管线 Inbox → 存储 IncomingMessage
  │
  ↓
消息管线 Router（按优先级匹配）
  │
  ├─ Rule 1: 系统命令（/start, /help）
  │   → 命令处理器 → 返回预设回复
  │
  ├─ Rule 2: 成员事件
  │   → dispatch Community Manager → WELCOME_MEMBER / FAREWELL_MEMBER
  │
  ├─ Rule 3: 疑似违规内容
  │   → dispatch Community Manager → 规则检测 → DELETE_MESSAGE（如确认）
  │
  ├─ Rule 4: @Bot 的群消息 / 私聊消息
  │   → dispatch Interaction Agent → 理解 + 回复
  │
  └─ Rule 5: 普通群消息
      → 记录统计 → 不处理（控制成本）
```

### 4.2 Interaction Agent 处理流程

```
Router 派发 → Interaction Agent
  │
  ↓
Agent Dispatcher:
  1. 加载 AgentTemplate(at-interaction)
  2. 加载 Identity（项目绑定的 Identity）
  3. 加载 channelStyle（telegram_bot）
  4. 加载 Conversation 对话历史（最近 5 条）
  │
  ↓
快速路径判断:
  → 消息简单（问好、简短问题）→ 直接 GENERATE_REPLY
  → 消息需要数据（"今晚谁赢""最新伤病"）→ 先 SEARCH_WEB 再 GENERATE_REPLY
  │
  ↓
Skill 执行:
  → GENERATE_REPLY (或 SEARCH_WEB → GENERATE_REPLY)
  → Prompt 组装: Agent系统指令 + Skill步骤 + Identity人设 + 渠道风格 + 项目指令 + 对话历史 + 用户消息
  → LLM 生成回复
  │
  ↓
Response Sender:
  → telegramTerminalBridge.replyToMessage(chatId, replyToMessageId, text)
  │
  ↓
记录:
  → OutgoingMessage 存储
  → IncomingMessage.status = responded
  → Conversation 更新
```

### 4.3 Community Manager 处理流程

```
Router 派发 → Community Manager
  │
  ├→ 成员事件: WELCOME_MEMBER
  │   → LLM 生成欢迎语（~2s）
  │   → Telegram sendMessage
  │
  ├→ 违规内容: 规则检测
  │   → 已知广告域名 → DELETE_MESSAGE → 可选 WARNING
  │   → 不确定 → LLM 评估（confidence > 0.8 才删除）
  │
  └→ 投票事件: 记录统计
      → 更新 CommunityStats 数据
```

---

## 五、两条链路的交叉点

### 5.1 素材复用

链路 A 定时采集的 ResearchResult 可供链路 B 的 Interaction Agent 使用：

```
[链路 A] 07:00 Research Agent 采集今日赛事数据 → ResearchResult 存入素材库

[链路 B] 09:30 用户问"今晚有什么比赛"
  → Interaction Agent 检查素材库
    → 有最近 2 小时内的 ResearchResult？
      → 有 → 直接使用，不重新搜索（节省 Tavily 额度 + 减少延迟）
      → 无 → 调 SEARCH_WEB 实时搜索
```

**缓存复用规则**：
| 素材类型 | 有效期 | 说明 |
|---------|-------|------|
| 赛程/赔率 | 2 小时 | 数据变化较快 |
| 伤病报告 | 4 小时 | 通常一天更新 1-2 次 |
| 新闻摘要 | 1 小时 | 时效性高 |
| 社媒动态 | 30 分钟 | 变化快 |

### 5.2 发布后互动

链路 A 发布的内容可能引发链路 B 的互动：

```
[链路 A] 10:00 发布赛事预告 → Telegram 群消息(messageId=12345)

[链路 B] 10:05 用户回复该消息 "@Bot 你觉得湖人今晚能赢吗"
  → Webhook 接收 → 消息管线
  → Router: @Bot → Interaction Agent
  → Interaction Agent: 结合已发布内容上下文 + 素材库数据回复
```

### 5.3 社群管理与内容发布配合

```
[链路 A] Publisher 发布预测文章 → messageId=12345

[链路 A] 定时任务触发 Community Manager → PIN_MESSAGE(12345)
  → 置顶该预测文章

[链路 A] 定时任务触发 Community Manager → CREATE_POLL
  → 发起"你看好谁"投票

三个动作通过定时调度串联，间隔 5-10 分钟。
```

---

## 六、体育赛事 Bot 完整运转一天

以下是系统完整运转一天的时间线，展示链路 A 和链路 B 的协同：

```
06:00 ─────────────────────────────────────────
  │
07:00 [A] 定时: 晨间数据采集
  │     Research Agent → Tavily + RSS + Apify
  │     → ResearchResult 存入素材库
  │     耗时: ~25s  成本: 免费
  │
09:00 [A] 定时: 群话题引导
  │     Community Manager → GENERATE_TOPIC_PROMPT
  │     → "早上好！今晚 NBA 全明星赛，大家看好谁？🏀"
  │     耗时: ~3s  成本: 1次 LLM
  │
09:15 [B] 用户: "今晚都有什么比赛"
  │     → Interaction Agent → 复用素材库 → 回复赛程列表
  │     耗时: ~3s  成本: 1次 LLM（无搜索，复用素材）
  │
09:30 [B] 用户: "@Bot 湖人最近状态怎么样"
  │     → Interaction Agent → 复用素材 + 补充搜索 → 详细回复
  │     耗时: ~6s  成本: 1次搜索 + 1次 LLM
  │
10:00 [A] 定时: 赛事预告推送
  │     完整管线: Research → Creator → Reviewer → Publisher
  │     → 发布「今日 NBA 赛事预告」到群里
  │     耗时: ~35s  成本: 4次 LLM + 3次 API
  │
10:01 [A] 定时: 置顶预告消息
  │     Community Manager → PIN_MESSAGE
  │     耗时: ~1s  成本: 免费
  │
12:00 ─────────────────────────────────────────
  │
12:30 [B] 新人入群
  │     → Community Manager → WELCOME_MEMBER
  │     → "🎉 欢迎！这里是体育预测达人群..."
  │     耗时: ~3s  成本: 1次 LLM
  │
14:00 [B] 广告消息出现
  │     → Community Manager → 规则匹配 → DELETE_MESSAGE
  │     耗时: ~1s  成本: 免费
  │
16:00 [A] 定时: 赛前深度采集
  │     Research Agent → 深度搜索 + 文章全文提取
  │     → 更新素材库
  │     耗时: ~30s  成本: 2次搜索 + 2次 LLM
  │
18:00 [A] 定时(赛前2h): 赛事预测投票
  │     Community Manager → CREATE_POLL
  │     → "🏀 湖人 vs 凯尔特人，你看好谁？"
  │     → 投票消息置顶
  │     耗时: ~2s  成本: 免费
  │
19:00 [A] 定时(赛前1h): 深度预测文章
  │     完整管线: Research → Creator(深度) → Reviewer → Publisher
  │     → 发布「湖人 vs 凯尔特人深度预测分析」
  │     耗时: ~40s  成本: 4次 LLM + 3次 API
  │
19:30 [B] 用户: "你预测对了多少场"
  │     → Interaction Agent → 回复（当前阶段: 礼貌回应预留）
  │
20:00 比赛开始 ─────────────────────────────────
  │
20:15 [B] 用户: "第一节打完了，湖人领先"
  │     → Interaction Agent → 简短互动回复
  │
22:30 比赛结束 ─────────────────────────────────
  │
23:00 [A] 定时(赛后1h): 赛果复盘
  │     Research Agent → 搜索比赛结果 + 数据
  │     Content Creator → 生成复盘文章
  │     → 发布「湖人 vs 凯尔特人赛果复盘」
  │     耗时: ~35s  成本: 4次 LLM + 2次 API
  │
23:30 [B] 用户: "你的预测准不准"
  │     → Interaction Agent → 结合已发布预测和实际结果回复
  │
02:00 [A] 定时: 系统维护
  │     数据源健康检查 + 缓存清理
  │
─────────────────── 一天结束 ──────────────────
```

### 一日汇总

| 指标 | 数量 |
|------|------|
| 主动推送内容 | 3 篇（预告 + 预测 + 复盘） |
| 投票 | 1 个 |
| 话题引导 | 1 次 |
| 被动回复 | ~10-20 次（视群活跃度） |
| 新人欢迎 | ~2-5 次 |
| 违规清理 | ~0-3 次 |
| LLM 调用总量 | ~20-30 次 |
| 数据源 API 调用 | ~15-20 次 |
| 日成本估算 | **< $0.15**（LLM $0.10 + 数据源 $0.05） |

---

## 七、异常处理与降级策略

### 7.1 链路 A 异常降级

| 节点 | 异常 | 降级策略 | 用户感知 |
|------|------|---------|---------|
| Research | 所有数据源失败 | 使用缓存素材（如有）或跳过本次 | 不发布 / 发布旧数据 |
| Research | 部分数据源失败 | 用成功的源继续 | 素材不完整但可用 |
| Creator | LLM 调用失败 | 重试 1 次，仍失败暂停流程 | 不发布 |
| Reviewer | 审核不通过 | 退回 Creator 修改，最多 2 轮 | 延迟发布 |
| Reviewer | LLM 调用失败 | 跳过审核直接发布（风险标记） | 正常发布但无审核 |
| Publisher | Telegram API 失败 | 重试 2 次，仍失败记录待重发 | 延迟发布 |
| Publisher | Bot 被踢出群 | 标记终端异常，通知运营 | 不发布 + 告警 |

### 7.2 链路 B 异常降级

| 环节 | 异常 | 降级策略 | 用户感知 |
|------|------|---------|---------|
| Webhook | 接收失败 | Telegram 自动重试 | 延迟响应 |
| Router | 路由失败 | 默认忽略 | Bot 无回复 |
| Interaction | LLM 超时 | 重试 1 次 → 降级回复 | "我现在有点忙，稍后再聊" |
| Interaction | 搜索失败 | 跳过搜索走快速路径 | 回复不含最新数据 |
| Community | 欢迎语 LLM 失败 | 使用模板欢迎语 | 欢迎语较生硬 |
| Community | 删除权限不足 | 记录日志，不执行 | 违规内容未删 |
| Response | 发送失败 | 重试 1 次 → 记录失败 | Bot 无回复 |

### 7.3 跨链路异常

| 场景 | 影响 | 处理 |
|------|------|------|
| 素材库为空 | Interaction Agent 无缓存可用 | 实时搜索（成本增加但不中断） |
| Telegram API 全局限流 | 链路 A 发布 + 链路 B 回复都受影响 | 排队等待，延迟处理 |
| LLM 服务全局异常 | 所有需要 LLM 的操作失败 | 降级到规则/模板回复，暂停内容管线 |
| 数据库不可用 | 无法存储消息和执行记录 | 内存队列暂存，恢复后写入 |

---

## 八、节点间数据传递规范

### 8.1 传递机制

WorkflowInstance 的节点间数据通过 `WorkflowInstanceNode.resultJson` 传递：

```
Node N 执行完成
  → 输出写入 nodeN.resultJson（JSON 字符串）
  → Node N+1 启动时
  → 读取 nodeN.resultJson 作为输入
  → 通过 inputMapping 定义取哪些字段
```

### 8.2 标准输出格式

每个节点类型的输出必须遵循标准格式：

**Research 节点输出**：
```json
{
  "type": "research_result",
  "topic": "string",
  "keyFacts": [],
  "suggestedAngles": [],
  "dataHighlights": [],
  "sources": [],
  "freshness": "string"
}
```

**Creator 节点输出**：
```json
{
  "type": "content_draft",
  "title": "string",
  "content": "string",
  "tags": [],
  "parseMode": "Markdown | HTML | text",
  "contentType": "string",
  "wordCount": 0
}
```

**Reviewer 节点输出**：
```json
{
  "type": "review_result",
  "reviewResult": "approved | revise",
  "score": 0.0,
  "issues": [],
  "suggestions": [],
  "notes": "string"
}
```

**Publisher 节点输出**：
```json
{
  "type": "publish_result",
  "published": true,
  "messageId": 0,
  "chatId": 0,
  "publishedAt": "string",
  "terminalId": "string"
}
```

### 8.3 审核退回机制

当 Reviewer 返回 `revise` 时：

```
Node 3 (Reviewer) → revise
  │
  ↓ 执行引擎检查 onFailureStrategy
  │
  → retryCount < maxRetry (2)
    → 重新执行 Node 2 (Creator)
    → Creator 输入增加: { revisionSuggestions: reviewer.suggestions }
    → Creator 修改后重新提交 Node 3
  │
  → retryCount >= maxRetry
    → 标记 Node 3 status = waiting_review（人工审核）
    → 运营人员在 Runtime Center 查看并决定：发布 / 放弃 / 手动修改
```

---

## 九、监控与可观测性

### 9.1 Runtime Center 展示

运营人员在项目详情页的 Runtime Center 可以看到：

**链路 A 状态**：
```
┌── 今日内容管线 ────────────────────────────────────┐
│                                                    │
│  07:00 晨间采集    ✅ 完成  23s  48条素材           │
│  10:00 赛事预告    ✅ 已发布  35s  msgId:12345     │
│  19:00 深度预测    🔄 执行中  (创作节点)            │
│  23:00 赛后复盘    ⏳ 待执行                        │
│                                                    │
│  今日管线: 2/4 完成  1 执行中  1 待执行             │
└────────────────────────────────────────────────────┘
```

**链路 B 状态**：
```
┌── 今日消息处理 ────────────────────────────────────┐
│                                                    │
│  总消息: 156  处理: 23  回复: 18  忽略: 133        │
│  平均响应时间: 3.2s                                 │
│  新人欢迎: 3  违规清理: 1  投票: 1                  │
│                                                    │
│  最近互动:                                         │
│  09:15 @user1 "今晚有什么比赛" → 已回复 (3s)       │
│  09:30 @user2 "湖人状态怎么样" → 已回复 (6s)       │
│  12:30 新人 Alex 加入 → 已欢迎                     │
└────────────────────────────────────────────────────┘
```

### 9.2 异常告警

需要运营人员关注的异常，在 Runtime Center 醒目展示：

```
⚠️ 告警:
- 19:05 深度预测流程：审核不通过，已退回修改（第 1 次）
- 14:00 Tavily API 额度已使用 80%，建议关注

❌ 异常:
- 如有流程中断、终端断开等重大异常
```

---

## 十、开发顺序

```
步骤 1: 流程模板种子
  → 创建"内容生产管线"WorkflowTemplate 种子数据
  → 包含 4 个标准节点（Research → Creator → Reviewer → Publisher）
  → 配置节点间 inputMapping / outputMapping

步骤 2: 流程执行引擎增强
  → workflowNodeExecutor 对接 Skill 执行引擎（03）
  → 实现节点间数据传递（resultJson 读写）
  → 实现审核退回机制（revise → 重试 Creator）

步骤 3: 链路 A 串联
  → 定时调度（09）→ 创建 WorkflowInstance
  → WorkflowInstance 自动按节点顺序执行
  → 各节点调用对应 Agent + Skill
  → Publisher 节点调用 Telegram API 发布
  → 端到端验证：定时触发 → 采集 → 创作 → 审核 → 发布 → 群里出现消息

步骤 4: 链路 B 串联
  → Telegram Webhook → 消息管线 → Router → Agent Dispatcher
  → Interaction Agent 回复用户
  → Community Manager 处理成员事件
  → 端到端验证：群里 @Bot → 收到回复

步骤 5: 素材复用
  → Interaction Agent 检查素材库缓存
  → 有新鲜素材时复用，无则实时搜索

步骤 6: 异常降级
  → 各环节失败时的降级逻辑
  → LLM 失败 → 模板回复
  → 数据源失败 → 缓存兜底
  → 审核不通过 → 退回重试 → 超限人工审核

步骤 7: 监控面板
  → Runtime Center 展示链路 A 管线状态
  → Runtime Center 展示链路 B 消息处理统计
  → 异常告警展示

步骤 8: 完整日运转测试
  → 模拟体育赛事 Bot 运转一整天
  → 验证所有定时任务按时触发
  → 验证内容管线完整执行
  → 验证用户互动正常响应
  → 验证异常降级正确执行
```

---

## 十一、验收标准

### 链路 A（主动推送）
- [ ] 内容生产管线 WorkflowTemplate 已创建（4 节点）
- [ ] 定时触发 → 创建 WorkflowInstance → 自动执行
- [ ] Research 节点：采集素材 → 输出 ResearchResult
- [ ] Creator 节点：基于素材创作 → 输出 ContentDraft
- [ ] Reviewer 节点：审核通过/退回 → 退回时 Creator 重试
- [ ] Publisher 节点：发布到 Telegram → 群里出现消息
- [ ] 审核退回上限 2 次，超限进入人工审核
- [ ] 不同 contentType 产出不同风格的内容

### 链路 B（被动响应）
- [ ] 用户 @Bot → Interaction Agent 回复（< 4s）
- [ ] 用户私聊 → Interaction Agent 回复（< 4s）
- [ ] 新人入群 → Community Manager 欢迎（< 3s）
- [ ] 广告消息 → Community Manager 删除（< 2s）
- [ ] 普通群消息 → 不处理（控制成本）

### 协同
- [ ] 链路 A 素材可被链路 B 复用（2 小时内有效）
- [ ] 链路 A 发布的内容可被链路 B 引用回复
- [ ] 两条链路独立运行，互不阻塞

### 异常降级
- [ ] LLM 失败 → 降级回复 / 暂停管线
- [ ] 数据源失败 → 缓存兜底 / 部分源继续
- [ ] Telegram API 失败 → 重试 → 待重发
- [ ] 审核不通过 → 退回 → 超限人工审核

### 可观测性
- [ ] Runtime Center 展示管线执行状态
- [ ] Runtime Center 展示消息处理统计
- [ ] 异常告警醒目展示
- [ ] 所有状态标签和提示中文
