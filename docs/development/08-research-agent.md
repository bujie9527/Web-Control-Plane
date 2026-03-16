# 08 — Research Agent + 数据采集 Skill

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：数据源配置中心（01）、Skill 执行引擎（03）
> 后续依赖：主动推送闭环（10）— Research Agent 是内容创作链路的第一环
> 实用化案例：体育赛事预测 Bot — 每日自动搜索 NBA/英超赛程、伤病报告、数据统计，为内容创作提供素材

---

## 一、Agent 定位

Research Agent 是系统中负责**外部数据采集与整理**的执行类 Agent。它不创作内容，不发布内容，只负责"找到运营需要的素材"并整理为其他 Agent 可直接使用的结构化数据。

**核心价值**：AI 创作不能凭空编造，必须基于真实信息。Research Agent 是整个内容创作链的第一环，没有它，Content Creator 只能生产通用废话。

**它不是**：
- 搜索引擎（不是用户输入关键词然后返回链接列表）
- 内容创作者（不写文章，只提供素材包）
- 数据分析师（不做深度统计分析，只做数据采集和初步整理）
- 爬虫工具（不直接爬网页，通过 DataSourceProvider 间接获取）

**它是**：
- 外部信息的采集员（通过多个数据源获取最新信息）
- 素材的整理员（将杂乱的搜索结果整理为结构化素材包）
- 数据源的调度员（根据需求选择最合适的数据源）
- 内容创作的上游供应商（为 Content Creator / Interaction Agent 提供素材）

### 与其他 Agent 的边界

| 场景 | 处理者 | 原因 |
|------|-------|------|
| 搜索今晚 NBA 赛程 | **Research Agent** | 数据采集 |
| 监控 ESPN Twitter 最新动态 | **Research Agent** | 社媒监控 |
| 提取某篇球员专访全文 | **Research Agent** | 内容提取 |
| 基于赛程数据写预测文章 | Content Creator | 内容创作（Research 提供素材） |
| 用户问"今晚谁赢" | Interaction Agent | 实时对话（可调 Research 搜索） |
| 每天定时采集赛事数据 | **Research Agent** | 定时数据采集任务 |
| 配置一个新的数据源 | Config Agent | 资源配置 |

### 在内容创作链路中的位置

```
Research Agent（采集素材）
  ↓ 素材包（ResearchResult）
Content Creator（基于素材创作）
  ↓ 内容草稿
Content Reviewer（审核内容）
  ↓ 审核通过的内容
Publisher Agent（发布到终端）
```

Research Agent 的输出质量直接决定了整条链路的内容质量。

---

## 二、Agent 模板定义

### 2.1 AgentTemplate 种子

```
AgentTemplate:
  id:                     'at-research-agent'
  name:                   'Research Agent'
  nameZh:                 '数据采集 Agent'
  code:                   'research-agent'
  category:               'execution'
  roleType:               'researcher'
  domain:                 'general'
  description:            '通过多个数据源采集外部信息，整理为结构化素材包，供内容创作和对话回复使用'
  status:                 'active'
  isSystemPreset:         true
  isCloneable:            true

  systemPromptTemplate:   见 2.2
  instructionTemplate:    见 2.3
  outputFormat:           'json'

  supportedSkillIds:      [
    'skill-search-web',
    'skill-monitor-social',
    'skill-extract-article',
    'skill-subscribe-rss',
    'skill-summarize-research',
    'skill-compose-research-pack'
  ]
  defaultExecutorType:    'hybrid'
  allowedTerminalTypes:   '["datasource"]'

  supportedProjectTypeIds: '["pt-social-media", "pt-account-operation", "pt-website-ops", "pt-facebook-page"]'

  channelStyleProfiles:   {}    // Research Agent 不面向用户，无渠道适配

  temperature:            0.3   // 数据采集需要高准确性
  maxTokens:              4096  // 素材汇总可能较长

  requireIdentityContext: false   // 采集数据不需要人设
  requireStructuredOutput: true   // 输出必须结构化
  disallowDirectTerminalAction: true
```

### 2.2 System Prompt Template

```
你是一个数据采集助手，负责从外部数据源获取最新信息并整理为结构化素材。

核心规则：
1. 你只采集和整理数据，不创作内容
2. 搜索结果必须标注来源（URL/来源名称/时间）
3. 优先使用免费数据源，标注哪些数据来自收费源
4. 去除重复信息，合并相同主题的多个来源
5. 输出必须是结构化 JSON，不是自然语言描述
6. 如果所有数据源都失败，明确报告失败原因
7. 不要编造数据，没找到就说没找到
```

### 2.3 Instruction Template

```
数据采集规范：
- 每次采集任务必须明确主题和关键词
- 搜索结果按相关性排序
- 时效性优先：优先保留最近 24 小时内的信息
- 每条素材必须包含：标题、摘要、来源、时间、相关性评分
- 素材包总量控制在 10-20 条核心信息内
- 如果项目有特定领域要求，优先匹配该领域的数据
```

---

## 三、数据源调度策略

Research Agent 的核心能力是**根据采集需求选择最合适的数据源组合**。

### 3.1 数据源能力矩阵

| 数据源 | 实时搜索 | 社媒监控 | 内容提取 | 定期订阅 | 成本 |
|-------|---------|---------|---------|---------|------|
| Tavily | ✅ 强 | ❌ | ❌ | ❌ | 免费额度 + 付费 |
| Apify | ❌ | ✅ 强 | ✅ 中 | ❌ | 免费额度 + 付费 |
| Jina Reader | ❌ | ❌ | ✅ 强 | ❌ | 免费 |
| RSS | ❌ | ❌ | ❌ | ✅ 强 | 免费 |

### 3.2 需求→数据源映射

| 采集需求 | 首选数据源 | 备选数据源 | 说明 |
|---------|-----------|-----------|------|
| 最新新闻/赛事 | Tavily | RSS | Tavily 更实时，RSS 更稳定 |
| 球员/名人动态 | Apify | Tavily | Apify 直接监控社交媒体 |
| 深度文章全文 | Jina Reader | Apify | Jina 专做内容提取 |
| 行业日常更新 | RSS | Tavily | RSS 零成本，适合日常 |
| 热点事件追踪 | Tavily + Apify | — | 多源交叉验证 |

### 3.3 调度逻辑

```
采集请求进入
  │
  ├→ 分析需求类型（实时搜索 / 社媒监控 / 内容提取 / 订阅更新）
  │
  ├→ 检查项目已配置的数据源终端
  │   → 有对应终端 → 使用
  │   → 无对应终端 → 降级到可用终端 or 报告缺少数据源
  │
  ├→ 按成本优先级排序
  │   → 免费源优先
  │   → 免费额度用尽 → 收费源（如已授权）
  │   → 无可用源 → 报告失败
  │
  └→ 执行采集 → 合并去重 → 输出素材包
```

---

## 四、Skill 清单

### 4.1 数据采集 Skill（对接 DataSourceProvider）

| Skill | code | executionType | 对接 Provider | 说明 |
|-------|------|--------------|-------------|------|
| **Web 搜索** | SEARCH_WEB | external_api | Tavily | 实时搜索指定主题的最新信息 |
| **社媒监控** | MONITOR_SOCIAL | external_api | Apify | 监控指定账号/话题的社交媒体动态 |
| **内容提取** | EXTRACT_ARTICLE | external_api | Jina Reader | 提取指定 URL 的文章正文 |
| **RSS 订阅** | SUBSCRIBE_RSS | external_api | RSS | 获取指定 RSS 源的最新条目 |

### 4.2 数据处理 Skill

| Skill | code | executionType | 说明 |
|-------|------|--------------|------|
| **素材汇总** | SUMMARIZE_RESEARCH | llm | 将多个搜索结果压缩为关键信息摘要 |
| **素材包组装** | COMPOSE_RESEARCH_PACK | llm | 将多源数据合并为标准化 ResearchResult |

### 4.3 执行方式分布

```
6 个 Skill 中：
- 4 个 external_api（直接调数据源 API，不需要 LLM）
- 2 个 llm（数据整理和汇总，需要 LLM 理解和压缩）

数据采集本身不需要 LLM，LLM 只在整理阶段使用。
```

---

## 五、Skill 详细定义

### 5.1 SearchWebForTopic（Web 搜索）

```json
{
  "id": "skill-search-web",
  "name": "SearchWebForTopic",
  "nameZh": "Web 主题搜索",
  "code": "SEARCH_WEB",
  "category": "research",
  "executionType": "external_api",
  "openClawSpecJson": {
    "steps": [
      "构造搜索查询（主题 + 时间范围 + 语言）",
      "调用 Tavily Search API",
      "解析返回结果",
      "按相关性排序",
      "输出标准化搜索结果列表"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": { "type": "string", "description": "搜索关键词" },
        "searchDepth": {
          "type": "string",
          "enum": ["basic", "advanced"],
          "default": "basic",
          "description": "basic=快速搜索，advanced=深度搜索（消耗更多额度）"
        },
        "maxResults": { "type": "number", "default": 10, "maximum": 20 },
        "includeAnswer": { "type": "boolean", "default": true },
        "timeRange": {
          "type": "string",
          "enum": ["day", "week", "month", "any"],
          "default": "day"
        },
        "includeDomains": {
          "type": "array",
          "items": { "type": "string" },
          "description": "限定搜索域名（如 espn.com, bbc.com/sport）"
        },
        "excludeDomains": {
          "type": "array",
          "items": { "type": "string" },
          "description": "排除域名"
        }
      },
      "required": ["query"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "answer": { "type": "string", "description": "Tavily 生成的直接回答" },
        "results": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "url": { "type": "string" },
              "content": { "type": "string" },
              "score": { "type": "number" },
              "publishedDate": { "type": "string" }
            }
          }
        },
        "totalResults": { "type": "number" },
        "searchCost": { "type": "string", "enum": ["free", "paid"] }
      },
      "required": ["results"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "datasource",
    "providerCode": "tavily",
    "method": "search",
    "requiresCredential": true,
    "credentialType": "tavily_api_key",
    "timeoutMs": 10000,
    "retryOnTimeout": true
  },
  "estimatedDurationMs": 3000,
  "maxRetries": 2
}
```

**实用示例**：

```
输入:
  query: "NBA Lakers vs Celtics March 17 2026 prediction"
  searchDepth: "basic"
  maxResults: 10
  timeRange: "day"
  includeDomains: ["espn.com", "nba.com", "bleacherreport.com"]

输出:
  answer: "The Lakers face the Celtics tonight at 8:00 PM ET. LeBron James is listed as probable..."
  results: [
    { title: "Lakers vs Celtics Preview: Injury Report & Predictions",
      url: "https://espn.com/nba/preview?gameId=...",
      content: "LeBron James is probable with a sore knee...",
      score: 0.95, publishedDate: "2026-03-17T06:00:00Z" },
    { title: "NBA Odds: Lakers at Celtics Betting Lines",
      url: "https://...",
      content: "Celtics -5.5, O/U 218.5...",
      score: 0.88, publishedDate: "2026-03-17T08:00:00Z" },
    ...
  ]
```

### 5.2 MonitorSocialMedia（社媒监控）

```json
{
  "id": "skill-monitor-social",
  "name": "MonitorSocialMedia",
  "nameZh": "社交媒体监控",
  "code": "MONITOR_SOCIAL",
  "category": "research",
  "executionType": "external_api",
  "openClawSpecJson": {
    "steps": [
      "确认监控目标（账号/话题/关键词）",
      "调用 Apify Actor（Twitter Scraper 等）",
      "解析返回的帖子/推文数据",
      "按时间排序，去除无关内容",
      "输出标准化社媒动态列表"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "platform": {
          "type": "string",
          "enum": ["twitter", "instagram", "facebook", "tiktok"],
          "default": "twitter"
        },
        "monitorType": {
          "type": "string",
          "enum": ["account", "hashtag", "keyword"],
          "description": "监控类型：指定账号/话题标签/关键词"
        },
        "targets": {
          "type": "array",
          "items": { "type": "string" },
          "description": "监控目标列表（账号名/话题标签/关键词）"
        },
        "maxItems": { "type": "number", "default": 20, "maximum": 50 },
        "sinceHours": { "type": "number", "default": 24, "description": "获取最近 N 小时内的内容" }
      },
      "required": ["platform", "monitorType", "targets"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "posts": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "author": { "type": "string" },
              "authorHandle": { "type": "string" },
              "text": { "type": "string" },
              "url": { "type": "string" },
              "timestamp": { "type": "string" },
              "likes": { "type": "number" },
              "retweets": { "type": "number" },
              "replies": { "type": "number" },
              "mediaUrls": { "type": "array" }
            }
          }
        },
        "totalFetched": { "type": "number" },
        "monitorCost": { "type": "string" }
      },
      "required": ["posts"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "datasource",
    "providerCode": "apify",
    "actorId": "apidojo/tweet-scraper",
    "requiresCredential": true,
    "credentialType": "apify_api_token",
    "timeoutMs": 30000,
    "retryOnTimeout": false
  },
  "estimatedDurationMs": 15000,
  "maxRetries": 1
}
```

**实用示例**：

```
输入:
  platform: "twitter"
  monitorType: "account"
  targets: ["@ESPN", "@NBA", "@wojespn"]
  maxItems: 20
  sinceHours: 12

输出:
  posts: [
    { author: "Adrian Wojnarowski", authorHandle: "@wojespn",
      text: "Breaking: LeBron James has been upgraded to probable for tonight's game vs Celtics",
      url: "https://twitter.com/wojespn/status/...",
      timestamp: "2026-03-17T10:30:00Z",
      likes: 2341, retweets: 876, replies: 412 },
    ...
  ]
  totalFetched: 18
  monitorCost: "free_quota"
```

### 5.3 ExtractArticleContent（内容提取）

```json
{
  "id": "skill-extract-article",
  "name": "ExtractArticleContent",
  "nameZh": "文章内容提取",
  "code": "EXTRACT_ARTICLE",
  "category": "research",
  "executionType": "external_api",
  "openClawSpecJson": {
    "steps": [
      "接收目标 URL",
      "调用 Jina Reader API 提取正文",
      "输出清洗后的文章内容（标题、正文、作者、发布时间）"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "url": { "type": "string", "description": "目标文章 URL" },
        "extractImages": { "type": "boolean", "default": false },
        "maxLength": { "type": "number", "default": 5000, "description": "正文最大字符数" }
      },
      "required": ["url"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "author": { "type": "string" },
        "publishedDate": { "type": "string" },
        "content": { "type": "string" },
        "contentLength": { "type": "number" },
        "sourceUrl": { "type": "string" },
        "images": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["title", "content", "sourceUrl"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "datasource",
    "providerCode": "jina_reader",
    "method": "extract",
    "requiresCredential": false,
    "timeoutMs": 15000,
    "retryOnTimeout": true
  },
  "estimatedDurationMs": 5000,
  "maxRetries": 2
}
```

### 5.4 SubscribeRSSFeed（RSS 订阅）

```json
{
  "id": "skill-subscribe-rss",
  "name": "SubscribeRSSFeed",
  "nameZh": "RSS 订阅获取",
  "code": "SUBSCRIBE_RSS",
  "category": "research",
  "executionType": "external_api",
  "openClawSpecJson": {
    "steps": [
      "读取已配置的 RSS 订阅源列表",
      "逐个拉取最新条目",
      "过滤已读条目（基于发布时间或 GUID）",
      "按发布时间排序",
      "输出新条目列表"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "feedUrls": {
          "type": "array",
          "items": { "type": "string" },
          "description": "RSS 源地址列表"
        },
        "sinceHours": { "type": "number", "default": 24 },
        "maxItemsPerFeed": { "type": "number", "default": 10 },
        "filterKeywords": {
          "type": "array",
          "items": { "type": "string" },
          "description": "关键词过滤（只保留含关键词的条目）"
        }
      },
      "required": ["feedUrls"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "link": { "type": "string" },
              "description": { "type": "string" },
              "pubDate": { "type": "string" },
              "source": { "type": "string" },
              "guid": { "type": "string" }
            }
          }
        },
        "totalNewItems": { "type": "number" },
        "feedsChecked": { "type": "number" },
        "feedErrors": { "type": "array" }
      },
      "required": ["items"]
    }
  },
  "executionConfigJson": {
    "apiEndpoint": "datasource",
    "providerCode": "rss",
    "method": "fetch",
    "requiresCredential": false,
    "timeoutMs": 10000,
    "retryOnTimeout": true
  },
  "estimatedDurationMs": 5000,
  "maxRetries": 2
}
```

### 5.5 SummarizeResearchData（素材汇总）

```json
{
  "id": "skill-summarize-research",
  "name": "SummarizeResearchData",
  "nameZh": "素材数据汇总",
  "code": "SUMMARIZE_RESEARCH",
  "category": "research",
  "executionType": "llm",
  "openClawSpecJson": {
    "steps": [
      "接收多个来源的原始搜索/监控结果",
      "去除重复和低相关性信息",
      "提取关键事实和数据点",
      "按主题聚类",
      "生成结构化摘要"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "rawData": {
          "type": "object",
          "description": "来自各数据源的原始结果",
          "properties": {
            "searchResults": { "type": "array" },
            "socialPosts": { "type": "array" },
            "articles": { "type": "array" },
            "rssItems": { "type": "array" }
          }
        },
        "topic": { "type": "string" },
        "focusAreas": { "type": "array", "items": { "type": "string" } },
        "maxSummaryItems": { "type": "number", "default": 15 }
      },
      "required": ["rawData", "topic"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "keyFacts": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "fact": { "type": "string" },
              "source": { "type": "string" },
              "sourceUrl": { "type": "string" },
              "timestamp": { "type": "string" },
              "relevance": { "type": "number" },
              "category": { "type": "string" }
            }
          }
        },
        "topicSummary": { "type": "string" },
        "dataGaps": { "type": "array", "items": { "type": "string" } },
        "sourcesUsed": { "type": "number" },
        "deduplicatedCount": { "type": "number" }
      },
      "required": ["keyFacts", "topicSummary"]
    }
  },
  "promptTemplate": "以下是关于「{topic}」的多源数据，请整理为结构化素材：\n\n搜索结果：{rawData.searchResults}\n社媒动态：{rawData.socialPosts}\n文章内容：{rawData.articles}\nRSS 更新：{rawData.rssItems}\n\n重点关注：{focusAreas}\n\n要求：\n1. 去除重复信息\n2. 按相关性排序\n3. 每条 keyFact 必须标注来源\n4. 输出 JSON 格式",
  "estimatedDurationMs": 5000,
  "maxRetries": 1
}
```

### 5.6 ComposeResearchPack（素材包组装）

```json
{
  "id": "skill-compose-research-pack",
  "name": "ComposeResearchPack",
  "nameZh": "组装素材包",
  "code": "COMPOSE_RESEARCH_PACK",
  "category": "research",
  "executionType": "llm",
  "openClawSpecJson": {
    "steps": [
      "接收汇总后的 keyFacts",
      "根据下游 Agent 的需求类型组织素材",
      "为 Content Creator 生成创作提示",
      "为 Interaction Agent 生成问答参考",
      "打包为标准 ResearchResult 对象"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "keyFacts": { "type": "array" },
        "topicSummary": { "type": "string" },
        "targetAgent": {
          "type": "string",
          "enum": ["content_creator", "interaction", "general"],
          "default": "general"
        },
        "contentType": {
          "type": "string",
          "enum": ["prediction", "news_summary", "event_preview", "post_match_review", "general"],
          "description": "期望的内容类型，帮助组织素材重点"
        }
      },
      "required": ["keyFacts", "topicSummary"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "researchPack": {
          "type": "object",
          "properties": {
            "topic": { "type": "string" },
            "summary": { "type": "string" },
            "keyFacts": { "type": "array" },
            "suggestedAngles": {
              "type": "array",
              "items": { "type": "string" },
              "description": "建议的内容创作角度"
            },
            "dataHighlights": {
              "type": "array",
              "items": { "type": "string" },
              "description": "值得突出的数据点"
            },
            "sources": { "type": "array" },
            "freshness": { "type": "string", "description": "数据时效性说明" },
            "gaps": { "type": "array", "description": "数据缺口说明" }
          }
        }
      },
      "required": ["researchPack"]
    }
  },
  "promptTemplate": "基于以下素材，组装一个面向{targetAgent}的素材包。\n\n主题摘要：{topicSummary}\n关键事实：{keyFacts}\n内容类型：{contentType}\n\n要求：\n1. 提供 3-5 个建议创作角度\n2. 突出最有价值的数据点\n3. 标注数据时效性\n4. 指出数据缺口",
  "estimatedDurationMs": 4000,
  "maxRetries": 1
}
```

---

## 六、核心数据结构：ResearchResult

ResearchResult 是 Research Agent 的标准输出格式，也是下游 Agent 的标准输入。

```typescript
interface ResearchResult {
  id: string;
  projectId: string;
  topic: string;
  summary: string;
  
  keyFacts: ResearchFact[];
  suggestedAngles: string[];
  dataHighlights: string[];
  
  sources: ResearchSource[];
  freshness: string;       // "最新数据截至 2026-03-17 10:30"
  gaps: string[];           // ["缺少凯尔特人近期防守数据", "未获取到伤病详情"]
  
  metadata: {
    createdAt: string;
    dataSourcesUsed: string[];
    totalRawItems: number;
    deduplicatedItems: number;
    llmCallCount: number;
    totalCost: string;       // "free" | "0.02 USD"
  };
}

interface ResearchFact {
  fact: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  relevance: number;       // 0-1
  category: string;        // "injury", "stats", "odds", "news", "opinion"
}

interface ResearchSource {
  name: string;
  url: string;
  provider: string;        // "tavily" | "apify" | "jina" | "rss"
  fetchedAt: string;
}
```

---

## 七、执行流程详解

### 7.1 主动采集流程（定时触发，为内容创作准备素材）

```
定时调度触发：每日 07:00 "采集今日体育赛事信息"
  │
  ↓
创建 WorkflowInstance → Research 节点
  │
  ↓
Agent Dispatcher → Research Agent
  │
  ↓
步骤 1: 并行数据采集
  ┌→ SEARCH_WEB: "NBA games today March 17 2026 preview odds"
  │   → Tavily 返回 10 条搜索结果（~3s）
  │
  ├→ SEARCH_WEB: "Premier League matches today"
  │   → Tavily 返回 8 条搜索结果（~3s）
  │
  ├→ MONITOR_SOCIAL: @ESPN, @NBA, @PremierLeague
  │   → Apify 返回 20 条推文（~15s）
  │
  └→ SUBSCRIBE_RSS: ESPN NBA + BBC Sport
      → RSS 返回 12 条新条目（~5s）
  │
  ↓ 合计原始数据：~50 条
  │
步骤 2: SUMMARIZE_RESEARCH
  → LLM 去重、聚类、排序（~5s）
  → 输出 15 条 keyFacts
  │
  ↓
步骤 3: COMPOSE_RESEARCH_PACK
  → LLM 组装素材包（~4s）
  → 输出 ResearchResult
  │
  ↓
写入素材库 → 供 Content Creator 后续使用
```

总延迟：~20-25 秒（数据源并行 + LLM 2 次）
总成本：~1 次 Tavily 免费额度 + 1 次 Apify 免费额度 + 2 次 LLM 调用

### 7.2 被动采集流程（Interaction Agent 请求素材）

```
Interaction Agent 处理用户消息时判断需要搜索
  │
  ↓
调用 Research Agent 的 SEARCH_WEB Skill（单次搜索）
  → query: "Lakers vs Celtics prediction March 17 2026"
  → Tavily 返回 10 条结果（~3s）
  │
  ↓
调用 SUMMARIZE_RESEARCH（轻量汇总）
  → 输出 5 条 keyFacts（~3s）
  │
  ↓
返回给 Interaction Agent → 生成回复
```

总延迟：~6 秒
总成本：1 次 Tavily + 1 次 LLM

### 7.3 深度研究流程（针对特定主题的深度采集）

```
运营人员或 Content Creator 请求深度研究
  │
  ↓
步骤 1: SEARCH_WEB（深度搜索 advanced）
  → 详细搜索结果（~5s）
  │
  ↓
步骤 2: 从搜索结果中提取高价值文章 URL
  │
  ↓
步骤 3: EXTRACT_ARTICLE（逐篇提取全文）
  → Jina Reader 提取 3-5 篇文章（~15s）
  │
  ↓
步骤 4: SUMMARIZE_RESEARCH + COMPOSE_RESEARCH_PACK
  → 深度素材包（~8s）
```

总延迟：~30 秒
适用场景：赛事深度预测、专题内容、深度分析文章

---

## 八、缓存与去重

### 8.1 搜索结果缓存

| 缓存策略 | TTL | 说明 |
|---------|-----|------|
| 相同查询 + 相同时间范围 | 5 分钟 | 短时间内重复搜索直接复用 |
| RSS 条目 | 按 GUID 去重 | 已读条目不重复获取 |
| 社媒帖子 | 按帖子 ID 去重 | 同一帖子不重复返回 |

### 8.2 素材包缓存

ResearchResult 存储后，30 分钟内针对同一主题的采集请求可复用已有素材包，而非重新采集。

### 8.3 去重逻辑

```
多源数据合并时：
1. URL 完全相同 → 去重，保留第一个
2. 标题相似度 > 80% → 去重，保留内容更完整的
3. 事实相同但来源不同 → 合并来源列表，保留一条
```

---

## 九、错误处理与降级

| 场景 | 处理方式 | 影响 |
|------|---------|------|
| Tavily API 超时 | 重试 2 次，仍失败降级到 RSS | 搜索结果缺失，RSS 兜底 |
| Apify Actor 失败 | 重试 1 次，仍失败跳过社媒数据 | 社媒动态缺失 |
| Jina Reader 无法提取 | 跳过该文章，使用搜索摘要代替 | 全文缺失，用摘要 |
| RSS 源不可达 | 标记该源异常，跳过 | 该订阅源数据缺失 |
| 所有数据源都失败 | 返回空 ResearchResult + 错误报告 | 素材包为空，下游 Agent 需处理 |
| LLM 汇总失败 | 重试 1 次，仍失败返回原始数据不汇总 | 数据未整理但可用 |
| 免费额度用尽 | 提示运营人员，标记数据源受限 | 该数据源暂不可用 |

所有错误信息在 ResearchResult.gaps 中标注，确保下游 Agent 知道数据不完整。

---

## 十、成本控制

### 10.1 每日成本估算（体育赛事 Bot）

| 操作 | 频率 | 数据源 | 成本 |
|------|------|-------|------|
| 晨间赛事采集 | 1次/天 | Tavily(2次) + RSS + Apify | ~免费 |
| 用户问答搜索 | ~10次/天 | Tavily(10次) | Tavily 免费额度内 |
| 深度研究 | 1-2次/天 | Tavily(2次) + Jina(5次) | ~免费 |
| LLM 汇总 | ~15次/天 | GPT-4o-mini | ~$0.02 |
| **日均总成本** | | | **< $0.05** |

### 10.2 成本优化策略

1. **免费源优先**：RSS 和 Jina Reader 完全免费，优先使用
2. **缓存复用**：5 分钟内相同查询复用缓存
3. **按需深度**：大部分搜索用 basic，只有深度研究用 advanced
4. **轻量汇总模型**：SUMMARIZE_RESEARCH 可用 GPT-4o-mini 而非 GPT-4o
5. **批量采集**：定时任务一次采集多个主题，减少 API 调用次数

---

## 十一、开发顺序

```
步骤 1: Agent 模板种子
  → 新增 at-research-agent 到 agentTemplateSeed.ts
  → 配置 supportedSkillIds、systemPromptTemplate

步骤 2: Skill 种子
  → 新增 6 个 Research Skill 到 skillSeed.ts
  → 完善 openClawSpec、executionConfigJson

步骤 3: 数据源适配器
  → 在 Skill 执行引擎中实现 datasource provider 路由
  → SEARCH_WEB → dataSourceExecutor → tavilyAdapter
  → MONITOR_SOCIAL → dataSourceExecutor → apifyAdapter
  → EXTRACT_ARTICLE → dataSourceExecutor → jinaAdapter
  → SUBSCRIBE_RSS → dataSourceExecutor → rssAdapter

步骤 4: 数据源并行采集
  → 实现多数据源并行请求
  → 实现超时控制和单源失败不阻塞

步骤 5: 汇总与组装
  → 实现 SUMMARIZE_RESEARCH 的 LLM 调用
  → 实现 COMPOSE_RESEARCH_PACK 的素材包输出
  → 确保输出符合 ResearchResult 标准格式

步骤 6: 缓存与去重
  → 搜索结果缓存（5分钟 TTL）
  → RSS GUID 去重
  → 多源数据合并去重逻辑

步骤 7: 对接下游
  → 主动采集流程：定时触发 → 素材包存储 → 供 Content Creator 读取
  → 被动采集流程：Interaction Agent 调用 SEARCH_WEB → 返回搜索结果

步骤 8: 集成测试
  → 搜索"NBA today" → Tavily 返回结果 → 汇总 → 素材包
  → 监控 @ESPN → Apify 返回推文 → 汇总
  → 提取 ESPN 文章全文 → Jina 返回正文
  → RSS ESPN NBA → 返回最新条目
  → 全部数据源并行采集 → 合并去重 → 输出 ResearchResult
  → Tavily 超时 → 降级到 RSS 兜底
  → 免费额度用尽 → 正确提示
```

---

## 十二、验收标准

- [ ] at-research-agent Agent 模板已创建
- [ ] SEARCH_WEB 可执行：Tavily 返回搜索结果（< 5 秒）
- [ ] MONITOR_SOCIAL 可执行：Apify 返回社媒动态（< 20 秒）
- [ ] EXTRACT_ARTICLE 可执行：Jina Reader 提取文章全文（< 10 秒）
- [ ] SUBSCRIBE_RSS 可执行：RSS 返回最新条目（< 5 秒）
- [ ] SUMMARIZE_RESEARCH 可执行：多源数据去重汇总
- [ ] COMPOSE_RESEARCH_PACK 可执行：输出标准 ResearchResult
- [ ] 多数据源并行采集：单源失败不阻塞整体
- [ ] 缓存生效：5 分钟内相同查询复用缓存
- [ ] 去重生效：相同 URL / 相似标题不重复出现
- [ ] 降级策略：Tavily 失败 → RSS 兜底、Apify 失败 → 跳过社媒
- [ ] 免费额度耗尽时正确提示
- [ ] ResearchResult 格式标准化，下游 Agent 可直接使用
- [ ] 定时采集流程：触发 → 并行采集 → 汇总 → 存储（< 30 秒）
- [ ] 被动采集流程：Interaction Agent 请求 → 搜索 → 返回（< 8 秒）
- [ ] 所有错误提示中文
