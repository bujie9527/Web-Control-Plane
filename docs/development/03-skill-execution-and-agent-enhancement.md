# 03 — Skill 执行引擎与 Agent 调参体系

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：Phase 0 技术债清理
> 后续依赖：所有 Agent（05-08）、执行闭环（10）
> 注：核心引擎依赖 P0 即可开发，external_api 类 Skill 的集成测试依赖 P1-A（数据源）+ P1-B（Telegram）
> 实用化案例：体育赛事预测 Telegram Bot 运营

---

## 一、模块定位

本文档定义 Skill 执行引擎和 Agent 调参体系的开发标准。这是系统从「Agent 只是标签」进化为「Agent 真正执行 Skill」的核心架构补齐。

### 当前问题

| 问题 | 现状 | 影响 |
|------|------|------|
| Skill 不参与执行 | `workflowNodeExecutor` 按 Agent ID 硬编码 adapter，忽略 Skill | Skill 是装饰，不是功能 |
| selectedSkillIds 未持久化 | 只在前端 UI/mock 中，WorkflowInstanceNode 无此字段 | 运行时不知道用了哪些 Skill |
| Prompt 固定 | adapter 内写死 prompt，不读 Skill 的 steps/spec | 无法按 Skill 差异化执行 |
| 无渠道适配 | 同一内容发不同渠道需要复制 Agent | 模板膨胀，维护困难 |
| 运营人员无法调参 | Agent 配置只有系统管理员能改 | 项目级定制需求无法满足 |

### 本文档解决的问题

1. **Skill 执行引擎** — 让 Skill 的 `executionType`、`openClawSpec`、`executionConfig` 真正驱动执行
2. **Agent 渠道适配** — 一个 Agent 适配多渠道，通过渠道风格 Profile 动态注入
3. **项目级调参** — 运营人员可用自然语言覆盖指令、切换模型、调整参数
4. **OpenClaw 兼容** — Skill 定义与 OpenClaw 格式可互通
5. **Agent 删除补强** — 服务端引用检查 + 前端确认完整

---

## 二、Skill 执行引擎

### 2.1 执行架构总览

```
WorkflowInstanceNode
  │
  ├── selectedAgentTemplateId → Agent 模板（能力定义）
  ├── selectedSkillIds[]      → Skill 列表（具体做什么）
  ├── terminalBinding         → 终端（通过什么通道）
  └── projectContext          → 项目上下文（Identity / Goal / 渠道）
        │
        ↓
Skill Execution Engine
  │
  ├── 遍历 selectedSkillIds
  │   ├── 读取 Skill 定义（executionType, openClawSpec, executionConfig）
  │   ├── 按 executionType 路由：
  │   │   ├── llm          → Prompt 组装 → LLM Executor
  │   │   ├── external_api → 外部 API 调用（Tavily / Apify / Telegram）
  │   │   ├── internal_api → 系统内部 API 调用（终端配置 / 资源绑定）
  │   │   └── hybrid       → LLM 规划 + API 执行
  │   └── 输出校验（按 outputSchemaJson）
  │
  └── 聚合结果 → 写入 WorkflowInstanceNode.resultSummary / workerOutputJson
```

### 2.2 Skill 执行类型定义

| executionType | 调用目标 | 举例 |
|--------------|---------|------|
| `llm` | LLM Provider（通过 llmExecutor） | 内容创作、审核、意图分类、摘要 |
| `external_api` | 外部第三方 API | Tavily 搜索、Apify 爬虫、Telegram 发消息、Jina 提取 |
| `internal_api` | 系统自身 /api/* | 创建终端、绑定资源、查询配置 |
| `hybrid` | 先 LLM 再 API（或交替） | 搜索策略生成(LLM) → 执行搜索(API) → 汇总(LLM) |

### 2.3 Skill Schema 增强

当前 Prisma 模型需新增字段：

```
Skill 增强:
  // 已有字段保留
  executionType       String    // 扩展为: llm | external_api | internal_api | hybrid
  openClawSpecJson    String?   // 完善结构

  // 新增字段
  inputSchemaJson     String?   // 输入参数 JSON Schema
  outputSchemaJson    String?   // 输出结果 JSON Schema
  executionConfigJson String?   // 执行配置 JSON（按 executionType 不同结构）
  promptTemplate      String?   // LLM 类 Skill 的 prompt 模板（支持变量占位）
  requiredContextFields String? // JSON array: 执行所需的上下文字段
  estimatedDurationMs  Int?     // 预估执行时长（用于超时控制）
  retryable           Boolean   @default(true)
  maxRetries          Int       @default(1)
```

### 2.4 openClawSpec 完善结构

```json
{
  "steps": [
    "分析项目目标和当前主题方向",
    "从素材包中提取关键事实和数据点",
    "根据 Identity 人设确定写作角度",
    "按渠道风格要求调整篇幅和格式",
    "生成标题、正文、标签",
    "检查内容是否符合 Identity 边界约束"
  ],
  "inputSchema": {
    "type": "object",
    "properties": {
      "researchData": { "type": "object", "description": "素材包" },
      "topic": { "type": "string", "description": "主题" },
      "identity": { "type": "object", "description": "身份信息" },
      "channelStyle": { "type": "object", "description": "渠道风格" }
    },
    "required": ["topic"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "content": { "type": "string" },
      "summary": { "type": "string" },
      "tags": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["title", "content"]
  }
}
```

### 2.5 executionConfig 按类型定义

#### LLM 类型

```json
{
  "type": "llm",
  "promptTemplate": "你是一个{agentRole}。\n\n任务：{skillSteps}\n\n身份视角：{identity}\n\n渠道要求：{channelStyle}\n\n输入素材：{input}\n\n请按 JSON 格式输出。",
  "requiredContextFields": ["identity", "channelStyle", "researchData"],
  "outputMode": "json_object",
  "temperature": null,
  "maxTokens": null
}
```

`temperature` 和 `maxTokens` 为 null 时使用 Agent 模板默认值。

#### External API 类型

```json
{
  "type": "external_api",
  "provider": "tavily",
  "method": "search",
  "paramMapping": {
    "query": "{{input.searchQuery}}",
    "maxResults": "{{input.maxResults || 5}}",
    "searchDepth": "basic"
  },
  "resultMapping": {
    "results": "$.results",
    "resultCount": "$.results.length"
  }
}
```

#### Internal API 类型

```json
{
  "type": "internal_api",
  "endpoint": "/api/terminals/:terminalId/actions/send-message",
  "method": "POST",
  "paramMapping": {
    "terminalId": "{{context.terminalId}}",
    "body": {
      "chatId": "{{input.chatId}}",
      "text": "{{input.content}}",
      "parseMode": "Markdown"
    }
  }
}
```

#### Hybrid 类型

```json
{
  "type": "hybrid",
  "stages": [
    {
      "name": "generate_search_strategy",
      "executionType": "llm",
      "promptTemplate": "根据项目目标 {goal} 和主题 {topic}，生成 3-5 个搜索关键词...",
      "outputField": "searchQueries"
    },
    {
      "name": "execute_search",
      "executionType": "external_api",
      "provider": "tavily",
      "method": "search",
      "paramMapping": { "query": "{{stages.generate_search_strategy.searchQueries[0]}}" },
      "outputField": "searchResults"
    },
    {
      "name": "summarize_results",
      "executionType": "llm",
      "promptTemplate": "汇总以下搜索结果为结构化素材包：{searchResults}",
      "outputField": "researchData"
    }
  ]
}
```

### 2.6 WorkflowInstanceNode 持久化增强

Prisma 模型需新增字段：

```
WorkflowInstanceNode 新增:
  selectedSkillIds      String?   // JSON array: 运行时选中的 Skill ID 列表
  skillExecutionLog     String?   // JSON: 每个 Skill 的执行结果日志
  channelType           String?   // 目标渠道类型（从终端推导）
  channelStyleApplied   String?   // 实际应用的渠道风格 JSON
```

### 2.7 执行器实现位置

```
server/
  domain/
    skillExecutionEngine.ts         # Skill 执行引擎（核心）
    skillPromptAssembler.ts         # LLM 类 Skill 的 Prompt 组装
    skillOutputValidator.ts         # 输出结果 Schema 校验
  services/
    skillExternalApiExecutor.ts     # External API 类 Skill 执行
    skillInternalApiExecutor.ts     # Internal API 类 Skill 执行
```

---

## 三、LLM Prompt 组装规范

### 3.1 Prompt 分层结构

LLM 类 Skill 的 prompt 由多层动态组装，每层独立维护：

```
┌─────────────────────────────────────────┐
│ Layer 1: Agent System Prompt            │
│ 来源: AgentTemplate.systemPromptTemplate│
│ 内容: "你是一个专业的内容创作 Agent..."  │
├─────────────────────────────────────────┤
│ Layer 2: Skill Steps                    │
│ 来源: Skill.openClawSpec.steps          │
│ 内容: "步骤1: 分析素材..."              │
├─────────────────────────────────────────┤
│ Layer 3: Identity Context               │
│ 来源: Identity 绑定                     │
│ 内容: "以体育预测达人身份，风格幽默..."  │
├─────────────────────────────────────────┤
│ Layer 4: Channel Style                  │
│ 来源: AgentTemplate.channelStyleProfiles│
│ 内容: "Telegram 短文格式，500字以内..."  │
├─────────────────────────────────────────┤
│ Layer 5: Project Override               │
│ 来源: ProjectAgentConfig                │
│ 内容: "重点关注 NBA 和英超赛事..."      │
├─────────────────────────────────────────┤
│ Layer 6: Skill Prompt Template          │
│ 来源: Skill.promptTemplate              │
│ 内容: "基于以下素材创作：{researchData}" │
├─────────────────────────────────────────┤
│ Layer 7: Actual Input Data              │
│ 来源: 上一节点 outputMapping            │
│ 内容: 实际的素材、数据、上下文           │
└─────────────────────────────────────────┘
```

### 3.2 变量替换规范

Prompt 模板中的变量使用 `{variableName}` 格式：

| 变量 | 来源 | 说明 |
|------|------|------|
| `{agentRole}` | AgentTemplate.nameZh | Agent 角色名称 |
| `{skillSteps}` | Skill.openClawSpec.steps | 执行步骤列表 |
| `{identity}` | Identity 信息 | 名称 + 定位 + 风格 + 内容方向 |
| `{channelStyle}` | channelStyleProfiles[terminalType] | 渠道风格指令 |
| `{projectOverride}` | ProjectAgentConfig.instructionOverride | 项目级指令覆盖 |
| `{goal}` | ProjectGoal | 项目目标 |
| `{input.*}` | 上一节点输出 / Skill 输入 | 实际数据 |
| `{context.*}` | 运行时上下文 | terminalId, chatId, projectId 等 |

### 3.3 Prompt 组装器接口

```typescript
interface PromptAssemblerInput {
  agentTemplate: AgentTemplate
  skill: Skill
  identity?: Identity
  channelType?: string
  projectAgentConfig?: ProjectAgentConfig
  inputData: Record<string, any>
  runtimeContext: Record<string, any>
}

interface AssembledPrompt {
  systemPrompt: string    // Layer 1-4 合并
  userPrompt: string      // Layer 5-7 合并
  outputMode: string      // json_object | json_schema | none
  temperature?: number    // 优先级: ProjectConfig > Skill > Agent > 系统默认
  maxTokens?: number
}
```

---

## 四、Agent 渠道适配（Channel Style Profiles）

### 4.1 设计原则

**不为每个渠道复制 Agent，而是一个 Agent 动态适配多渠道。**

### 4.2 AgentTemplate 新增字段

```
AgentTemplate 新增:
  channelStyleProfiles    String?   // JSON: 渠道风格配置
```

### 4.3 channelStyleProfiles 结构

```json
{
  "telegram_bot": {
    "styleName": "Telegram 频道/群组风格",
    "styleInstruction": "内容控制在 300-500 字，使用 Markdown 格式。开头用一句话总结核心观点，正文分 2-3 个短段落，适当使用 emoji（每段 1-2 个）。结尾加互动引导（如'你怎么看？'）。",
    "maxLength": 500,
    "format": "markdown",
    "features": ["emoji", "short_paragraphs", "engagement_hook"]
  },
  "wordpress": {
    "styleName": "网站文章风格",
    "styleInstruction": "内容 1000-2000 字，使用 HTML 格式。包含 H2/H3 小标题结构，前 150 字嵌入核心关键词，正文包含数据引用和来源链接，结尾有总结段落和行动号召。",
    "maxLength": 2000,
    "format": "html",
    "features": ["seo_keywords", "subheadings", "data_citations", "cta"]
  },
  "facebook_page": {
    "styleName": "Facebook 社交风格",
    "styleInstruction": "内容 150-400 字，纯文本。开头用提问或惊人事实吸引注意力，正文口语化，结尾鼓励互动（点赞/评论/分享），可附 3-5 个相关 hashtag。",
    "maxLength": 400,
    "format": "text",
    "features": ["question_hook", "conversational", "hashtags", "share_prompt"]
  }
}
```

### 4.4 执行时渠道风格注入流程

```
1. 从 WorkflowInstanceNode 获取关联的 Terminal
2. 从 Terminal.type 得到渠道类型（如 'telegram_bot'）
3. 从 AgentTemplate.channelStyleProfiles[terminal.type] 获取风格配置
4. 将 styleInstruction 注入 Prompt 的 Layer 4
5. 如果 ProjectAgentConfig 有渠道风格覆盖，则合并或替换
```

### 4.5 实用案例：体育赛事预测内容

同一条素材，同一个 Content Creator Agent，不同渠道输出：

**Telegram 输出**：
```
🏀 今晚 NBA 焦点：湖人 vs 凯尔特人

詹姆斯复出首战，状态成疑。凯尔特人主场 12 连胜，防守效率联盟第一。

**预测：凯尔特人 -5.5，大分 218.5**

综合伤病和主场优势，看好绿军主场拿下。

你觉得呢？👇
```

**网站输出**：
```html
<h1>NBA 预测：湖人 vs 凯尔特人深度分析</h1>
<h2>赛事概况</h2>
<p>北京时间 3 月 17 日上午 8:00，洛杉矶湖人将客场挑战波士顿凯尔特人...</p>
<h2>关键数据对比</h2>
<p>凯尔特人本赛季主场战绩 28-5，防守效率 106.2（联盟第一）...</p>
<h2>伤病情况</h2>
<p>湖人方面，勒布朗·詹姆斯（腿筋）本场复出但上场时间预计受限...</p>
<h2>预测结论</h2>
<p>综合分析，推荐凯尔特人 -5.5，总分大 218.5...</p>
```

**同一个 Agent、同一个 Identity、同一份素材，只是渠道风格不同。**

---

## 五、项目级 Agent 配置覆盖

### 5.1 ProjectAgentConfig 数据模型

```
ProjectAgentConfig（新增 Prisma 模型）:
  id                    String    @id
  projectId             String
  agentTemplateId       String
  instructionOverride   String?   // 运营人员的自然语言指令（如"重点关注 NBA 和英超"）
  channelStyleOverride  String?   // JSON: 渠道风格覆盖（部分字段覆盖）
  temperatureOverride   Float?
  maxTokensOverride     Int?
  modelConfigIdOverride String?   // 项目级 LLM 模型覆盖
  customParams          String?   // JSON: 自定义参数（按 Skill 不同含义不同）
  isEnabled             Boolean   @default(true)
  createdAt             String
  updatedAt             String

  @@unique([projectId, agentTemplateId])
```

### 5.2 配置优先级

参数覆盖的优先级链（从高到低）：

```
ProjectAgentConfig > Skill 定义 > AgentTemplate 默认值 > 系统全局默认
```

具体地：

| 参数 | 优先级链 |
|------|---------|
| temperature | ProjectAgentConfig.temperatureOverride > Skill.executionConfig.temperature > AgentTemplate.temperature > 0.7 |
| maxTokens | ProjectAgentConfig.maxTokensOverride > Skill.executionConfig.maxTokens > AgentTemplate.maxTokens > 2048 |
| 模型 | ProjectAgentConfig.modelConfigIdOverride > AgentLLMBinding(primary) |
| 渠道风格 | ProjectAgentConfig.channelStyleOverride (merge) > AgentTemplate.channelStyleProfiles |
| 指令 | ProjectAgentConfig.instructionOverride (append) > AgentTemplate.instructionTemplate |

### 5.3 运营人员调参入口

运营人员不直接编辑 ProjectAgentConfig 的 JSON。两种入口：

**入口一：项目详情 Agent 团队 Tab**
- 列出项目绑定的 Agent 列表
- 每个 Agent 有「调整配置」按钮
- 打开抽屉：指令覆盖（自然语言文本框）、渠道风格调整、参数调整

**入口二：Config Agent 对话（推荐）**
- 运营人员说："内容风格再轻松一点，多用 emoji，每篇控制在 300 字以内"
- Config Agent 解析 → 更新 ProjectAgentConfig.channelStyleOverride 和 instructionOverride

---

## 六、OpenClaw 兼容规范

### 6.1 兼容目标

| 场景 | 兼容程度 | 说明 |
|------|---------|------|
| OpenClaw LLM 类 Skill 导入 | **直接可用** | steps → openClawSpec.steps, input → inputSchema, output → outputSchema |
| OpenClaw Tool 类 Skill 导入 | **少量适配** | 需映射 tool 调用到 executionConfig |
| 从本系统导出 OpenClaw 格式 | **可导出** | 反向生成 OpenClaw YAML |

### 6.2 OpenClaw → 本系统映射

```
OpenClaw 字段            → 本系统字段
─────────────────────────────────────
name                     → Skill.name
description              → Skill.description
input                    → Skill.inputSchemaJson (转 JSON Schema)
output                   → Skill.outputSchemaJson (转 JSON Schema)
steps                    → Skill.openClawSpecJson.steps
tools                    → Skill.executionConfigJson.requiredTools
execution_type           → Skill.executionType
```

### 6.3 导入流程

```
上传 OpenClaw YAML/JSON 文件
  → 解析格式
  → 映射字段到 Skill Schema
  → 填入 openClawSpecJson / inputSchemaJson / outputSchemaJson
  → 创建 Skill 记录（status: draft）
  → 管理员审核启用
```

### 6.4 Skill 工厂页面增强

在 Skill 工厂的 OpenClaw Tab 中：
- 当前只展示 spec，需增加「导入 OpenClaw」按钮
- 支持粘贴 YAML/JSON 或上传文件
- 解析后预览映射结果
- 确认后创建 Skill

---

## 七、Agent 删除能力补强

### 7.1 当前状态

- 服务端 `DELETE /api/agent-templates/:id` 已存在
- 系统预置模板（`isSystemPreset: true`）禁止删除
- 删除前先删 AgentLLMBinding
- 前端引用检查：检查 WorkflowTemplateNode 和 PlanningDraftNode

### 7.2 需要补强的内容

**服务端引用检查（迁移到后端）**：

```
DELETE /api/agent-templates/:id 增强逻辑:
  1. 检查 isSystemPreset → 禁止删除
  2. 检查 WorkflowTemplateNode 引用 → 有引用则返回引用列表，禁止删除
  3. 检查 WorkflowInstanceNode 引用 → 有运行中引用则禁止删除
  4. 检查 ProjectAgentConfig 引用 → 有绑定则返回项目列表
  5. 通过检查后：删除 AgentLLMBinding → 删除 AgentTemplate
  6. 返回中文提示
```

**错误提示规范**：

| 场景 | 中文提示 |
|------|---------|
| 系统预置 | "系统预置模板不可删除" |
| 被流程节点引用 | "该模板被 {N} 个流程节点引用，请先解绑后再删除" |
| 被运行中实例引用 | "该模板有 {N} 个运行中的流程实例，请等待完成或终止后再删除" |
| 被项目配置引用 | "该模板被 {N} 个项目使用，请先移除项目绑定" |
| 删除成功 | "已删除模板「{name}」" |

**前端 UI 确认**：
- 列表页：每行操作列确保有「删除」按钮（非系统预置时显示）
- 详情页：顶部摘要条确保有「删除」按钮
- 删除弹窗：显示模板名称 + 引用数量 + 不可撤销警告

---

## 八、实用化案例：体育赛事 Telegram Bot

用体育 Bot 项目串联所有设计，验证 Skill 执行引擎的完整链路。

### 8.1 项目配置

```
项目：体育赛事预测频道
  Goal：每日发布赛事预测，提升频道订阅和互动
  Identity：体育预测达人 — 专业、数据驱动、幽默、中文
  Terminal：@sports_predict_bot（Telegram Bot，管理一个频道和一个群）
  数据源终端：Tavily（搜索赛事新闻）、Apify（Twitter 体育 KOL 监控）
```

### 8.2 涉及的 Agent 与 Skill

**每日赛事预告流程（主动推送）**：

| 节点 | Agent | Skill | executionType | 说明 |
|------|-------|-------|--------------|------|
| 采集赛程 | Research Agent | FetchSportsSchedule | external_api | 调体育 API 获取今日赛程 |
| 采集新闻 | Research Agent | SearchWebForTopic | external_api | Tavily 搜索最新体育新闻 |
| 监控 KOL | Research Agent | MonitorSocialMedia | external_api | Apify 获取体育 KOL 推文 |
| 汇总素材 | Research Agent | SummarizeResearchData | llm | LLM 汇总为结构化素材包 |
| 创作内容 | Content Creator | GenerateArticle | llm | 基于素材 + Identity + 渠道风格创作 |
| 审核内容 | Content Reviewer | ReviewContent | llm | 质量和合规审核 |
| 发布内容 | Publisher Agent | SendTelegramMessage | external_api | 发到 Telegram 频道 |
| 置顶消息 | Community Manager | PinImportantMessage | external_api | 置顶预告 |
| 发起投票 | Community Manager | CreateInteractivePoll | external_api | "今晚你最看好谁？" |

**用户提问响应流程（被动响应）**：

| 步骤 | Agent | Skill | executionType | 说明 |
|------|-------|-------|--------------|------|
| 意图分类 | Interaction Agent | ClassifyUserIntent | llm | 判断用户想问什么 |
| 快速数据查询 | Research Agent | SearchWebForTopic | external_api | 必要时搜索最新数据 |
| 生成回复 | Interaction Agent | GenerateContextualReply | llm | 结合 Identity 人设生成回复 |
| 发送回复 | Interaction Agent | SendTelegramReply | external_api | 回复用户 |

### 8.3 Skill 定义示例

#### GenerateArticle（内容创作 Skill）

```json
{
  "id": "skill-content-write",
  "name": "GenerateArticle",
  "nameZh": "内容创作",
  "code": "CONTENT_WRITE",
  "category": "content",
  "executionType": "llm",
  "openClawSpecJson": {
    "steps": [
      "分析提供的素材包，提取关键事实、数据和引用来源",
      "根据 Identity 的定位和风格确定写作角度",
      "根据渠道风格要求确定篇幅、格式和表达方式",
      "撰写标题（吸引注意力，包含核心信息）",
      "撰写正文（结构清晰，数据支撑，符合人设口吻）",
      "生成标签（3-5 个相关标签）",
      "生成一句话摘要"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "researchData": { "type": "object", "description": "素材包" },
        "topic": { "type": "string", "description": "主题方向" }
      },
      "required": ["topic"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "content": { "type": "string" },
        "summary": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["title", "content"]
    }
  },
  "promptTemplate": "基于以下素材，创作一篇内容。\n\n素材：\n{researchData}\n\n主题方向：{topic}\n\n请按 JSON 格式输出。",
  "requiredContextFields": ["identity", "channelStyle"]
}
```

#### SearchWebForTopic（Web 搜索 Skill）

```json
{
  "id": "skill-search-web",
  "name": "SearchWebForTopic",
  "nameZh": "Web 搜索",
  "code": "SEARCH_WEB",
  "category": "research",
  "executionType": "external_api",
  "executionConfigJson": {
    "type": "external_api",
    "provider": "tavily",
    "method": "search",
    "paramMapping": {
      "query": "{{input.searchQuery}}",
      "maxResults": "{{input.maxResults || 5}}",
      "searchDepth": "{{input.searchDepth || 'basic'}}",
      "includeAnswer": true
    },
    "resultMapping": {
      "results": "$.results",
      "answer": "$.answer"
    }
  },
  "inputSchemaJson": {
    "type": "object",
    "properties": {
      "searchQuery": { "type": "string" },
      "maxResults": { "type": "integer", "default": 5 },
      "searchDepth": { "type": "string", "enum": ["basic", "advanced"] }
    },
    "required": ["searchQuery"]
  },
  "outputSchemaJson": {
    "type": "object",
    "properties": {
      "results": { "type": "array" },
      "answer": { "type": "string" }
    }
  }
}
```

#### SendTelegramMessage（Telegram 发消息 Skill）

```json
{
  "id": "skill-send-telegram-msg",
  "name": "SendTelegramMessage",
  "nameZh": "发送 Telegram 消息",
  "code": "SEND_TELEGRAM_MSG",
  "category": "publish",
  "executionType": "external_api",
  "executionConfigJson": {
    "type": "external_api",
    "provider": "telegram",
    "method": "sendMessage",
    "paramMapping": {
      "terminalId": "{{context.terminalId}}",
      "chatId": "{{input.chatId}}",
      "text": "{{input.content}}",
      "parseMode": "{{input.parseMode || 'Markdown'}}"
    },
    "resultMapping": {
      "messageId": "$.messageId",
      "success": "$.success"
    }
  }
}
```

### 8.4 渠道适配验证

同一个 Content Creator Agent（`at-base-content-creator`），channelStyleProfiles 配置：

| 终端类型 | 风格 | 输出特征 |
|---------|------|---------|
| telegram_bot | Telegram 频道风格 | 300-500字，Markdown，emoji，互动引导 |
| wordpress | 网站 SEO 风格 | 1000-2000字，HTML，小标题，关键词，CTA |
| facebook_page | Facebook 社交风格 | 150-400字，纯文本，提问开头，hashtag |

**验收场景**：同一份素材包 → Content Creator 执行 GenerateArticle Skill → 目标终端分别为 Telegram/WordPress/Facebook → 三份内容风格显著不同。

---

## 九、种子数据更新计划

### 9.1 Skill 种子更新

现有 15 个 Skill 需要补充 `executionConfigJson`、`inputSchemaJson`、`outputSchemaJson`、`promptTemplate`：

| Skill | executionType | 需补充 |
|-------|--------------|--------|
| CONTENT_WRITE | llm | openClawSpec + promptTemplate |
| CONTENT_REVIEW | llm | openClawSpec + promptTemplate |
| COMPLIANCE_CHECK | llm | openClawSpec + promptTemplate |
| PUBLISH_CONTENT | external_api | executionConfig（终端发送） |
| SCHEDULE_PUBLISH | external_api | executionConfig（定时任务） |
| DATA_FETCH | external_api | executionConfig（数据源调用） |
| METRICS_WRITE | llm | openClawSpec + promptTemplate |
| KEYWORD_RESEARCH | hybrid | executionConfig（搜索+汇总） |
| PARSE_SOP | llm | openClawSpec + promptTemplate |
| GENERATE_WORKFLOW_DRAFT | llm | openClawSpec + promptTemplate |
| REVISE_WORKFLOW_DRAFT | llm | openClawSpec + promptTemplate |
| SUMMARIZE_CHANGES | llm | openClawSpec + promptTemplate |
| SUGGEST_AGENT_BINDINGS | llm | openClawSpec + promptTemplate |
| IMAGE_GEN | llm | openClawSpec + promptTemplate |
| BRAND_CHECK | llm | openClawSpec + promptTemplate |

### 9.2 新增 Skill

| Skill | category | executionType | 说明 |
|-------|----------|--------------|------|
| SEARCH_WEB | research | external_api | Tavily Web 搜索 |
| MONITOR_SOCIAL | research | external_api | Apify 社媒监控 |
| EXTRACT_CONTENT | research | external_api | Jina 内容提取 |
| SUBSCRIBE_RSS | research | external_api | RSS 订阅获取 |
| SUMMARIZE_RESEARCH | research | llm | 素材汇总 |
| CLASSIFY_INTENT | interaction | llm | 用户意图分类 |
| GENERATE_REPLY | interaction | llm | 上下文回复生成 |
| WELCOME_MEMBER | community | llm | 新人欢迎消息 |
| CREATE_POLL | community | external_api | 创建投票 |
| PIN_MESSAGE | community | external_api | 置顶消息 |
| SEND_TELEGRAM_MSG | publish | external_api | 发送 Telegram 消息 |
| SEND_TELEGRAM_REPLY | publish | external_api | 回复 Telegram 消息 |

### 9.3 Agent 种子更新

现有 12 个 Agent 模板的 `supportedSkillIds` 需要更新，并新增 channelStyleProfiles：

| Agent | 新增 Skill | channelStyleProfiles |
|-------|-----------|---------------------|
| at-base-content-creator | SEARCH_WEB, SUMMARIZE_RESEARCH | telegram_bot + wordpress + facebook_page |
| at-content-reviewer | — | — |
| at-publisher | SEND_TELEGRAM_MSG | — |
| at-research-agent | SEARCH_WEB, MONITOR_SOCIAL, EXTRACT_CONTENT, SUBSCRIBE_RSS, SUMMARIZE_RESEARCH, COMPOSE_RESEARCH_PACK | — |

新增 Agent 模板：

| Agent | roleType | category | 说明 |
|-------|----------|----------|------|
| at-interaction | responder | execution | 互动 Agent（04 文档详细定义） |
| at-community-manager | manager | coordination | 社群管理 Agent（05 文档详细定义） |
| at-config-agent | configurator | coordination | 配置助手（07 文档详细定义） |

---

## 十、开发顺序

```
步骤 1：Prisma Schema 更新
  → Skill 新增字段（inputSchemaJson, outputSchemaJson, executionConfigJson, promptTemplate 等）
  → WorkflowInstanceNode 新增字段（selectedSkillIds, channelType 等）
  → AgentTemplate 新增字段（channelStyleProfiles）
  → 新增 ProjectAgentConfig 模型
  → 数据库迁移

步骤 2：Skill 执行引擎核心
  → skillExecutionEngine.ts（路由 + 调度）
  → skillPromptAssembler.ts（Prompt 多层组装）
  → skillOutputValidator.ts（输出 Schema 校验）

步骤 3：按 executionType 实现执行器
  → LLM 执行（复用 llmExecutor，增强 Prompt 组装）
  → External API 执行（调用 dataSourceExecutor / telegramTerminalBridge）
  → Internal API 执行（调用系统 /api/*）
  → Hybrid 执行（多阶段编排）

步骤 4：workflowNodeExecutor 重构
  → 从"按 Agent ID 硬编码 adapter"改为"按 Skill 驱动执行"
  → 保持向后兼容（无 Skill 配置时走旧逻辑）

步骤 5：种子数据更新
  → 现有 Skill 补充 executionConfig / openClawSpec
  → 新增 Skill
  → 现有 Agent 模板更新 supportedSkillIds + channelStyleProfiles

步骤 6：前端适配
  → Skill 工厂页面增强（显示 executionType 标签、OpenClaw 导入）
  → Agent 工厂页面增强（channelStyleProfiles 编辑区）
  → 项目详情 Agent Tab 增强（ProjectAgentConfig 调参入口）
  → Agent 删除 UI 确认与补强

步骤 7：集成验证
  → 使用体育 Bot 案例端到端测试
  → 验证渠道适配（同一素材 → 不同渠道 → 不同风格输出）
```

---

## 十一、验收标准

### Skill 执行引擎
- [ ] LLM 类 Skill 可执行：读取 openClawSpec.steps 构建 Prompt → 调 LLM → 校验输出
- [ ] External API 类 Skill 可执行：按 executionConfig 调用外部 API → 返回结果
- [ ] Internal API 类 Skill 可执行：按 executionConfig 调用系统 API → 返回结果
- [ ] Hybrid 类 Skill 可执行：多阶段依次执行 → 聚合结果
- [ ] Skill 输出按 outputSchemaJson 校验，校验失败时节点标记 failed

### Prompt 组装
- [ ] 7 层 Prompt 正确组装（Agent + Skill + Identity + Channel + Project + Template + Input）
- [ ] 变量替换正确（{identity}、{channelStyle} 等）
- [ ] 缺少某层时优雅降级（如无 Identity 时跳过该层）

### 渠道适配
- [ ] channelStyleProfiles 可在 Agent 工厂页面编辑
- [ ] 执行时根据终端类型自动注入渠道风格
- [ ] 同一素材 + 同一 Agent → 不同渠道 → 输出风格明显不同

### 项目级调参
- [ ] ProjectAgentConfig 可通过项目详情页创建/编辑
- [ ] instructionOverride 正确附加到 Prompt
- [ ] temperatureOverride 正确覆盖默认值
- [ ] modelConfigIdOverride 正确切换 LLM 模型

### Agent 删除
- [ ] 服务端引用检查完整（TemplateNode + InstanceNode + ProjectConfig）
- [ ] 引用存在时返回中文错误和引用列表
- [ ] 前端列表页和详情页删除按钮正常工作
- [ ] 删除成功后 Toast 提示 + 刷新列表

### OpenClaw 兼容
- [ ] LLM 类 OpenClaw Skill 可导入并直接执行
- [ ] 导入后 openClawSpecJson 正确填充
- [ ] Skill 工厂有「导入 OpenClaw」入口
