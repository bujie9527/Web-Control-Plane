# 11 — 结果汇报视图

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：执行闭环（10）— 有数据才能汇报
> 后续依赖：无（路线图终点）
> 对应核心原则：**原则 7 — 结果必须可向上汇报**
> 实用化案例：运营主管打开项目详情，5 秒内看清这个 Bot 上周做了什么、效果如何、下一步该怎么优化

---

## 一、模块定位

结果汇报视图是整个系统的**价值出口**。前面所有模块（数据采集、内容创作、消息互动、社群管理）的产出，最终都要在这里汇聚为可量化、可展示、可向上汇报的业务结果。

**核心问题**：运营主管 / 老板只关心三个问题：
1. 这个项目做了什么？（执行量）
2. 效果怎么样？（业务指标）
3. 花了多少钱？（成本）

**它不是**：
- 数据分析平台（不做复杂 BI、不做自定义报表）
- 实时监控大屏（不做秒级刷新的可视化大屏）
- 审计系统（不做操作审计追溯，那是平台审计的职责）

**它是**：
- 项目级的运营结果仪表盘
- 可汇报的周期性报告生成器
- 目标达成率的追踪器
- 成本效益的可视化展示

---

## 二、数据来源

结果汇报视图不产生新数据，它**汇聚**各模块已有的数据：

| 数据维度 | 来源模块 | 数据表/对象 |
|---------|---------|------------|
| 内容发布量 | Publisher Agent | OutgoingMessage (type=publish) |
| 内容类型分布 | WorkflowInstance | WorkflowInstanceNode.resultJson |
| 消息互动量 | 消息管线 | IncomingMessage + OutgoingMessage |
| 群成员增长 | Community Manager | IncomingMessage (type=member_join/leave) |
| 群活跃度 | Community Manager | CommunityStats Skill 输出 |
| 投票参与率 | Community Manager | IncomingMessage (type=poll_answer) |
| 数据采集量 | Research Agent | ScheduledTaskExecution + ResearchResult |
| 流程执行状态 | WorkflowInstance | WorkflowInstance.status |
| LLM 调用成本 | LLM Executor | 执行日志 |
| 数据源调用成本 | DataSource Executor | DataSourceUsageLog |
| 定时任务执行率 | 调度系统 | ScheduledTaskExecution |

---

## 三、汇报层级

### 3.1 三级汇报结构

```
Level 1: 项目仪表盘（日常查看）
  → 项目详情页「结果反馈」Tab
  → 实时数据，运营人员每天看

Level 2: 周期报告（定期汇报）
  → 日报 / 周报 / 月报
  → 结构化报告，可导出可分享

Level 3: 全局数据分析（平台视角）
  → 租户后台「数据分析」页面
  → 跨项目汇总，管理层视角
```

### 3.2 各级受众

| 层级 | 受众 | 关注点 | 查看频率 |
|------|------|-------|---------|
| L1 项目仪表盘 | 运营人员 | 今天做了什么、有没有异常 | 每天 |
| L2 周期报告 | 运营主管 | 本周效果、趋势、优化方向 | 每周 |
| L3 全局分析 | 管理层 / 老板 | 投入产出比、各项目对比 | 每月 |

---

## 四、Level 1：项目仪表盘

### 4.1 入口

项目详情页 → 「结果反馈」Tab（已在详情工作台规范中预留）

### 4.2 布局结构

```
┌─────────────────────────────────────────────────────────┐
│  结果反馈                          时间范围: [今天 ▾]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ 核心指标卡片 ──────────────────────────────────────┐│
│  │ 📝 发布内容   🗣 互动消息   👥 群成员   🗳 投票     ││
│  │    3 篇         18 条       156(+5)    1(38%)    ││
│  │    ↑1 vs 昨天   ↑3 vs 昨天  ↑5 今日    参与率     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─ 今日执行时间线 ───────────────────────────────────┐ │
│  │ 07:00 ✅ 晨间数据采集 — 48条素材                   │ │
│  │ 09:00 ✅ 群话题引导 — "今晚全明星赛..."            │ │
│  │ 10:00 ✅ 赛事预告推送 — 已发布 (msgId:12345)      │ │
│  │ 18:00 ✅ 赛事预测投票 — 38%参与率                  │ │
│  │ 19:00 ✅ 深度预测文章 — 已发布                     │ │
│  │ 23:00 ⏳ 赛后复盘 — 待执行                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ 内容效果 ────────────┐ ┌─ 互动分析 ──────────────┐ │
│  │ 今日发布 3 篇          │ │ 收到消息: 156           │ │
│  │ · 预告: 1  预测: 1     │ │ 处理消息: 23 (15%)     │ │
│  │ · 复盘: 0 (待发布)     │ │ 回复消息: 18           │ │
│  │                       │ │ 平均响应: 3.2s          │ │
│  │ 审核: 通过 3 退回 0    │ │ 忽略(群聊): 133        │ │
│  └───────────────────────┘ └──────────────────────────┘ │
│                                                         │
│  ┌─ 成本概览 ────────────────────────────────────────┐  │
│  │ LLM 调用: 28次  约 $0.08                          │  │
│  │ 数据源: Tavily 12次(免费) / RSS 4次(免费)         │  │
│  │ 今日总成本: $0.08                                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.3 核心指标卡片定义

| 指标 | 计算方式 | 对比维度 |
|------|---------|---------|
| 发布内容数 | COUNT(OutgoingMessage WHERE type=publish AND period) | vs 昨天 / vs 上周同期 |
| 互动消息数 | COUNT(OutgoingMessage WHERE type=reply AND period) | vs 昨天 |
| 群成员数 | 最新 CommunityStats.totalMembers | 今日净增 |
| 投票参与率 | 最新投票的参与人数 / 群总人数 | — |

时间范围切换：今天 / 昨天 / 本周 / 本月 / 自定义

### 4.4 执行时间线

按时间顺序展示当天所有已执行和待执行的操作：

```typescript
interface TimelineItem {
  time: string;
  status: 'completed' | 'running' | 'pending' | 'failed';
  taskName: string;
  taskNameZh: string;
  summary: string;
  sourceType: 'scheduled_task' | 'webhook_response' | 'manual';
  relatedIds: {
    workflowInstanceId?: string;
    scheduledTaskExecutionId?: string;
    messageId?: string;
  };
}
```

---

## 五、Level 2：周期报告

### 5.1 报告类型

| 报告 | 周期 | 生成方式 | 用途 |
|------|------|---------|------|
| 日报 | 每日 | 自动生成（每日 23:59） | 运营人员自检 |
| 周报 | 每周 | 自动生成（每周日 23:59） | 向主管汇报 |
| 月报 | 每月 | 自动生成（每月最后一天） | 管理层汇报 |

### 5.2 报告数据结构

```typescript
interface ProjectReport {
  id: string;
  projectId: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  
  // 内容产出
  contentMetrics: {
    totalPublished: number;
    byContentType: Record<string, number>;  // prediction: 7, preview: 7, review: 5
    avgCreationTimeMs: number;
    reviewPassRate: number;                  // 0-1
    reviewReviseCount: number;
  };
  
  // 互动指标
  interactionMetrics: {
    totalIncomingMessages: number;
    totalProcessedMessages: number;
    totalReplies: number;
    avgResponseTimeMs: number;
    processRate: number;                     // 处理率
    topQuestionCategories: { category: string; count: number }[];
  };
  
  // 社群指标
  communityMetrics: {
    memberCountStart: number;
    memberCountEnd: number;
    netGrowth: number;
    growthRate: number;                      // 增长率
    totalMessages: number;
    activeUsers: number;
    interactionRate: number;
    pollCount: number;
    avgPollParticipation: number;
    deletedMessages: number;
    topContributors: { username: string; messageCount: number }[];
  };
  
  // 数据采集
  researchMetrics: {
    totalCollections: number;
    totalRawItems: number;
    totalProcessedItems: number;
    dataSourceBreakdown: { provider: string; calls: number; cost: string }[];
  };
  
  // 流程执行
  workflowMetrics: {
    totalInstances: number;
    completedInstances: number;
    failedInstances: number;
    avgExecutionTimeMs: number;
    scheduledTaskSuccessRate: number;
  };
  
  // 成本
  costMetrics: {
    llmCalls: number;
    llmCost: number;                         // USD
    dataSourceCalls: number;
    dataSourceCost: number;
    totalCost: number;
    costPerContent: number;                  // 单篇内容成本
    costPerInteraction: number;              // 单次互动成本
  };
  
  // 目标达成
  goalProgress: {
    goalDescription: string;
    kpiTargets: { name: string; target: number; actual: number; unit: string; achieved: boolean }[];
  };
  
  // AI 生成的总结与建议
  aiSummary?: string;
  aiSuggestions?: string[];
}
```

### 5.3 周报示例

```
═══════════════════════════════════════════════════
  体育赛事预测 Bot · 周报
  2026/03/10 — 2026/03/16
═══════════════════════════════════════════════════

📊 核心指标

  内容发布: 19 篇
    · 赛事预告: 7   预测分析: 7   赛后复盘: 5
    · 审核通过率: 95%  退回修改: 1 次
    · 平均创作耗时: 35s

  社群互动:
    · 群成员: 156 人 (+18, 增长 13%)
    · 群消息: 487 条  活跃用户: 67 人 (43%)
    · Bot 回复: 127 条  平均响应 3.2s
    · 投票: 7 场  平均参与率 38%

  数据采集:
    · 采集任务: 14 次  原始素材: 680 条  有效素材: 210 条
    · Tavily: 84 次  RSS: 28 次  Apify: 14 次

💰 成本

  · LLM 调用: 196 次  $0.58
  · 数据源: 免费额度内  $0.00
  · 总成本: $0.58
  · 单篇内容成本: $0.03
  · 单次互动成本: $0.005

🎯 目标达成

  ┌──────────────────┬────────┬────────┬────────┐
  │ KPI              │ 目标    │ 实际    │ 状态   │
  ├──────────────────┼────────┼────────┼────────┤
  │ 每日发布内容数    │ ≥ 2    │ 2.7    │ ✅ 达成│
  │ 群成员周增长      │ ≥ 10   │ 18     │ ✅ 超额│
  │ 互动响应率       │ ≥ 90%  │ 95%    │ ✅ 达成│
  │ 平均响应时间      │ ≤ 5s   │ 3.2s   │ ✅ 达成│
  │ 投票参与率       │ ≥ 30%  │ 38%    │ ✅ 达成│
  └──────────────────┴────────┴────────┴────────┘

📈 趋势（vs 上周）

  · 发布量: 19 (+4, ↑27%)
  · 群成员: 156 (+18, ↑13%)
  · 互动量: 127 (+31, ↑32%)
  · 成本: $0.58 (+$0.12, ↑26%)  — 增长因互动量增加

💡 AI 建议

  1. 投票参与率稳定在 38%，可尝试增加悬念型投票提升参与
  2. 赛后复盘只有 5 篇（少于预告和预测），部分晚场比赛未覆盖
  3. 群活跃用户占比 43%，可在低活跃时段增加话题引导
  4. LLM 成本可通过将意图分类切换到 GPT-4o-mini 降低约 20%

═══════════════════════════════════════════════════
```

### 5.4 报告生成方式

**自动生成**：通过定时调度系统（09）触发

```
定时任务:
  taskType: system_maintenance
  scheduleType: cron
  cronExpression: "59 23 * * 0"  // 每周日 23:59
  targetType: system
  targetConfig: {
    action: "generate_project_report",
    parameters: {
      reportType: "weekly",
      projectId: "{projectId}"
    }
  }
```

**生成流程**：

```
定时触发 → reportGenerator.generate(projectId, reportType, period)
  │
  ├→ 查询 OutgoingMessage 统计
  ├→ 查询 IncomingMessage 统计
  ├→ 查询 WorkflowInstance 统计
  ├→ 查询 ScheduledTaskExecution 统计
  ├→ 查询 CommunityStats 数据
  ├→ 计算成本（LLM 日志 + 数据源日志）
  ├→ 计算目标达成率（ProjectGoal.kpi vs 实际）
  │
  ├→ (可选) LLM 生成 AI 总结和建议
  │   → SUMMARIZE_REPORT Skill
  │   → 输入: 全部指标数据
  │   → 输出: 自然语言总结 + 优化建议
  │
  └→ 存储 ProjectReport
```

### 5.5 报告存储

```prisma
model ProjectReport {
  id              String   @id @default(cuid())
  projectId       String
  reportType      String   // daily | weekly | monthly
  periodStart     DateTime
  periodEnd       DateTime
  generatedAt     DateTime @default(now())
  
  reportDataJson  String   // 完整 ProjectReport JSON
  aiSummary       String?
  aiSuggestions   String?  // JSON array
  
  project         Project  @relation(fields: [projectId], references: [id])
}
```

---

## 六、Level 3：全局数据分析

### 6.1 入口

租户后台 → 「数据分析」页面（菜单中已预留）

### 6.2 布局

```
┌─────────────────────────────────────────────────────────┐
│  数据分析                          时间范围: [本月 ▾]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ 全局概览 ──────────────────────────────────────────┐│
│  │ 📋 活跃项目   📝 总发布   🗣 总互动   💰 总成本     ││
│  │    3 个         57 篇      381 条      $1.74      ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─ 项目对比 ─────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  项目名称       发布  互动  成员增长  成本  效率     │ │
│  │  体育预测Bot     19   127   +18     $0.58  ⭐⭐⭐  │ │
│  │  科技资讯Bot     22    98   +12     $0.62  ⭐⭐⭐  │ │
│  │  投资交流群      16   156   +25     $0.54  ⭐⭐⭐⭐│ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ 趋势图 ──────────────────────────────────────────┐  │
│  │  [发布量趋势]  [互动量趋势]  [成员增长趋势]        │  │
│  │                                                    │  │
│  │  (折线图 / 柱状图，按天/周展示)                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ 成本分析 ────────────────────────────────────────┐  │
│  │  LLM 成本: $1.20 (69%)                            │  │
│  │  数据源: $0.54 (31%)                               │  │
│  │  单篇内容成本: $0.03   单次互动: $0.005            │  │
│  │  [饼图: 按 Agent 分成本]                           │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 6.3 项目效率评分

简单的效率评分算法，帮助管理层快速识别高效/低效项目：

```typescript
function calculateEfficiencyScore(report: ProjectReport): number {
  const scores = {
    contentOutput: Math.min(report.contentMetrics.totalPublished / 14, 1) * 25,
    interactionRate: report.interactionMetrics.processRate * 25,
    communityGrowth: Math.min(report.communityMetrics.growthRate / 0.1, 1) * 25,
    costEfficiency: Math.min(0.05 / report.costMetrics.costPerContent, 1) * 25
  };
  return Object.values(scores).reduce((a, b) => a + b, 0);
}

// 0-25: ⭐
// 25-50: ⭐⭐
// 50-75: ⭐⭐⭐
// 75-100: ⭐⭐⭐⭐
```

---

## 七、目标达成追踪

### 7.1 与 ProjectGoal 的关联

ProjectGoal 中定义了项目的 KPI 目标（06-project-domain.md）。结果汇报视图负责**将实际执行数据与目标对照**。

```
ProjectGoal:
  goalType: "提升活跃度与互动"
  primaryMetric: "互动率"
  kpiTargets: [
    { name: "每日发布内容数", target: 2, unit: "篇/天" },
    { name: "群成员周增长", target: 10, unit: "人/周" },
    { name: "互动响应率", target: 0.9, unit: "%" },
    { name: "平均响应时间", target: 5, unit: "秒" },
    { name: "投票参与率", target: 0.3, unit: "%" }
  ]

结果汇报视图:
  → 查询实际数据
  → 逐项对比 target vs actual
  → 标注达成 / 未达成 / 超额
  → 计算整体达成率
```

### 7.2 KPI 指标与数据源映射

| KPI 指标 | 数据来源 | 计算方式 |
|---------|---------|---------|
| 每日发布内容数 | OutgoingMessage (type=publish) | COUNT / 天数 |
| 群成员周增长 | CommunityStats | 周末人数 - 周初人数 |
| 互动响应率 | IncomingMessage + OutgoingMessage | 回复数 / 需回复消息数 |
| 平均响应时间 | OutgoingMessage.createdAt - IncomingMessage.createdAt | AVG(差值) |
| 投票参与率 | IncomingMessage (type=poll_answer) | 参与人数 / 群总人数 |

### 7.3 未达成时的建议

当 KPI 未达成时，系统可生成建议（当前阶段用规则，后续用 LLM）：

| KPI 未达成 | 可能原因 | 建议 |
|-----------|---------|------|
| 发布量不足 | 流程失败 / 审核退回多 | 检查流程执行日志，优化 Prompt |
| 成员增长缓慢 | 内容吸引力不足 | 增加互动内容（投票、话题）、优化 Identity |
| 响应时间过长 | LLM 延迟高 / 搜索耗时 | 尝试更快的模型、增加素材缓存 |
| 投票参与率低 | 投票时机不对 / 选项不吸引 | 调整投票发起时间、优化投票问题 |

---

## 八、AI 总结与建议 Skill

### 8.1 SummarizeReport Skill

用 LLM 自动为周报/月报生成自然语言总结和优化建议：

```json
{
  "id": "skill-summarize-report",
  "name": "SummarizeReport",
  "nameZh": "报告总结与建议",
  "code": "SUMMARIZE_REPORT",
  "category": "reporting",
  "executionType": "llm",
  "openClawSpecJson": {
    "steps": [
      "阅读报告中的全部指标数据",
      "识别亮点（超额达成的指标）",
      "识别问题（未达成的指标、趋势下降）",
      "与上一周期对比分析趋势",
      "生成 3-5 条可操作的优化建议",
      "输出自然语言总结"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "reportData": { "type": "object", "description": "ProjectReport 完整数据" },
        "previousReportData": { "type": "object", "description": "上一周期的报告（可选）" },
        "projectGoals": { "type": "object", "description": "项目目标和 KPI" }
      },
      "required": ["reportData"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "summary": { "type": "string", "description": "3-5 句话的总结" },
        "highlights": { "type": "array", "items": { "type": "string" } },
        "concerns": { "type": "array", "items": { "type": "string" } },
        "suggestions": { "type": "array", "items": { "type": "string" } },
        "trendAnalysis": { "type": "string" }
      },
      "required": ["summary", "suggestions"]
    }
  },
  "promptTemplate": "以下是一个运营项目的周期报告数据：\n\n{reportData}\n\n上期数据（如有）：{previousReportData}\n\n项目目标：{projectGoals}\n\n请分析报告数据，生成：\n1. 3-5句话的总结\n2. 亮点\n3. 需要关注的问题\n4. 3-5条可操作的优化建议\n\n所有内容使用中文。",
  "estimatedDurationMs": 5000,
  "maxRetries": 1
}
```

---

## 九、数据聚合服务

### 9.1 reportAggregator

负责从各数据表查询和聚合指标：

```typescript
// server/services/reportAggregator.ts

interface ReportAggregator {
  getContentMetrics(projectId: string, start: Date, end: Date): Promise<ContentMetrics>;
  getInteractionMetrics(projectId: string, start: Date, end: Date): Promise<InteractionMetrics>;
  getCommunityMetrics(projectId: string, start: Date, end: Date): Promise<CommunityMetrics>;
  getResearchMetrics(projectId: string, start: Date, end: Date): Promise<ResearchMetrics>;
  getWorkflowMetrics(projectId: string, start: Date, end: Date): Promise<WorkflowMetrics>;
  getCostMetrics(projectId: string, start: Date, end: Date): Promise<CostMetrics>;
  getGoalProgress(projectId: string, start: Date, end: Date): Promise<GoalProgress>;
  
  generateFullReport(projectId: string, reportType: string, start: Date, end: Date): Promise<ProjectReport>;
}
```

### 9.2 成本追踪

成本数据来自两个来源：

**LLM 成本**：每次 LLM 调用记录 token 使用量

```typescript
interface LLMUsageRecord {
  modelKey: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;  // 按模型定价估算
  projectId: string;
  agentTemplateId: string;
  skillCode: string;
  timestamp: string;
}
```

**数据源成本**：DataSourceUsageLog 已在文档 01 中定义

当前阶段成本估算使用固定单价表：

| 模型 | 输入价格 | 输出价格 |
|------|---------|---------|
| GPT-4o | $2.50/1M tokens | $10.00/1M tokens |
| GPT-4o-mini | $0.15/1M tokens | $0.60/1M tokens |

---

## 十、API 设计

### 10.1 仪表盘 API

```
GET /api/projects/:id/dashboard?period=today
  → 返回项目仪表盘数据（指标卡片 + 时间线 + 成本）

GET /api/projects/:id/dashboard/timeline?date=2026-03-17
  → 返回指定日期的执行时间线
```

### 10.2 报告 API

```
GET    /api/projects/:id/reports
  → 查询项目报告列表（支持 reportType 筛选）

GET    /api/projects/:id/reports/:reportId
  → 查询报告详情

POST   /api/projects/:id/reports/generate
  → 手动触发报告生成 { reportType, periodStart, periodEnd }
```

### 10.3 全局分析 API

```
GET /api/analytics/overview?period=month
  → 租户级全局概览（活跃项目数、总发布量、总互动量、总成本）

GET /api/analytics/projects-comparison?period=week
  → 项目对比数据

GET /api/analytics/cost-breakdown?period=month
  → 成本明细（按 Agent / Skill / 数据源分类）
```

---

## 十一、前端组件

### 11.1 项目仪表盘组件

```
tabs/ResultFeedbackTab.tsx
  ├── DashboardMetricCards.tsx      核心指标卡片（4个）
  ├── ExecutionTimeline.tsx         执行时间线
  ├── ContentEffectPanel.tsx        内容效果面板
  ├── InteractionAnalysisPanel.tsx  互动分析面板
  ├── CostOverviewPanel.tsx         成本概览面板
  └── GoalProgressPanel.tsx         目标达成追踪
```

### 11.2 报告组件

```
tabs/ResultFeedbackTab.tsx (续)
  └── ReportSection.tsx
      ├── ReportList.tsx             报告列表
      ├── ReportDetail.tsx           报告详情（含 AI 总结）
      └── ReportGenerateButton.tsx   手动生成按钮
```

### 11.3 全局分析页

```
pages/DataAnalysis/
  ├── DataAnalysisPage.tsx           主页面
  ├── GlobalOverviewCards.tsx        全局指标卡
  ├── ProjectComparisonTable.tsx     项目对比表
  ├── TrendCharts.tsx                趋势图（折线/柱状）
  └── CostBreakdownChart.tsx         成本分析图
```

### 11.4 图表库选型

当前阶段推荐 **Recharts**（React 原生、轻量、已在常用生态中）：
- 折线图：发布量 / 互动量 / 成员增长趋势
- 柱状图：项目对比
- 饼图：成本分布
- 数字卡片：核心指标

---

## 十二、开发顺序

```
步骤 1: 数据模型
  → Prisma Schema：ProjectReport
  → prisma migrate dev

步骤 2: 数据聚合服务
  → reportAggregator.ts
  → 各维度指标查询（content / interaction / community / cost / goal）
  → 注意：部分数据来自尚未创建的表（如 OutgoingMessage）
  → 对于缺失的数据表，先返回占位值，等对应模块开发后填充

步骤 3: 成本追踪
  → LLM 调用记录 token 用量（在 llmExecutor 中埋点）
  → 数据源调用记录（DataSourceUsageLog）
  → 成本估算逻辑（固定单价表）

步骤 4: 项目仪表盘 API + 前端
  → GET /api/projects/:id/dashboard
  → 项目详情「结果反馈」Tab 实现
  → 核心指标卡片 + 执行时间线 + 内容效果 + 互动分析 + 成本

步骤 5: 目标达成追踪
  → 关联 ProjectGoal 的 KPI 定义
  → 计算 actual vs target
  → GoalProgressPanel 展示

步骤 6: 报告生成
  → reportGenerator.generate()
  → 定时触发日报/周报/月报
  → 可选：AI 总结 Skill (SUMMARIZE_REPORT)
  → 报告存储和查询 API

步骤 7: 全局数据分析
  → 租户后台「数据分析」页面
  → 跨项目汇总和对比
  → 趋势图（Recharts）

步骤 8: 集成验证
  → 体育赛事 Bot 运转一周后查看仪表盘
  → 确认各指标数据准确
  → 周报自动生成并包含 AI 建议
  → 目标达成率正确计算
```

---

## 十三、验收标准

### 项目仪表盘（L1）
- [ ] 核心指标卡片：发布量、互动量、群成员、投票参与率
- [ ] 指标卡片支持时间范围切换（今天/本周/本月）
- [ ] 指标卡片显示与上期对比（↑/↓）
- [ ] 执行时间线：按时间顺序展示当天所有操作
- [ ] 内容效果面板：按类型分布、审核通过率
- [ ] 互动分析面板：消息处理率、平均响应时间
- [ ] 成本概览面板：LLM + 数据源成本汇总

### 周期报告（L2）
- [ ] 日报/周报/月报自动生成
- [ ] 报告包含全部 6 个指标维度
- [ ] 周报含 AI 总结和优化建议
- [ ] 报告可查看历史列表
- [ ] 报告可手动触发生成

### 目标达成（L2 内嵌）
- [ ] KPI 目标 vs 实际对照表
- [ ] 达成/未达成/超额状态标记
- [ ] 未达成时给出建议

### 全局分析（L3）
- [ ] 租户级活跃项目数、总发布量、总成本
- [ ] 项目对比表（发布/互动/成员/成本/效率评分）
- [ ] 趋势折线图（按天/周展示）
- [ ] 成本分析（按 Agent / Skill / 数据源分类）

### 数据准确性
- [ ] 各指标数据与源数据一致（抽查验证）
- [ ] 成本估算与实际 token 用量匹配
- [ ] 目标达成率计算正确

### 中文化
- [ ] 所有指标名称、状态标签、时间描述中文
- [ ] AI 总结和建议中文
- [ ] 报告标题和说明中文
