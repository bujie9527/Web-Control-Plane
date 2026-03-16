# 07 — Config Agent（配置助手）

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：数据源配置中心（01）、Telegram Bot 终端（02）、Skill 执行引擎（03）
> 后续依赖：执行闭环（10）— Config Agent 负责在项目启动前完成资源就绪
> 实用化案例：运营人员说"帮我配一个体育数据源，主要看 NBA 和英超"，Config Agent 自动创建数据源终端并完成配置

---

## 一、Agent 定位

Config Agent 是系统中负责**项目资源配置自动化**的协调类 Agent。运营人员通过自然语言描述需求，Config Agent 理解意图后调用内部 API 完成配置操作。

**核心价值**：运营人员不需要理解系统配置页面的复杂操作，只需描述业务需求，Config Agent 将需求翻译为系统配置动作。

**它不是**：
- 聊天机器人（不做闲聊，只做配置任务）
- Planner Agent（不做流程规划，只做资源配置）
- 系统管理员（不做平台级设置，只做项目级资源配置）
- 万能助手（只处理系统可配置的资源，不处理业务逻辑问题）

**它是**：
- 运营人员的配置助手（将自然语言翻译为配置操作）
- 项目资源的快速配置工具（终端、数据源、Agent 偏好）
- 配置结果的验证者（配置后自动测试连通性）
- 配置建议的提供者（根据项目类型推荐合适的资源组合）

### 与其他 Agent 的边界

| 场景 | 处理者 | 原因 |
|------|-------|------|
| "帮我加一个 Telegram 发布终端" | **Config Agent** | 终端配置 |
| "帮我配一个体育新闻数据源" | **Config Agent** | 数据源终端配置 |
| "这个项目用 GPT-4o 模型" | **Config Agent** | 项目级 Agent 参数调整 |
| "帮我写一篇 NBA 预测文章" | Content Creator | 内容创作，非配置 |
| "帮我规划一下运营流程" | Planner Agent | 流程规划，非配置 |
| "今晚有什么比赛" | Interaction Agent | 用户对话，非配置 |
| "把这条消息置顶" | Community Manager | 群管理，非配置 |

### 核心原则

1. **所有配置操作必须通过内部 API**，Config Agent 不直接操作数据库
2. **操作前必须确认**：非紧急配置操作执行前，向运营人员展示即将执行的操作并等待确认
3. **操作后必须验证**：创建终端后自动测试连通性，配置数据源后验证可用
4. **错误必须中文回报**：配置失败的原因和建议都用中文说明

---

## 二、Agent 模板定义

### 2.1 AgentTemplate 种子

```
AgentTemplate:
  id:                     'at-config-agent'
  name:                   'Config Agent'
  nameZh:                 '配置助手'
  code:                   'config-agent'
  category:               'coordination'
  roleType:               'configurator'
  domain:                 'general'
  description:            '理解运营人员的自然语言需求，自动完成项目资源配置（终端、数据源、Agent 偏好等）'
  status:                 'active'
  isSystemPreset:         true
  isCloneable:            false

  systemPromptTemplate:   见 2.2
  instructionTemplate:    见 2.3
  outputFormat:           'json'

  supportedSkillIds:      [
    'skill-parse-config-intent',
    'skill-suggest-datasources',
    'skill-create-datasource-terminal',
    'skill-create-publish-terminal',
    'skill-configure-project-agent',
    'skill-test-terminal-connection',
    'skill-list-available-resources'
  ]
  defaultExecutorType:    'hybrid'
  allowedTerminalTypes:   '[]'    // Config Agent 不操作外部终端

  supportedProjectTypeIds: '["pt-social-media", "pt-account-operation", "pt-website-ops", "pt-facebook-page"]'

  channelStyleProfiles:   {}    // Config Agent 不面向用户，无渠道适配

  temperature:            0.3   // 配置操作需要高确定性
  maxTokens:              2048

  requireIdentityContext: false   // 配置操作不需要 Identity 人设
  requireStructuredOutput: true   // 所有输出必须结构化
  disallowDirectTerminalAction: true  // 不直接操作外部终端
```

### 2.2 System Prompt Template

```
你是一个项目配置助手，负责帮助运营人员完成项目资源的配置。

核心规则：
1. 理解运营人员的自然语言需求，将其转化为具体的配置操作
2. 每次只执行一个配置操作，操作前向用户确认
3. 你只能配置系统已支持的资源类型，不能凭空创造
4. 配置完成后必须验证结果
5. 所有回复和操作说明使用中文
6. 如果需求不明确，主动追问而非猜测执行

你可以配置的资源类型：
- 数据源终端（Tavily 搜索、Apify 社媒监控、Jina 内容提取、RSS 订阅）
- 发布终端（Telegram Bot 频道/群组）
- 项目 Agent 参数（指令覆盖、模型选择、温度调整）
```

### 2.3 Instruction Template

```
配置操作规范：
- 接收到配置请求后，先分析需求，输出配置计划
- 配置计划必须包含：操作类型、目标资源、具体参数
- 等待用户确认后再执行
- 执行后输出结果：成功/失败、资源 ID、连通性测试结果
- 如果用户需求模糊，列出可选方案让用户选择
- 推荐资源时优先免费方案，标注收费方案
```

---

## 三、交互模式

Config Agent 的交互模式与其他 Agent 不同。它不是被动响应消息，而是**在项目上下文中与运营人员对话式配置**。

### 3.1 交互入口

```
项目详情页 → "项目设置" Tab / "资源配置" Tab
  → 配置助手面板（右侧或底部抽屉）
  → 运营人员输入自然语言需求
  → Config Agent 理解 → 确认 → 执行 → 反馈
```

### 3.2 对话流程

**典型交互示例**：

```
运营人员：帮我配一个体育新闻的数据源，主要看 NBA 和英超

Config Agent（分析意图）：
  → 解析为：创建数据源终端，领域=体育，细分=NBA+英超

Config Agent（回复）：
  好的，我建议为你配置以下数据源：

  1. 🔍 Tavily 搜索（免费）
     - 用途：实时搜索 NBA 和英超相关新闻
     - 关键词预设：NBA scores, Premier League results, 球员伤病报告

  2. 📱 Apify 社媒监控（有免费额度）
     - 用途：监控 Twitter/X 上的体育博主和官方账号
     - 目标：@ESPN, @NBA, @PremierLeague

  3. 📰 RSS 订阅（免费）
     - 用途：ESPN、BBC Sport 的 RSS 新闻流

  是否按照这个方案配置？可以告诉我需要调整的部分。

运营人员：先配 Tavily 和 RSS 吧，Apify 后面再说

Config Agent（执行）：
  ✅ 正在配置...

  1. Tavily 搜索终端 — 已创建
     名称：体育新闻搜索
     预设关键词：NBA, Premier League, 球员伤病
     连通性测试：✅ 通过

  2. RSS 订阅终端 — 已创建
     名称：体育新闻 RSS
     订阅源：ESPN NBA, BBC Sport Football
     连通性测试：✅ 通过

  两个数据源已添加到项目资源中。Research Agent 现在可以使用它们采集数据了。
  需要我继续配置 Apify 或者其他资源吗？
```

### 3.3 确认机制

所有配置操作分为两类：

| 操作类型 | 是否需要确认 | 示例 |
|---------|------------|------|
| **创建类**（不可逆） | 必须确认 | 创建终端、绑定资源 |
| **修改类**（可回滚） | 推荐确认 | 修改 Agent 参数、更新关键词 |
| **查询类**（只读） | 无需确认 | 列出可用资源、查看配置状态 |

---

## 四、Skill 清单

### 4.1 理解与推荐 Skill

| Skill | code | executionType | 说明 |
|-------|------|--------------|------|
| **解析配置意图** | PARSE_CONFIG_INTENT | llm | 理解运营人员的自然语言，输出结构化配置意图 |
| **推荐数据源** | SUGGEST_DATASOURCES | llm + internal_api | 根据项目类型和需求推荐数据源方案 |
| **列出可用资源** | LIST_AVAILABLE_RESOURCES | internal_api | 查询系统已有的 Provider、终端类型、模型 |

### 4.2 执行 Skill

| Skill | code | executionType | 说明 |
|-------|------|--------------|------|
| **创建数据源终端** | CREATE_DATASOURCE_TERMINAL | internal_api | 调用内部 API 创建数据源类终端 |
| **创建发布终端** | CREATE_PUBLISH_TERMINAL | internal_api | 调用内部 API 创建 Telegram 等发布终端 |
| **配置项目 Agent** | CONFIGURE_PROJECT_AGENT | internal_api | 写入 ProjectAgentConfig 覆盖参数 |
| **测试终端连通** | TEST_TERMINAL_CONNECTION | internal_api | 调用终端测试接口验证配置正确 |

### 4.3 执行方式分布

```
7 个 Skill 中：
- 5 个 internal_api（CREATE_DATASOURCE_TERMINAL, CREATE_PUBLISH_TERMINAL, CONFIGURE_PROJECT_AGENT, TEST_TERMINAL_CONNECTION, LIST_AVAILABLE_RESOURCES）
- 1 个 llm（PARSE_CONFIG_INTENT：纯理解场景）
- 1 个 hybrid（SUGGEST_DATASOURCES：LLM 推荐 + API 查询可用资源）

LLM 消耗低，大部分操作是 API 调用。
```

---

## 五、Skill 详细定义

### 5.1 ParseConfigIntent（解析配置意图）

```json
{
  "id": "skill-parse-config-intent",
  "name": "ParseConfigIntent",
  "nameZh": "解析配置意图",
  "code": "PARSE_CONFIG_INTENT",
  "category": "config",
  "executionType": "llm",
  "openClawSpecJson": {
    "steps": [
      "阅读运营人员的自然语言描述",
      "识别配置操作类型",
      "提取目标资源类型和关键参数",
      "判断信息是否充足（如不充足标记需追问的字段）",
      "输出结构化配置意图"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "userMessage": { "type": "string", "description": "运营人员的原始描述" },
        "projectContext": {
          "type": "object",
          "description": "当前项目上下文",
          "properties": {
            "projectTypeId": { "type": "string" },
            "projectName": { "type": "string" },
            "existingTerminals": { "type": "array" },
            "existingAgentConfigs": { "type": "array" }
          }
        }
      },
      "required": ["userMessage"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "intentType": {
          "type": "string",
          "enum": [
            "create_datasource",
            "create_publish_terminal",
            "configure_agent",
            "query_resources",
            "test_connection",
            "unclear"
          ]
        },
        "resourceType": { "type": "string" },
        "parameters": { "type": "object" },
        "needsClarification": { "type": "boolean" },
        "clarificationQuestions": { "type": "array", "items": { "type": "string" } },
        "confidence": { "type": "number" }
      },
      "required": ["intentType", "needsClarification"]
    }
  },
  "promptTemplate": "运营人员在项目「{projectContext.projectName}」中说：\n\n\"{userMessage}\"\n\n当前项目已有资源：{projectContext.existingTerminals}\n\n请分析这句话的配置意图，输出 JSON 格式的结构化结果。如果信息不够明确，设置 needsClarification=true 并列出需要追问的问题。",
  "estimatedDurationMs": 2000,
  "maxRetries": 1
}
```

**意图分类表**：

| intentType | 含义 | 后续 Skill |
|-----------|------|-----------|
| `create_datasource` | 创建数据源终端 | SUGGEST_DATASOURCES → CREATE_DATASOURCE_TERMINAL |
| `create_publish_terminal` | 创建发布终端 | CREATE_PUBLISH_TERMINAL |
| `configure_agent` | 调整 Agent 参数 | CONFIGURE_PROJECT_AGENT |
| `query_resources` | 查询已有资源 | LIST_AVAILABLE_RESOURCES |
| `test_connection` | 测试终端连通性 | TEST_TERMINAL_CONNECTION |
| `unclear` | 无法判断 | 回复追问 |

### 5.2 SuggestDataSources（推荐数据源）

```json
{
  "id": "skill-suggest-datasources",
  "name": "SuggestDataSources",
  "nameZh": "推荐数据源方案",
  "code": "SUGGEST_DATASOURCES",
  "category": "config",
  "executionType": "hybrid",
  "openClawSpecJson": {
    "steps": [
      "查询系统可用的 DataSourceProvider 列表",
      "根据项目类型和用户需求，筛选相关 Provider",
      "评估每个 Provider 的能力（搜索/监控/提取/订阅）",
      "标注免费/收费信息",
      "生成推荐方案（按优先级排序）"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "domain": { "type": "string", "description": "业务领域（体育/科技/金融/...）" },
        "subDomains": { "type": "array", "items": { "type": "string" } },
        "dataNeeds": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["real_time_search", "social_monitor", "content_extract", "rss_subscribe", "news_aggregate"]
          }
        },
        "budgetPreference": {
          "type": "string",
          "enum": ["free_only", "free_first", "no_limit"],
          "default": "free_first"
        }
      },
      "required": ["domain"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "recommendations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "providerCode": { "type": "string" },
              "providerNameZh": { "type": "string" },
              "capability": { "type": "string" },
              "isFree": { "type": "boolean" },
              "freeQuota": { "type": "string" },
              "suggestedConfig": { "type": "object" },
              "priority": { "type": "number" }
            }
          }
        },
        "totalCostEstimate": { "type": "string" }
      },
      "required": ["recommendations"]
    }
  },
  "estimatedDurationMs": 3000,
  "maxRetries": 1
}
```

### 5.3 CreateDataSourceTerminal（创建数据源终端）

```json
{
  "id": "skill-create-datasource-terminal",
  "name": "CreateDataSourceTerminal",
  "nameZh": "创建数据源终端",
  "code": "CREATE_DATASOURCE_TERMINAL",
  "category": "config",
  "executionType": "internal_api",
  "openClawSpecJson": {
    "steps": [
      "验证 Provider 可用性",
      "验证凭证已配置（或使用免费额度）",
      "创建 Terminal 记录（type=datasource）",
      "写入 DataSourceConfig",
      "绑定到当前项目",
      "测试连通性",
      "返回创建结果"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": { "type": "string" },
        "providerCode": {
          "type": "string",
          "enum": ["tavily", "apify", "jina_reader", "rss"]
        },
        "terminalName": { "type": "string" },
        "config": {
          "type": "object",
          "description": "Provider 特定配置",
          "properties": {
            "defaultKeywords": { "type": "array" },
            "targetUrls": { "type": "array" },
            "rssFeeds": { "type": "array" },
            "monitorTargets": { "type": "array" },
            "refreshIntervalMinutes": { "type": "number" }
          }
        }
      },
      "required": ["projectId", "providerCode", "terminalName"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "terminalId": { "type": "string" },
        "created": { "type": "boolean" },
        "boundToProject": { "type": "boolean" },
        "connectionTestResult": {
          "type": "object",
          "properties": {
            "success": { "type": "boolean" },
            "message": { "type": "string" },
            "latencyMs": { "type": "number" }
          }
        }
      },
      "required": ["created"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "internal",
    "methods": [
      "POST /api/terminals",
      "POST /api/datasource/config",
      "POST /api/projects/{projectId}/terminals",
      "POST /api/datasource/test"
    ],
    "requiresAuth": true
  },
  "estimatedDurationMs": 5000,
  "maxRetries": 1
}
```

### 5.4 CreatePublishTerminal（创建发布终端）

```json
{
  "id": "skill-create-publish-terminal",
  "name": "CreatePublishTerminal",
  "nameZh": "创建发布终端",
  "code": "CREATE_PUBLISH_TERMINAL",
  "category": "config",
  "executionType": "internal_api",
  "openClawSpecJson": {
    "steps": [
      "确认终端类型（当前仅 Telegram）",
      "验证 Bot Token 已配置",
      "创建 Terminal 记录",
      "绑定频道/群组",
      "绑定到当前项目",
      "测试消息发送能力",
      "返回创建结果"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": { "type": "string" },
        "terminalType": {
          "type": "string",
          "enum": ["telegram"]
        },
        "terminalName": { "type": "string" },
        "botToken": { "type": "string", "description": "加密传输，不在日志中记录" },
        "channels": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "chatId": { "type": "string" },
              "chatName": { "type": "string" },
              "chatType": { "type": "string", "enum": ["group", "supergroup", "channel"] }
            }
          }
        }
      },
      "required": ["projectId", "terminalType", "terminalName"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "terminalId": { "type": "string" },
        "created": { "type": "boolean" },
        "channelsBound": { "type": "number" },
        "connectionTestResult": {
          "type": "object",
          "properties": {
            "success": { "type": "boolean" },
            "botUsername": { "type": "string" },
            "message": { "type": "string" }
          }
        }
      },
      "required": ["created"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "internal",
    "methods": [
      "POST /api/terminals/telegram",
      "POST /api/projects/{projectId}/terminals",
      "POST /api/terminals/{id}/test"
    ],
    "requiresAuth": true
  },
  "estimatedDurationMs": 5000,
  "maxRetries": 1
}
```

### 5.5 ConfigureProjectAgent（配置项目 Agent 参数）

```json
{
  "id": "skill-configure-project-agent",
  "name": "ConfigureProjectAgent",
  "nameZh": "配置项目 Agent 参数",
  "code": "CONFIGURE_PROJECT_AGENT",
  "category": "config",
  "executionType": "internal_api",
  "openClawSpecJson": {
    "steps": [
      "确认目标 AgentTemplate 在项目可用范围内",
      "解析用户要修改的参数（指令、模型、温度等）",
      "创建或更新 ProjectAgentConfig 记录",
      "返回修改结果"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "projectId": { "type": "string" },
        "agentTemplateId": { "type": "string" },
        "overrides": {
          "type": "object",
          "properties": {
            "instructionOverride": { "type": "string" },
            "channelStyleOverride": { "type": "string" },
            "modelConfigIdOverride": { "type": "string" },
            "temperatureOverride": { "type": "number", "minimum": 0, "maximum": 2 },
            "maxTokensOverride": { "type": "number" }
          }
        }
      },
      "required": ["projectId", "agentTemplateId", "overrides"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "configId": { "type": "string" },
        "applied": { "type": "boolean" },
        "previousValues": { "type": "object" },
        "newValues": { "type": "object" }
      },
      "required": ["applied"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "internal",
    "methods": [
      "POST /api/projects/{projectId}/agent-configs",
      "PUT /api/projects/{projectId}/agent-configs/{configId}"
    ],
    "requiresAuth": true
  },
  "estimatedDurationMs": 2000,
  "maxRetries": 1
}
```

**实用示例**：

```
运营人员："内容写作的 Agent 用 GPT-4o，温度调高一点，写东西更有创意"

Config Agent:
  → PARSE_CONFIG_INTENT:
    intentType: "configure_agent"
    resourceType: "agent_config"
    parameters: {
      agentCode: "content-creator",
      modelPreference: "gpt-4o",
      temperatureDirection: "higher"
    }

  → CONFIGURE_PROJECT_AGENT:
    agentTemplateId: "at-content-creator"
    overrides: {
      modelConfigIdOverride: "mc-gpt4o",
      temperatureOverride: 0.9
    }

  → 回复：
    ✅ 已更新内容创作 Agent 的配置：
    - 模型：GPT-4o-mini → GPT-4o
    - 温度：0.7 → 0.9（更有创意）
    这些调整仅影响当前项目，不影响其他项目。
```

### 5.6 TestTerminalConnection（测试终端连通）

```json
{
  "id": "skill-test-terminal-connection",
  "name": "TestTerminalConnection",
  "nameZh": "测试终端连通性",
  "code": "TEST_TERMINAL_CONNECTION",
  "category": "config",
  "executionType": "internal_api",
  "openClawSpecJson": {
    "steps": [
      "获取目标终端配置",
      "根据终端类型调用对应测试接口",
      "返回测试结果（延迟、状态、错误信息）"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "terminalId": { "type": "string" },
        "testType": {
          "type": "string",
          "enum": ["connectivity", "send_test", "fetch_test"],
          "default": "connectivity"
        }
      },
      "required": ["terminalId"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "success": { "type": "boolean" },
        "latencyMs": { "type": "number" },
        "message": { "type": "string" },
        "details": { "type": "object" }
      },
      "required": ["success", "message"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "internal",
    "methods": ["POST /api/terminals/{id}/test"],
    "requiresAuth": true
  },
  "estimatedDurationMs": 5000,
  "maxRetries": 2
}
```

### 5.7 ListAvailableResources（列出可用资源）

```json
{
  "id": "skill-list-available-resources",
  "name": "ListAvailableResources",
  "nameZh": "查询可用资源",
  "code": "LIST_AVAILABLE_RESOURCES",
  "category": "config",
  "executionType": "internal_api",
  "openClawSpecJson": {
    "steps": [
      "查询系统可用的资源列表",
      "按类型分组（数据源 Provider、终端类型、模型配置）",
      "标注状态（已启用/已配置凭证/免费额度）",
      "返回结构化列表"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "resourceType": {
          "type": "string",
          "enum": ["datasource_providers", "terminal_types", "model_configs", "all"],
          "default": "all"
        },
        "projectId": { "type": "string", "description": "可选，查当前项目已绑定的资源" }
      }
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "datasourceProviders": { "type": "array" },
        "terminalTypes": { "type": "array" },
        "modelConfigs": { "type": "array" },
        "projectBoundResources": { "type": "array" }
      }
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "internal",
    "methods": [
      "GET /api/datasource/providers",
      "GET /api/terminal-types",
      "GET /api/llm/model-configs",
      "GET /api/projects/{projectId}/terminals"
    ],
    "requiresAuth": true
  },
  "estimatedDurationMs": 2000,
  "maxRetries": 1
}
```

---

## 六、执行流程详解

### 6.1 完整配置流程

```
运营人员输入自然语言
  │
  ↓
步骤 1: PARSE_CONFIG_INTENT（LLM 理解意图）
  → 输出: { intentType, parameters, needsClarification }
  │
  ├→ needsClarification = true
  │   → Config Agent 回复追问
  │   → 等待运营人员补充信息
  │   → 重新 PARSE_CONFIG_INTENT
  │
  └→ needsClarification = false
      │
      ↓
步骤 2: 准备阶段（按 intentType 分流）
  ├→ create_datasource → SUGGEST_DATASOURCES → 展示方案
  ├→ create_publish_terminal → LIST_AVAILABLE_RESOURCES → 展示选项
  ├→ configure_agent → LIST_AVAILABLE_RESOURCES(model_configs) → 展示选项
  ├→ query_resources → LIST_AVAILABLE_RESOURCES → 直接展示
  └→ test_connection → 直接执行
      │
      ↓
步骤 3: 用户确认
  → 展示即将执行的操作详情
  → 等待用户确认（"好的"/"继续"/"调整..."）
      │
      ↓
步骤 4: 执行（调用对应执行 Skill）
  → CREATE_DATASOURCE_TERMINAL / CREATE_PUBLISH_TERMINAL / CONFIGURE_PROJECT_AGENT
      │
      ↓
步骤 5: 验证
  → TEST_TERMINAL_CONNECTION（自动执行）
      │
      ↓
步骤 6: 反馈
  → 中文反馈执行结果（成功/失败/部分成功）
```

### 6.2 多轮对话示例

```
[运营人员] 帮我配置这个项目的数据源

[Config Agent]
  → PARSE_CONFIG_INTENT: { intentType: "create_datasource", needsClarification: true,
      clarificationQuestions: ["你需要什么领域的数据？", "需要实时搜索还是定期监控？"] }

  回复：好的，我来帮你配置数据源。请告诉我：
  1. 你主要关注什么领域的数据？（比如体育、科技、金融...）
  2. 需要实时搜索还是定期监控？

[运营人员] 体育的，主要是足球，需要每天的比赛信息和球员动态

[Config Agent]
  → PARSE_CONFIG_INTENT: { intentType: "create_datasource",
      parameters: { domain: "sports", subDomains: ["football"],
      dataNeeds: ["real_time_search", "social_monitor", "rss_subscribe"] } }
  → SUGGEST_DATASOURCES:
      recommendations: [
        { providerCode: "tavily", capability: "实时搜索", isFree: true },
        { providerCode: "rss", capability: "订阅 ESPN/BBC 足球板块", isFree: true },
        { providerCode: "apify", capability: "监控球员社交媒体", isFree: false, freeQuota: "5次/天" }
      ]

  回复：根据你的需求，推荐以下方案：
  1. 🔍 Tavily 搜索（免费）— 搜索每日赛程、比分、球员伤病
  2. 📰 RSS 订阅（免费）— ESPN 和 BBC Sport 足球板块自动推送
  3. 📱 Apify 监控（免费额度 5次/天）— 监控球员和球队官方社交媒体

  建议先配 1 和 2（免费），3 看需要再开。确认吗？

[运营人员] 可以，先配前两个

[Config Agent]
  → CREATE_DATASOURCE_TERMINAL(tavily, ...)
  → CREATE_DATASOURCE_TERMINAL(rss, ...)
  → TEST_TERMINAL_CONNECTION(...)

  回复：✅ 配置完成！
  1. Tavily 搜索终端 — 已创建，连通性 ✅（延迟 320ms）
  2. RSS 订阅终端 — 已创建，连通性 ✅

  Research Agent 现在可以使用这些数据源了。
```

---

## 七、安全边界

### 7.1 Config Agent 的权限范围

Config Agent 只能操作**项目级资源**，不能修改系统级配置：

| 可以做 | 不能做 |
|-------|-------|
| 创建项目终端 | 创建系统 Provider |
| 绑定终端到项目 | 修改 Provider 全局配置 |
| 调整项目 Agent 参数 | 修改 AgentTemplate 本身 |
| 查询可用资源 | 创建新的 AgentTemplate |
| 测试终端连通性 | 修改 LLM 凭证 |
| 配置数据源关键词 | 修改其他项目的配置 |

### 7.2 敏感操作保护

| 操作 | 保护机制 |
|------|---------|
| Bot Token 传输 | 加密传输，不在日志和对话记录中明文显示 |
| API Key 配置 | 引导用户到系统配置中心（由管理员操作），Config Agent 不直接处理密钥 |
| 删除终端 | 当前阶段 Config Agent 不支持删除操作，需在配置页面手动操作 |
| 跨项目操作 | 严格限制在当前项目上下文内 |

### 7.3 错误处理

| 场景 | 处理方式 | 回复运营人员 |
|------|---------|------------|
| Provider 未启用 | 提示需要管理员在系统中心启用 | "Apify 数据源目前未启用，需要系统管理员在「数据源配置中心」中启用后才能使用" |
| 凭证未配置 | 提示需要管理员配置凭证 | "Tavily 的 API Key 还未配置。免费额度无需密钥，但高级功能需要管理员配置密钥" |
| 连通性测试失败 | 给出具体原因和建议 | "RSS 订阅源 ESPN NBA 连接失败（超时），可能地址有变化。我换一个试试？" |
| 模型不存在 | 列出可用模型供选择 | "GPT-4-turbo 在系统中未配置，当前可用的模型有：GPT-4o、GPT-4o-mini" |
| 意图无法理解 | 追问 | "抱歉没太理解你的需求，你是要配置数据源、发布终端，还是调整 Agent 参数？" |

---

## 八、前端交互设计

### 8.1 配置助手面板

在项目详情页的「项目设置」或「资源配置」Tab 中嵌入配置助手：

```
┌─────────────────────────────────────────────────┐
│ 项目详情 > 体育赛事预测 Bot                        │
├──────────┬──────────────────────────────────────┤
│ 概览     │                                      │
│ 目标     │  ┌── 项目资源 ──────────────────────┐ │
│ 流程     │  │                                  │ │
│ Agent    │  │  终端列表 / 数据源列表            │ │
│ 终端     │  │  （资源卡片展示）                 │ │
│▸资源配置 │  │                                  │ │
│ 设置     │  │                                  │ │
│          │  └──────────────────────────────────┘ │
│          │                                      │
│          │  ┌── 配置助手 ──────────────────────┐ │
│          │  │ 💬 帮我配一个体育新闻数据源       │ │
│          │  │                                  │ │
│          │  │ [对话历史区域]                    │ │
│          │  │                                  │ │
│          │  │ [输入框] [发送]                   │ │
│          │  └──────────────────────────────────┘ │
└──────────┴──────────────────────────────────────┘
```

### 8.2 交互组件

- **对话式输入**：类似聊天界面，运营人员输入自然语言
- **操作确认卡片**：Config Agent 展示配置方案时，使用结构化卡片 + 确认/调整按钮
- **执行结果反馈**：绿色/红色状态标记，连通性测试结果实时展示
- **资源状态联动**：配置成功后，上方资源列表自动刷新

### 8.3 快捷操作

除了自然语言对话，提供常用操作快捷入口：

```
快捷配置：
[+ 数据源] [+ Telegram 终端] [调整 Agent 参数] [测试全部连通性]
```

点击快捷按钮后进入对应的引导式对话流程。

---

## 九、与项目创建流程的关系

### 9.1 项目创建后的资源配置

项目创建流程（06-project-domain.md 第 4 节）完成后，项目通常缺少具体资源配置。Config Agent 负责填补这个空白：

```
项目创建完成（基础信息 + 目标 + 流程选择）
  ↓
项目详情页 → "资源配置" Tab
  ↓
Config Agent 主动提示："这个项目还没有配置数据源和发布终端，需要我帮你配置吗？"
  ↓
运营人员确认 → 开始配置对话
```

### 9.2 智能推荐

Config Agent 根据项目类型自动推荐资源组合：

| 项目类型 | 推荐数据源 | 推荐终端 |
|---------|-----------|---------|
| 社媒内容运营 | Tavily + Apify + RSS | Telegram 频道/群 |
| 账号矩阵管理 | Tavily + Apify | Telegram 多群/多频道 |
| 网站运营与 SEO | Tavily + Jina Reader + RSS | （暂无，预留 WordPress） |
| 线索获客 | Tavily + Apify | Telegram 群 |

---

## 十、开发顺序

```
步骤 1: Agent 模板种子
  → 新增 at-config-agent 到 agentTemplateSeed.ts
  → 配置 supportedSkillIds、systemPromptTemplate

步骤 2: Skill 种子
  → 新增 7 个 Config Skill 到 skillSeed.ts
  → 每个 Skill 完善 openClawSpec、inputSchema、outputSchema、executionConfigJson

步骤 3: 意图解析
  → 实现 PARSE_CONFIG_INTENT 的 LLM 调用
  → 测试各类自然语言输入的意图分类准确性

步骤 4: 资源查询
  → 实现 LIST_AVAILABLE_RESOURCES 对接各资源 API
  → 实现 SUGGEST_DATASOURCES 的推荐逻辑

步骤 5: 创建能力
  → 实现 CREATE_DATASOURCE_TERMINAL 对接数据源中心（01）API
  → 实现 CREATE_PUBLISH_TERMINAL 对接终端管理 API
  → 实现 CONFIGURE_PROJECT_AGENT 对接 ProjectAgentConfig API

步骤 6: 验证能力
  → 实现 TEST_TERMINAL_CONNECTION 对接各终端测试接口
  → 创建后自动验证

步骤 7: 前端配置助手面板
  → 项目详情页「资源配置」Tab 内嵌对话式配置面板
  → 操作确认卡片 + 执行结果反馈

步骤 8: 集成测试
  → "帮我配一个体育新闻数据源" → 推荐方案 → 确认 → 创建成功 → 连通性 ✅
  → "这个项目用 GPT-4o" → 解析 → 确认 → Agent 参数更新
  → "帮我加个 Telegram 群" → 引导输入 Bot Token → 创建终端 → 测试通过
  → 模糊需求 → 追问 → 补充 → 成功
```

---

## 十一、验收标准

- [ ] at-config-agent Agent 模板已创建，含完整 systemPrompt
- [ ] PARSE_CONFIG_INTENT 正确分类：create_datasource / configure_agent / query_resources / unclear
- [ ] SUGGEST_DATASOURCES 根据项目类型推荐合理方案，标注免费/收费
- [ ] CREATE_DATASOURCE_TERMINAL 可创建 Tavily / RSS 数据源终端
- [ ] CREATE_PUBLISH_TERMINAL 可创建 Telegram 发布终端
- [ ] CONFIGURE_PROJECT_AGENT 可修改项目级 Agent 参数（模型/温度/指令）
- [ ] TEST_TERMINAL_CONNECTION 创建后自动测试，结果正确反馈
- [ ] 多轮对话：模糊需求 → 追问 → 补充 → 成功配置
- [ ] 确认机制：创建类操作执行前展示方案并等待确认
- [ ] 安全边界：不能修改系统级配置、不能跨项目操作
- [ ] 错误处理：Provider 未启用/凭证缺失/连通失败 → 中文说明 + 建议
- [ ] 前端配置助手面板：对话式交互 + 确认卡片 + 结果反馈
- [ ] 所有回复和提示使用中文
