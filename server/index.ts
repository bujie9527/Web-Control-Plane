/**
 * LLM API 服务（Phase 17.7a）
 * POST /api/llm/execute
 * POST /api/llm/test-provider
 * 流程规划持久化 API（批次 1）：/api/planning-sessions, /api/planning-drafts, /api/planning-messages
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { registerLLMRoutes } from './routes/llmRoutes'
import { registerPlanningRoutes } from './routes/planningRoutes'
import { registerCredentialRoutes } from './routes/credentialRoutes'
import { registerSystemConfigRoutes } from './routes/systemConfigRoutes'
import { registerRuntimeRoutes } from './routes/runtimeRoutes'
import { registerProjectWorkbenchRoutes } from './routes/projectWorkbenchRoutes'
import { registerFacebookRoutes } from './routes/facebookRoutes'
import { registerSystemTerminalRoutes } from './routes/systemTerminalRoutes'
import { registerAgentFactoryRoutes } from './routes/agentFactoryRoutes'
import { registerProjectRoutes } from './routes/projectRoutes'
import { registerTenantRoutes } from './routes/tenantRoutes'
import { registerIdentityTerminalRoutes } from './routes/identityTerminalRoutes'
import { registerWorkflowRoutes } from './routes/workflowRoutes'
import { registerDataSourceRoutes } from './routes/dataSourceRoutes'
import { registerMessagePipelineRoutes } from './routes/messagePipelineRoutes'
import { registerSchedulerRoutes } from './routes/schedulerRoutes'
import { registerReportRoutes } from './routes/reportRoutes'

const app = express()
const PORT = process.env.LLM_API_PORT ? Number(process.env.LLM_API_PORT) : 3001

app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

const authRoutes = (await import('./auth/authRoutes')).default
app.use('/api/auth', authRoutes)

registerLLMRoutes(app)
registerPlanningRoutes(app)
registerSystemConfigRoutes(app)
registerRuntimeRoutes(app)
registerProjectWorkbenchRoutes(app)
registerFacebookRoutes(app)
registerSystemTerminalRoutes(app)
registerProjectRoutes(app)
registerTenantRoutes(app)
registerIdentityTerminalRoutes(app)
registerWorkflowRoutes(app)
registerDataSourceRoutes(app)
registerMessagePipelineRoutes(app)
registerSchedulerRoutes(app)
registerReportRoutes(app)

registerCredentialRoutes(app)
registerAgentFactoryRoutes(app)

if (process.env.NODE_ENV === 'production') {
  const { mountStaticFiles } = await import('./staticServe')
  mountStaticFiles(app)
}

app.listen(PORT, async () => {
  try {
    const { seedAgentTemplatesIfEmpty, seedAgentTemplateBaselines } = await import('./domain/agentTemplateSeed')
    const { seedSkillsIfEmpty, seedSkillBaselines, migrateSkillExecutionTypeToExternalApi } = await import('./domain/skillSeed')
    const { seedLLMConfigIfEmpty } = await import('./domain/llmConfigSeed')
    const { seedSystemTerminalTypesIfEmpty } = await import('./domain/systemTerminalTypeSeed')
    const { seedDataSourceProvidersIfEmpty } = await import('./domain/dataSourceSeed')
    const { seedAdminUserIfMissing } = await import('./auth/userSeed')
    await seedAgentTemplatesIfEmpty()
    await seedAgentTemplateBaselines()
    await seedSkillsIfEmpty()
    await seedSkillBaselines()
    await migrateSkillExecutionTypeToExternalApi()
    await seedLLMConfigIfEmpty()
    await seedSystemTerminalTypesIfEmpty()
    await seedDataSourceProvidersIfEmpty()
    await seedAdminUserIfMissing()
    const { startSchedulerEngine } = await import('./domain/schedulerEngine')
    startSchedulerEngine()
  } catch (e) {
    // eslint-disable-next-line no-console -- startup seed may fail if DB not ready
    console.warn('[seed]', e)
  }
  // eslint-disable-next-line no-console -- startup message
  console.log(`[Phase 17.7a] LLM API 服务已启动: http://localhost:${PORT}`)
})
