# 待修复/补充问题清单与下阶段开发计划

> 不写代码，仅列出问题与建议计划，供策划与开发对齐。

---

## 一、待修复与补充的问题

### 1.1 工程与质量（建议优先）

| 序号 | 问题 | 说明 | 建议优先级 |
|------|------|------|------------|
| E1 | **TypeScript 报错未清零** | 如：大量未使用的 `import React`、部分未使用变量、Table/PageContainer/WorkflowRuntime 等处的类型不匹配（泛型、rowKey、children）、WorkflowPlanningList 的 status/sourceType 类型、WorkflowPlanningWorkbench 的 session 可能为 null、WorkflowRuntimeDetail 的 selectedTemplateNode 使用顺序与 executionSummary 等字段、planningDraftToTemplateConverter / workflowTemplatePublishService / workerAgentExecutionService 等与 schema 不一致。 | P0 |
| E2 | **ESLint 未完全 0 warning** | 需配合 typecheck 修复一并清理未使用导入与变量。 | P0 |
| E3 | **Table / EmptyState 中 React 类型** | Table 已移除 `import React` 但仍使用 `React.ReactNode`，若 TS 严格模式下报错，需改为 `import type { ReactNode } from 'react'`。 | P0（按需） |
| E4 | **skeletonMock 死代码** | `analyticsSkeleton`、`systemSettingsSkeleton` 已无引用（AnalyticsPage/SystemSettings 已接真实 service），可移除或保留作后备；其他未再使用的 skeleton 导出（如 taskSkeleton、terminalSkeleton、agentSkeleton 中 teams/roleTemplates）可一并收敛。 | P1 |

### 1.2 架构与规范

| 序号 | 问题 | 说明 | 建议优先级 |
|------|------|------|------------|
| A1 | **租户 tenantId 不统一** | 有的从 `useAuth().user?.tenant?.tenantId` 取，有的写死 `'t1'`，缺少统一约定与无 tenant 时的降级策略（只读提示/跳转）。 | P1 |
| A2 | **跨模块引用边界** | tenant 侧 referenceCheckService 等依赖 platform mock，需注意循环依赖；长期建议通过 API/服务边界解耦。 | P2 |
| A3 | **projectList 未按租户过滤** | 当前 getProjectList 未传 tenantId，analyticsService 在内存侧 filter；后端接入后需约定 list 是否按租户过滤并统一。 | P2 |

### 1.3 体验与健壮性

| 序号 | 问题 | 说明 | 建议优先级 |
|------|------|------|------------|
| U1 | **异步请求无错误态** | AnalyticsPage、SystemSettings、Step4Resources 等请求失败时仅 `.finally` 关 loading，无 `.catch`、无 Toast 或内联错误提示。 | P1 |
| U2 | **Step4 终端加载无提示** | 进入项目创建 Step4 时终端列表先空后出数，可加简短「加载终端列表中…」提示。 | P2 |
| U3 | **项目详情部分 Tab 的 Table rowKey** | 部分 Tab 使用 `rowKey="id"` 但数据类型未必有 `id`（如 status、identityName），需与 Table 泛型统一，避免 TS 报错。 | P0（随 E1） |

### 1.4 功能与业务闭环

| 序号 | 问题 | 说明 | 建议优先级 |
|------|------|------|------------|
| F1 | **结果汇报视图缺失** | 原则 7「结果必须可向上汇报」尚未有专门汇报页或项目详情内「结果反馈」Tab 的完整结构（交付物完成情况、目标达成、各身份/终端产出）。 | P1 |
| F2 | **终端仅展示无 CRUD** | 终端中心无「新建终端」「编辑」「分配身份」等入口；Terminal 与 Identity 绑定关系需在 UI 可配置与展示。 | P1 |
| F3 | **Skill 测试台无执行能力** | 仅说明文案，无「选 Agent + Skill + 输入 → 调接口 → 看结果」的闭环。 | P2 |
| F4 | **任务与流程实例绑定** | TaskCenter 与 WorkflowInstance 的数据关系可进一步理清并在一处统一（如任务来自实例节点）。 | P2 |
| F5 | **SOP → Workflow 完整链路** | Planner 真实 LLM 接入有基础，从 SOP 解析到可执行流程的端到端验证与发布流程可加强。 | P2 |

---

## 二、下阶段开发计划建议

### 阶段 1：工程清零与体验补强（约 1～2 周）

**目标**：typecheck / lint 通过，核心体验无缺口。

- **1.1** 修复全部 TypeScript 报错（E1、E3、U3）：未使用导入与变量、Table/PageContainer/Workflow 等相关类型、session 可空、WorkflowRuntimeDetail 变量顺序与字段、converter/publish/worker 与 schema 对齐。
- **1.2** 配合完成 ESLint 0 warning（E2）。
- **1.3** 为 AnalyticsPage、SystemSettings、Step4Resources 等增加请求失败时的错误态（U1）：Toast 或内联错误文案 + 可选重试。
- **1.4** skeletonMock 收敛（E4）：移除或标记废弃已无引用的 analyticsSkeleton、systemSettingsSkeleton 等，避免误导后续开发。

**验收**：`npm run typecheck`、`npm run lint` 通过；关键列表/表单页有明确错误提示。

---

### 阶段 2：租户规范与结果汇报（约 1～2 周）

**目标**：租户上下文统一、原则 7 有可展示的汇报能力。

- **2.1** 租户 tenantId 规范（A1）：文档约定「租户页一律从 useAuth 取 tenantId，无 tenant 时明确降级」；在 1～2 个典型页落地并形成可复用模式。
- **2.2** 结果汇报视图（F1）：在项目详情工作台增加「结果反馈」/「汇报视图」Tab（或独立汇报页），展示：交付物完成情况、目标达成指标、各身份/终端产出摘要；先 mock 数据，结构可扩展。
- **2.3** 终端配置入口（F2）：终端中心增加「新建终端」「编辑」「分配身份」等入口（可先 mock），明确 Terminal–Identity 绑定在 UI 的展示与编辑方式。

**验收**：租户页不隐式依赖写死 tenantId；项目可打开汇报视图并看到结构化数据；终端可进行基础配置（mock 层）。

---

### 阶段 3：Skill 测试与执行验证（约 2 周）

**目标**：Skill 测试台可用，执行链可验证。

- **3.1** Skill 测试台（F3）：选定 Agent + Skill + 输入，调用 `/api/llm/execute` 或等价接口，展示执行结果、耗时、错误信息；可作为与 OpenClaw 联动的验证入口。
- **3.2** 任务与流程实例关系（F4）：梳理并在一处统一 TaskCenter 与 WorkflowInstance 的数据来源（如任务即实例节点或与实例强关联），避免两套概念脱节。
- **3.3** SOP → Workflow 链路（F5）：在现有 Planner 基础上，补全从 SOP 输入到草案、校验、发布为模板的端到端演示或文档，便于后续接入真实执行。

**验收**：可在 UI 完成「选 Agent → 选 Skill → 填输入 → 看输出」闭环；任务与实例关系清晰可查。

---

### 阶段 4：与第二阶段路线图衔接

**目标**：为真实权限、持久化、执行层打基础。

- 真实权限体系与 RBAC 落地。
- 真实数据库与 API 替换 mock。
- Workflow 逻辑增强（状态机、重试、审批）。
- Agent Team 配置增强。
- Terminal 接入层（真实第三方）。
- 结果分析回流与报表。

具体拆解可依赖现有 `docs/phase-next-goals-and-fixes.md` 中的阶段 D 与路线图。

---

## 三、优先级与依赖关系简表

| 优先级 | 内容 | 依赖 |
|--------|------|------|
| P0 | TS/ESLint 清零、Table/rowKey 等类型修复 | 无 |
| P1 | 错误态提示、skeleton 收敛、tenantId 规范、结果汇报、终端配置 | 建议在 P0 之后 |
| P2 | Step4 加载提示、跨模块边界、Skill 测试台、任务–实例关系、SOP 链路 | 可并行或排在 P1 之后 |

---

## 四、需策划确认的点

1. **阶段 1 范围**：是否同意优先「工程清零 + 错误态」，再开结果汇报与终端配置？
2. **结果汇报形态**：以项目详情内 Tab 为主，还是需要独立「汇报中心」页面？
3. **终端配置范围**：本阶段仅 mock 级新建/编辑/分配，还是需要预留真实 API 契约？
4. **Skill 测试台**：是否作为阶段 3 的演示重点，优先级是否高于任务–实例关系梳理？
5. **tenantId 降级**：无 tenant（如平台管理员进租户菜单）时，期望行为是只读提示、跳转，还是其他？

---

**文档版本**：v1  
**用途**：待修复/补充问题清单 + 下阶段开发计划，不包含代码实现，确认后可按阶段拆任务实施。
