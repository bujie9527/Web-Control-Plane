# AI Work Control Center — 开发进度日志

> 本文档为动态更新的开发变更日志。每次开发完成后，需在此文档顶部追加新条目。
> Cursor Rule `99-dev-progress-tracking.mdc` 会自动提醒开发者更新此文档。

---

## 更新格式

```markdown
## [YYYY-MM-DD] 变更标题

### 变更内容
- 具体变更项 1
- 具体变更项 2

### 影响范围
- 影响的模块/文件

### 方向调整（如有）
- 策略或架构调整说明

### 代码结构变化（如有）
- 新增/删除/重命名的目录或文件
```

---

## [2026-03-16] 系统文档体系建设与规则清理

### 变更内容
- 新建 `docs/status/` 系列文档：system-architecture.md、codebase-index.md、completed-features.md、product-blueprint.md、CHANGELOG.md
- 合并 68 个 `.cursor/rules/` 为约 17 个精简规则文件
- 归档 40+ 份历史阶段文档至 `docs/archive/`
- 精简 `docs/architecture/` 目录
- 更新 CLAUDE.md 同步新规则引用
- 新建 `99-dev-progress-tracking.mdc` 自动提醒规则

### 影响范围
- `.cursor/rules/` — 规则文件大幅精简
- `docs/` — 文档体系重组
- `CLAUDE.md` — 更新规则引用

### 方向调整
- 建立标准化的开发进度追踪机制，替代此前分散的 phase 自检文档
- 规则文件从 68 个合并为 ~17 个，降低 AI 协作上下文负担

### 代码结构变化
- 新增 `docs/status/` 目录（5 个文件）
- 新增 `docs/archive/` 目录（历史文档归档）
- 删除 `.cursor/rules/` 中 50+ 个旧规则文件
- 新增 `.cursor/rules/99-dev-progress-tracking.mdc`

---

## [2026-03-15] Git 化云端部署

### 变更内容
- 将云端服务器从 tar 上传切换为 Git 化部署
- 配置 GitHub 远程仓库
- 创建标准部署脚本 `scripts/deploy-update.sh`
- 更新部署文档 `docs/deployment/cloud-update-rules.md`

### 影响范围
- `scripts/deploy-update.sh` — 新建
- `docs/deployment/` — 更新
- `.gitignore` / `.gitattributes` — 新建/更新
- 服务器 `/opt/awcc` — 从 tar 目录切换为 Git 仓库

---

## [2026-03-14] Facebook 集成与终端真实化（Phase 17.8）

### 变更内容
- Facebook Pages API 真实接入（OAuth、主页管理、发帖、定时发帖）
- 终端中心真实化（CRUD + 测试连接 + Token 刷新）
- 任务中心真实化
- 平台能力注册与凭证配置
- 回调地址动态生成（不再硬编码 localhost）

### 影响范围
- `server/index.ts` — 新增 Facebook 相关 API
- `server/data/` — Facebook 凭证存储
- `src/modules/tenant/pages/FacebookPageAuth/` — 新增
- `src/modules/tenant/pages/TerminalCenter/` — 真实化
- `src/modules/platform/pages/PlatformCapabilities/` — 新增

---

## [2026-03-13] LLM 运行时切换（Phase 17.7a/17.7b）

### 变更内容
- LLM 调用从前端环境变量模式切换到服务端执行模式
- 新建 serverStoreDb（从 Prisma 读取 LLM 配置）
- Worker Agent 节点执行真实化（内容创作/审核）
- 流程节点执行 API（POST /api/workflow-instances/:id/nodes/:nodeId/execute）

### 影响范围
- `server/llm/` — 执行器重构
- `server/domain/workflowNodeExecutor.ts` — 新增
- `src/modules/tenant/services/workerAgentExecutionService.ts` — 新增

---

## [基线] 系统状态快照

截至 2026-03-16，系统状态：

- **前端**：React 18 + TypeScript + Vite 6，三 Shell 架构
- **后端**：Express.js + Prisma + SQLite，29 个模型，120+ API 端点
- **部署**：Ubuntu + Nginx + PM2 + Certbot，Git 化部署
- **LLM**：OpenAI 通过服务端 Executor 调用
- **集成**：Facebook Pages API 真实接入
- **数据**：主要模块已从 mock 迁移到 Prisma 持久化，少量 mock 残留
