# 01 — 数据源配置中心（DataSourceProvider Center）

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：无（基础设施层，可独立启动）
> 后续依赖：Telegram 终端、Research Agent、Config Agent、执行闭环

---

## 一、模块定位

数据源配置中心是系统级治理模块，与 LLM 配置中心平级，负责管理所有外部数据采集能力的 Provider 注册、凭证、优先级与调用统计。

**它不是**：
- 运营人员直接操作的页面（运营人员通过 Config Agent 或项目工作台间接使用）
- 数据源终端本身（终端是具体实例，归属终端中心）
- 数据采集执行器（执行器在 Agent Skill 层）

**它是**：
- 系统管理员管理数据采集 Provider 的治理入口
- 数据源凭证的安全存储中心
- 多 Provider 路由与成本控制的策略配置层
- 调用量与费用的统计面板

### 在系统中的位置

```
系统控制台 /system
  ├── Agent 模板工厂
  ├── Skill 工厂
  ├── 流程模板工厂
  ├── LLM 配置中心          ← 管 LLM Provider
  ├── 数据源配置中心（新）    ← 管数据采集 Provider
  └── 终端能力注册
```

### 与其他模块的关系

```
DataSourceProvider Center（系统级治理）
  │
  ├── 注册 Provider（Tavily / Apify / Jina / RSS）
  ├── 管理凭证（API Key 加密存储）
  ├── 设置优先级（免费优先 → 付费兜底）
  └── 统计调用量与成本
        │
        ↓  提供 Provider 配置
Terminal 实例（租户级使用）
  │
  ├── "Tavily 搜索" 终端
  ├── "Apify 社媒监控" 终端
  ├── "Jina 内容提取" 终端
  └── "行业新闻 RSS" 终端
        │
        ↓  被 Agent Skill 调用
Research Agent → 数据采集 Skill → dataAcquisitionExecutor → Provider API
```

---

## 二、与 LLM 配置中心的对称设计

| 维度 | LLM 配置中心 | 数据源配置中心 |
|------|-------------|--------------|
| 路由 | /system/llm-configs | /system/data-source-configs |
| Provider 示例 | OpenAI, Azure, Anthropic | Tavily, Apify, Jina, RSS |
| 凭证 | LLMCredential（API Key） | DataSourceCredential（API Key / Token） |
| 配置 | LLMModelConfig | DataSourceConfig |
| 绑定 | AgentLLMBinding | Agent 通过 Skill 使用（不需要显式绑定表） |
| 执行器 | llmExecutor | dataAcquisitionExecutor |
| 路由策略 | 主模型 / 备用模型 | 免费优先 / 付费兜底 |

---

## 三、数据模型

### 3.1 DataSourceProvider（数据源提供商）

```
DataSourceProvider:
  id                  String    @id
  name                String    // "Tavily"
  nameZh              String    // "Tavily 搜索引擎"
  code                String    @unique  // "tavily"
  providerType        String    // "web_search" | "social_media" | "content_extract" | "news_feed"
  description         String?
  baseUrl             String    // "https://api.tavily.com"
  status              String    // "active" | "disabled"
  credentialId        String?   // 关联 DataSourceCredential（免费源可为空）
  costTier            String    // "free" | "freemium" | "paid"
  priority            Int       // 同类 Provider 路由优先级，数字越小越优先
  rateLimitPerMinute  Int?
  rateLimitPerDay     Int?
  rateLimitPerMonth   Int?
  isSystemPreset      Boolean   @default(true)
  configSchema        String?   // JSON Schema，描述该 Provider 支持的配置参数
  createdAt           String
  updatedAt           String
```

### 3.2 DataSourceCredential（数据源凭证）

```
DataSourceCredential:
  id                  String    @id
  providerId          String    // 关联 DataSourceProvider
  name                String    // "Tavily API Key"
  credentialType      String    // "api_key" | "token" | "none"
  encryptedSecret     String?   // AES-256-GCM 加密存储
  secretMasked        String?   // "tav-****1234" 前端显示用
  status              String    // "active" | "expired" | "revoked"
  expiresAt           String?
  createdAt           String
  updatedAt           String
```

### 3.3 DataSourceConfig（数据源配置）

```
DataSourceConfig:
  id                  String    @id
  providerId          String    // 关联 DataSourceProvider
  name                String    // "Tavily Basic Search"
  nameZh              String    // "Tavily 基础搜索"
  code                String    @unique  // "tavily-basic-search"
  configType          String    // "search" | "monitor" | "extract" | "subscribe"
  defaultParams       String    // JSON: { maxResults: 5, searchDepth: "basic", language: "zh" }
  isEnabled           Boolean   @default(true)
  isDefault           Boolean   @default(false)  // 同类中的默认配置
  costPerCall         Float?    // 预估单次调用成本（美元），用于统计
  createdAt           String
  updatedAt           String
```

Apify 特殊说明：一个 Apify Provider 可以有多个 DataSourceConfig，每个对应一个 Actor：
- `apify-twitter-scraper` → configType: "monitor", defaultParams: { actorId: "quacker/twitter-scraper" }
- `apify-instagram-scraper` → configType: "monitor", defaultParams: { actorId: "apify/instagram-scraper" }

### 3.4 DataSourceUsageLog（调用统计日志）

```
DataSourceUsageLog:
  id                  String    @id
  providerId          String
  configId            String?
  terminalId          String?   // 哪个终端实例触发的
  projectId           String?   // 关联项目
  callType            String    // "search" | "monitor" | "extract" | "subscribe"
  status              String    // "success" | "failed" | "timeout"
  latencyMs           Int?
  resultCount         Int?      // 返回结果数量
  costEstimate        Float?    // 预估成本
  errorMessage        String?
  createdAt           String
```

---

## 四、第一批 Provider 清单

### 4.1 Tavily（Web 搜索）

| 属性 | 值 |
|------|-----|
| code | `tavily` |
| providerType | `web_search` |
| baseUrl | `https://api.tavily.com` |
| costTier | `freemium` |
| 免费额度 | 1,000 次/月 |
| 凭证类型 | API Key |
| 核心 API | `POST /search` — 搜索, `POST /extract` — URL 内容提取 |

**DataSourceConfig 预设**：
- `tavily-search-basic`：基础搜索（maxResults: 5, searchDepth: "basic"）
- `tavily-search-deep`：深度搜索（maxResults: 10, searchDepth: "advanced"）
- `tavily-extract`：URL 内容提取

### 4.2 Apify（社交媒体爬虫）

| 属性 | 值 |
|------|-----|
| code | `apify` |
| providerType | `social_media` |
| baseUrl | `https://api.apify.com/v2` |
| costTier | `freemium` |
| 免费额度 | $5/月 |
| 凭证类型 | API Token |
| 核心 API | `POST /acts/{actorId}/runs` — 启动 Actor, `GET /datasets/{id}/items` — 获取结果 |

**DataSourceConfig 预设**：
- `apify-twitter`：Twitter 数据采集（actorId: "quacker/twitter-scraper"）
- `apify-instagram`：Instagram 数据采集（actorId: "apify/instagram-scraper"）
- `apify-reddit`：Reddit 数据采集（actorId: "trudax/reddit-scraper"）
- `apify-tiktok`：TikTok 数据采集（actorId: "clockworks/tiktok-scraper"）

Apify 特殊机制：Actor 运行是异步的。调用流程：
1. POST 启动 Actor run → 返回 runId
2. 轮询 GET /actor-runs/{runId} 等待完成
3. GET /datasets/{datasetId}/items 获取结果

### 4.3 Jina Reader（内容提取）

| 属性 | 值 |
|------|-----|
| code | `jina_reader` |
| providerType | `content_extract` |
| baseUrl | `https://r.jina.ai` |
| costTier | `free` |
| 免费额度 | 无限 |
| 凭证类型 | 无需凭证 |
| 核心 API | `GET /{url}` — 返回 URL 内容的 Markdown 文本 |

**DataSourceConfig 预设**：
- `jina-reader-default`：默认提取配置

### 4.4 RSS（新闻订阅）

| 属性 | 值 |
|------|-----|
| code | `rss` |
| providerType | `news_feed` |
| baseUrl | 无固定（每个订阅源不同） |
| costTier | `free` |
| 免费额度 | 无限 |
| 凭证类型 | 无需凭证 |
| 核心机制 | 解析 RSS/Atom XML feed |

**DataSourceConfig 预设**：
- `rss-default`：默认 RSS 解析配置（maxItems: 20）

RSS 的特殊性：不需要全局凭证，但每个终端实例需要配置具体的 feed URL 列表。

---

## 五、后端实现结构

### 5.1 目录规划

```
server/
  domain/
    dataSourceProviderDb.ts         # Provider CRUD
    dataSourceCredentialDb.ts       # 凭证 CRUD
    dataSourceConfigDb.ts           # Config CRUD
    dataSourceUsageLogDb.ts         # 调用日志写入与统计
    dataSourceProviderSeed.ts       # 种子数据（四个 Provider + 预设 Config）
  services/
    dataSourceProviders/
      tavilyProvider.ts             # Tavily API 封装
      apifyProvider.ts              # Apify API 封装
      jinaReaderProvider.ts         # Jina Reader API 封装
      rssProvider.ts                # RSS 解析封装
    dataSourceExecutor.ts           # 统一数据采集执行器（路由 + 调度）
    dataSourceCredentialStore.ts    # 凭证加密存储（复用 LLM 凭证模式）
```

### 5.2 统一执行器（dataSourceExecutor）

```typescript
// 概念接口，非最终代码
interface DataAcquisitionRequest {
  intentType: 'search' | 'monitor' | 'extract' | 'subscribe'
  query?: string
  urls?: string[]
  targetAccounts?: string[]
  providerHint?: string       // 指定 Provider（可选）
  configId?: string           // 指定 Config（可选）
  terminalId?: string         // 通过终端实例调用
  maxResults?: number
  language?: string
}

interface DataAcquisitionResult {
  success: boolean
  provider: string
  configCode: string
  results: DataItem[]
  resultCount: number
  latencyMs: number
  costTier: 'free' | 'paid'
  errorMessage?: string
  errorMessageZh?: string
}

interface DataItem {
  title: string
  content: string             // 正文或摘要
  url?: string
  source?: string             // 来源平台/媒体
  publishedAt?: string
  author?: string
  metadata?: Record<string, any>  // 平台特有字段（likes, retweets 等）
}
```

执行器路由逻辑：
1. 根据 intentType 筛选匹配的 Provider（web_search → tavily, social_media → apify, ...）
2. 如有 providerHint / configId / terminalId，直接使用指定的
3. 否则按 priority 排序，优先 free/freemium
4. 解析 Provider → Credential → 调用具体 Provider 实现
5. 写入 DataSourceUsageLog
6. 返回统一格式结果

### 5.3 API 路由

| 路由 | 方法 | 用途 | 权限 |
|------|------|------|------|
| `/api/data-source-providers` | GET | 列表 | system_admin |
| `/api/data-source-providers` | POST | 创建 | system_admin |
| `/api/data-source-providers/:id` | GET | 详情 | system_admin |
| `/api/data-source-providers/:id` | PUT | 更新 | system_admin |
| `/api/data-source-providers/:id/status` | PATCH | 启用/停用 | system_admin |
| `/api/data-source-providers/:id` | DELETE | 删除 | system_admin |
| `/api/data-source-credentials` | GET/POST/PUT/DELETE | 凭证 CRUD | system_admin |
| `/api/data-source-configs` | GET/POST/PUT/DELETE | Config CRUD | system_admin |
| `/api/data-source/test-provider` | POST | 测试 Provider 连通性 | system_admin |
| `/api/data-source/execute` | POST | 统一数据采集执行 | 内部调用 / Agent |
| `/api/data-source/stats` | GET | 调用统计 | system_admin |

---

## 六、前端实现结构

### 6.1 页面结构

```
src/modules/platform/pages/DataSourceCenter/
  DataSourceCenterPage.tsx          # 主页面（三分区，参考 LLMConfigCenterPage）
  sections/
    ProviderSection.tsx             # Provider 管理区（列表 + 新建/编辑/启停）
    ConfigSection.tsx               # Config 管理区（列表 + 新建/编辑/启停）
    StatsSection.tsx                # 调用统计区（图表 + 列表）
```

### 6.2 三分区布局

参考 LLM 配置中心的布局模式：

**区块一：数据源提供商（Provider）**
- 列表：名称、类型、状态、成本等级、优先级、凭证状态
- 操作：新建、编辑、启用/停用、测试连接、删除

**区块二：数据源配置（Config）**
- 列表：名称、所属 Provider、配置类型、启用状态、默认标记
- 操作：新建、编辑、启用/停用、设为默认、删除

**区块三：调用统计（Stats）**
- 今日/本周/本月调用次数
- 按 Provider 分布
- 免费 vs 付费调用占比
- 失败率

### 6.3 Service / Repository / Schema

```
src/modules/platform/
  schemas/
    dataSourceProvider.ts           # 类型定义
  repositories/
    dataSourceProviderRepository.ts # API 调用
    dataSourceCredentialRepository.ts
    dataSourceConfigRepository.ts
  services/
    dataSourceProviderService.ts    # 业务逻辑
```

---

## 七、数据源终端类型（SystemTerminalType 扩展）

数据源 Provider 注册在配置中心，但具体使用时以终端实例形式存在。需要新增以下 SystemTerminalType 种子：

| 终端类型 | code | typeCategory | 说明 |
|---------|------|-------------|------|
| Web 搜索数据源 | `data_source_search` | `api` | Tavily 等搜索 API |
| 社媒数据源 | `data_source_social` | `api` | Apify 等社媒爬虫 |
| 内容提取数据源 | `data_source_extract` | `api` | Jina Reader 等 |
| RSS 订阅数据源 | `data_source_rss` | `api` | RSS feed 解析 |

每个终端实例的 `credentialsJson` 引用 DataSourceProvider 的凭证，`configJson` 存储实例级参数（如 RSS 的 feed URL 列表、Apify 的 Actor 参数覆盖等）。

---

## 八、Agent 分工说明（重要边界）

系统中有多个 Agent 涉及数据和流程，必须严格区分：

| Agent | 职责 | 操作对象 | 不做什么 |
|-------|------|---------|---------|
| **Planner Agent（流程规划助手）** | 根据 SOP 规划流程节点结构 | WorkflowTemplate / Draft | 不做资源配置，不做数据采集 |
| **Config Agent（配置助手，新）** | 根据运营需求配置项目资源 | Terminal / DataSource / Identity 绑定 | 不做流程规划，不做内容创作 |
| **Research Agent（研究搜索助手）** | 在流程执行中采集实时素材 | DataSource 终端 | 不做配置，不做内容创作 |
| **Content Creator（内容创作 Agent）** | 基于素材 + Identity 创作内容 | LLM | 不做数据采集，不做发布 |
| **Supervisor（执行监督助手）** | 监督流程运行状态 | WorkflowInstance | 不做业务节点执行 |

### Planner Agent vs Config Agent 的关键区别

| 维度 | Planner Agent | Config Agent |
|------|--------------|-------------|
| 触发时机 | 项目创建后，SOP 录入后 | 项目启动前或启动时 |
| 输入 | SOP 文本、项目目标、交付模式 | 运营人员的自然语言需求 |
| 输出 | WorkflowPlanningDraft（流程草案） | 已配置的终端实例、已绑定的资源 |
| 操作的系统对象 | WorkflowTemplate / Node | Terminal / DataSourceConfig / ProjectBinding |
| 关注点 | "流程分几步、每步做什么" | "需要什么数据源、发布到哪里" |
| 是否调外部 API | 否（纯 LLM 规划） | 是（创建终端、测试连接） |

两者协作关系：
1. Config Agent 先配置好数据源终端和发布终端
2. Planner Agent 规划流程时，可以引用已配置的终端
3. 流程执行时，Research Agent 通过数据源终端采集素材

---

## 九、测试连接规范

每个 Provider 必须支持测试连接，返回中文结果：

| Provider | 测试方式 | 成功提示 | 失败提示 |
|----------|---------|---------|---------|
| Tavily | `POST /search` 查询 "test" | "Tavily 连接成功，搜索功能正常" | "Tavily 连接失败：{原因}" |
| Apify | `GET /v2/users/me` | "Apify 连接成功，当前余额 ${amount}" | "Apify 连接失败：{原因}" |
| Jina Reader | `GET /https://example.com` | "Jina Reader 连接成功，内容提取正常" | "Jina Reader 连接失败：{原因}" |
| RSS | 解析一个预设 feed URL | "RSS 解析成功，获取到 N 条内容" | "RSS 解析失败：{原因}" |

---

## 十、开发顺序

```
步骤 1：Prisma 模型 + 种子数据
  → DataSourceProvider / Credential / Config / UsageLog
  → 四个 Provider 种子 + 预设 Config

步骤 2：后端 Provider 实现
  → tavilyProvider / apifyProvider / jinaReaderProvider / rssProvider
  → dataSourceCredentialStore（加密存储）

步骤 3：统一执行器 + API 路由
  → dataSourceExecutor（路由 + 调度 + 日志）
  → 全部 CRUD + 测试连接 + 执行 API

步骤 4：前端页面
  → DataSourceCenterPage（三分区）
  → Schema / Repository / Service

步骤 5：终端类型种子 + 终端创建适配
  → SystemTerminalType 新增四种数据源类型
  → 终端创建向导支持数据源终端

步骤 6：集成验证
  → 从前端触发搜索 / 社媒采集 / 内容提取 / RSS 订阅
  → 验证调用统计正确写入
```

---

## 十一、验收标准

- [ ] 四个 Provider 可注册、可编辑、可启停
- [ ] 凭证加密存储，前端只显示掩码
- [ ] 每个 Provider 测试连接可执行，返回中文结果
- [ ] DataSourceConfig 可配置、可启停、可设默认
- [ ] 统一执行器可按 intentType 路由到正确 Provider
- [ ] 免费 Provider 优先，付费 Provider 兜底
- [ ] 调用统计日志正确写入
- [ ] 前端三分区页面完整可用
- [ ] 四种数据源终端类型已注册
- [ ] 终端中心可创建数据源终端实例
