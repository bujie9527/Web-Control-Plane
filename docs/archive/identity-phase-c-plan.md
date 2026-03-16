# Identity 1.0 Phase C 实施计划：任务使用 Identity

## 一、本阶段目标理解

- **核心目标**：让 Task 正式支持「使用 Identity」，使 Identity 从项目配置进入**任务执行链路**；用户能明确看到任务「以哪个身份执行」，任务与结果可追踪身份，为后续矩阵账号、差异化内容与行为打基础。
- **实现深度**：优先**高质量结构与真实业务关系**，不追求一次性实现复杂智能逻辑。Identity 保持为标准对象；任务与结果仅做「关联 Identity + 展示」与「创建时选择 Identity」的闭环。
- **不做**：真实任务执行引擎、复杂工作流、终端真实绑定与鉴权；本阶段只做 schema 扩展、mock 关系、列表/详情/结果区的 Identity 展示与创建时选择占位。

---

## 二、任务创建流程中 Identity 的接入方案

### 2.1 现状

- 任务中心（TaskCenter）当前为骨架页，使用 taskSkeleton，无真实「创建任务」表单。
- 项目详情「流程与任务」Tab 有「近期任务」表格，无创建入口。

### 2.2 建议方案（控制深度）

- **入口**：在**项目详情 · 流程与任务 Tab** 增加主按钮「创建任务」，点击打开**抽屉**（Drawer）。
- **抽屉内容**（占位级即可）：
  - **Identity 选择**（必选）：下拉或单选列表，选项来自**当前项目已绑定 Identity**（`data.identities.list`）；若项目有 `data.identities.defaultIdentityId`，则默认选中该项；允许用户切换为其他已绑定身份。
  - 其他字段：任务名称、关联流程等可为占位输入或下拉，提交为 mock（调用 taskMock.createTask 或仅 toast「创建成功」并关闭抽屉、刷新近期任务列表）。
- **数据**：创建时提交 `identityId`（必填），mock 落库时写入 Task 的 identityId；列表/详情从 mock 读回并展示。
- **不做的**：不从身份库全量拉列表、不跨项目选身份；选择范围严格限定为「本项目已绑定身份」，与 Phase B 一致。

### 2.3 可选简化

- 若希望进一步收窄：可仅在「流程与任务」Tab 内增加一块 **「创建任务（占位）」Card**，内有一个「选择身份」下拉（数据源同上）+ 说明文案「正式创建流程将在后续开放」，不实现真实提交，只把「任务创建时选 Identity」的交互与数据关系固定下来。

---

## 三、任务详情页与结果区的 Identity 展示方案

### 3.1 任务详情

- **入口**：项目详情「流程与任务」Tab 的「近期任务」表格中，行操作增加「查看」；或任务中心表格「查看」。点击后打开**任务详情抽屉**或跳转**任务详情页**（若已有路由则用现有，否则用抽屉更轻量）。
- **详情内容**：
  - 任务基础信息：任务名称、流程、状态、负责人、创建/更新时间等（沿用现有 Task 字段）。
  - **本任务使用的身份**（新增区块）：身份名称、身份类型、核心定位摘要（一句）；可带「查看身份详情」链接至 `/tenant/agents/identities/:id`。数据来自 Task.identityId → getIdentityById 或 mock 返回的 taskDetail.identitySummary。
- **数据**：Task 增加 identityId；任务详情接口（或 getProjectDetail 内 recentTasks 扩展）返回 identityId + identitySummary（name, type, corePositioning 截断），便于详情页直接展示，无需再请求身份库。

### 3.2 任务列表中的 Identity 展示

- **项目详情 · 流程与任务**：近期任务表格增加一列「使用身份」，展示身份名称；无身份时显示「—」。
- **项目详情 · 概览**：最近任务若沿用 RecentTaskItem，可扩展 identityName 或 identitySummary，表格加一列「身份」。
- **任务中心**：运行中/待审核等表格增加一列「使用身份」，数据来自 taskSkeleton 扩展或未来 taskMock 列表。

### 3.3 结果信息保留 Identity

- **任务结果摘要**：若存在「单条任务结果」结构（如 TaskResult 或结果详情），则其中包含 identityId + identityDisplay（name/type 等）；任务结果列表可加一列「使用身份」。
- **项目结果反馈**：ResultFeedItem 扩展为可选字段 `identityId?: string`、`identityName?: string`（或 identitySummary），用于「该条回流是以哪个身份产生」的占位；列表或详情中展示「身份」标签。
- **最近任务 / 最近结果**：租户工作台、项目概览等处的「最近任务」与「最近结果」列表中，每条可带身份标签（身份名称或「默认」等），便于追溯。

### 3.4 实现深度控制

- 先做**结构**：Task、TaskItem、RecentTaskItem、ResultFeedItem 等增加 identity 相关字段；mock 为部分任务/结果写入 identityId 与展示用 name/type/corePositioningSummary。
- 再做**展示**：列表加列、详情加区块、结果区加标签；不要求每条历史数据都补全，保证「有身份的任务/结果能正确显示」即可。

---

## 四、终端预留绑定位的实现建议

- **Schema**：在 `Terminal`（terminal.ts）中增加可选字段 `primaryIdentityId?: string`，表示该终端当前绑定的主身份；不实现绑定/解绑业务逻辑。
- **Mock**：terminalSkeleton 或终端 mock 中，可为 1～2 个终端写入 primaryIdentityId，便于「终端详情」或终端列表占位展示。
- **展示**：终端中心页或终端详情占位中，增加一块「绑定身份」：有 primaryIdentityId 时展示身份名称 + 「查看身份详情」链接；无则展示「未绑定身份，后续可在终端配置中绑定」。
- **不做的**：不实现终端维度的绑定/解绑接口与复杂鉴权，仅预留字段与展示占位，满足「终端可绑定主 Identity 的结构位」即可。

---

## 五、需要新增或修改的 Schema / Service / Mock 范围

### 5.1 Schema

| 文件 | 变更 |
|------|------|
| **task.ts** | Task 增加 `identityId?: string`；可选 `identityName?: string`、`identityType?: string`、`identityCorePositioningSummary?: string`（列表/详情展示用，可由 mock 或 service 拼装）。 |
| **projectDetail.ts** | TaskItem 增加 `identityId?: string`、`identityName?: string`（或 identitySummary）；RecentTaskItem 增加 `identityName?: string`；ResultFeedItem 增加 `identityId?: string`、`identityName?: string`。 |
| **tenantDashboard.ts** | RecentTask 增加 `identityName?: string`（工作台最近任务带身份标签）。 |
| **terminal.ts** | Terminal 增加 `primaryIdentityId?: string`。 |

### 5.2 Mock

| 文件 | 变更 |
|------|------|
| **taskMock 或 skeletonMock** | 若有统一 taskMock：getTaskList/getTaskDetail 返回带 identityId 及展示字段；createTask 接收 identityId。若仍用 skeletonMock：runningTasks/reviewTasks 等增加 identityName（或 identityId），与 project 绑定身份一致（如 p1 任务带 id1）。 |
| **projectDetailMock** | workflowTasks.recentTasks（TaskItem[]）中每条任务带 identityId、identityName；overview.recentTasks（RecentTaskItem[]）带 identityName；results.feeds 中部分条目标注 identityId/identityName。 |
| **tenantDashboardMock** | recentTasks 中部分带 identityName。 |
| **terminalMock 或 terminalSkeleton** | 1～2 个终端设置 primaryIdentityId；终端详情或列表占位展示用。 |

### 5.3 Service

| 说明 |
|------|
| 任务列表/详情若仍由 projectDetailService 聚合（getProjectDetail），则无需新接口；projectDetailMock 内组装 task 的 identity 展示字段即可。 |
| 若有独立 taskService/taskRepository：getTaskList、getTaskDetail、createTask 支持 identityId；createTask 校验 identityId 属于当前项目已绑定身份（mock 内校验）。 |
| 终端 service 若存在，仅透传 Terminal，不新增绑定接口；终端详情展示 primaryIdentityId 时由前端或 service 从 identityMock 取 name 展示。 |

### 5.4 页面与组件

| 位置 | 变更 |
|------|------|
| 项目详情 · 流程与任务 Tab | 近期任务表格加列「使用身份」；「创建任务」按钮 + 抽屉（Identity 选择 + 占位表单）；提交后刷新 data 或本地追加一条带 identity 的任务。 |
| 任务详情 | 抽屉或详情页：任务信息 + 「本任务使用的身份」区块（名称、类型、核心定位摘要、查看详情链接）。 |
| 项目详情 · 概览 | 最近任务若有表格，加列「身份」。 |
| 项目详情 · 结果反馈 Tab | 结果回流表格加列「身份」（若有）；或保留现有表格，在 Card 说明中注明「结果将保留身份信息」。 |
| 租户工作台 | 最近任务列表展示 identityName 标签（若 schema 已支持）。 |
| 任务中心 | 运行中/待审核表格加列「使用身份」（数据来自 skeleton 扩展）。 |
| 终端中心 / 终端详情 | 预留「绑定身份」占位区块，展示 primaryIdentityId 对应名称或「未绑定」。 |

---

## 六、风险点与注意事项

1. **任务创建入口不统一**：若任务既可从项目详情创建、又可从任务中心创建，则 Identity 选项均需来自「当前项目」已绑定身份；从任务中心创建时需先选项目或上下文带 projectId，再拉该项目 identities。本阶段可仅做「从项目详情 · 流程与任务创建」一条路径，降低复杂度。
2. **历史数据**：既有 mock 任务可能无 identityId；列表/详情展示时「无身份」显示为「—」或「未指定」，不报错。
3. **默认身份带出**：创建任务时若项目有 defaultIdentityId，表单默认选中该项；用户可改选，提交以表单为准。
4. **租户与项目隔离**：createTask 时 identityId 必须在当前 project 的 identities.list 内，mock 或 service 做校验，避免跨项目绑身份。
5. **扩展性**：Task、Result、Terminal 的 identity 字段设计需兼顾后续「矩阵账号管理」「差异化内容/行为」的查询与展示，避免后续大改 schema。

---

## 七、实施顺序建议

1. **Schema**：Task、TaskItem、RecentTaskItem、ResultFeedItem、RecentTask、Terminal 的 identity 相关字段补全。  
2. **Mock**：projectDetailMock 中 recentTasks、workflowTasks.recentTasks、results.feeds 部分数据带 identity；taskSkeleton 或 taskMock 带 identityName；terminal 预留 primaryIdentityId。  
3. **展示**：项目详情流程与任务 Tab 表格加列「使用身份」；概览最近任务加列；结果 Tab 加列或说明；任务详情（抽屉）增加「本任务使用的身份」区块；任务中心表格加列；终端占位「绑定身份」。  
4. **创建**：项目详情流程与任务 Tab「创建任务」按钮 + 抽屉，Identity 选择（来源 data.identities，默认 defaultIdentityId）+ 占位提交。  
5. **自检**：任务创建可选身份、任务详情与列表可见身份、结果与最近任务可带身份标签、终端有绑定位占位；无复杂逻辑、结构清晰、可扩展。

---

请确认是否按此方案执行；确认后再进入具体改动与实现。
