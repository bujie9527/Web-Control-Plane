# Identity 1.0 Phase B 实施计划：项目绑定 Identity

## 一、本阶段目标理解

- **目标**：让 Project 正式支持 Identity 绑定，Identity 从资源库进入业务使用场景；用户能在项目详情中看到、管理「本项目用哪些身份」以及「默认身份」。
- **不做的**：任务创建选 Identity、任务详情展示 Identity、终端绑定 Identity 的完整实现；本阶段仅做「项目 ↔ Identity」绑定与项目详情内的展示与管理骨架。
- **产品感**：身份配置在项目详情中要显性、独立，能传达「项目支持身份矩阵/账号矩阵管理」的能力，而不是藏在表单角落。

---

## 二、实现方案总览

| 维度 | 方案 |
|------|------|
| 关系模型 | 项目可绑定多个 Identity，可设置一个默认 Identity；在项目详情数据中增加「已绑定身份列表」与「默认身份 ID」。 |
| 项目详情接入 | **新增「身份配置」页签**，与概览、目标、渠道、Agent团队、终端等并列；在「概览」页增加「身份摘要」Card。 |
| 摘要区 | 在项目详情顶部 summary 条中增加「身份数」与「默认身份」两项（可选，与现有渠道数、Agent Team、终端数一致）。 |
| 数据来源 | projectDetail mock 按 projectId 返回绑定的 Identity 列表及 defaultIdentityId；列表项含 identityId、name、type、平台摘要、isDefault；service 层不新增单独接口，仍由 fetchProjectDetailWorkbench 一次拉取整份工作台数据。 |
| 页面逻辑 | 身份配置 Tab 只做展示 + 占位操作（添加绑定、解绑、设为默认、查看详情）；具体添加/解绑/设默认的接口与表单可在本阶段用 mock 占位，或做最小可写 mock（内存更新）。 |

---

## 三、项目详情页如何接入「身份配置」

### 3.1 新增页签（推荐）

- 在 **ProjectDetailWorkbench** 的 `TAB_KEYS` 中新增 `'identities'`，标签为 **「身份配置」**。
- 页签顺序建议：放在 **「Agent团队」之后、「终端分配」之前**（身份与表达/账号强相关，与 Agent、终端相邻便于理解）。  
  即：概览 → 目标与KPI → 渠道配置 → Agent团队 → **身份配置** → 终端分配 → 流程与任务 → 结果反馈 → 项目设置。
- 新增 Tab 组件：**IdentityConfigTab**，接收 `data: ProjectDetailData`，从 `data.identities` 读取已绑定列表与默认身份，渲染「身份配置」页签内容。

### 3.2 身份配置页签内容结构

1. **说明 Card（可选）**  
   - 简短文案：本项目绑定的身份将用于任务执行时的「以谁的身份」表达与发布，支持多身份与默认身份；后续任务创建时可选择本次使用的身份。
2. **已绑定身份列表**  
   - 表格或卡片列表，列/项：身份名称、身份类型、适用平台摘要、是否默认、操作（查看详情、设为默认、解绑）。
3. **默认身份**  
   - 列表中用 StatusTag 或「默认」标签标出；若未设置默认，可文案提示「请从已绑定身份中设置一个默认身份」。
4. **添加绑定入口**  
   - 主按钮「添加身份」：点击可打开抽屉/弹窗占位（本阶段可仅占位，或做「从身份库选择」的简单列表选择 + mock 绑定）。
5. **解绑入口**  
   - 行操作「解绑」：确认后从 mock 中移除该项目对该 Identity 的绑定（若做可写 mock）。
6. **查看身份详情**  
   - 行操作「查看」：跳转至 `/tenant/agents/identities/:id`。
7. **绑定说明与业务提示**  
   - 在页签顶部或说明 Card 中强调：身份用于统一表达口径、区分账号、支撑矩阵账号管理。

### 3.3 概览页增强

- 在 **OverviewTab** 中增加一个 **Card「身份摘要」**（或「项目身份」）：
  - **已绑定身份数量**：如「3 个身份」。
  - **默认身份**：默认身份名称，若无则「未设置默认身份」。
  - **适用平台摘要**：从已绑定身份的 platformAdaptations 聚合为「微信、X、抖音」等简短文案。
- 可提供「前往身份配置」链接，跳转到同一项目详情页并切换 activeTab 为 `identities`（或直接使用页内锚点/同一页签切换）。

### 3.4 顶部摘要条（可选）

- 在 **ProjectDetailWorkbench** 的 summary 区域增加两项：
  - **身份数**：如「3 个身份」。
  - **默认身份**：默认身份名称或「未设置」。
- 与现有「渠道数」「Agent Team」「终端数」并列，保持风格一致。

---

## 四、默认身份的展示与交互

### 4.1 展示

- **身份配置 Tab**：列表中每行/每卡标明「默认」或「设为默认」；仅允许一个默认，用 Tag/徽标区分。
- **概览**：身份摘要 Card 中单独一行「默认身份：xxx」。
- **顶部摘要条**：若增加则与渠道数、终端数同排展示「默认身份：xxx」。

### 4.2 交互

- **设为默认**：行操作「设为默认」→ 调用 service/mock 的「设置项目默认身份」→ 将当前项目的 defaultIdentityId 设为该 identityId，并刷新项目详情数据（或本地 state 更新）。
- **添加身份后**：若当前无默认身份，可提示「是否设为首个绑定身份为默认」；或由用户稍后在列表中「设为默认」。
- 本阶段若不做可写 mock，则「添加绑定」「解绑」「设为默认」可为占位按钮 + 提示「将在后续开放」。

---

## 五、需要新增或修改的 Schema / Service / Mock 范围

### 5.1 Schema（projectDetail.ts）

- **ProjectDetailSummary** 扩展（用于摘要条与概览）：
  - `identityCount?: number`
  - `defaultIdentityName?: string`
  - `identityPlatformSummary?: string`（如「微信、X、抖音」）
- **ProjectIdentityBindingItem**（新建）：
  - `identityId: string`
  - `name: string`
  - `type: string`（或 IdentityType）
  - `platformLabels?: string`
  - `isDefault: boolean`
- **ProjectDetailData** 扩展：
  - `identities: { list: ProjectIdentityBindingItem[]; defaultIdentityId?: string }`

### 5.2 Mock（projectDetailMock.ts + 可选 projectIdentityMock）

- **方案 A（推荐）**：在 **projectDetailMock** 内维护「项目 ↔ 身份」绑定关系：
  - 定义 `projectIdentityBindings: Record<string, { identityIds: string[]; defaultIdentityId?: string }>`（按 projectId）。
  - `getProjectDetail(projectId)` 中：
    - 根据 projectId 取 identityIds、defaultIdentityId；
    - 调用 identityMock.getIdentityById 或批量取 identity 列表，组装为 `ProjectIdentityBindingItem[]`，并填入 summary 的 identityCount、defaultIdentityName、identityPlatformSummary。
  - 若需「添加绑定/解绑/设默认」的可写能力，可在 projectDetailMock 中暴露 `bindIdentity(projectId, identityId)`、`unbindIdentity(projectId, identityId)`、`setDefaultIdentity(projectId, identityId)`，并更新内存中的 projectIdentityBindings；页面通过 projectDetailService 或新增 projectIdentityService 调用（见下）。
- **方案 B**：单独 **projectIdentityMock.ts** 维护绑定表，projectDetailMock 调用其获取 list 与 default，再拼入 ProjectDetailData。  
  两种方式二选一，以「不破坏现有 projectDetailMock 主流程、易读」为准。

### 5.3 Service

- **projectDetailService**：仍只暴露 `fetchProjectDetailWorkbench(projectId)`；内部调用的 getProjectDetail 已包含 identities，无需改接口签名。
- **可选**：若本阶段做「添加/解绑/设默认」的可写操作，可新增 **projectIdentityService**（或 projectIdentityBindingService）：  
  `bindIdentity(projectId, identityId)`、`unbindIdentity(projectId, identityId)`、`setDefaultIdentity(projectId, identityId)`，内部调 mock 或后续 API；  
  身份配置 Tab 的「添加」「解绑」「设为默认」则调用该 service，再刷新 projectDetail（重新 fetch 或本地更新 data.identities）。

### 5.4 身份库侧

- **identityService**：已有 getIdentityList、getIdentityDetail，无需改。
- **添加绑定时**：若做「从身份库选择」的抽屉，可复用 getIdentityList（传入当前 tenantId），过滤掉已绑定项，选择后调用 bindIdentity(projectId, identityId)。

---

## 六、涉及文件范围

| 类型 | 路径 | 变更说明 |
|------|------|----------|
| Schema | `modules/tenant/schemas/projectDetail.ts` | 新增 ProjectIdentityBindingItem；ProjectDetailSummary 增加 identityCount、defaultIdentityName、identityPlatformSummary；ProjectDetailData 增加 identities |
| Mock | `modules/tenant/mock/projectDetailMock.ts` | 维护 projectId → identityIds/defaultIdentityId；getProjectDetail 中组装 identities 及 summary 中身份相关字段；可选可写方法 bind/unbind/setDefault |
| Service | `modules/tenant/services/projectDetailService.ts` | 无签名变更；若做可写则可选新增 projectIdentityService |
| 项目详情主页面 | `modules/tenant/pages/ProjectDetail/ProjectDetailWorkbench.tsx` | TAB_KEYS 增加 'identities'，TAB_LABELS 增加「身份配置」；summary 区可选增加身份数、默认身份；content 区渲染 IdentityConfigTab |
| 新 Tab | `modules/tenant/pages/ProjectDetail/tabs/IdentityConfigTab.tsx` | 新建：说明、已绑定列表、默认标记、添加/解绑/查看入口、绑定说明 |
| 概览 Tab | `modules/tenant/pages/ProjectDetail/tabs/OverviewTab.tsx` | 新增「身份摘要」Card：已绑定数量、默认身份、适用平台摘要、可选「前往身份配置」 |
| 样式 | `modules/tenant/pages/ProjectDetail/tabs.module.css` 或 IdentityConfigTab 内联/独立 css | 按需增加列表、标签、按钮样式，与现有 Tab 一致 |

**不修改**：Identity 列表/详情、identityService/identityRepository、路由与菜单；仅项目详情侧扩展。

---

## 七、风险点与注意事项

1. **租户隔离**：绑定关系 mock 按 projectId 维护时，需保证 identity 属于同一 tenant（project 的 tenantId 与 identity 的 tenantId 一致）；列表过滤与校验在 mock 或 service 层做，页面不直写 tenantId。
2. **默认身份唯一性**：一个项目仅能有一个 defaultIdentityId；设默认时 mock 需覆盖写入，避免出现两个默认。
3. **与 Identity 资源一致**：ProjectIdentityBindingItem 的 name/type/platformLabels 应从 identityMock 实时取，避免在绑定表里冗余一份后与身份库不一致；mock 内用 identityIds 查 identity 组装 list。
4. **产品感**：身份配置页签的文案与布局要突出「身份矩阵/账号矩阵」对项目的重要性，避免被当成次要配置。
5. **扩展性**：schema 与 mock 结构要为「任务选 Identity」「结果回写带 Identity」预留；本阶段仅做项目绑定与展示，不牵动任务/结果表结构。
6. **先读后写**：建议先实现「只读展示」（getProjectDetail 拼 identities，身份配置 Tab + 概览身份摘要 + 摘要条），再视需要加「添加绑定/解绑/设默认」的可写 mock 与按钮。

---

## 八、实施步骤建议

1. **Schema**：在 projectDetail.ts 中新增 ProjectIdentityBindingItem，扩展 ProjectDetailSummary、ProjectDetailData。
2. **Mock**：在 projectDetailMock 中增加 projectId → identityIds/defaultIdentityId 的映射，在 getProjectDetail 中组装 identities 及 summary 的身份字段；为部分项目预置 1～2 个绑定身份与默认。
3. **身份配置 Tab**：新建 IdentityConfigTab，只读展示已绑定列表、默认标记、查看详情链接；添加/解绑/设为默认可为占位按钮。
4. **项目详情主页面**：接入 identities 页签与 IdentityConfigTab；摘要条可选增加身份数、默认身份。
5. **概览**：OverviewTab 增加「身份摘要」Card。
6. **可写（可选）**：projectDetailMock 增加 bind/unbind/setDefault，IdentityConfigTab 中「添加」「解绑」「设为默认」调用后刷新详情数据。

---

请确认是否按此方案执行；确认后可先做只读展示（步骤 1～5），再决定是否在本阶段做可写绑定（步骤 6）。
