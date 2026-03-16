# Phase 17.7a LLM 运行时切换完成摘要

## 一、目标达成

已将 Planner / Worker 的真实 LLM 调用主链路从前端环境变量模式切换到服务端执行模式。

- ✅ 前端不再依赖 `VITE_OPENAI_API_KEY` 作为正式主路径
- ✅ OpenAI 请求由服务端发起
- ✅ 服务端从 CredentialStore 凭证存储读取密钥（由后台「LLM 凭证」模块录入）
- ✅ Agent 通过 AgentLLMBinding → LLMModelConfig → LLMProvider → Credential 解析所用模型
- ✅ Provider 测试连接与真实执行使用同一套服务端能力

## 二、新增与修改文件

### 新增 Rules

- `.cursor/rules/61-llm-runtime-cutover-rules.mdc`
- `.cursor/rules/62-server-side-credential-rules.mdc`
- `.cursor/rules/63-llm-api-and-provider-test-rules.mdc`

### 新增服务端模块（`server/`）

| 文件 | 职责 |
|------|------|
| `server/index.ts` | Express 入口，`/api/llm/execute`、`/api/llm/test-provider` |
| `server/llm/serverStore.ts` | 服务端数据（Provider、ModelConfig、Binding），密钥从 CredentialStore 读取 |
| `server/llm/llmResolverService.ts` | 解析 agent/modelConfig → 可执行配置 |
| `server/llm/llmExecutorServer.ts` | 执行入口，调 resolver + provider |
| `server/llm/testProviderServer.ts` | 真实 Provider 测试连接 |
| `server/llm/providers/openaiProviderServer.ts` | 服务端 OpenAI 调用 |
| `server/llm/llmApiErrorMapper.ts` | 错误映射为中文 |

### 修改前端

| 文件 | 修改内容 |
|------|----------|
| `src/modules/tenant/services/llmExecutor.ts` | 改为调用 `POST /api/llm/execute`，移除前端 provider 调用 |
| `src/modules/tenant/services/llmProviderService.ts` | `testProviderConnection` 改为调用 `POST /api/llm/test-provider` |
| `src/modules/tenant/services/providers/openaiProvider.ts` | 标记为弃用 |
| `vite.config.ts` | 增加 `/api` 代理到 `http://localhost:3001` |

### 新增配置

- `.env.example`：`OPENAI_API_KEY` 等配置说明
- `package.json`：`dev:api`、`dev:full`、express、cors、tsx、dotenv、concurrently`

## 三、服务端执行链路

```
POST /api/llm/execute
  → llmExecutorServer.executeLLMServer()
  → llmResolverService.resolveByModelConfigId() 或 resolveModelConfigByAgent()
  → serverStore: ModelConfig → Provider → Credential (CredentialStore)
  → openaiProviderServer.callOpenAIServer()
  → OpenAI API
```

## 四、API 说明

### POST /api/llm/execute

**请求体示例：**
```json
{
  "modelConfigId": "llm-openai-main",
  "systemPrompt": "你是 Base Workflow Planner...",
  "userPrompt": "请基于以下会话信息生成流程草案...",
  "outputMode": "json_schema"
}
```

**响应体：**
```json
{
  "success": true,
  "rawText": "...",
  "parsedJson": { "nodes": [...], ... },
  "modelKey": "gpt-4o",
  "provider": "openai",
  "latencyMs": 1200
}
```

### POST /api/llm/test-provider

**请求体：**
```json
{ "providerId": "provider-openai" }
```

**响应体：**
```json
{ "ok": true, "messageZh": "测试连接成功", "latencyMs": 450 }
```

## 五、使用说明

### 开发环境

1. 启动完整开发环境：
   ```bash
   npm run dev:full
   ```
   - Vite 前端：http://localhost:5173
   - LLM API：http://localhost:3001
2. 登录平台后台 → 模型配置中心 → LLM 凭证，创建凭证并填写密钥
3. 前端请求 `/api/*` 通过 Vite proxy 转发到 3001

### 单独启动

- 仅前端：`npm run dev`
- 仅 API：`npm run dev:api`

## 六、Planner / Worker 改造

- `workflowPlannerLLMAdapter.ts`：继续通过 `executeLLM` 调用，底层已切到服务端
- `contentCreatorLLMAdapter.ts`：同上
- `contentReviewerLLMAdapter.ts`：同上

无需修改 Adapter 代码，仅 `llmExecutor` 实现切换。

## 七、当前保留的开发兼容项

- `src/modules/tenant/services/providers/openaiProvider.ts`：已弃用，仅保留历史兼容
- `VITE_OPENAI_API_KEY`：不再作为正式路径

## 八、后续清理建议

1. 确认无引用后删除前端 `openaiProvider.ts`
2. 将 Credential 创建流程与服务端持久化打通（当前密钥来源为 env）
3. 生产环境部署时，将 Vite proxy 替换为 Nginx 等对 `/api` 的反向代理
