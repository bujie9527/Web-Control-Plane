# Identity Phase B 结构化自检报告

## 说明

自检时对当前代码库逐项核对后发现：**Phase B（项目绑定 Identity）尚未在代码中落地**。以下按「若已完成 Phase B 时应满足」的维度做检查，并标注当前实际状态与后续建议。

---

## 一、逐项检查结论

### 1. 项目是否已支持绑定多个 Identity

**当前状态：否。**

- **应有**：ProjectDetailData 中存在 `identities.list: ProjectIdentityBindingItem[]`，mock 按 projectId 维护 identityIds，getProjectDetail 返回多条绑定身份。
- **实际**：`projectDetail.ts` 中无 `identities`、无 `ProjectIdentityBindingItem`；`projectDetailMock.ts` 无项目↔身份绑定关系，getProjectDetail 返回结构中无 identities。
- **结论**：需在 Phase B 实施时补齐 schema + mock 的「项目绑定多 Identity」结构。

---

### 2. 项目是否支持默认 Identity

**当前状态：否。**

- **应有**：ProjectDetailData.identities 含 `defaultIdentityId`；summary 或 identities 中有 defaultIdentityName；列表/概览中可展示「默认身份」。
- **实际**：无 defaultIdentityId、无默认身份相关字段与展示。
- **结论**：需在 Phase B 中增加 defaultIdentityId 及默认身份展示与（可选）设默认交互。

---

### 3. 项目详情页中的「身份配置」是否结构清晰

**当前状态：未存在。**

- **应有**：项目详情工作台新增「身份配置」页签；独立 Tab 组件（如 IdentityConfigTab），含：已绑定列表、默认标记、添加绑定/解绑/查看详情入口、绑定说明与业务提示。
- **实际**：ProjectDetailWorkbench 的 TAB_KEYS 仍为 8 项（overview、goals、channels、agentTeam、terminals、workflowTasks、results、settings），无 `identities`；无 IdentityConfigTab 文件。
- **结论**：需在 Phase B 中新增「身份配置」页签及 IdentityConfigTab，并按计划文档保证结构清晰、业务感明确。

---

### 4. 项目概览中是否已经体现 Identity 摘要

**当前状态：否。**

- **应有**：OverviewTab 中有「身份摘要」Card：已绑定身份数量、默认身份、适用平台摘要；可选「前往身份配置」入口。
- **实际**：OverviewTab 仅包含「项目当前状态与关键指标」「最近任务」「预警与待办」三个 Card，无身份相关区块。
- **结论**：需在 Phase B 中在概览页增加身份摘要 Card。

---

### 5. 是否让 Identity 真正进入了项目业务上下文

**当前状态：否。**

- **应有**：在项目详情（摘要条、概览、身份配置页签）中可见、可管理「本项目用哪些身份」「默认身份是谁」，形成「身份矩阵/账号矩阵」的项目级能力感知。
- **实际**：Identity 仅存在于身份库（列表/详情），项目侧无任何 Identity 展示或绑定入口。
- **结论**：Phase B 落地后，Identity 才会从资源库进入项目业务上下文；当前尚未实现。

---

### 6. 是否保持了项目详情页的工作台感，没有破坏原有结构

**当前状态：不适用（Phase B 未做）。**

- **若已做**：应检查新增「身份配置」页签与身份摘要是否与现有 8 个页签、摘要条、Card 风格一致；是否仍为「工作台型详情」而非单表单页。
- **建议**：实施 Phase B 时保持现有 TAB_KEYS 顺序与样式，仅新增一页签一 Tab 组件，概览仅新增一 Card，不删改原有 Tab 结构。

---

### 7. 是否符合统一 UI 与模块边界规范

**当前状态：不适用（Phase B 未做）。**

- **若已做**：身份配置 Tab 应复用 Card、Table、StatusTag、EmptyState、listPageStyles 等；数据来自 projectDetailService/projectDetailMock，页面不直连 identityMock；projectDetail 相关类型仅在 schemas/projectDetail 与 mock/service 内扩展。
- **建议**：实施时遵守 05 页面规范与 03 模块边界，身份配置仅消费 ProjectDetailData，不把 Identity 业务逻辑写进项目页面组件内部。

---

## 二、本阶段完成清单（Phase B 实施后应达到）

| 类别 | 项 | 当前状态 | 说明 |
|------|-----|----------|------|
| Schema | ProjectIdentityBindingItem、identities、summary 身份字段 | ❌ 未做 | 需在 projectDetail.ts 中新增并接入 ProjectDetailData |
| Mock | projectId → identityIds/defaultIdentityId、getProjectDetail 拼 identities | ❌ 未做 | 需在 projectDetailMock 中维护绑定关系并组装 list |
| 项目详情 | 新增「身份配置」页签、IdentityConfigTab | ❌ 未做 | 需在 Workbench 与 tabs 中新增 |
| 概览 | 身份摘要 Card（数量、默认身份、平台摘要） | ❌ 未做 | 需在 OverviewTab 中新增 |
| 摘要条 | 身份数、默认身份（可选） | ❌ 未做 | 可选，与渠道数/终端数并列 |
| 多 Identity / 默认 Identity | 项目支持多绑定 + 一个默认 | ❌ 未做 | 依赖 schema + mock 落地 |

---

## 三、需要微调的点（Phase B 实施时建议注意）

1. **Schema 与 mock 同步**：ProjectDetailSummary 扩展字段（identityCount、defaultIdentityName、identityPlatformSummary）与 getProjectDetail 中组装逻辑保持一致，避免类型与数据不一致。
2. **默认身份唯一性**：mock 或 service 层保证每个项目仅有一个 defaultIdentityId。
3. **租户隔离**：绑定关系仅允许同租户的 project 与 identity；校验放在 mock/service。
4. **产品感**：身份配置页签的说明文案要突出「身份矩阵/账号矩阵」对项目的重要性，避免被弱化为次要配置。
5. **可写操作**：若先只做只读展示，则「添加绑定」「解绑」「设为默认」可为占位按钮 + 提示，后续再接可写 mock 与 projectIdentityService。

---

## 四、是否可以进入 Phase C

**结论：建议先完成 Phase B，再进入 Phase C。**

- 当前代码中**未实现**项目绑定 Identity（无 schema 扩展、无 mock 绑定关系、无身份配置页签、无概览身份摘要）。
- Phase C 通常为「任务创建时选择 Identity、任务详情展示 Identity、结果回写保留 Identity」等，依赖「项目已支持绑定 Identity」的数据与界面基础；若 Phase B 未落地，Phase C 会缺少项目上下文的 Identity 数据与配置入口。
- **建议顺序**：先按 `docs/identity-phase-b-plan.md` 完成 Phase B（schema、mock、身份配置页签、概览身份摘要、可选摘要条与可写占位），再做一次 Phase B 自检；通过后再进入 Phase C。

---

## 五、若已完成 Phase B 后的自检要点（供后续验收用）

完成 Phase B 实施后，可按以下要点再次自检：

1. **多 Identity**：项目详情 data.identities.list 能展示多条，mock 中至少一个项目绑定 2 个以上身份。
2. **默认 Identity**：有 defaultIdentityId 及默认身份展示（身份配置 Tab、概览身份摘要、可选摘要条）。
3. **身份配置页签**：独立页签、已绑定列表、默认标记、添加/解绑/查看入口、绑定说明齐全。
4. **概览身份摘要**：Card 中有数量、默认身份、平台摘要。
5. **业务上下文**：在项目详情中能明确感知「本项目用哪些身份、默认是谁」，Identity 不再仅停留在身份库。
6. **工作台感**：未删减原有页签与结构，仅新增一页签一 Card，风格与现有一致。
7. **规范**：符合 05/03，复用通用组件，数据经 service/mock，无页面直连 identityMock 或把复杂逻辑写在页面里。

完成上述并修正「需要微调的点」后，即可视为可进入 Phase C。
