# AI Work Control Center — 当前代码结构、问题与后续目标

> 供产品策划确认后，再进入开发实施

---

## 一、当前代码结构总结

### 1.1 三控制台结构（已落地）

| Shell | 路由前缀 | 核心模块 | 状态 |
|-------|----------|----------|------|
| **PlatformShell** | `/platform` | 租户管理、平台用户、配额、模板、审计、设置 | 骨架完成 |
| **SystemShell** | `/system` | Agent 模板工厂、Skill 工厂、流程模板工厂、流程规划、流程运行、LLM 配置中心 | 核心能力已实现 |
| **TenantShell** | `/tenant` | 工作台、项目、任务、流程、Agent 中心、Skills、终端、分析、系统管理 | 部分真实数据、部分骨架 |

### 1.2 分层结构（已落地）

```
page → service → repository → schema
```

- **platform** 模块：AgentTemplate、Skill、WorkflowTemplate、LLM 配置等具有完整的 schema / mock / repository / service。
- **tenant** 模块：Project、Identity、Workflow、Terminal、Task 等部分有完整数据层，部分仍依赖 `skeletonMock`。

### 1.3 已具备真实数据能力的模块

| 模块 | 数据源 | 说明 |
|------|--------|------|
| 项目中心 | projectService / projectMock | 列表、详情、创建、编辑、删除 |
| 项目详情工作台 | projectDetailMock | 多 Tab 完整数据 |
| 身份库 | identityService / identityMock | 列表、详情、CRUD |
| Agent 中心 | agentTemplateService（平台） | 只读展示平台 Agent 资产 |
| Agent 模板工厂 | agentTemplateMock | 列表、新建、编辑、复制、状态、批量删除 |
| Skill 工厂 | skillService / skillMock | 列表、新建、编辑、详情、引用检查 |
| Skills 能力库（租户） | skillService（平台） | 只读展示已启用 Skill |
| 流程模板 | workflowTemplateFactoryService | 平台/租户模板管理 |
| 流程规划 | workflowPlanningSessionMock | 会话、草案、消息 |
| 流程运行 | workflowRuntimeService | 实例列表与详情 |
| LLM 配置中心 | llmProvider/ModelConfig/Credential | Provider、ModelConfig、凭证管理 |
| 终端中心 | terminalService / terminalMock | 已接入真实 Terminal 列表（本次完成） |
| 任务中心 | taskCenterService / taskCenterMock | 已接入真实任务数据（本次完成） |

### 1.4 仍为骨架/占位的模块

| 模块 | 现状 | 数据来源 |
|------|------|----------|
| **数据分析** | 静态占位 | analyticsSkeleton |
| **系统管理（租户）** | 静态占位 | systemSettingsSkeleton |
| **TaskCenter 异常/已完成** | 文案占位 | 未实现列表 |
| **技能测试台** | 文案说明 | 无执行能力 |
| **终端配置/分配** | 无入口 | 终端仅展示，无 CRUD |

---

## 二、当前存在的问题

### 2.1 工程层面

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| TypeScript 类型检查存在报错 | 中 | 如未使用的 `React` 导入、EmptyState/StatusTag/Table 等组件 props 类型不匹配、部分 mock 与 schema 不一致 |
| ESLint 0 warning 目标未完全达成 | 低 | 需配合 typecheck 修复一并清理 |
| Mock 数据与 schema 偶有不一致 | 低 | 如 LLMCredential 的 encryptedSecret/secretMasked 等 |

### 2.2 架构与规范层面

| 问题 | 说明 |
|------|------|
| 部分 tenant 模块依赖 platform mock | referenceCheckService 等会跨模块引用，需注意循环依赖与边界 |
| 租户 tenantId 传递方式不统一 | 有的从 useAuth 取，有的用默认 't1'，缺少统一约定 |
| skeletonMock 残留 | analyticsSkeleton、systemSettingsSkeleton 仍被使用，未迁移到真实 service |

### 2.3 功能与体验层面

| 问题 | 说明 |
|------|------|
| 任务中心「异常/已完成」仅为占位 | 无列表、无筛选 |
| 数据分析、系统管理为纯静态 | 无法反映真实业务数据 |
| 终端中心无配置入口 | 仅展示，无法新建/编辑/分配终端 |
| Skill 测试台无执行能力 | 仅说明文案 |
| 项目创建 Step 4 终端选项来源 | 注释为「来自 skeleton」，与 terminalMock 未打通 |

### 2.4 业务闭环层面

| 缺口 | 说明 |
|------|------|
| 结果汇报视图 | 原则 7「结果必须可向上汇报」尚未有专门汇报页 |
| SOP → Workflow 真实解析 | Planner 真实 LLM 接入有基础，SOP 解析到可执行流程的完整链路待验证 |
| Agent 执行 → Terminal 操作 | 执行层仅为 mock，无真实终端操作 |
| 任务与流程实例的强绑定 | TaskCenter 与 WorkflowInstance 的数据关系可进一步理清 |

---

## 三、既往系统开发目标（摘要）

依据 `docs/architecture/` 与路线图：

- **第一阶段目标**：控制平面骨架、mock-first、双后台分离、标准化页面与分层。
- **第二阶段方向**：真实权限、数据库持久化、Workflow 增强、Agent Team 配置、Skill 测试台、Terminal 接入层、任务执行状态机、结果分析回流。

**七条核心原则**（开发红线）：

1. 项目是一切执行的起点  
2. 项目类型决定配置包  
3. Identity 属于项目层，不是 Agent 的属性  
4. Agent = LLM + Skills，Skills 与 OpenClaw 兼容  
5. 终端是执行边界  
6. SOP → Workflow 转换是核心 AI 价值点  
7. 结果必须可向上汇报  

---

## 四、后续修复目标（建议优先级）

### P0：工程与一致性修复

1. **TypeScript 与 ESLint 清零**
   - 清理未使用的 React 导入
   - 修正 EmptyState、StatusTag、Table 等组件的 props 类型
   - 统一 mock 与 schema 的字段定义
   - 目标：`npm run typecheck` 与 `npm run lint` 通过

2. **租户 tenantId 使用规范**
   - 明确：租户页面一律从 `useAuth().user?.tenant?.tenantId` 获取
   - 无 tenant 时采用明确降级策略（如只读提示或跳转），避免隐式默认 `'t1'`
   - 在 1–2 个典型页面落地，形成可复用模式

3. **skeletonMock 收敛**
   - 移除不再使用的 skeleton 导出（如 taskSkeleton、terminalSkeleton、agentSkeleton 中的 teams/roleTemplates）
   - 保留 analyticsSkeleton、systemSettingsSkeleton 直至对应模块接入真实数据

### P1：功能补齐与体验优化

4. **数据分析页接入真实数据**
   - 新建 analyticsService，从 projectMock、taskCenterMock、workflowInstanceMock 等聚合数据
   - 实现「数据总览」「项目分析」等 Card 的真实统计
   - 任务/Agent/Skill 分析可先保留占位，注明后续迭代

5. **系统管理（租户）接入真实数据**
   - 新建 memberService、roleService、auditService（或复用现有）
   - 成员管理、角色权限、审计日志使用真实 mock 数据
   - 菜单权限、工作区设置可保留占位

6. **任务中心异常/已完成列表**
   - 在 taskCenterMock 中补充异常、已完成任务
   - TaskCenter 增加对应 Tab 或 Card 展示

7. **项目创建 Step 4 终端选项**
   - 终端选项从 terminalService / terminalMock 按 tenantId 获取
   - 替换「来自 skeleton」的占位逻辑

### P2：业务闭环与价值验证

8. **结果汇报视图**
   - 在项目详情或独立页面增加「结果反馈」/「汇报视图」
   - 展示：交付物完成情况、目标达成指标、各身份/终端产出摘要
   - 优先 mock 数据，结构可扩展

9. **终端配置与管理入口**
   - 终端中心增加「新建终端」「编辑」「分配身份」等入口（可先 mock）
   - 明确 Terminal 与 Identity 的绑定关系及展示方式

10. **Skill 测试台能力**
    - 选定 Agent + Skill + 输入，调用 `/api/llm/execute` 或等价接口
    - 展示执行结果、耗时、错误信息
    - 可作为后续与 OpenClaw 联动的验证入口

---

## 五、后续开发目标（按阶段）

### 阶段 A：修复与一致性（建议 1–2 周）

- 完成 P0 全部项
- 完成 P1 中的 4、5、6、7（数据分析、系统管理、任务中心补全、项目创建终端选项）
- 验收：typecheck/lint 通过，skeleton 依赖收敛，核心租户页无显式 skeleton

### 阶段 B：汇报与终端（建议 1–2 周）

- 完成 P2 中的 8、9（结果汇报视图、终端配置入口）
- 验收：项目结果可展示，终端可配置（mock 层）

### 阶段 C：Skill 测试与执行验证（建议 2 周+）

- 完成 P2 中的 10（Skill 测试台）
- 验证 Planner → Workflow → Agent → Skill → LLM 调用链
- 验收：可在 UI 完成一次「选 Agent → 选 Skill → 填输入 → 看输出」的闭环

### 阶段 D：第二阶段的衔接（按原路线图）

- 真实权限体系
- 真实数据库与数据持久化
- Workflow 逻辑增强
- Agent Team 配置增强
- Terminal 接入层（真实第三方）
- 任务执行状态机
- 结果分析回流

---

## 六、需策划确认的决策点

1. **优先级确认**：P0 / P1 / P2 及阶段 A/B/C 的优先级是否与当前产品节奏一致？  
2. **数据分析范围**：第一阶段「数据分析」希望做到什么深度？仅总览+项目分析，还是包含任务/Agent/Skill 分析？  
3. **系统管理范围**：成员、角色、审计是否要在本阶段实现完整 CRUD，还是只读展示即可？  
4. **结果汇报形态**：汇报视图是以项目详情内的 Tab 为主，还是需要独立「汇报中心」页面？  
5. **Skill 测试台范围**：是否将 Skill 测试台作为下一阶段重点演示能力，优先级如何？  

---

**文档版本**：v1  
**生成日期**：基于 2025-03 代码结构与架构文档整理  
**用途**：供产品策划确认后，再拆分为具体开发任务并实施
