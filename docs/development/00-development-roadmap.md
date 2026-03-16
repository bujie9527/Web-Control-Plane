# 00 — 开发路线图（Development Roadmap）

> 创建日期：2026-03-16
> 本文档是所有待开发内容的总索引和执行规划。

---

## 一、开发目标

基于当前系统已有的控制平面骨架，完成以下核心能力的建设：

1. **UI 升级** — 从手写 CSS Modules 升级到 Tailwind + shadcn/ui，菜单重构，图标系统，图表可视化
2. **数据采集能力** — Agent 能从外部获取实时信息（搜索、社媒监控、新闻、内容提取）
3. **内容发布能力** — Agent 能向 Telegram 频道/群组发布内容
4. **Skill 执行引擎** — Skill 从装饰变为功能，真正驱动 Agent 执行（LLM / 外部API / 内部API）
5. **Agent 渠道适配** — 一个 Agent 适配多渠道，通过 Channel Style Profile 动态注入
6. **实时互动能力** — Bot 能接收用户消息并智能回复
7. **社群管理能力** — Bot 能管理群组（欢迎、投票、置顶、内容管理）
8. **自动配置能力** — 运营人员描述需求，Config Agent 自动完成配置
9. **完整执行闭环** — 研究 → 创作 → 审核 → 发布 + 接收 → 路由 → 理解 → 回复
10. **结果汇报** — 核心原则 7 达成，产出可量化、可汇报、图表仪表盘完整

最终验证案例：**体育赛事预测 Telegram Bot**，在社群中运营，具备主动推送 + 被动互动能力。

---

## 二、Agent 复用原则

所有 Agent 均为平台级模板，可复用于不同项目类型。

### Agent 是能力，Identity 是人设，Terminal 是通道

```
AgentTemplate（平台级，可复用）
  × Identity（项目级，定义人设）
  × Terminal（项目级，定义通道）
  = 具体业务执行
```

同一个 Interaction Agent：
- 体育 Bot 项目 + 体育专家 Identity = 回答体育问题
- 科技 Bot 项目 + 科技博主 Identity = 回答科技问题
- 客服 Bot 项目 + 客服代表 Identity = 处理客户咨询

### Agent 清单与复用矩阵

| Agent | category | 核心能力 | 体育Bot | 科技Bot | 客服Bot | 资讯Bot |
|-------|----------|---------|--------|--------|--------|--------|
| Planner Agent | planning | 规划流程节点 | ✅ | ✅ | ✅ | ✅ |
| Config Agent | coordination | 配置项目资源 | ✅ | ✅ | ✅ | ✅ |
| Research Agent | execution | 采集外部数据 | ✅ | ✅ | ✅ | ✅ |
| Content Creator | execution | 创作内容 | ✅ | ✅ | — | ✅ |
| Content Reviewer | execution | 审核内容 | ✅ | ✅ | — | ✅ |
| Interaction Agent | execution | 实时对话互动 | ✅ | ✅ | ✅ | ✅ |
| Community Manager | coordination | 社群管理运营 | ✅ | ✅ | — | ✅ |
| Publisher Agent | execution | 发布到终端 | ✅ | ✅ | — | ✅ |
| Supervisor | coordination | 监督执行流程 | ✅ | ✅ | ✅ | ✅ |

### Skill 共享原则

Skill 是原子能力单元，可被多个 Agent 共享使用：

| Skill | 可被哪些 Agent 使用 | 执行方式 |
|-------|-------------------|---------|
| SearchWebForTopic | Research, Interaction | 外部 API (Tavily) |
| MonitorSocialMedia | Research | 外部 API (Apify) |
| ExtractArticleContent | Research | 外部 API (Jina) |
| SubscribeRSSFeed | Research | 外部 API (RSS) |
| SummarizeResearchData | Research, Content Creator | LLM |
| GenerateArticle | Content Creator | LLM |
| ReviewContent | Content Reviewer | LLM |
| ClassifyUserIntent | Interaction, Message Router | LLM |
| GenerateContextualReply | Interaction, Community Manager | LLM |
| RespondToUserQuery | Interaction | LLM + 外部 API |
| WelcomeNewMember | Community Manager | LLM + Telegram API |
| CreateInteractivePoll | Community Manager, Content Creator | Telegram API |
| PinImportantMessage | Community Manager, Publisher | Telegram API |
| SendTelegramMessage | Publisher, Interaction, Community Manager | Telegram API |
| SendTelegramReply | Interaction, Community Manager | Telegram API |
| DeleteMessage | Community Manager | Telegram API |
| CreateDataSourceTerminal | Config Agent | 内部 API |
| CreatePublishTerminal | Config Agent | 内部 API |
| ConfigureProjectResources | Config Agent | 内部 API |
| TestTerminalConnection | Config Agent | 内部 API |
| SuggestDataSources | Config Agent | LLM + 内部 API |
| GeneratePrediction | Content Creator (体育垂直) | LLM |
| GenerateEventPreview | Content Creator (体育垂直) | LLM |
| GeneratePostMatchReview | Content Creator (体育垂直) | LLM |

垂直 Skill（如 GeneratePrediction）属于特定领域，通过 Agent 模板的 Skill 授权体系管理。

---

## 三、Skill 执行方式分类

当前系统的 Skill 只支持 LLM 调用。新方案需要扩展为四种执行方式：

| 执行方式 | 调用目标 | 举例 |
|---------|---------|------|
| **LLM 调用** (`llm`) | OpenAI 等 LLM | 创作、审核、意图识别、对话 |
| **外部 API 调用** (`external_api`) | Tavily / Apify / Telegram 等 | 搜索、爬虫、发消息、提取内容 |
| **内部 API 调用** (`internal_api`) | 系统自身 /api/* | 创建终端、绑定资源、查询配置 |
| **混合执行** (`hybrid`) | LLM 生成 + API 执行的多步组合 | 新人欢迎（LLM 写文案 + API 发送） |

Skill Schema 需新增 `executionType` 字段：
```
executionType: 'llm' | 'external_api' | 'internal_api' | 'hybrid'
```

> 注：已有种子数据中的 `executionType: 'tool'` 统一迁移为 `external_api`，详见文档 13 第四节。

此扩展影响：
- Skill Schema（新增字段）
- Skill 执行器（workflowNodeExecutor 需路由到不同执行方式）
- Skill 工厂页面（展示执行方式标签）

---

## 四、阶段规划

### Phase 0：技术债清理 + UI 基座安装

| 编号 | 文档 | 内容 | 估计工作量 | 状态 |
|------|------|------|-----------|------|
| P0-1 | — | TypeScript 类型检查清零 | 中 | ✅ 已完成 |
| P0-2 | — | ESLint warning 清零 | 小 | ✅ 已完成（lint 脚本已按 src/server 分域稳定执行） |
| P0-3 | — | tenantId 硬编码统一（从 auth 取） | 小 | ✅ 已完成 |
| P0-4 | — | serverStoreDb 完全替代 serverStore | 小 | ✅ 已完成 |
| P0-5 | 12 | UI 基座安装（Tailwind + shadcn/ui + Lucide + sonner） | 中 | ✅ 已完成（Tailwind v4/Vite 插件、Lucide、sonner、react-hook-form+zod 基础依赖已接入） |
| P0-6 | 12 | Sidebar 重构（图标 + 折叠优化）+ 三 Shell 菜单更新 | 中 | ✅ 已完成（Sidebar 支持图标/徽标/折叠图标模式，三 Shell 菜单结构与图标映射已更新） |
| P0-7 | 12 | 新路由注册 + 骨架占位页 | 小 | ✅ 已完成（Tenant/System 新增路由已注册并提供骨架占位页，身份库路由已独立） |
| P0-8 | 13 | server/index.ts 路由拆分（3700+ 行 → routes/*.ts） | 中 | ✅ 已完成（新增 Workflow 路由拆分，主入口已降至约 64 行，全部业务接口改为 registerXxxRoutes 挂载） |
| P0-9 | 13 | Skill executionType 数据迁移（tool → external_api） | 小 | ✅ 已完成 |

**交付标准**：
- `npm run typecheck` 和 `npm run lint` 零错误零警告
- Tailwind + shadcn/ui + Lucide Icons 可用
- 侧边栏菜单有图标、折叠模式可用
- 新增菜单项和路由已注册（骨架占位页）
- 旧页面不受影响
- server/index.ts 路由拆分为 routes/*.ts（每个域一个文件）
- Skill executionType `tool` → `external_api` 迁移完成

---

### Phase 1：基础设施层

两个模块可并行开发，互不依赖。

| 编号 | 文档 | 内容 | 估计工作量 | 状态 |
|------|------|------|-----------|------|
| P1-A | 01 | 数据源配置中心（DataSourceProvider Center） | 中-大 | ✅ 已完成（首版） |
| P1-B | 02 | Telegram Bot 终端（第一批：发送能力） | 中 | ✅ 已完成（第一批发送） |

**P1-A 交付标准**：四个 Provider 可管理，凭证可配置，统一执行器可调通。（已达成：Tavily/Apify/Jina/RSS）
**P1-B 交付标准**：Telegram Bot 终端可创建，可管理群/频道，可发送消息/图片/投票。（已达成）

**Phase 1 交付后**：系统能从外部采集数据，能向 Telegram 发消息。

---

### Phase 1.5：Skill 执行引擎与 Agent 增强

这是所有 Agent 能力的基座，必须在 Agent 激活（Phase 3）之前完成。

| 编号 | 文档 | 内容 | 前置依赖 | 估计工作量 | 状态 |
|------|------|------|---------|-----------|------|
| P1.5-A | 03 | Skill 执行引擎（LLM / external_api / internal_api / hybrid 四种执行方式） | P0 | 大 | ✅ 已完成 |
| P1.5-B | 03 | Prompt 多层组装（Agent + Skill + Identity + Channel + Project + Input） | P1.5-A | 中 | ✅ 已完成 |
| P1.5-C | 03 | Agent 渠道适配（channelStyleProfiles） | P1.5-B | 中 | ✅ 已完成 |
| P1.5-D | 03 | 项目级 Agent 调参（ProjectAgentConfig） | P1.5-C | 小-中 | ✅ 已完成 |
| P1.5-E | 03 | Skill 种子数据完善 + 新增 Skill | P1.5-A | 中 | ✅ 已完成 |
| P1.5-F | 03 | Agent 删除补强 + OpenClaw 导入 | P1.5-A | 小 | ✅ 已完成 |

**P1.5 交付标准**：
- Skill 的 `executionType` 和 `openClawSpec` 真正驱动执行
- 同一 Agent 发布到 Telegram/网站/Facebook 输出风格自动适配
- 运营人员可在项目级覆盖 Agent 指令和参数
- Agent 删除含服务端引用检查

**Phase 1.5 交付后**：Agent 从「标签」变为「可执行实体」，Skill 从「装饰」变为「真正的能力单元」。

---

### Phase 2：管线与调度

| 编号 | 文档 | 内容 | 前置依赖 | 估计工作量 | 状态 |
|------|------|------|---------|-----------|------|
| P2-A | 02（第二批） | Telegram Webhook 接收能力 | P1-B | 中 | ✅ 已完成 |
| P2-B | 04 | 消息管线（Inbox + Router + 事件驱动） | P2-A | 中-大 | ✅ 已完成 |
| P2-C | 09 | 定时任务调度系统 | P1-B | 中 | ✅ 已完成 |

**P2-A 交付标准**：Webhook 注册成功，用户消息能正确接收和解析。
**P2-B 交付标准**：消息能入 Inbox、被分类、被路由到正确的 Agent。
**P2-C 交付标准**：可配置定时任务，到时触发流程实例创建。

**Phase 2 交付后**：系统能收消息、能路由消息、能定时触发任务。

---

### Phase 3：Agent 与 Skill 激活

四个 Agent 可部分并行开发（P3-A 和 P3-D 依赖 Phase 1，P3-B 和 P3-C 依赖 Phase 2）。

| 编号 | 文档 | 内容 | 前置依赖 | 估计工作量 | 状态 |
|------|------|------|---------|-----------|------|
| P3-A | 08 | Research Agent + 数据采集 Skill | P1-A | 中 | ✅ 已完成 |
| P3-B | 05 | Interaction Agent + 对话 Skill | P2-B | 中-大 | ✅ 已完成 |
| P3-C | 06 | Community Manager Agent + 社群 Skill | P2-B | 中 | ✅ 已完成 |
| P3-D | 07 | Config Agent + 配置 Skill | P1-A + P1-B | 中 | ✅ 已完成 |

**P3-A 交付标准**：Research Agent 可调用数据源终端获取搜索结果/社媒数据。
**P3-B 交付标准**：Interaction Agent 可理解用户消息意图，生成上下文回复。
**P3-C 交付标准**：Community Manager 可欢迎新人、发起投票、置顶消息。
**P3-D 交付标准**：运营人员描述需求，Config Agent 自动配置终端和资源。

**Phase 3 交付后**：系统拥有完整 Agent 团队。

---

### Phase 4：执行闭环

| 编号 | 文档 | 内容 | 前置依赖 | 估计工作量 | 状态 |
|------|------|------|---------|-----------|------|
| P4-A | 10 | 主动推送闭环 | P3-A + P1-B + P2-C | 中 | ✅ 已完成 |
| P4-B | 10 | 被动响应闭环 | P3-B + P3-C + P2-B | 中 | ✅ 已完成 |

**主动推送闭环**：
```
定时触发 → Research Agent 采集素材 → Content Creator 创作 → Reviewer 审核 → Publisher 发布到 Telegram
```

**被动响应闭环**：
```
用户发消息 → Webhook 接收 → Inbox 入队 → Router 分类 → Interaction/Community Agent 处理 → 回复
```

**Phase 4 交付标准**：体育赛事 Bot 可完整运转。

---

### Phase 5：结果汇报

| 编号 | 文档 | 内容 | 前置依赖 | 估计工作量 | 状态 |
|------|------|------|---------|-----------|------|
| P5-A | 11 | 结果汇报视图 | P4-A + P4-B | 中 | ✅ 已完成 |

**交付标准**：
- 项目详情「结果反馈」Tab 展示真实数据
- 数据分析页展示：发布量、互动量、订阅增长、数据采集统计
- 核心原则 7（结果必须可汇报）达成

---

## 五、依赖关系图

```
Phase 0（技术债 + UI 基座 + 菜单重构）
    │
    ├───────────────────────────────────────────────────┐
    ↓                                                   ↓
Phase 1-A（数据源中心）                         Phase 1-B（Telegram 发送）
    │                                                   │
    └──────────────┬────────────────────────────────────┘
                   ↓
          Phase 1.5（Skill 执行引擎 + Agent 增强）
                   │
    ┌──────────────┼───────────────────────────┐
    ↓              ↓                           ↓
Phase 3-A      Phase 2-A（Webhook 接收）    Phase 3-D
(Research)        ↓                        (Config Agent)
    │         Phase 2-B（消息管线）
    │              │
    │              ├──→ Phase 3-B（Interaction Agent）
    │              │
    │              └──→ Phase 3-C（Community Manager）
    │                            │
    ↓                            ↓
Phase 2-C（定时调度）
    │
    └──→ Phase 4-A（主动推送）    Phase 4-B（被动响应）
              │                          │
              └──────────┬───────────────┘
                         ↓
                  Phase 5-A（结果汇报 + 数据可视化）

UI 升级（文档 12）贯穿全程：
  P0    → 基座安装 + Sidebar 重构 + 菜单更新
  P1-P3 → 新页面全部使用 shadcn + Tailwind
  P5    → Recharts 图表 + 业务可视化组件
  持续  → 旧页面渐进迁移
```

关键变化：
- Phase 0 新增 UI 基座安装和菜单重构
- Phase 1.5（Skill 执行引擎）成为所有 Agent（Phase 3）的前置依赖
- UI 升级（文档 12）贯穿全开发周期

---

## 六、文档索引

| 编号 | 文档名 | 对应阶段 | 状态 |
|------|-------|---------|------|
| 00 | 开发路线图（本文档） | — | ✅ 已完成 |
| 01 | 数据源配置中心（DataSourceProvider Center） | P1-A | ✅ 已完成 |
| 02 | Telegram Bot 终端（双向通信） | P1-B + P2-A | ✅ 已完成 |
| 03 | Skill 执行引擎与 Agent 调参体系 | P1.5 | ✅ 已完成 |
| 04 | 消息管线（Inbox + Router + 事件驱动） | P2-B | ✅ 已完成 |
| 05 | Interaction Agent（互动 Agent） | P3-B | ✅ 已完成 |
| 06 | Community Manager Agent（社群管理 Agent） | P3-C | ✅ 已完成 |
| 07 | Config Agent（配置助手） | P3-D | ✅ 已完成 |
| 08 | Research Agent + 数据采集 Skill | P3-A | ✅ 已完成 |
| 09 | 定时任务调度系统 | P2-C | ✅ 已完成 |
| 10 | 执行闭环（主动推送 + 被动响应） | P4 | ✅ 已完成 |
| 11 | 结果汇报视图 | P5 | ✅ 已完成 |
| 12 | UI 升级与菜单重构 | P0 + 贯穿全程 | ✅ 已完成 |
| 13 | 勘误、统一规范与补充定义 | P0（权威清单） | ✅ 已完成 |

---

## 七、里程碑检查点

| 里程碑 | 达成条件 | 预期结果 |
|--------|---------|---------|
| **M0：能看** | P0 完成 | UI 基座就绪、菜单重构完成、侧边栏有图标、新体系可用 |
| **M1：能发** | P1-A + P1-B 完成 | 系统能搜索外部信息，能向 Telegram 发消息 |
| **M1.5：能用** | P1.5 完成 | Skill 真正驱动执行，Agent 渠道自适配，运营人员可调参 |
| **M2：能收** | P2-A + P2-B 完成 | Telegram Bot 能接收用户消息并分类路由 |
| **M3：能想** | P3-A + P3-B 完成 | Agent 能采集素材、能理解消息并回复 |
| **M4：能跑** | P4-A + P4-B 完成 | 体育赛事 Bot 完整运转（推送 + 互动） |
| **M5：能报** | P5-A 完成 | 运营数据可量化展示，图表仪表盘完整 |

---

## 八、风险与约束

| 风险 | 影响 | 应对 |
|------|------|------|
| Telegram Bot API 在某些地区访问受限 | 开发调试受阻 | 服务器部署在可访问区域（已满足） |
| Apify 免费额度不够 | 社媒监控受限 | 优先用免费源，按需升级 |
| Webhook 并发量大 | 消息处理延迟 | 消息管线异步处理，队列缓冲 |
| LLM 调用成本 | Interaction Agent 实时对话消耗 | 意图分类先过滤，只对有效消息调 LLM |
| 多 Agent 协同复杂度 | 开发周期拉长 | 按 Phase 分批交付，每个 Phase 可独立验证 |

---

## 九、不在当前路线图范围内的内容

以下内容暂不纳入当前开发计划，但保持架构可扩展：

- 复杂分支流程（保持线性流程）
- Supervisor 真实 LLM 接入（保持规则分析）
- 多 LLM Provider 路由（保持 OpenAI 单链路）
- 新终端类型（WordPress / X / WhatsApp 等，等 Telegram 跑通后再扩展）
- OpenClaw Skill 格式对接
- 垂直 Planner 策略差异化
- 复杂权限体系（保持当前 Guard 模式）
- 多语言国际化
