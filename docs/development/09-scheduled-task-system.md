# 09 — 定时任务调度系统

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：Telegram Bot 终端（02）
> 后续依赖：主动推送闭环（10）— 定时任务是主动推送的触发器
> 实用化案例：体育赛事预测 Bot — 每天 07:00 采集赛事数据、09:00 发话题引导、赛前 2 小时发投票、赛后 1 小时发复盘

---

## 一、模块定位

定时任务调度系统是整个运营自动化的**时间引擎**。没有它，所有主动推送能力都无法运转——系统只能被动等用户消息。

**它不是**：
- Cron 服务器（不是独立的定时任务服务，而是系统内建的调度能力）
- 消息队列（不做异步消息处理，那是消息管线的职责）
- 流程引擎（不做复杂工作流编排，只负责"到时间了触发一个动作"）

**它是**：
- 项目级的定时任务配置与执行入口
- WorkflowInstance 的定时创建器
- Agent Skill 的定时触发器
- 运营节奏的自动化保证

### 在系统中的位置

```
定时调度系统
  │
  ├→ 触发 WorkflowInstance 创建 → 走完整流程链路
  │   （Research → Creator → Reviewer → Publisher）
  │
  ├→ 直接触发单个 Agent Skill
  │   （Community Manager: 话题引导、投票、周报）
  │
  └→ 触发系统维护任务
      （数据源健康检查、缓存清理、统计汇总）
```

---

## 二、核心概念

### 2.1 ScheduledTask（定时任务）

系统中的每一个定时任务就是一个 ScheduledTask 记录。

```typescript
interface ScheduledTask {
  id: string;
  projectId: string;
  
  // 任务标识
  name: string;
  nameZh: string;
  description: string;
  taskType: ScheduledTaskType;
  
  // 调度配置
  scheduleType: 'cron' | 'interval' | 'once' | 'event_relative';
  cronExpression?: string;        // cron 表达式（scheduleType=cron 时必填）
  intervalMinutes?: number;       // 间隔分钟（scheduleType=interval 时必填）
  scheduledAt?: string;           // 一次性执行时间（scheduleType=once 时必填）
  eventRelativeConfig?: EventRelativeConfig;  // 相对事件配置
  timezone: string;               // 时区，默认 "Asia/Shanghai"
  
  // 执行目标
  targetType: 'workflow' | 'agent_skill' | 'system';
  targetConfig: WorkflowTarget | AgentSkillTarget | SystemTarget;
  
  // 状态
  status: 'active' | 'paused' | 'disabled' | 'completed';
  
  // 执行记录
  lastExecutedAt?: string;
  lastExecutionStatus?: 'success' | 'failed' | 'skipped';
  nextScheduledAt?: string;
  totalExecutions: number;
  totalFailures: number;
  
  // 元数据
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

### 2.2 任务类型（ScheduledTaskType）

| 类型 | 含义 | 执行目标 | 示例 |
|------|------|---------|------|
| `content_pipeline` | 内容生产管线 | WorkflowInstance | 每日采集→创作→审核→发布 |
| `data_collection` | 定时数据采集 | Agent Skill | 每日 07:00 采集赛事数据 |
| `community_action` | 社群管理动作 | Agent Skill | 每日话题引导、每周统计 |
| `event_driven` | 事件相对触发 | Agent Skill | 赛前 2 小时发投票 |
| `system_maintenance` | 系统维护 | System | 缓存清理、健康检查 |

### 2.3 调度类型

| scheduleType | 含义 | 示例 |
|-------------|------|------|
| `cron` | Cron 表达式 | `0 7 * * *`（每天 7:00） |
| `interval` | 固定间隔 | 每 30 分钟 |
| `once` | 一次性 | 2026-03-17T20:00:00+08:00 |
| `event_relative` | 相对于外部事件 | 赛前 2 小时 |

### 2.4 EventRelativeConfig（事件相对配置）

用于"赛前 N 小时""赛后 N 小时"等场景：

```typescript
interface EventRelativeConfig {
  eventSource: string;            // 事件来源（"sports_schedule" | "custom"）
  eventType: string;              // 事件类型（"game_start" | "game_end"）
  offsetMinutes: number;          // 相对偏移（-120 = 赛前2小时, +60 = 赛后1小时）
  eventQueryConfig: object;       // 事件查询参数（如 team, league）
}
```

**当前阶段实现**：event_relative 在当前阶段通过手动录入事件时间 + once 任务近似实现。完整的事件源对接（体育赛程 API 等）留到后续迭代。

---

## 三、执行目标定义

### 3.1 WorkflowTarget（触发流程实例）

```typescript
interface WorkflowTarget {
  workflowTemplateId: string;     // 使用哪个流程模板
  inputParameters: object;        // 传入流程的参数
  identityId?: string;            // 指定执行 Identity
  autoStart: boolean;             // 创建后是否自动开始执行
}
```

**示例**：每日内容管线

```json
{
  "workflowTemplateId": "wt-content-pipeline",
  "inputParameters": {
    "topic": "NBA today",
    "contentType": "prediction",
    "targetChannels": ["telegram-sports-group"]
  },
  "identityId": "id-sports-expert",
  "autoStart": true
}
```

### 3.2 AgentSkillTarget（触发 Agent Skill）

```typescript
interface AgentSkillTarget {
  agentTemplateId: string;        // 使用哪个 Agent
  skillCode: string;              // 执行哪个 Skill
  skillInput: object;             // Skill 输入参数
  terminalId?: string;            // 目标终端（如有）
}
```

**示例**：每日话题引导

```json
{
  "agentTemplateId": "at-community-manager",
  "skillCode": "GENERATE_TOPIC_PROMPT",
  "skillInput": {
    "chatId": -1001234567890,
    "groupTopic": "体育赛事预测"
  },
  "terminalId": "terminal-tg-sports-group"
}
```

### 3.3 SystemTarget（系统维护任务）

```typescript
interface SystemTarget {
  action: string;                 // 系统动作标识
  parameters: object;             // 动作参数
}
```

**示例**：数据源健康检查

```json
{
  "action": "datasource_health_check",
  "parameters": {
    "checkAllProviders": true,
    "notifyOnFailure": true
  }
}
```

---

## 四、体育赛事 Bot 的完整定时任务表

以下是体育赛事预测 Bot 项目的标准定时任务配置，展示系统的日常运营节奏：

| 时间 | 任务名称 | 类型 | 执行目标 | 说明 |
|------|---------|------|---------|------|
| 每日 07:00 | 晨间数据采集 | data_collection | Research Agent → SEARCH_WEB + SUBSCRIBE_RSS | 采集当日赛程、伤病、赔率 |
| 每日 09:00 | 群话题引导 | community_action | Community Manager → GENERATE_TOPIC_PROMPT | 在群里发起当日话题讨论 |
| 每日 10:00 | 赛事预告推送 | content_pipeline | 完整流程：Research→Creator→Reviewer→Publisher | 发布当日赛事预告帖 |
| 赛前 2 小时 | 赛事预测投票 | event_driven | Community Manager → CREATE_POLL | 发起"你看好谁"投票 |
| 赛前 1 小时 | 深度预测文章 | content_pipeline | 完整流程（深度研究模式） | 发布详细预测分析 |
| 赛后 1 小时 | 赛果复盘 | content_pipeline | 完整流程（复盘模式） | 发布比赛复盘和数据 |
| 每周一 10:00 | 群周报 | community_action | Community Manager → COMMUNITY_STATS | 发布本周群数据统计 |
| 每日 02:00 | 数据源健康检查 | system_maintenance | 系统检查 | 检查所有数据源可用性 |

---

## 五、调度引擎架构

### 5.1 整体架构

```
┌──────────────────────────────────────────────┐
│              Scheduler Engine                 │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Cron     │  │ Interval │  │ Once/Event│  │
│  │ Evaluator│  │ Timer    │  │ Queue     │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       └──────────────┼──────────────┘        │
│                      ↓                        │
│              Task Dispatcher                  │
│                      │                        │
│       ┌──────────────┼──────────────┐        │
│       ↓              ↓              ↓        │
│  ┌─────────┐  ┌───────────┐  ┌──────────┐   │
│  │Workflow │  │AgentSkill │  │ System   │   │
│  │Executor │  │ Executor  │  │ Executor │   │
│  └─────────┘  └───────────┘  └──────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │         Execution Logger             │    │
│  │  (记录每次执行状态、耗时、结果)      │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### 5.2 技术实现方案

当前阶段使用 **node-cron** + 内存调度 + 数据库持久化的轻量方案：

```
启动流程：
1. 服务器启动 → 加载所有 status=active 的 ScheduledTask
2. 为每个 cron/interval 类型任务注册 node-cron job
3. 为 once/event_relative 类型任务注册 setTimeout
4. 内存中维护 jobRegistry（taskId → cronJob 映射）

运行时：
- cron/interval 任务由 node-cron 自动触发
- 触发时调用 TaskDispatcher.execute(taskId)
- Dispatcher 根据 targetType 路由到对应 Executor
- 执行完成后更新 ScheduledTask 记录（lastExecutedAt 等）
- 写入 ScheduledTaskExecution 日志

动态更新：
- 新建/修改/暂停/恢复任务 → 更新数据库 + 更新内存 jobRegistry
- 服务器重启 → 从数据库重新加载所有任务
```

**为什么不用独立的任务队列服务（BullMQ / Agenda 等）**：
- 当前阶段单进程 Express 服务，node-cron 足够简单可靠
- 定时任务数量预计 < 100 个，不需要分布式调度
- 减少基础设施依赖，降低部署复杂度
- 后续如果需要分布式或高可靠调度，可以替换实现层而不改上层接口

---

## 六、数据模型

### 6.1 Prisma Schema

```prisma
model ScheduledTask {
  id              String   @id @default(cuid())
  projectId       String
  
  name            String
  nameZh          String
  description     String   @default("")
  taskType        String   // content_pipeline | data_collection | community_action | event_driven | system_maintenance
  
  scheduleType    String   // cron | interval | once | event_relative
  cronExpression  String?
  intervalMinutes Int?
  scheduledAt     DateTime?
  eventRelativeConfigJson String?  // JSON
  timezone        String   @default("Asia/Shanghai")
  
  targetType      String   // workflow | agent_skill | system
  targetConfigJson String  // JSON
  
  status          String   @default("active")  // active | paused | disabled | completed
  
  lastExecutedAt      DateTime?
  lastExecutionStatus String?    // success | failed | skipped
  nextScheduledAt     DateTime?
  totalExecutions     Int      @default(0)
  totalFailures       Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String
  
  project         Project  @relation(fields: [projectId], references: [id])
  executions      ScheduledTaskExecution[]
}

model ScheduledTaskExecution {
  id              String   @id @default(cuid())
  taskId          String
  
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  
  status          String   // running | success | failed | skipped | timeout
  
  resultSummary   String?
  errorMessage    String?
  durationMs      Int?
  
  triggerType      String   // scheduled | manual | retry
  
  targetOutputJson String?  // 执行结果 JSON（WorkflowInstance ID / Skill 输出等）
  
  task            ScheduledTask @relation(fields: [taskId], references: [id])
}
```

### 6.2 与现有模型的关系

```
ScheduledTask
  → belongsTo Project
  → hasMany ScheduledTaskExecution
  → 通过 targetConfig 引用：
    - WorkflowTemplate（触发流程时）
    - AgentTemplate + Skill（触发 Skill 时）
    - Terminal（需要终端的 Skill）
```

---

## 七、API 设计

### 7.1 任务管理 API

```
POST   /api/scheduled-tasks              创建定时任务
GET    /api/scheduled-tasks              查询任务列表（支持 projectId 筛选）
GET    /api/scheduled-tasks/:id          查询任务详情
PUT    /api/scheduled-tasks/:id          更新任务配置
DELETE /api/scheduled-tasks/:id          删除任务
PATCH  /api/scheduled-tasks/:id/status   切换状态（pause / resume / disable）
POST   /api/scheduled-tasks/:id/execute  手动触发执行
```

### 7.2 执行记录 API

```
GET    /api/scheduled-tasks/:id/executions   查询执行历史
GET    /api/scheduled-task-executions/:id     查询单次执行详情
```

### 7.3 调度器状态 API

```
GET    /api/scheduler/status             调度器运行状态（已注册任务数、下次触发时间等）
POST   /api/scheduler/reload             重新加载所有任务（从数据库同步到内存）
```

---

## 八、前端页面设计

### 8.1 入口位置

定时任务管理嵌入**项目详情页**的「流程任务」Tab 中，因为定时任务是项目运营节奏的核心组成部分。

```
项目详情 → 流程任务 Tab
  ├── 流程实例列表（WorkflowInstance 运行状态）
  └── 定时任务管理（ScheduledTask 配置与监控）
```

### 8.2 任务列表视图

```
┌─────────────────────────────────────────────────────────────────┐
│ 定时任务                                              [+ 新建]  │
├───────────────┬──────┬───────────┬──────────┬────────┬─────────┤
│ 任务名称       │ 类型  │ 调度规则   │ 下次执行   │ 状态   │ 操作    │
├───────────────┼──────┼───────────┼──────────┼────────┼─────────┤
│ 晨间数据采集   │ 采集  │ 每天 07:00 │ 明天 07:00│ ✅ 运行 │ ⏸ 编辑  │
│ 群话题引导     │ 社群  │ 每天 09:00 │ 明天 09:00│ ✅ 运行 │ ⏸ 编辑  │
│ 赛事预告推送   │ 管线  │ 每天 10:00 │ 明天 10:00│ ✅ 运行 │ ⏸ 编辑  │
│ 赛事预测投票   │ 事件  │ 赛前 2 小时│ 今天 18:00│ ✅ 运行 │ ⏸ 编辑  │
│ 群周报统计     │ 社群  │ 每周一 10:00│ 下周一   │ ✅ 运行 │ ⏸ 编辑  │
│ 数据源检查     │ 系统  │ 每天 02:00 │ 明天 02:00│ ⏸ 暂停 │ ▶ 编辑  │
└───────────────┴──────┴───────────┴──────────┴────────┴─────────┘
```

### 8.3 任务创建/编辑表单

```
┌── 新建定时任务 ──────────────────────────────────┐
│                                                  │
│  任务名称：[                               ]     │
│  任务类型：[内容管线 ▾]                           │
│                                                  │
│  ── 调度规则 ──                                   │
│  调度方式：○ Cron  ○ 固定间隔  ○ 一次性  ○ 事件   │
│  Cron 表达式：[0 7 * * *           ]             │
│  可读说明：每天 07:00 执行                        │
│  时区：[Asia/Shanghai ▾]                          │
│                                                  │
│  ── 执行目标 ──                                   │
│  目标类型：○ 触发流程  ○ 触发 Agent Skill  ○ 系统  │
│  流程模板：[内容生产管线 ▾]                        │
│  输入参数：                                       │
│    主题：[NBA today                      ]        │
│    内容类型：[prediction ▾]                       │
│    目标渠道：[☑ 体育预测群] [☐ 体育频道]          │
│  执行 Identity：[体育预测达人 ▾]                   │
│                                                  │
│  [取消]                           [创建任务]      │
└──────────────────────────────────────────────────┘
```

### 8.4 执行历史视图

```
┌── 晨间数据采集 · 执行历史 ─────────────────────────────────┐
│                                                            │
│  统计：共执行 45 次 / 成功 43 / 失败 2 / 平均耗时 22s      │
│                                                            │
│  ┌──────────┬────────┬────────┬───────────────────────────┐│
│  │ 执行时间  │ 状态    │ 耗时   │ 结果摘要                  ││
│  ├──────────┼────────┼────────┼───────────────────────────┤│
│  │ 今天 07:00│ ✅ 成功 │ 23s    │ 采集 48 条，汇总 15 条    ││
│  │ 昨天 07:00│ ✅ 成功 │ 19s    │ 采集 52 条，汇总 18 条    ││
│  │ 3/15 07:00│ ❌ 失败 │ 31s    │ Tavily 超时，降级 RSS     ││
│  │ 3/14 07:00│ ✅ 成功 │ 25s    │ 采集 41 条，汇总 12 条    ││
│  └──────────┴────────┴────────┴───────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

### 8.5 Cron 表达式辅助

运营人员不需要懂 Cron 表达式。前端提供可视化配置：

```
调度方式选择：
  ○ 每天执行  → 时间选择器 → 自动生成 cron
  ○ 每周执行  → 星期几 + 时间 → 自动生成 cron
  ○ 固定间隔  → 间隔分钟数 → intervalMinutes
  ○ 一次性    → 日期时间选择器 → scheduledAt
  ○ 自定义    → Cron 表达式输入 + 可读说明展示
```

---

## 九、执行保障

### 9.1 并发控制

同一个 ScheduledTask 不允许并发执行。如果上一次执行还未完成，新的触发将被跳过（status=skipped）。

```
触发检查：
  → 该任务是否有 status=running 的 Execution？
    → 有 → 跳过本次，记录 skipped
    → 无 → 正常执行
```

### 9.2 超时控制

| 任务类型 | 默认超时 | 说明 |
|---------|---------|------|
| data_collection | 60s | 数据采集含网络请求 |
| content_pipeline | 120s | 完整流程包含多次 LLM |
| community_action | 30s | 单次 API 调用 |
| system_maintenance | 60s | 系统检查 |

超时后标记 Execution status=timeout，记录错误信息。

### 9.3 失败处理

```
任务执行失败：
  1. 记录 Execution status=failed + errorMessage
  2. 更新 ScheduledTask.totalFailures
  3. 检查连续失败次数：
     → 连续失败 3 次 → 自动暂停任务（status=paused）
     → 发送告警（当前阶段：写入系统日志；后续：通知运营人员）
  4. 暂停后需人工排查并手动恢复
```

### 9.4 错过的执行（Missed Executions）

服务器重启或宕机期间可能错过定时执行。处理策略：

| 策略 | 适用场景 | 说明 |
|------|---------|------|
| **跳过** | 时效性强的任务（如群话题引导） | 过了时间就不执行了 |
| **补执行一次** | 数据采集 | 重启后立即执行一次 |
| **不补执行** | 默认 | 等下次调度时间 |

在 ScheduledTask 中增加 `missedExecutionPolicy` 字段：

```typescript
missedExecutionPolicy: 'skip' | 'execute_once' | 'ignore';
```

---

## 十、Cron 表达式速查

提供给前端展示和文档参考：

| 表达式 | 含义 | 中文说明 |
|-------|------|---------|
| `0 7 * * *` | 每天 07:00 | 每天早上 7 点 |
| `0 9 * * *` | 每天 09:00 | 每天上午 9 点 |
| `0 10 * * 1` | 每周一 10:00 | 每周一上午 10 点 |
| `0 2 * * *` | 每天 02:00 | 每天凌晨 2 点 |
| `*/30 * * * *` | 每 30 分钟 | 每半小时 |
| `0 */6 * * *` | 每 6 小时 | 每 6 小时整点 |
| `0 10,14,18 * * *` | 每天 10/14/18 点 | 每天三个时段 |

---

## 十一、与其他模块的接口

### 11.1 → WorkflowInstance（触发流程）

```
Scheduler → TaskDispatcher.executeWorkflowTarget(target)
  → workflowService.createInstance({
      templateId: target.workflowTemplateId,
      projectId: task.projectId,
      inputParameters: target.inputParameters,
      identityId: target.identityId,
      triggerSource: 'scheduled',
      scheduledTaskId: task.id
    })
  → 如果 autoStart=true → workflowService.startInstance(instanceId)
```

### 11.2 → Agent Skill（触发单个 Skill）

```
Scheduler → TaskDispatcher.executeAgentSkillTarget(target)
  → agentDispatcher.executeSingleSkill({
      agentTemplateId: target.agentTemplateId,
      skillCode: target.skillCode,
      input: target.skillInput,
      projectId: task.projectId,
      terminalId: target.terminalId,
      triggerSource: 'scheduled',
      scheduledTaskId: task.id
    })
```

### 11.3 → System（系统任务）

```
Scheduler → TaskDispatcher.executeSystemTarget(target)
  → systemTaskExecutor.execute(target.action, target.parameters)
  
支持的 system action：
  - datasource_health_check：检查所有数据源终端可用性
  - cache_cleanup：清理过期的搜索缓存和素材缓存
  - stats_aggregation：汇总统计数据（消息数、成员数等）
```

### 11.4 ← Config Agent（创建定时任务）

Config Agent 可通过内部 API 为项目创建定时任务：

```
运营人员："帮我设置每天早上 7 点采集体育新闻"
  → Config Agent → PARSE_CONFIG_INTENT
  → 调用 POST /api/scheduled-tasks
  → 创建 ScheduledTask（data_collection, cron: "0 7 * * *"）
```

---

## 十二、错误处理

| 场景 | 处理方式 | 日志记录 |
|------|---------|---------|
| Cron 表达式无效 | 创建/更新时校验拒绝 | 中文提示"Cron 表达式格式错误" |
| 流程模板不存在 | 执行时标记 failed | "流程模板 {id} 不存在或已归档" |
| Agent/Skill 不存在 | 执行时标记 failed | "Agent {id} 或 Skill {code} 不存在" |
| 终端不可用 | 执行时标记 failed | "终端 {id} 未连接或已禁用" |
| 执行超时 | 标记 timeout | "任务执行超时（{timeoutMs}ms）" |
| 连续失败 3 次 | 自动暂停任务 | "任务连续失败 3 次，已自动暂停" |
| 服务器重启 | 重新加载任务 | "调度器重新加载，共 {n} 个活跃任务" |

---

## 十三、开发顺序

```
步骤 1: 数据模型
  → Prisma Schema：ScheduledTask + ScheduledTaskExecution
  → prisma migrate dev

步骤 2: 调度引擎核心
  → schedulerEngine.ts：任务注册/注销/触发
  → 基于 node-cron 实现 cron 和 interval 类型
  → 基于 setTimeout 实现 once 类型
  → 启动时从数据库加载所有 active 任务

步骤 3: 任务分发器
  → taskDispatcher.ts：根据 targetType 路由到对应执行器
  → workflowTargetExecutor：创建 WorkflowInstance
  → agentSkillTargetExecutor：调用 Agent Skill
  → systemTargetExecutor：执行系统任务

步骤 4: 执行保障
  → 并发控制（同任务不重复执行）
  → 超时控制
  → 失败自动暂停（连续 3 次）
  → 执行日志记录

步骤 5: API
  → CRUD API + 状态切换 + 手动触发
  → 执行历史查询 API
  → 调度器状态 API

步骤 6: 前端页面
  → 项目详情「流程任务」Tab 中嵌入任务列表
  → 任务创建/编辑表单（含 Cron 可视化辅助）
  → 执行历史视图
  → 状态标签中文化

步骤 7: 集成测试
  → 创建 cron 任务 → 到时间自动触发 → 执行成功
  → 创建 once 任务 → 到时间触发一次 → 标记 completed
  → 手动触发 → 立即执行
  → 暂停/恢复 → 状态正确切换
  → 执行失败 → 记录错误 → 连续 3 次 → 自动暂停
  → 服务器重启 → 任务自动恢复
```

---

## 十四、验收标准

- [ ] ScheduledTask + ScheduledTaskExecution Prisma 模型已创建
- [ ] cron 类型任务：按表达式准时触发（误差 < 5 秒）
- [ ] interval 类型任务：按间隔触发
- [ ] once 类型任务：指定时间触发一次，执行后标记 completed
- [ ] 触发流程：ScheduledTask → 创建 WorkflowInstance → 自动开始
- [ ] 触发 Skill：ScheduledTask → Agent Skill 执行 → 结果记录
- [ ] 并发控制：上次未完成时跳过本次
- [ ] 超时控制：超时标记 timeout
- [ ] 失败自动暂停：连续 3 次失败 → 自动 paused
- [ ] 手动触发：点击"立即执行"→ 立即运行
- [ ] 暂停/恢复：状态切换后调度正确响应
- [ ] 服务器重启后自动恢复所有 active 任务
- [ ] 执行历史：每次执行有完整记录（时间、状态、耗时、结果）
- [ ] 前端：Cron 可视化辅助，运营人员不需要手写 Cron 表达式
- [ ] 前端：任务列表展示下次执行时间、状态标签中文化
- [ ] 所有错误提示中文
