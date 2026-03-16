/**
 * LLM API 服务（Phase 17.7a）
 * POST /api/llm/execute
 * POST /api/llm/test-provider
 * 流程规划持久化 API（批次 1）：/api/planning-sessions, /api/planning-drafts, /api/planning-messages
 */
import 'dotenv/config'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import express from 'express'
import cors from 'cors'
import { executeLLMServer } from './llm/llmExecutorServer'
import { testProviderConnection } from './llm/testProviderServer'
import {
  listServerCredentialsForClient,
  createServerCredential,
  updateServerCredential,
  deleteServerCredential,
  getServerCredentialByIdForClient,
} from './data/credentialStore'
import {
  listFacebookPageSummaries,
  getFacebookPageAccessToken,
  revokeFacebookPageCredential,
} from './data/facebookCredentialStore'
import {
  authorizeAndUpsertTerminals,
  getPageAccessTokenByTerminalId,
  refreshTerminalPageToken,
  revokeFacebookCredentialByTerminalId,
} from './services/facebookTerminalBridge'
import {
  getFacebookIntegrationForClient,
  getFacebookIntegrationSecret,
  saveFacebookIntegration,
  DEFAULT_FACEBOOK_SCOPES,
} from './data/platformIntegrationStore'

const app = express()
const PORT = process.env.LLM_API_PORT ? Number(process.env.LLM_API_PORT) : 3001

app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

const authRoutes = (await import('./auth/authRoutes')).default
app.use('/api/auth', authRoutes)

app.post('/api/llm/execute', async (req, res) => {
  try {
    const body = req.body as {
      agentTemplateId?: string
      modelConfigId?: string
      systemPrompt?: string
      userPrompt?: string
      temperature?: number
      maxTokens?: number
      timeoutMs?: number
      outputMode?: string
      structuredSchema?: Record<string, unknown>
      metadata?: Record<string, unknown>
    }
    const userPrompt = body?.userPrompt
    if (typeof userPrompt !== 'string' || !userPrompt.trim()) {
      res.status(400).json({
        success: false,
        errorCode: 'INVALID_REQUEST',
        errorMessageZh: '缺少 userPrompt',
      })
      return
    }

    const result = await executeLLMServer({
      agentTemplateId: body.agentTemplateId,
      modelConfigId: body.modelConfigId,
      systemPrompt: body.systemPrompt,
      userPrompt: userPrompt.trim(),
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      timeoutMs: body.timeoutMs,
      outputMode: (body.outputMode as 'json' | 'json_schema' | 'markdown_json' | 'json_object' | 'none') ?? 'json_schema',
      structuredSchema: body.structuredSchema,
      metadata: body.metadata,
    })

    res.json(result)
  } catch (e) {
    res.status(500).json({
      success: false,
      rawText: '',
      modelKey: 'unknown',
      provider: 'openai',
      latencyMs: 0,
      errorCode: 'SERVER_ERROR',
      errorMessageZh: e instanceof Error ? e.message : '服务端执行异常',
    })
  }
})

app.post('/api/llm/test-provider', async (req, res) => {
  try {
    const body = req.body as { providerId?: string }
    const providerId = body?.providerId
    if (typeof providerId !== 'string' || !providerId.trim()) {
      res.status(400).json({ ok: false, messageZh: '缺少 providerId' })
      return
    }

    const result = await testProviderConnection(providerId.trim())
    res.json(result)
  } catch (e) {
    res.status(500).json({
      ok: false,
      messageZh: e instanceof Error ? e.message : '测试连接异常',
    })
  }
})

// ─── 流程规划持久化 API（批次 1，依赖 Prisma：需先 npx prisma generate && npx prisma migrate dev）──

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getPlanningDb() {
  try {
    return await import('./domain/planningSessionDb')
  } catch {
    return null
  }
}

app.get('/api/planning-sessions', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const params = {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      scopeType: req.query.scopeType as string | undefined,
      tenantId: req.query.tenantId as string | undefined,
      status: req.query.status as string | undefined,
      projectTypeId: req.query.projectTypeId as string | undefined,
      deliverableMode: req.query.deliverableMode as string | undefined,
      sourceType: req.query.sourceType as string | undefined,
    }
    const result = await db.dbListPlanningSessions(params)
    res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.get('/api/planning-sessions/:id', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetPlanningSessionById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.post('/api/planning-sessions', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      scopeType: String(body.scopeType ?? 'tenant'),
      tenantId: body.tenantId != null ? String(body.tenantId) : undefined,
      title: String(body.title ?? ''),
      description: body.description != null ? String(body.description) : undefined,
      projectTypeId: String(body.projectTypeId ?? ''),
      goalTypeId: String(body.goalTypeId ?? ''),
      deliverableMode: String(body.deliverableMode ?? ''),
      sourceType: String(body.sourceType ?? 'sop_input'),
      sourceText: body.sourceText != null ? String(body.sourceText) : undefined,
      plannerAgentTemplateId: body.plannerAgentTemplateId != null ? String(body.plannerAgentTemplateId) : undefined,
      plannerExecutionBackend: String(body.plannerExecutionBackend ?? 'llm'),
      status: String(body.status ?? 'draft'),
      createdBy: String(body.createdBy ?? ''),
    }
    const data = await db.dbCreatePlanningSession(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.put('/api/planning-sessions/:id/status', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbUpdatePlanningSessionStatus(req.params.id, status)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.put('/api/planning-sessions/:id/current-draft', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const draftId = (req.body as { draftId?: string })?.draftId
    if (!draftId) {
      res.status(400).json({ code: 400, message: '缺少 draftId', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbSetCurrentDraft(req.params.id, draftId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.delete('/api/planning-sessions/:id', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    await db.dbDeletePlanningSession(req.params.id)
    res.json({ code: 0, message: 'success', data: true, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.get('/api/planning-sessions/:sessionId/drafts', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbListPlanningDrafts(req.params.sessionId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.post('/api/planning-sessions/:sessionId/drafts', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      sessionId: req.params.sessionId,
      version: body.version != null ? Number(body.version) : undefined,
      summary: body.summary != null ? String(body.summary) : undefined,
      parsedSOP: body.parsedSOP != null ? String(body.parsedSOP) : undefined,
      nodes: Array.isArray(body.nodes) ? body.nodes : [],
      suggestedAgentTemplateIds: Array.isArray(body.suggestedAgentTemplateIds)
        ? (body.suggestedAgentTemplateIds as string[])
        : undefined,
      suggestedSkillIds: Array.isArray(body.suggestedSkillIds) ? (body.suggestedSkillIds as string[]) : undefined,
      changeSummary: body.changeSummary != null ? String(body.changeSummary) : undefined,
      riskNotes: body.riskNotes != null ? String(body.riskNotes) : undefined,
      missingCapabilities: Array.isArray(body.missingCapabilities)
        ? (body.missingCapabilities as string[])
        : undefined,
      capabilityNotes: body.capabilityNotes != null ? String(body.capabilityNotes) : undefined,
      status: String(body.status ?? 'suggested'),
    }
    const data = await db.dbCreatePlanningDraft(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.get('/api/planning-drafts/:id', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetPlanningDraftById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.get('/api/planning-sessions/:sessionId/messages', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbListPlanningMessages(req.params.sessionId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.post('/api/planning-sessions/:sessionId/messages', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      sessionId: req.params.sessionId,
      role: String(body.role ?? 'user'),
      content: String(body.content ?? ''),
      relatedDraftVersion: body.relatedDraftVersion != null ? Number(body.relatedDraftVersion) : undefined,
      messageType: String(body.messageType ?? 'chat'),
    }
    const data = await db.dbAddPlanningMessage(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

app.get('/api/planning-drafts/referencing-agent/:agentTemplateId', async (req, res) => {
  const db = await getPlanningDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetDraftNodesReferencingAgent(req.params.agentTemplateId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '服务端异常',
      data: null,
      meta: apiMeta(),
    })
  }
})

// ─── 批次 2：Project / ProjectGoal / ProjectSOP API ───────────────────────────

async function getProjectDb() {
  try {
    return await import('./domain/projectDb')
  } catch {
    return null
  }
}

app.get('/api/projects', async (req, res) => {
  const db = await getProjectDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const params = {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      keyword: req.query.keyword as string | undefined,
      status: req.query.status as string | undefined,
      tenantId: req.query.tenantId as string | undefined,
    }
    const result = await db.dbListProjects(params)
    res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/projects/:id', async (req, res) => {
  const db = await getProjectDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetProjectById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/projects', async (req, res) => {
  const db = await getProjectDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      tenantId: String(body.tenantId ?? ''),
      name: String(body.name ?? ''),
      description: body.description != null ? String(body.description) : undefined,
      status: body.status != null ? String(body.status) : 'draft',
      ownerId: String(body.ownerId ?? ''),
      projectTypeCode: body.projectTypeCode != null ? String(body.projectTypeCode) : undefined,
      goalSummary: body.goalSummary != null ? String(body.goalSummary) : undefined,
      kpiSummary: body.kpiSummary != null ? String(body.kpiSummary) : undefined,
      allowedAgentTemplateIds: Array.isArray(body.allowedAgentTemplateIds) ? body.allowedAgentTemplateIds as string[] : undefined,
      preferredAgentTemplateIds: Array.isArray(body.preferredAgentTemplateIds) ? body.preferredAgentTemplateIds as string[] : undefined,
      defaultPlannerAgentTemplateId: body.defaultPlannerAgentTemplateId != null ? String(body.defaultPlannerAgentTemplateId) : undefined,
      selectedWorkflowTemplateId: body.selectedWorkflowTemplateId != null ? String(body.selectedWorkflowTemplateId) : undefined,
    }
    const data = await db.dbCreateProject(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.put('/api/projects/:id', async (req, res) => {
  const db = await getProjectDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload: Record<string, unknown> = {}
    if (body.name !== undefined) payload.name = String(body.name)
    if (body.description !== undefined) payload.description = String(body.description)
    if (body.status !== undefined) payload.status = String(body.status)
    if (body.goalSummary !== undefined) payload.goalSummary = String(body.goalSummary)
    if (body.kpiSummary !== undefined) payload.kpiSummary = String(body.kpiSummary)
    if (body.allowedAgentTemplateIds !== undefined) payload.allowedAgentTemplateIds = body.allowedAgentTemplateIds as string[]
    if (body.preferredAgentTemplateIds !== undefined) payload.preferredAgentTemplateIds = body.preferredAgentTemplateIds as string[]
    if (body.defaultPlannerAgentTemplateId !== undefined) payload.defaultPlannerAgentTemplateId = String(body.defaultPlannerAgentTemplateId)
    if (body.selectedWorkflowTemplateId !== undefined) payload.selectedWorkflowTemplateId = String(body.selectedWorkflowTemplateId)
    const data = await db.dbUpdateProject(req.params.id, payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.delete('/api/projects/:id', async (req, res) => {
  const db = await getProjectDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    await db.dbDeleteProject(req.params.id)
    res.json({ code: 0, message: 'success', data: true, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.patch('/api/projects/:id/status', async (req, res) => {
  const db = await getProjectDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbPatchProjectStatus(req.params.id, status)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/projects/:projectId/goals', async (req, res) => {
  const db = await getProjectDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetGoalsByProjectId(req.params.projectId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/projects/:projectId/goals', async (req, res) => {
  const db = await getProjectDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      goalType: String(body.goalType ?? 'other'),
      goalName: String(body.goalName ?? ''),
      goalDescription: String(body.goalDescription ?? ''),
      successCriteria: body.successCriteria != null ? String(body.successCriteria) : undefined,
      kpiDefinition: body.kpiDefinition != null ? String(body.kpiDefinition) : undefined,
      goalTypeCode: body.goalTypeCode != null ? String(body.goalTypeCode) : undefined,
      primaryMetricCode: body.primaryMetricCode != null ? String(body.primaryMetricCode) : undefined,
      secondaryMetricCodes: Array.isArray(body.secondaryMetricCodes) ? (body.secondaryMetricCodes as string[]) : undefined,
    }
    const data = await db.dbCreateGoal(req.params.projectId, payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/projects/:projectId/sop', async (req, res) => {
  const db = await getProjectDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetSOPByProjectId(req.params.projectId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.put('/api/projects/:projectId/sop', async (req, res) => {
  const db = await getProjectDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const sopRaw = (req.body as { sopRaw?: string })?.sopRaw
    if (typeof sopRaw !== 'string') {
      res.status(400).json({ code: 400, message: '缺少 sopRaw', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbUpdateProjectSOP(req.params.projectId, { sopRaw })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── 批次 3：Identity / Terminal API ───────────────────────────────────────────

async function getIdentityTerminalDb() {
  try {
    return await import('./domain/identityTerminalDb')
  } catch {
    return null
  }
}

app.get('/api/identities', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const tenantId = req.query.tenantId as string
    if (!tenantId) {
      res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
      return
    }
    const result = await db.dbListIdentities({
      tenantId,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      keyword: req.query.keyword as string | undefined,
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
    })
    res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/identities/:id', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetIdentityById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/identities', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      tenantId: String(body.tenantId ?? ''),
      name: String(body.name ?? ''),
      type: body.type != null ? String(body.type) : undefined,
      corePositioning: body.corePositioning != null ? String(body.corePositioning) : undefined,
      toneStyle: body.toneStyle != null ? String(body.toneStyle) : undefined,
      contentDirections: body.contentDirections != null ? String(body.contentDirections) : undefined,
      behaviorRules: body.behaviorRules != null ? String(body.behaviorRules) : undefined,
      platformAdaptations: (body.platformAdaptations as Record<string, string>) ?? undefined,
      status: body.status != null ? String(body.status) : 'active',
    }
    const data = await db.dbCreateIdentity(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.put('/api/identities/:id', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbUpdateIdentity(req.params.id, req.body as Record<string, unknown>)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.delete('/api/identities/:id', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    await db.dbDeleteIdentity(req.params.id)
    res.json({ code: 0, message: 'success', data: true, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.patch('/api/identities/:id/status', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbPatchIdentityStatus(req.params.id, status)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/terminals', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const result = await db.dbListTerminals({
      tenantId: req.query.tenantId as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      keyword: req.query.keyword as string | undefined,
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      typeCategory: req.query.typeCategory as string | undefined,
    })
    res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/terminals', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const tenantId = String(body.tenantId ?? '')
    const name = String(body.name ?? '')
    const type = String(body.type ?? '')
    if (!tenantId || !name || !type) {
      res.status(400).json({ code: 400, message: '缺少 tenantId、name 或 type', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbCreateTerminal({
      tenantId,
      name,
      type,
      typeCategory: body.typeCategory as string | undefined,
      identityId: body.identityId != null ? String(body.identityId) : undefined,
      status: body.status as string | undefined,
      credentialsJson: body.credentialsJson as string | undefined,
      configJson: body.configJson as string | undefined,
      linkedProjectIds: Array.isArray(body.linkedProjectIds) ? (body.linkedProjectIds as string[]) : undefined,
      notes: body.notes as string | undefined,
    })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// 新建前测试连接（须在 /api/terminals/:id 之前注册，避免 test-connection 被当作 id）
app.post('/api/terminals/test-connection', async (_req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: { success: true, message: '测试连接成功' },
    meta: apiMeta(),
  })
})

app.get('/api/terminals/:id', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetTerminalById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.put('/api/terminals/:id', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const data = await db.dbUpdateTerminal(req.params.id, {
      name: body.name as string | undefined,
      identityId: body.identityId !== undefined ? (body.identityId as string | null) : undefined,
      status: body.status as string | undefined,
      credentialsJson: body.credentialsJson as string | undefined,
      configJson: body.configJson as string | undefined,
      linkedProjectIds: Array.isArray(body.linkedProjectIds) ? (body.linkedProjectIds as string[]) : undefined,
      notes: body.notes as string | undefined,
    })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.patch('/api/terminals/:id/status', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbPatchTerminalStatus(req.params.id, status)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.delete('/api/terminals/:id', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const terminal = await db.dbGetTerminalById(req.params.id)
    if (terminal?.type === 'facebook_page') {
      await revokeFacebookCredentialByTerminalId(req.params.id)
    }
    await db.dbDeleteTerminal(req.params.id)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// 对已有终端重新测试连接
app.post('/api/terminals/:id/test', async (req, res) => {
  const db = await getIdentityTerminalDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    // 当前阶段：mock 成功并更新 lastTestedAt/lastTestResult
    await db.dbSetTerminalTestResult(req.params.id, { lastTestResult: 'success', lastTestMessage: '测试连接成功' })
    const data = await db.dbGetTerminalById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// Facebook 主页终端：刷新 Token 校验
app.post('/api/terminals/:id/refresh-token', async (req, res) => {
  try {
    const result = await refreshTerminalPageToken(req.params.id)
    if (result.success) {
      res.json({ code: 0, message: result.message, data: { valid: true }, meta: apiMeta() })
    } else {
      res.status(400).json({ code: 400, message: result.message, data: { valid: false }, meta: apiMeta() })
    }
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// Facebook 主页终端：按终端 ID 发帖（兼容旧路径 /api/facebook/pages/:pageId/posts）
app.post('/api/terminals/:id/actions/post', async (req, res) => {
  const token = await getPageAccessTokenByTerminalId(req.params.id)
  if (!token) {
    res.status(404).json({
      code: 404,
      message: '该终端未授权或不是 Facebook 主页类型',
      data: null,
      meta: apiMeta(),
    })
    return
  }
  const db = await getIdentityTerminalDb()
  const terminal = db ? await db.dbGetTerminalById(req.params.id) : null
  const credentialsJson = terminal?.credentialsJson
  let pageId: string | null = null
  if (credentialsJson) {
    try {
      const o = JSON.parse(credentialsJson) as { pageId?: string }
      pageId = typeof o.pageId === 'string' ? o.pageId : null
    } catch {
      // ignore
    }
  }
  if (!pageId) {
    res.status(400).json({ code: 400, message: '无法解析主页 ID', data: null, meta: apiMeta() })
    return
  }
  const body = req.body as { message?: string; link?: string }
  const message = body.message?.trim()
  const link = body.link?.trim()
  if (!message && !link) {
    res.status(400).json({ code: 400, message: '请提供 message 或 link', data: null, meta: apiMeta() })
    return
  }
  try {
    const formBody = new URLSearchParams()
    if (message) formBody.set('message', message)
    if (link) formBody.set('link', link)
    formBody.set('access_token', token)
    const graphRes = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    })
    const result = (await graphRes.json()) as { id?: string; error?: { message: string; code?: number } }
    if (result.error) {
      res.status(400).json({ code: 400, message: result.error.message || '发帖失败', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data: { postId: result.id }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '发帖请求异常', data: null, meta: apiMeta() })
  }
})

async function getWorkflowTemplateDb() {
  try {
    return await import('./domain/workflowTemplateDb')
  } catch {
    return null
  }
}

app.get('/api/workflow-templates', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const result = await db.dbListWorkflowTemplates({
      tenantId: req.query.tenantId as string | undefined,
      scopeType: req.query.scopeType as string | undefined,
      status: req.query.status as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      keyword: req.query.keyword as string | undefined,
    })
    res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/workflow-templates/referencing-agent/:agentTemplateId', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbListTemplateNodesReferencingAgent(req.params.agentTemplateId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/workflow-templates/:id', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetWorkflowTemplateById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/workflow-templates', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      scopeType: String(body.scopeType ?? 'tenant'),
      tenantId: body.tenantId != null ? String(body.tenantId) : undefined,
      name: String(body.name ?? ''),
      code: body.code != null ? String(body.code) : undefined,
      description: body.description != null ? String(body.description) : undefined,
      status: body.status != null ? String(body.status) : 'draft',
      supportedProjectTypeId: body.supportedProjectTypeId != null ? String(body.supportedProjectTypeId) : undefined,
      supportedGoalTypeIds: Array.isArray(body.supportedGoalTypeIds) ? body.supportedGoalTypeIds as string[] : undefined,
      supportedDeliverableModes: Array.isArray(body.supportedDeliverableModes) ? body.supportedDeliverableModes as string[] : undefined,
    }
    const data = await db.dbCreateWorkflowTemplate(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.put('/api/workflow-templates/:id', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbUpdateWorkflowTemplate(req.params.id, req.body as Record<string, unknown>)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.delete('/api/workflow-templates/:id', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbDeleteWorkflowTemplate(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/workflow-templates/:id/clone', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const tenantId = (req.body as { tenantId?: string })?.tenantId
    if (!tenantId) {
      res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbCloneWorkflowTemplateToTenant(req.params.id, tenantId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.patch('/api/workflow-templates/:id/status', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbUpdateWorkflowTemplate(req.params.id, { status })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/workflow-templates/:id/nodes', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbListTemplateNodes(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/workflow-templates/:id/nodes', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      key: String(body.key ?? body.nodeKey ?? ''),
      name: String(body.name ?? body.nodeName ?? ''),
      description: body.description != null ? String(body.description) : undefined,
      executionType: body.executionType != null ? String(body.executionType) : undefined,
      intentType: body.intentType != null ? String(body.intentType) : undefined,
      orderIndex: body.orderIndex != null ? Number(body.orderIndex) : undefined,
      dependsOnNodeIds: Array.isArray(body.dependsOnNodeIds) ? body.dependsOnNodeIds as string[] : undefined,
      recommendedAgentTemplateId: body.recommendedAgentTemplateId != null ? String(body.recommendedAgentTemplateId) : undefined,
      allowedSkillIds: Array.isArray(body.allowedSkillIds) ? body.allowedSkillIds as string[] : undefined,
      allowedTerminalTypes: Array.isArray(body.allowedTerminalTypes) ? body.allowedTerminalTypes as string[] : undefined,
    }
    const data = await db.dbCreateTemplateNode(req.params.id, payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/workflow-templates/:id/nodes/reorder', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const orderedNodeIds = (req.body as { orderedNodeIds?: string[] })?.orderedNodeIds
    if (!Array.isArray(orderedNodeIds)) {
      res.status(400).json({ code: 400, message: '缺少 orderedNodeIds 数组', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbReorderTemplateNodes(req.params.id, orderedNodeIds)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.put('/api/workflow-template-nodes/:id', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload: Record<string, unknown> = {}
    if (body.key !== undefined) payload.key = body.key
    if (body.nodeKey !== undefined) payload.key = body.nodeKey
    if (body.name !== undefined) payload.name = body.name
    if (body.nodeName !== undefined) payload.name = body.nodeName
    if (body.description !== undefined) payload.description = body.description
    if (body.executionType !== undefined) payload.executionType = body.executionType
    if (body.intentType !== undefined) payload.intentType = body.intentType
    if (body.orderIndex !== undefined) payload.orderIndex = body.orderIndex
    if (body.dependsOnNodeIds !== undefined) payload.dependsOnNodeIds = body.dependsOnNodeIds
    if (body.recommendedAgentTemplateId !== undefined) payload.recommendedAgentTemplateId = body.recommendedAgentTemplateId
    if (body.allowedSkillIds !== undefined) payload.allowedSkillIds = body.allowedSkillIds
    if (body.allowedTerminalTypes !== undefined) payload.allowedTerminalTypes = body.allowedTerminalTypes
    const data = await db.dbUpdateTemplateNode(req.params.id, payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.delete('/api/workflow-template-nodes/:id', async (req, res) => {
  const db = await getWorkflowTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbDeleteTemplateNode(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

async function getWorkflowInstanceDb() {
  try {
    return await import('./domain/workflowInstanceDb')
  } catch {
    return null
  }
}

app.get('/api/workflow-instances', async (req, res) => {
  const db = await getWorkflowInstanceDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程实例持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const projectId = req.query.projectId as string
    if (projectId) {
      const data = await db.dbListInstancesByProjectId(projectId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
      return
    }
    const tenantId = req.query.tenantId as string
    if (tenantId) {
      const data = await db.dbListInstancesForTenant(tenantId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
      return
    }
    const workflowTemplateId = req.query.workflowTemplateId as string
    if (workflowTemplateId) {
      const data = await db.dbListInstancesByTemplateId(workflowTemplateId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
      return
    }
    res.status(400).json({ code: 400, message: '缺少 projectId、tenantId 或 workflowTemplateId', data: null, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/workflow-instances/:id', async (req, res) => {
  const db = await getWorkflowInstanceDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程实例持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetInstanceById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/workflow-instances', async (req, res) => {
  const db = await getWorkflowInstanceDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程实例持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const projectId = String(body.projectId ?? '')
    const templateId = String(body.templateId ?? body.workflowTemplateId ?? '')
    if (!projectId || !templateId) {
      res.status(400).json({ code: 400, message: '缺少 projectId 或 templateId', data: null, meta: apiMeta() })
      return
    }
    const instance = await db.dbCreateInstance({
      projectId,
      workflowTemplateId: templateId,
      status: 'pending',
    })
    const templateDb = await getWorkflowTemplateDb()
    if (templateDb) {
      const templateNodes = await templateDb.dbListTemplateNodes(templateId)
      if (templateNodes.length > 0) {
        await db.dbCreateInstanceNodes(
          instance.id,
          templateNodes.map((n, i) => ({
            key: n.key,
            name: n.name,
            templateNodeId: n.id,
            orderIndex: i,
          }))
        )
      }
    }
    const data = await db.dbGetInstanceById(instance.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.put('/api/workflow-instances/:id', async (req, res) => {
  const db = await getWorkflowInstanceDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程实例持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbUpdateInstance(req.params.id, req.body as Record<string, unknown>)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/workflow-instances/:id/nodes', async (req, res) => {
  const db = await getWorkflowInstanceDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程实例持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbListInstanceNodes(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.put('/api/workflow-instance-nodes/:id', async (req, res) => {
  const db = await getWorkflowInstanceDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '流程实例持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload: Record<string, unknown> = {}
    if (body.status !== undefined) payload.status = body.status
    if (body.resultSummary !== undefined) payload.resultSummary = body.resultSummary
    if (body.workerOutputJson !== undefined) payload.workerOutputJson = body.workerOutputJson
    if (body.errorSummary !== undefined) payload.errorSummary = body.errorSummary
    if (body.reviewSummary !== undefined) payload.reviewSummary = body.reviewSummary
    if (body.retryCount !== undefined) payload.retryCount = body.retryCount
    if (body.workerExecutionModel !== undefined) payload.workerExecutionModel = body.workerExecutionModel
    if (body.workerExecutionDurationMs !== undefined) payload.workerExecutionDurationMs = body.workerExecutionDurationMs
    if (body.workerExecutionAgentId !== undefined) payload.workerExecutionAgentId = body.workerExecutionAgentId
    if (body.selectedAgentTemplateId !== undefined) payload.selectedAgentTemplateId = body.selectedAgentTemplateId
    if (body.recoveryStatus !== undefined) payload.recoveryStatus = body.recoveryStatus
    if (body.lastRecoveryAction !== undefined) payload.lastRecoveryAction = body.lastRecoveryAction
    const data = await db.dbUpdateInstanceNode(req.params.id, payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// POST 执行流程实例节点（P1-A）
app.post('/api/workflow-instances/:instanceId/nodes/:nodeId/execute', async (req, res) => {
  try {
    const { executeInstanceNode } = await import('./domain/workflowNodeExecutor')
    const { instanceId, nodeId } = req.params
    const updated = await executeInstanceNode(instanceId, nodeId)
    if (!updated) {
      res.status(404).json({ code: 404, message: '实例或节点不存在', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data: updated, meta: apiMeta() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务端异常'
    const code = msg.includes('正在执行中') ? 5003 : 500
    res.status(code === 5003 ? 409 : 500).json({ code, message: msg, data: null, meta: apiMeta() })
  }
})

app.get('/api/tasks', async (req, res) => {
  const db = await getWorkflowInstanceDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '任务持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const projectId = req.query.projectId as string
    if (!projectId) {
      res.status(400).json({ code: 400, message: '缺少 projectId', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbListTasksByProjectId(projectId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/tasks/:id', async (req, res) => {
  const db = await getWorkflowInstanceDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '任务持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetTaskById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/tasks', async (req, res) => {
  const db = await getWorkflowInstanceDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '任务持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      projectId: String(body.projectId ?? ''),
      workflowInstanceId: body.workflowInstanceId != null ? String(body.workflowInstanceId) : undefined,
      workflowInstanceNodeId: body.workflowInstanceNodeId != null ? String(body.workflowInstanceNodeId) : undefined,
      title: String(body.title ?? ''),
      status: body.status != null ? String(body.status) : 'pending',
    }
    const data = await db.dbCreateTask(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.patch('/api/tasks/:id', async (req, res) => {
  const db = await getWorkflowInstanceDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '任务持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbUpdateTask(req.params.id, { status })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

async function getTenantDb() {
  try {
    return await import('./domain/tenantDb')
  } catch {
    return null
  }
}

app.get('/api/tenants', async (req, res) => {
  const db = await getTenantDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const result = await db.dbListTenants({
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      keyword: req.query.keyword as string | undefined,
      status: req.query.status as string | undefined,
    })
    res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/tenants/:id', async (req, res) => {
  const db = await getTenantDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetTenantById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.post('/api/tenants', async (req, res) => {
  const db = await getTenantDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      name: String(body.name ?? ''),
      code: body.code != null ? String(body.code) : undefined,
      status: body.status != null ? String(body.status) : 'active',
    }
    const data = await db.dbCreateTenant(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.put('/api/tenants/:id', async (req, res) => {
  const db = await getTenantDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbUpdateTenant(req.params.id, req.body as Record<string, unknown>)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.delete('/api/tenants/:id', async (req, res) => {
  const db = await getTenantDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    await db.dbDeleteTenant(req.params.id)
    res.json({ code: 0, message: 'success', data: true, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.patch('/api/tenants/:id/status', async (req, res) => {
  const db = await getTenantDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbPatchTenantStatus(req.params.id, status)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

function buildMeta() {
  return {
    requestId: '',
    timestamp: new Date().toISOString(),
  }
}

app.get('/api/credentials', (req, res) => {
  const list = listServerCredentialsForClient()
  res.json({
    code: 0,
    message: 'success',
    data: list,
    meta: buildMeta(),
  })
})

app.post('/api/credentials', (req, res) => {
  const body = req.body as {
    id?: string
    name?: string
    nameZh?: string
    providerType?: string
    secret?: string
    status?: string
    notes?: string
  }

  const id = body.id?.trim()
  const name = body.name?.trim()
  const nameZh = body.nameZh?.trim()
  const providerType = body.providerType as 'openai' | 'azure_openai' | 'openai_compatible' | 'custom' | undefined
  const secret = body.secret?.trim()
  const status = body.status as 'active' | 'disabled' | undefined

  if (!id) {
    res.status(400).json({
      code: 40001,
      message: '缺少凭证编码 id',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  if (!name || !nameZh) {
    res.status(400).json({
      code: 40002,
      message: '名称与中文名称不能为空',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  if (!providerType) {
    res.status(400).json({
      code: 40003,
      message: '缺少 providerType',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  if (!secret) {
    res.status(400).json({
      code: 40004,
      message: '创建凭证时必须填写密钥',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  if (!status) {
    res.status(400).json({
      code: 40005,
      message: '缺少凭证状态 status',
      data: null,
      meta: buildMeta(),
    })
    return
  }

  try {
    const created = createServerCredential({
      id,
      name,
      nameZh,
      providerType,
      secret,
      status,
      notes: body.notes?.trim() || undefined,
    })
    res.json({
      code: 0,
      message: 'success',
      data: created,
      meta: buildMeta(),
    })
  } catch (e) {
    res.status(400).json({
      code: 40006,
      message: e instanceof Error ? e.message : '创建凭证失败',
      data: null,
      meta: buildMeta(),
    })
  }
})

app.put('/api/credentials/:id', (req, res) => {
  const id = String(req.params.id || '').trim()
  if (!id) {
    res.status(400).json({
      code: 40011,
      message: '缺少凭证编码 id',
      data: null,
      meta: buildMeta(),
    })
    return
  }

  const body = req.body as {
    name?: string
    nameZh?: string
    providerType?: string
    secret?: string
    status?: string
    notes?: string
  }

  const updated = updateServerCredential(id, {
    name: body.name,
    nameZh: body.nameZh,
    providerType: body.providerType as
      | 'openai'
      | 'azure_openai'
      | 'openai_compatible'
      | 'custom'
      | undefined,
    secret: body.secret,
    status: body.status as 'active' | 'disabled' | undefined,
    notes: body.notes,
  })

  if (!updated) {
    res.status(404).json({
      code: 40401,
      message: '凭证不存在',
      data: null,
      meta: buildMeta(),
    })
    return
  }

  res.json({
    code: 0,
    message: 'success',
    data: updated,
    meta: buildMeta(),
  })
})

app.delete('/api/credentials/:id', (req, res) => {
  const id = String(req.params.id || '').trim()
  if (!id) {
    res.status(400).json({
      code: 40021,
      message: '缺少凭证编码 id',
      data: null,
      meta: buildMeta(),
    })
    return
  }

  const exists = getServerCredentialByIdForClient(id)
  if (!exists) {
    res.status(404).json({
      code: 40401,
      message: '凭证不存在',
      data: null,
      meta: buildMeta(),
    })
    return
  }

  const ok = deleteServerCredential(id)
  if (!ok) {
    res.status(500).json({
      code: 50021,
      message: '删除凭证失败',
      data: null,
      meta: buildMeta(),
    })
    return
  }

  res.json({
    code: 0,
    message: 'success',
    data: true,
    meta: buildMeta(),
  })
})

// ─── 平台第三方集成配置（后台化管理，替代 .env）──────────────────────────────────

app.get('/api/platform-integrations/facebook', (req, res) => {
  const config = getFacebookIntegrationForClient()
  const storedRedirect = (config?.redirectUri || '').trim()
  const redirectUri =
    storedRedirect && !isLocalhostRedirect(storedRedirect)
      ? storedRedirect
      : getFacebookRedirectUri(req)
  const data = config
    ? {
      ...config,
      redirectUri,
    }
    : null
  res.json({
    code: 0,
    message: 'success',
    data,
    meta: buildMeta(),
  })
})

app.get('/api/platform-integrations/facebook/stats', async (_req, res) => {
  try {
    const pages = listFacebookPageSummaries()
    const db = await getIdentityTerminalDb()
    let totalTerminals = 0
    if (db) {
      const result = await db.dbListTerminals({ type: 'facebook_page', pageSize: 1 })
      totalTerminals = result.total
    }
    res.json({
      code: 0,
      message: 'success',
      data: {
        totalAuthorizedPages: pages.length,
        totalFacebookTerminals: totalTerminals,
      },
      meta: buildMeta(),
    })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '获取统计失败',
      data: null,
      meta: buildMeta(),
    })
  }
})

app.put('/api/platform-integrations/facebook', (req, res) => {
  const body = req.body as {
    appId?: string
    appSecret?: string
    redirectUri?: string
    scopes?: string
    isEnabled?: boolean
  }
  const appId = typeof body?.appId === 'string' ? body.appId.trim() : ''
  const appSecret = typeof body?.appSecret === 'string' ? body.appSecret.trim() : undefined
  let redirectUri = typeof body?.redirectUri === 'string' ? body.redirectUri.trim() : undefined
  if (redirectUri && isLocalhostRedirect(redirectUri)) redirectUri = undefined
  const scopes = typeof body?.scopes === 'string' ? body.scopes.trim() : undefined
  const isEnabled = typeof body?.isEnabled === 'boolean' ? body.isEnabled : true
  if (!appId) {
    res.status(400).json({
      code: 400,
      message: 'App ID 不能为空',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  try {
    const updated = saveFacebookIntegration({
      appId,
      appSecret,
      redirectUri,
      scopes,
      isEnabled,
    })
    res.json({
      code: 0,
      message: 'success',
      data: updated,
      meta: buildMeta(),
    })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '保存失败',
      data: null,
      meta: buildMeta(),
    })
  }
})

// ─── Facebook 公共主页授权与发帖 API ─────────────────────────────────────────────

/** 运行时从平台集成 store 读取，未配置时回退到 env（开发兜底） */
function getFacebookAppId(): string {
  const fromStore = getFacebookIntegrationForClient()
  if (fromStore?.appId) return fromStore.appId
  return process.env.FACEBOOK_APP_ID || ''
}

function getFacebookAppSecret(): string {
  const secret = getFacebookIntegrationSecret()
  if (secret) return secret
  return process.env.FACEBOOK_APP_SECRET || ''
}

/** 是否为 localhost 回调地址（不持久化、不返回给前端，改为按请求域名动态生成） */
function isLocalhostRedirect(uri: string): boolean {
  const u = (uri || '').trim().toLowerCase()
  return u.startsWith('http://127.0.0.1') || u.startsWith('http://localhost') || u.startsWith('https://localhost')
}

function getConfiguredFacebookRedirectUri(): string {
  const fromStore = getFacebookIntegrationForClient()
  const stored = (fromStore?.redirectUri || '').trim()
  if (stored && !isLocalhostRedirect(stored)) return stored
  return (process.env.FACEBOOK_REDIRECT_URI || '').trim()
}

function getRequestOrigin(req: express.Request): string {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
  const forwardedHost = String(req.headers['x-forwarded-host'] || '')
    .split(',')[0]
    .trim()
  const protocol = forwardedProto || req.protocol || 'http'
  const host = forwardedHost || req.get('host') || ''
  return host ? `${protocol}://${host}` : ''
}

/** 回调地址：优先使用已配置的非 localhost 地址，否则按当前请求的 origin 自动生成 */
function getFacebookRedirectUri(req?: express.Request): string {
  const configured = getConfiguredFacebookRedirectUri()
  if (configured && !isLocalhostRedirect(configured)) return configured
  const origin = req ? getRequestOrigin(req) : ''
  return origin ? `${origin}/api/facebook/auth/callback` : ''
}

function getFacebookFrontendRedirect(req?: express.Request): string {
  const configured = (process.env.FACEBOOK_FRONTEND_REDIRECT || '').trim()
  if (configured) return configured
  const origin = req ? getRequestOrigin(req) : ''
  return origin ? `${origin}/tenant/facebook-pages` : '/tenant/facebook-pages'
}

const FACEBOOK_PAGE_ID_REGEX = /^\d+$/

function isValidFacebookPageId(pageId: string): boolean {
  return FACEBOOK_PAGE_ID_REGEX.test(pageId.trim())
}

function getFacebookScopes(): string {
  const config = getFacebookIntegrationForClient()
  return (config?.scopes ?? '').trim() || DEFAULT_FACEBOOK_SCOPES
}

/** OAuth state 防 CSRF：state -> { expiry, tenantId }，仅内存，重启清空 */
const facebookOAuthStateStore = new Map<string, { expiry: number; tenantId?: string }>()
const FACEBOOK_OAUTH_STATE_TTL_MS = 10 * 60 * 1000

function createFacebookOAuthState(tenantId?: string): string {
  const state = crypto.randomBytes(24).toString('hex')
  facebookOAuthStateStore.set(state, {
    expiry: Date.now() + FACEBOOK_OAUTH_STATE_TTL_MS,
    tenantId: tenantId?.trim() || undefined,
  })
  return state
}

function consumeFacebookOAuthState(state: string): { valid: boolean; tenantId?: string } {
  const entry = facebookOAuthStateStore.get(state)
  facebookOAuthStateStore.delete(state)
  if (entry == null || Date.now() > entry.expiry) return { valid: false }
  return { valid: true, tenantId: entry.tenantId }
}

/** 要求请求携带合法 API 认证（Bearer token 与环境变量 API_SECRET 一致）；callback 由 Meta 重定向调用无法带 Header，不在此处使用 */
function requireFacebookApiAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const secret = process.env.API_SECRET || process.env.FACEBOOK_AUTH_SECRET
  if (!secret) {
    next()
    return
  }
  const authHeader = req.headers.authorization
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7) : ''
  if (token !== secret) {
    res.status(401).json({
      code: 401,
      message: '未授权',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  next()
}

/** 前端用：获取 Facebook App ID 与 scopes（用于 SDK 初始化），未配置时返回 null */
app.get('/api/facebook/config', (_req, res) => {
  const appId = getFacebookAppId()
  const scopes = getFacebookScopes()
  res.json({
    code: 0,
    message: 'success',
    data: appId ? { appId, scopes } : null,
    meta: buildMeta(),
  })
})

/** 前端用：用户通过 SDK 登录后拿到 userAccessToken，调用此接口由服务端拉取主页、保存凭证并创建/更新 Terminal 实例 */
app.post('/api/facebook/auth/with-token', requireFacebookApiAuth, async (req, res) => {
  const body = req.body as { userAccessToken?: string; tenantId?: string }
  const userToken = typeof body?.userAccessToken === 'string' ? body.userAccessToken.trim() : ''
  const tenantId = typeof body?.tenantId === 'string' ? body.tenantId.trim() : ''
  if (!userToken) {
    res.status(400).json({
      code: 400,
      message: '请提供 userAccessToken',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  if (!tenantId) {
    res.status(400).json({
      code: 400,
      message: '请提供 tenantId',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  try {
    const result = await authorizeAndUpsertTerminals(tenantId, userToken)
    res.json({
      code: 0,
      message: 'success',
      data: {
        created: result.created,
        updated: result.updated,
        pageCount: result.created.length + result.updated.length,
      },
      meta: buildMeta(),
    })
  } catch (e) {
    const rawMsg = e instanceof Error ? e.message : '服务端异常'
    console.error('[facebook auth with-token] error:', rawMsg)
    res.status(500).json({
      code: 500,
      message: rawMsg.includes('获取主页列表') ? rawMsg : '处理失败，请稍后重试',
      data: null,
      meta: buildMeta(),
    })
  }
})

app.post('/api/facebook/auth/init', requireFacebookApiAuth, (req, res) => {
  const appId = getFacebookAppId()
  if (!appId) {
    res.status(503).json({
      code: 503,
      message: 'Facebook 集成尚未配置，请在平台设置中完成认证配置',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  const tenantId = (req.body as { tenantId?: string })?.tenantId as string | undefined
  const state = createFacebookOAuthState(tenantId?.trim())
  const redirectUri = getFacebookRedirectUri(req)
  if (!redirectUri) {
    res.status(503).json({
      code: 503,
      message: '未能确定 OAuth 回调地址，请配置 FACEBOOK_REDIRECT_URI',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  const scopes = getFacebookScopes()
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${encodeURIComponent(state)}`
  res.json({
    code: 0,
    message: 'success',
    data: { authUrl },
    meta: buildMeta(),
  })
})

app.get('/api/facebook/auth/callback', async (req, res) => {
  const frontendRedirect = getFacebookFrontendRedirect(req)
  const code = (req.query.code as string) || ''
  const state = (req.query.state as string) || ''
  const error = req.query.error as string | undefined
  if (error) {
    res.redirect(`${frontendRedirect}?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent((req.query.error_description as string) || '')}`)
    return
  }
  const stateResult = consumeFacebookOAuthState(state)
  if (!state || !stateResult.valid) {
    res.redirect(`${frontendRedirect}?error=invalid_state&error_description=state 无效或已过期，请重新发起授权`)
    return
  }
  const tenantId = stateResult.tenantId || ''
  const appId = getFacebookAppId()
  const appSecret = getFacebookAppSecret()
  const redirectUri = getFacebookRedirectUri(req)
  if (!code || !appId || !appSecret || !redirectUri) {
    res.redirect(`${frontendRedirect}?error=config&error_description=${encodeURIComponent('Facebook 集成尚未配置，请在平台设置中完成认证配置')}`)
    return
  }
  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`
    )
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: { message: string } }
    if (tokenData.error || !tokenData.access_token) {
      const rawMsg = tokenData.error?.message || '获取 access_token 失败'
      console.error('[facebook auth callback] token error:', rawMsg)
      res.redirect(`${frontendRedirect}?error=token&error_description=${encodeURIComponent('获取访问凭证失败，请重试')}`)
      return
    }
    const userToken = tokenData.access_token
    if (tenantId) {
      await authorizeAndUpsertTerminals(tenantId, userToken)
    } else {
      const accountsRes = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,category&access_token=${encodeURIComponent(userToken)}`
      )
      const accountsData = (await accountsRes.json()) as {
        data?: Array<{ id: string; name: string; access_token?: string; category?: string }>
        error?: { message: string }
      }
      if (!accountsData.error && Array.isArray(accountsData.data)) {
        const { saveFacebookPageCredential: saveCred } = await import('./data/facebookCredentialStore')
        for (const page of accountsData.data) {
          if (page.access_token) {
            saveCred({
              pageId: page.id,
              pageName: page.name,
              pageCategory: page.category,
              accessToken: page.access_token,
            })
          }
        }
      }
    }
    res.redirect(`${frontendRedirect}?oauth_success=1${tenantId ? `&tenantId=${encodeURIComponent(tenantId)}` : ''}`)
  } catch (e) {
    const rawMsg = e instanceof Error ? e.message : '服务端异常'
    console.error('[facebook auth callback] server error:', rawMsg)
    res.redirect(`${frontendRedirect}?error=server&error_description=${encodeURIComponent('服务端异常，请稍后重试')}`)
  }
})

app.get('/api/facebook/pages', requireFacebookApiAuth, (req, res) => {
  const list = listFacebookPageSummaries()
  res.json({
    code: 0,
    message: 'success',
    data: list,
    meta: buildMeta(),
  })
})

app.delete('/api/facebook/pages/:pageId/revoke', requireFacebookApiAuth, (req, res) => {
  const pageId = String(req.params.pageId || '').trim()
  if (!pageId || !isValidFacebookPageId(pageId)) {
    res.status(400).json({
      code: 400,
      message: 'pageId 格式无效',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  const ok = revokeFacebookPageCredential(pageId)
  res.json({
    code: 0,
    message: ok ? 'success' : '未找到该主页凭证',
    data: { revoked: ok },
    meta: buildMeta(),
  })
})

app.post('/api/facebook/pages/:pageId/posts', requireFacebookApiAuth, async (req, res) => {
  const pageId = String(req.params.pageId || '').trim()
  if (!pageId || !isValidFacebookPageId(pageId)) {
    res.status(400).json({
      code: 400,
      message: 'pageId 格式无效',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  const token = getFacebookPageAccessToken(pageId)
  if (!token) {
    res.status(404).json({
      code: 404,
      message: '该主页未授权或已撤销',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  const body = req.body as { message?: string; link?: string }
  const message = body.message?.trim()
  const link = body.link?.trim()
  if (!message && !link) {
    res.status(400).json({
      code: 400,
      message: '请提供 message 或 link',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  try {
    const formBody = new URLSearchParams()
    if (message) formBody.set('message', message)
    if (link) formBody.set('link', link)
    formBody.set('access_token', token)
    const graphRes = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    })
    const result = (await graphRes.json()) as { id?: string; error?: { message: string; code?: number } }
    if (result.error) {
      res.status(400).json({
        code: 400,
        message: result.error.message || '发帖失败',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    res.json({
      code: 0,
      message: 'success',
      data: { postId: result.id },
      meta: buildMeta(),
    })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '发帖请求异常',
      data: null,
      meta: buildMeta(),
    })
  }
})

app.post('/api/facebook/pages/:pageId/posts/schedule', requireFacebookApiAuth, async (req, res) => {
  const pageId = String(req.params.pageId || '').trim()
  if (!pageId || !isValidFacebookPageId(pageId)) {
    res.status(400).json({
      code: 400,
      message: 'pageId 格式无效',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  const token = getFacebookPageAccessToken(pageId)
  if (!token) {
    res.status(404).json({
      code: 404,
      message: '该主页未授权或已撤销',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  const body = req.body as { message?: string; link?: string; scheduled_publish_time: number }
  const message = body.message?.trim()
  const link = body.link?.trim()
  const scheduled_publish_time = body.scheduled_publish_time
  if (!message && !link) {
    res.status(400).json({
      code: 400,
      message: '请提供 message 或 link',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  if (typeof scheduled_publish_time !== 'number' || scheduled_publish_time <= Math.floor(Date.now() / 1000)) {
    res.status(400).json({
      code: 400,
      message: 'scheduled_publish_time 必须为未来的 Unix 时间戳（秒）',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  try {
    const params: Record<string, string | number> = {
      published: 'false',
      scheduled_publish_time,
    }
    if (message) params.message = message
    if (link) params.link = link
    const formBody = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => formBody.set(k, String(v)))
    formBody.set('access_token', token)
    const graphRes = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    })
    const result = (await graphRes.json()) as { id?: string; error?: { message: string } }
    if (result.error) {
      res.status(400).json({
        code: 400,
        message: result.error.message || '定时发帖失败',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    res.json({
      code: 0,
      message: 'success',
      data: { postId: result.id },
      meta: buildMeta(),
    })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '定时发帖请求异常',
      data: null,
      meta: buildMeta(),
    })
  }
})

// ─── 批次 7：AgentTemplate / Skill / LLM Config API（依赖 Prisma）────────────────

async function getAgentTemplateDb() {
  try {
    return await import('./domain/agentTemplateDb')
  } catch {
    return null
  }
}
async function getSkillDb() {
  try {
    return await import('./domain/skillDb')
  } catch {
    return null
  }
}
async function getLLMConfigDb() {
  try {
    return await import('./domain/llmConfigDb')
  } catch {
    return null
  }
}
async function getSystemTerminalTypeDb() {
  try {
    return await import('./domain/systemTerminalTypeDb')
  } catch {
    return null
  }
}

// AgentTemplate
app.get('/api/agent-templates', async (req, res) => {
  const db = await getAgentTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const params = {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      keyword: req.query.keyword as string | undefined,
      status: req.query.status as string | undefined,
      category: req.query.category as string | undefined,
      domain: req.query.domain as string | undefined,
      roleType: req.query.roleType as string | undefined,
      isSystemPreset: req.query.isSystemPreset === 'true' ? true : req.query.isSystemPreset === 'false' ? false : undefined,
      platformType: req.query.platformType as string | undefined,
    }
    const result = await db.dbListAgentTemplates(params)
    res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.get('/api/agent-templates/:id', async (req, res) => {
  const db = await getAgentTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetAgentTemplateById(req.params.id)
    if (!data) {
      res.status(404).json({ code: 404, message: 'Agent 模板不存在', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.post('/api/agent-templates', async (req, res) => {
  const db = await getAgentTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    if (!body.name || !String(body.name).trim()) {
      res.status(400).json({ code: 400, message: '模板名称不能为空', data: null, meta: apiMeta() })
      return
    }
    if (!body.code || !String(body.code).trim()) {
      res.status(400).json({ code: 400, message: '模板编码不能为空', data: null, meta: apiMeta() })
      return
    }
    const payload = {
      name: String(body.name).trim(),
      code: String(body.code).trim(),
      description: body.description != null ? String(body.description) : undefined,
      roleType: String(body.roleType ?? 'other'),
      category: body.category != null ? String(body.category) : undefined,
      domain: body.domain != null ? String(body.domain) : undefined,
      sceneTags: Array.isArray(body.sceneTags) ? (body.sceneTags as string[]) : undefined,
      platformType: body.platformType != null ? String(body.platformType) : undefined,
      archetypeCode: body.archetypeCode != null ? String(body.archetypeCode) : undefined,
      parentTemplateId: body.parentTemplateId != null ? String(body.parentTemplateId) : undefined,
      supportedProjectTypeIds: Array.isArray(body.supportedProjectTypeIds) ? body.supportedProjectTypeIds as string[] : undefined,
      supportedGoalTypeIds: Array.isArray(body.supportedGoalTypeIds) ? body.supportedGoalTypeIds as string[] : undefined,
      supportedSkillIds: Array.isArray(body.supportedSkillIds) ? body.supportedSkillIds as string[] : undefined,
      defaultExecutorType: String(body.defaultExecutorType ?? 'agent'),
      allowedExecutorTypes: Array.isArray(body.allowedExecutorTypes) ? body.allowedExecutorTypes as string[] : undefined,
      allowedTerminalTypes: Array.isArray(body.allowedTerminalTypes) ? body.allowedTerminalTypes as string[] : undefined,
      defaultModelKey: body.defaultModelKey != null ? String(body.defaultModelKey) : undefined,
      fallbackModelKeys: Array.isArray(body.fallbackModelKeys) ? body.fallbackModelKeys as string[] : undefined,
      temperature: body.temperature != null ? Number(body.temperature) : undefined,
      maxTokens: body.maxTokens != null ? Number(body.maxTokens) : undefined,
      systemPromptTemplate: body.systemPromptTemplate != null ? String(body.systemPromptTemplate) : undefined,
      instructionTemplate: body.instructionTemplate != null ? String(body.instructionTemplate) : undefined,
      outputFormat: body.outputFormat != null ? String(body.outputFormat) : undefined,
      requireGoalContext: body.requireGoalContext as boolean | undefined,
      requireIdentityContext: body.requireIdentityContext as boolean | undefined,
      requireSOPContext: body.requireSOPContext as boolean | undefined,
      requireStructuredOutput: body.requireStructuredOutput as boolean | undefined,
      disallowDirectTerminalAction: body.disallowDirectTerminalAction as boolean | undefined,
      requireHumanReview: body.requireHumanReview as boolean | undefined,
      requireNodeReview: body.requireNodeReview as boolean | undefined,
      autoApproveWhenConfidenceGte: body.autoApproveWhenConfidenceGte != null ? Number(body.autoApproveWhenConfidenceGte) : undefined,
      manual: body.manual as boolean | undefined,
      semi_auto: body.semi_auto as boolean | undefined,
      full_auto: body.full_auto as boolean | undefined,
    }
    const data = await db.dbCreateAgentTemplate(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.put('/api/agent-templates/:id', async (req, res) => {
  const db = await getAgentTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbUpdateAgentTemplate(req.params.id, req.body as Record<string, unknown>)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.post('/api/agent-templates/:id/clone', async (req, res) => {
  const db = await getAgentTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as { name?: string; code?: string; category?: string; domain?: string; sceneTags?: string[]; inheritSkills?: boolean; inheritModelConfig?: boolean; inheritGuardrails?: boolean; inheritReviewPolicy?: boolean }
    const payload = {
      name: String(body.name ?? ''),
      code: String(body.code ?? ''),
      category: body.category != null ? String(body.category) : undefined,
      domain: body.domain != null ? String(body.domain) : undefined,
      sceneTags: Array.isArray(body.sceneTags) ? body.sceneTags : undefined,
      inheritSkills: body.inheritSkills,
      inheritModelConfig: body.inheritModelConfig,
      inheritGuardrails: body.inheritGuardrails,
      inheritReviewPolicy: body.inheritReviewPolicy,
    }
    const data = await db.dbCloneAgentTemplate(req.params.id, payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.patch('/api/agent-templates/:id/status', async (req, res) => {
  const db = await getAgentTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbChangeAgentTemplateStatus(req.params.id, status)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.delete('/api/agent-templates/:id', async (req, res) => {
  const db = await getAgentTemplateDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    await db.dbDeleteAgentTemplate(req.params.id)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// Skills
app.get('/api/skills', async (req, res) => {
  const db = await getSkillDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const params = {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      keyword: req.query.keyword as string | undefined,
      status: req.query.status as string | undefined,
      category: req.query.category as string | undefined,
    }
    const result = await db.dbListSkills(params)
    res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.get('/api/skills/:id', async (req, res) => {
  const db = await getSkillDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetSkillById(req.params.id)
    if (!data) {
      res.status(404).json({ code: 404, message: 'Skill 不存在', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.post('/api/skills', async (req, res) => {
  const db = await getSkillDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    if (!body.name || !String(body.name).trim()) {
      res.status(400).json({ code: 400, message: 'Skill 名称不能为空', data: null, meta: apiMeta() })
      return
    }
    if (!body.code || !String(body.code).trim()) {
      res.status(400).json({ code: 400, message: 'Skill 编码不能为空', data: null, meta: apiMeta() })
      return
    }
    const payload = {
      name: String(body.name).trim(),
      nameZh: body.nameZh != null ? String(body.nameZh) : undefined,
      code: String(body.code).trim(),
      category: String(body.category ?? ''),
      executionType: String(body.executionType ?? 'llm'),
      description: body.description != null ? String(body.description) : undefined,
      version: body.version != null ? String(body.version) : undefined,
      status: body.status != null ? String(body.status) : undefined,
      openClawSpec: body.openClawSpec != null && typeof body.openClawSpec === 'object' ? body.openClawSpec as { steps?: string[]; inputSchemaJson?: string; outputSchemaJson?: string } : undefined,
    }
    const data = await db.dbCreateSkill(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.put('/api/skills/:id', async (req, res) => {
  const db = await getSkillDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload: Record<string, unknown> = {}
    if (body.name !== undefined) payload.name = body.name
    if (body.nameZh !== undefined) payload.nameZh = body.nameZh
    if (body.description !== undefined) payload.description = body.description
    if (body.category !== undefined) payload.category = body.category
    if (body.executionType !== undefined) payload.executionType = body.executionType
    if (body.version !== undefined) payload.version = body.version
    if (body.status !== undefined) payload.status = body.status
    if (body.openClawSpec !== undefined) payload.openClawSpec = body.openClawSpec
    const data = await db.dbUpdateSkill(req.params.id, payload as Parameters<typeof db.dbUpdateSkill>[1])
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.patch('/api/skills/:id/status', async (req, res) => {
  const db = await getSkillDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbChangeSkillStatus(req.params.id, status)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.delete('/api/skills/:id', async (req, res) => {
  const db = await getSkillDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    await db.dbDeleteSkill(req.params.id)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// LLM Providers
app.get('/api/llm-providers', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbListProviders()
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.get('/api/llm-providers/:id', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetProviderById(req.params.id)
    if (!data) {
      res.status(404).json({ code: 404, message: '模型提供商不存在', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.post('/api/llm-providers', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    if (!body.name || !String(body.name).trim()) {
      res.status(400).json({ code: 400, message: '提供商名称不能为空', data: null, meta: apiMeta() })
      return
    }
    const payload = {
      name: String(body.name).trim(),
      nameZh: body.nameZh != null ? String(body.nameZh) : undefined,
      providerType: String(body.providerType ?? 'openai'),
      baseUrl: body.baseUrl != null ? String(body.baseUrl) : undefined,
      credentialId: body.credentialId != null ? String(body.credentialId) : undefined,
      status: body.status != null ? String(body.status) : undefined,
      notes: body.notes != null ? String(body.notes) : undefined,
    }
    const data = await db.dbCreateProvider(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.put('/api/llm-providers/:id', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbUpdateProvider(req.params.id, req.body as Record<string, unknown>)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.patch('/api/llm-providers/:id/status', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbChangeProviderStatus(req.params.id, status)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.delete('/api/llm-providers/:id', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    await db.dbDeleteProvider(req.params.id)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务端异常'
    res.status(400).json({ code: 400, message: msg, data: null, meta: apiMeta() })
  }
})

// LLM ModelConfigs
app.get('/api/llm-model-configs', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const providerId = req.query.providerId as string | undefined
    const data = await db.dbListModelConfigs(providerId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.get('/api/llm-model-configs/:id', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetModelConfigById(req.params.id)
    if (!data) {
      res.status(404).json({ code: 404, message: '模型配置不存在', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.post('/api/llm-model-configs', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    if (!body.name || !String(body.name).trim()) {
      res.status(400).json({ code: 400, message: '模型配置名称不能为空', data: null, meta: apiMeta() })
      return
    }
    if (!body.providerId || !String(body.providerId).trim()) {
      res.status(400).json({ code: 400, message: '必须指定模型提供商', data: null, meta: apiMeta() })
      return
    }
    if (!body.modelKey || !String(body.modelKey).trim()) {
      res.status(400).json({ code: 400, message: '模型标识（modelKey）不能为空', data: null, meta: apiMeta() })
      return
    }
    const payload = {
      id: body.id != null ? String(body.id) : undefined,
      name: String(body.name).trim(),
      nameZh: body.nameZh != null ? String(body.nameZh) : undefined,
      providerId: String(body.providerId).trim(),
      modelKey: String(body.modelKey).trim(),
      isEnabled: body.isEnabled as boolean | undefined,
      isDefault: body.isDefault as boolean | undefined,
      temperature: body.temperature != null ? Number(body.temperature) : undefined,
      maxTokens: body.maxTokens != null ? Number(body.maxTokens) : undefined,
      timeoutMs: body.timeoutMs != null ? Number(body.timeoutMs) : undefined,
      retryCount: body.retryCount != null ? Number(body.retryCount) : undefined,
      structuredOutputMode: body.structuredOutputMode != null ? String(body.structuredOutputMode) : undefined,
      fallbackModelConfigId: body.fallbackModelConfigId != null ? String(body.fallbackModelConfigId) : undefined,
      supportedAgentCategories: Array.isArray(body.supportedAgentCategories) ? body.supportedAgentCategories as string[] : undefined,
      notes: body.notes != null ? String(body.notes) : undefined,
    }
    const data = await db.dbCreateModelConfig(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.put('/api/llm-model-configs/:id', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbUpdateModelConfig(req.params.id, req.body as Record<string, unknown>)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.patch('/api/llm-model-configs/:id/enabled', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const isEnabled = (req.body as { isEnabled?: boolean })?.isEnabled
    if (typeof isEnabled !== 'boolean') {
      res.status(400).json({ code: 400, message: '缺少 isEnabled', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbSetModelConfigEnabled(req.params.id, isEnabled)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.patch('/api/llm-model-configs/:id/default', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbSetDefaultModelConfig(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.delete('/api/llm-model-configs/:id', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    await db.dbDeleteModelConfig(req.params.id)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务端异常'
    res.status(400).json({ code: 400, message: msg, data: null, meta: apiMeta() })
  }
})

// Agent LLM Bindings
app.get('/api/agent-llm-bindings', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const agentTemplateId = req.query.agentTemplateId as string | undefined
    const data = await db.dbListBindings(agentTemplateId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.post('/api/agent-llm-bindings', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload = {
      agentTemplateId: String(body.agentTemplateId ?? ''),
      modelConfigId: String(body.modelConfigId ?? ''),
      bindingType: String(body.bindingType ?? 'primary'),
      priority: body.priority != null ? Number(body.priority) : undefined,
      isEnabled: body.isEnabled as boolean | undefined,
      notes: body.notes != null ? String(body.notes) : undefined,
    }
    const data = await db.dbCreateBinding(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.put('/api/agent-llm-bindings/:id', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbUpdateBinding(req.params.id, req.body as Record<string, unknown>)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.delete('/api/agent-llm-bindings/:id', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    await db.dbDeleteBinding(req.params.id)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.post('/api/agent-llm-bindings/set-primary', async (req, res) => {
  const db = await getLLMConfigDb()
  if (!db) {
    res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as { agentTemplateId?: string; modelConfigId?: string }
    const agentTemplateId = body?.agentTemplateId
    const modelConfigId = body?.modelConfigId
    if (!agentTemplateId || !modelConfigId) {
      res.status(400).json({ code: 400, message: '缺少 agentTemplateId 或 modelConfigId', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbSetPrimaryBinding(agentTemplateId, modelConfigId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── 批次 8：SystemTerminalType（终端类型工厂）────────────────────────────────────

app.get('/api/system-terminal-types', async (req, res) => {
  const db = await getSystemTerminalTypeDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '终端类型持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const params = {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      keyword: req.query.keyword as string | undefined,
      typeCategory: req.query.typeCategory as string | undefined,
      status: req.query.status as string | undefined,
    }
    const result = await db.dbListSystemTerminalTypes(params)
    res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.get('/api/system-terminal-types/:id', async (req, res) => {
  const db = await getSystemTerminalTypeDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '终端类型持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetSystemTerminalTypeById(req.params.id)
    if (!data) {
      res.status(404).json({ code: 404, message: '终端类型不存在', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.get('/api/system-terminal-types/:id/usage', async (req, res) => {
  const db = await getSystemTerminalTypeDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '终端类型持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const row = await db.dbGetSystemTerminalTypeById(req.params.id)
    if (!row) {
      res.status(404).json({ code: 404, message: '终端类型不存在', data: null, meta: apiMeta() })
      return
    }
    const usage = await db.dbGetSystemTerminalTypeUsage(row.code)
    res.json({ code: 0, message: 'success', data: usage, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.post('/api/system-terminal-types', async (req, res) => {
  const db = await getSystemTerminalTypeDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '终端类型持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    if (!body.name || !String(body.name).trim()) {
      res.status(400).json({ code: 400, message: '类型名称不能为空', data: null, meta: apiMeta() })
      return
    }
    if (!body.nameZh || !String(body.nameZh).trim()) {
      res.status(400).json({ code: 400, message: '类型中文名称不能为空', data: null, meta: apiMeta() })
      return
    }
    if (!body.code || !String(body.code).trim()) {
      res.status(400).json({ code: 400, message: '类型编码不能为空', data: null, meta: apiMeta() })
      return
    }
    if (!body.typeCategory || !['api', 'browser', 'mcp'].includes(String(body.typeCategory))) {
      res.status(400).json({ code: 400, message: '类别必须为 api / browser / mcp 之一', data: null, meta: apiMeta() })
      return
    }
    const payload = {
      id: body.id != null ? String(body.id) : undefined,
      name: String(body.name).trim(),
      nameZh: String(body.nameZh).trim(),
      code: String(body.code).trim(),
      typeCategory: String(body.typeCategory),
      icon: body.icon != null ? String(body.icon) : undefined,
      description: body.description != null ? String(body.description) : undefined,
      authSchema: body.authSchema != null ? String(body.authSchema) : undefined,
      configSchema: body.configSchema != null ? String(body.configSchema) : undefined,
      supportedProjectTypeIds: Array.isArray(body.supportedProjectTypeIds)
        ? (body.supportedProjectTypeIds as string[])
        : undefined,
      capabilityTags: Array.isArray(body.capabilityTags) ? (body.capabilityTags as string[]) : undefined,
      status: body.status != null ? String(body.status) : undefined,
      isSystemPreset: body.isSystemPreset === true,
      version: body.version != null ? String(body.version) : undefined,
    }
    const data = await db.dbCreateSystemTerminalType(payload)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.put('/api/system-terminal-types/:id', async (req, res) => {
  const db = await getSystemTerminalTypeDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '终端类型持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const body = req.body as Record<string, unknown>
    const payload: Record<string, unknown> = {}
    if (body.name !== undefined) payload.name = String(body.name)
    if (body.nameZh !== undefined) payload.nameZh = String(body.nameZh)
    if (body.code !== undefined) payload.code = String(body.code)
    if (body.typeCategory !== undefined) payload.typeCategory = String(body.typeCategory)
    if (body.icon !== undefined) payload.icon = body.icon != null ? String(body.icon) : undefined
    if (body.description !== undefined) payload.description = body.description != null ? String(body.description) : undefined
    if (body.authSchema !== undefined) payload.authSchema = body.authSchema != null ? String(body.authSchema) : undefined
    if (body.configSchema !== undefined) payload.configSchema = body.configSchema != null ? String(body.configSchema) : undefined
    if (body.supportedProjectTypeIds !== undefined)
      payload.supportedProjectTypeIds = Array.isArray(body.supportedProjectTypeIds)
        ? (body.supportedProjectTypeIds as string[])
        : undefined
    if (body.capabilityTags !== undefined)
      payload.capabilityTags = Array.isArray(body.capabilityTags) ? (body.capabilityTags as string[]) : undefined
    if (body.status !== undefined) payload.status = String(body.status)
    if (body.isSystemPreset !== undefined) payload.isSystemPreset = body.isSystemPreset === true
    if (body.version !== undefined) payload.version = String(body.version)
    const data = await db.dbUpdateSystemTerminalType(req.params.id, payload as Parameters<typeof db.dbUpdateSystemTerminalType>[1])
    if (!data) {
      res.status(404).json({ code: 404, message: '终端类型不存在', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.patch('/api/system-terminal-types/:id/status', async (req, res) => {
  const db = await getSystemTerminalTypeDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '终端类型持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const status = (req.body as { status?: string })?.status
    if (!status) {
      res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbChangeSystemTerminalTypeStatus(req.params.id, status)
    if (!data) {
      res.status(404).json({ code: 404, message: '终端类型不存在', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.delete('/api/system-terminal-types/:id', async (req, res) => {
  const db = await getSystemTerminalTypeDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '终端类型持久化未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    await db.dbDeleteSystemTerminalType(req.params.id)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务端异常'
    res.status(400).json({ code: 400, message: msg, data: null, meta: apiMeta() })
  }
})

// ─── 平台终端能力注册（替代终端类型工厂，只读 + 启用/停用）────────────────────────
const platformCapabilitiesStore: {
  items: Array<{
    id: string
    code: string
    name: string
    nameZh: string
    description: string
    protocolType: string
    authType: string
    supportedProjectTypeIds: string[]
    supportedExecutionTypes: string[]
    supportedIntentTypes: string[]
    configFields: Array<{ key: string; label: string; type: string; required: boolean; description?: string }>
    status: string
    isBuiltIn: boolean
    connectedTerminalCount?: number
    createdAt: string
    updatedAt: string
  }>
} = {
  items: [
    {
      id: 'cap-facebook-page-001',
      code: 'facebook_page_api',
      name: 'Facebook Page API',
      nameZh: 'Facebook 公共主页 API',
      description: '通过 Graph API 管理 Facebook 公共主页发帖、预约发布与基础洞察',
      protocolType: 'oauth2',
      authType: 'oauth2',
      supportedProjectTypeIds: ['project-type-social'],
      supportedExecutionTypes: ['agent_task', 'result_writer'],
      supportedIntentTypes: ['publish', 'record', 'create'],
      configFields: [
        { key: 'pageId', label: '主页 ID', type: 'string', required: true, description: 'Facebook 公共主页 ID' },
        { key: 'accessToken', label: '访问令牌', type: 'oauth_token', required: true },
      ],
      status: 'active',
      isBuiltIn: true,
      connectedTerminalCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
}
app.get('/api/platform-capabilities', (req, res) => {
  try {
    let list = [...platformCapabilitiesStore.items]
    const status = req.query.status as string | undefined
    const protocolType = req.query.protocolType as string | undefined
    if (status) list = list.filter((c) => c.status === status)
    if (protocolType) list = list.filter((c) => c.protocolType === protocolType)
    res.json({ code: 0, message: 'success', data: { items: list, total: list.length }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.get('/api/platform-capabilities/:code', (req, res) => {
  try {
    const cap = platformCapabilitiesStore.items.find((c) => c.code === req.params.code)
    if (!cap) {
      res.status(404).json({ code: 404, message: '终端能力不存在', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data: cap, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.patch('/api/platform-capabilities/:id/status', (req, res) => {
  try {
    const id = req.params.id
    const status = (req.body as { status?: string })?.status
    if (!status || !['active', 'beta', 'disabled', 'coming_soon'].includes(status)) {
      res.status(400).json({ code: 400, message: 'status 必须为 active/beta/disabled/coming_soon 之一', data: null, meta: apiMeta() })
      return
    }
    const cap = platformCapabilitiesStore.items.find((c) => c.id === id)
    if (!cap) {
      res.status(404).json({ code: 404, message: '终端能力不存在', data: null, meta: apiMeta() })
      return
    }
    cap.status = status
    cap.updatedAt = new Date().toISOString()
    res.json({ code: 0, message: 'success', data: { ...cap }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// 批次 9：项目工作台聚合 + 子域 CRUD + 运行日志 + 监督决策 + 发布记录 + Config + Stats
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 延迟加载辅助 ─────────────────────────────────────────────────────────────
async function getProjectSubdomainDb() {
  try {
    return await import('./domain/projectSubdomainDb')
  } catch {
    return null
  }
}
async function getProjectWorkbenchDb() {
  try {
    return await import('./domain/projectWorkbenchDb')
  } catch {
    return null
  }
}
async function getWorkflowRuntimeLogDb() {
  try {
    return await import('./domain/workflowRuntimeLogDb')
  } catch {
    return null
  }
}
async function getWorkflowSupervisorDecisionDb() {
  try {
    return await import('./domain/workflowSupervisorDecisionDb')
  } catch {
    return null
  }
}
async function getWorkflowPublishRecordDb() {
  try {
    return await import('./domain/workflowPublishRecordDb')
  } catch {
    return null
  }
}

// ─── GET /api/projects/:id/workbench — 项目工作台聚合 ────────────────────────
app.get('/api/projects/:id/workbench', async (req, res) => {
  const db = await getProjectWorkbenchDb()
  if (!db) {
    res.status(503).json({ code: 503, message: '工作台聚合服务未就绪', data: null, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetProjectWorkbench(req.params.id)
    if (!data) {
      res.status(404).json({ code: 404, message: '项目不存在', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── GET /api/projects/:id/identity-bindings — 项目身份绑定列表 ──────────────
app.get('/api/projects/:id/identity-bindings', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const data = await db.dbListProjectIdentityBindings(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── POST /api/projects/:id/identity-bindings — 新增项目身份绑定 ─────────────
app.post('/api/projects/:id/identity-bindings', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const body = req.body as { identityId?: string; isDefault?: boolean }
    if (!body.identityId) { res.status(400).json({ code: 400, message: '缺少 identityId', data: null, meta: apiMeta() }); return }
    const data = await db.dbAddProjectIdentityBinding({
      projectId: req.params.id,
      identityId: body.identityId,
      isDefault: body.isDefault ?? false,
    })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── DELETE /api/projects/:id/identity-bindings/:identityId ─────────────────
app.delete('/api/projects/:id/identity-bindings/:identityId', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    await db.dbRemoveProjectIdentityBinding(req.params.id, req.params.identityId)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── PATCH /api/projects/:id/identity-bindings/:identityId/set-default ───────
app.patch('/api/projects/:id/identity-bindings/:identityId/set-default', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    await db.dbSetDefaultProjectIdentityBinding(req.params.id, req.params.identityId)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── GET /api/projects/:id/deliverables ─────────────────────────────────────
app.get('/api/projects/:id/deliverables', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const data = await db.dbListProjectDeliverables(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── POST /api/projects/:id/deliverables ────────────────────────────────────
app.post('/api/projects/:id/deliverables', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const body = req.body as { deliverableType?: string; description?: string; frequency?: string; target?: string; notes?: string }
    if (!body.deliverableType || !body.description) {
      res.status(400).json({ code: 400, message: '缺少必填字段', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbCreateProjectDeliverable({ projectId: req.params.id, ...body as Required<typeof body> })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── PUT /api/projects/:id/deliverables/:deliverableId ──────────────────────
app.put('/api/projects/:id/deliverables/:deliverableId', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const data = await db.dbUpdateProjectDeliverable(req.params.deliverableId, req.body as Record<string, unknown>)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── DELETE /api/projects/:id/deliverables/:deliverableId ───────────────────
app.delete('/api/projects/:id/deliverables/:deliverableId', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    await db.dbDeleteProjectDeliverable(req.params.deliverableId)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── POST /api/projects/:id/deliverables/replace-all — 批量替换（创建向导）──
app.post('/api/projects/:id/deliverables/replace-all', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const items = (req.body as { items?: unknown[] })?.items ?? []
    const data = await db.dbReplaceProjectDeliverables(req.params.id, items as Parameters<typeof db.dbReplaceProjectDeliverables>[1])
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── GET /api/projects/:id/resource-configs ─────────────────────────────────
app.get('/api/projects/:id/resource-configs', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const data = await db.dbListProjectResourceConfigs(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── POST /api/projects/:id/resource-configs ────────────────────────────────
app.post('/api/projects/:id/resource-configs', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const body = req.body as { configType?: string; label?: string; value?: string; notes?: string }
    if (!body.configType || !body.label || !body.value) {
      res.status(400).json({ code: 400, message: '缺少必填字段', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbCreateProjectResourceConfig({ projectId: req.params.id, ...body as Required<typeof body> })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── PUT/DELETE /api/projects/:id/resource-configs/:configId ────────────────
app.put('/api/projects/:id/resource-configs/:configId', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const data = await db.dbUpdateProjectResourceConfig(req.params.configId, req.body as Record<string, unknown>)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})
app.delete('/api/projects/:id/resource-configs/:configId', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    await db.dbDeleteProjectResourceConfig(req.params.configId)
    res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── POST /api/projects/:id/resource-configs/replace-all ────────────────────
app.post('/api/projects/:id/resource-configs/replace-all', async (req, res) => {
  const db = await getProjectSubdomainDb()
  if (!db) { res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const items = (req.body as { items?: unknown[] })?.items ?? []
    const data = await db.dbReplaceProjectResourceConfigs(req.params.id, items as Parameters<typeof db.dbReplaceProjectResourceConfigs>[1])
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── GET /api/workflow-instances/:id/runtime-logs ───────────────────────────
app.get('/api/workflow-instances/:id/runtime-logs', async (req, res) => {
  const db = await getWorkflowRuntimeLogDb()
  if (!db) { res.status(503).json({ code: 503, message: '运行日志服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const data = await db.dbListRuntimeLogs(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── POST /api/workflow-instances/:id/runtime-logs ──────────────────────────
app.post('/api/workflow-instances/:id/runtime-logs', async (req, res) => {
  const db = await getWorkflowRuntimeLogDb()
  if (!db) { res.status(503).json({ code: 503, message: '运行日志服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const body = req.body as { eventType?: string; messageZh?: string; nodeId?: string; operatorId?: string; meta?: Record<string, unknown> }
    if (!body.eventType || !body.messageZh) {
      res.status(400).json({ code: 400, message: '缺少 eventType / messageZh', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbAppendRuntimeLog({ instanceId: req.params.id, ...body as Required<typeof body> })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── GET /api/workflow-instances/:id/supervisor-decisions ───────────────────
app.get('/api/workflow-instances/:id/supervisor-decisions', async (req, res) => {
  const db = await getWorkflowSupervisorDecisionDb()
  if (!db) { res.status(503).json({ code: 503, message: '监督决策服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const data = await db.dbListSupervisorDecisions(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── POST /api/workflow-instances/:id/supervisor-decisions ──────────────────
app.post('/api/workflow-instances/:id/supervisor-decisions', async (req, res) => {
  const db = await getWorkflowSupervisorDecisionDb()
  if (!db) { res.status(503).json({ code: 503, message: '监督决策服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const body = req.body as { decisionType?: string; reason?: string; nodeId?: string; suggestedNextAction?: string; relatedErrorSummary?: string }
    if (!body.decisionType || !body.reason) {
      res.status(400).json({ code: 400, message: '缺少 decisionType / reason', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbCreateSupervisorDecision({ instanceId: req.params.id, ...body as Required<typeof body> })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── GET /api/supervisor-decisions/:id ───────────────────────────────────────
app.get('/api/supervisor-decisions/:id', async (req, res) => {
  const db = await getWorkflowSupervisorDecisionDb()
  if (!db) { res.status(503).json({ code: 503, message: '监督决策服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const data = await db.dbGetSupervisorDecisionById(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── PATCH /api/supervisor-decisions/:id/status ─────────────────────────────
app.patch('/api/supervisor-decisions/:id/status', async (req, res) => {
  const db = await getWorkflowSupervisorDecisionDb()
  if (!db) { res.status(503).json({ code: 503, message: '监督决策服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const body = req.body as { status?: string; appliedBy?: string }
    if (!body.status || !['applied', 'dismissed'].includes(body.status)) {
      res.status(400).json({ code: 400, message: 'status 必须为 applied 或 dismissed', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbUpdateSupervisorDecisionStatus(req.params.id, body.status as 'applied' | 'dismissed', body.appliedBy)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── GET /api/workflow-templates/:id/publish-records ────────────────────────
app.get('/api/workflow-templates/:id/publish-records', async (req, res) => {
  const db = await getWorkflowPublishRecordDb()
  if (!db) { res.status(503).json({ code: 503, message: '发布记录服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const data = await db.dbListPublishRecords(req.params.id)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── POST /api/workflow-templates/:id/publish-records ───────────────────────
app.post('/api/workflow-templates/:id/publish-records', async (req, res) => {
  const db = await getWorkflowPublishRecordDb()
  if (!db) { res.status(503).json({ code: 503, message: '发布记录服务未就绪', data: null, meta: apiMeta() }); return }
  try {
    const body = req.body as { publishedBy?: string; planningSessionId?: string; planningDraftId?: string; draftVersion?: number; notes?: string }
    if (!body.publishedBy) {
      res.status(400).json({ code: 400, message: '缺少 publishedBy', data: null, meta: apiMeta() })
      return
    }
    const data = await db.dbCreatePublishRecord({ templateId: req.params.id, ...body as Required<typeof body> })
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── /api/config/* — 项目类型 / 目标类型 / 指标选项（静态配置文件）────────────
const configDir = path.join(process.cwd(), 'server', 'config')

function readConfigJson<T>(filename: string): T {
  const filePath = path.join(configDir, filename)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return [] as unknown as T
  }
}

app.get('/api/config/project-types', (_req, res) => {
  const data = readConfigJson<unknown[]>('projectTypes.json')
  res.json({ code: 0, message: 'success', data, meta: apiMeta() })
})
app.get('/api/config/goal-types', (_req, res) => {
  const data = readConfigJson<unknown[]>('goalTypes.json')
  res.json({ code: 0, message: 'success', data, meta: apiMeta() })
})
app.get('/api/config/goal-metric-options', (_req, res) => {
  const data = readConfigJson<unknown[]>('goalMetricOptions.json')
  res.json({ code: 0, message: 'success', data, meta: apiMeta() })
})

// ─── /api/stats/* — 聚合统计（仪表盘 / 任务中心 / 平台）────────────────────────
async function getStatsDb() {
  try {
    return await import('./domain/statsDb')
  } catch {
    return null
  }
}

app.get('/api/stats/tenant-dashboard', async (req, res) => {
  const tenantId = String(req.query.tenantId ?? '')
  if (!tenantId) {
    res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
    return
  }
  const db = await getStatsDb()
  if (!db) {
    res.json({ code: 0, message: 'success', data: { projectCount: 0, taskCount: 0, instanceCount: 0, identityCount: 0, terminalCount: 0 }, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetTenantDashboardStats(tenantId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/stats/task-center', async (req, res) => {
  const tenantId = String(req.query.tenantId ?? '')
  if (!tenantId) {
    res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
    return
  }
  const db = await getStatsDb()
  if (!db) {
    res.json({ code: 0, message: 'success', data: { total: 0, pending: 0, running: 0, completed: 0, failed: 0 }, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetTaskCenterStats(tenantId)
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

app.get('/api/stats/platform-dashboard', async (_req, res) => {
  const db = await getStatsDb()
  if (!db) {
    res.json({ code: 0, message: 'success', data: { tenantCount: 0, projectCount: 0, agentCount: 0, skillCount: 0 }, meta: apiMeta() })
    return
  }
  try {
    const data = await db.dbGetPlatformDashboardStats()
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

// ─── /api/planner-strategy-profiles/:id — 规划策略配置（内置常量）────────────
app.get('/api/planner-strategy-profiles/:id', async (req, res) => {
  try {
    const { getPlannerStrategyProfileById } = await import('./data/plannerStrategyProfiles')
    const profile = getPlannerStrategyProfileById(req.params.id)
    if (!profile) {
      res.status(404).json({ code: 404, message: '未找到该策略配置', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data: profile, meta: apiMeta() })
  } catch (e) {
    res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
  }
})

if (process.env.NODE_ENV === 'production') {
  const { mountStaticFiles } = await import('./staticServe')
  mountStaticFiles(app)
}

app.listen(PORT, async () => {
  try {
    const { seedAgentTemplatesIfEmpty } = await import('./domain/agentTemplateSeed')
    const { seedSkillsIfEmpty } = await import('./domain/skillSeed')
    const { seedLLMConfigIfEmpty } = await import('./domain/llmConfigSeed')
    const { seedSystemTerminalTypesIfEmpty } = await import('./domain/systemTerminalTypeSeed')
    const { seedAdminUserIfMissing } = await import('./auth/userSeed')
    await seedAgentTemplatesIfEmpty()
    await seedSkillsIfEmpty()
    await seedLLMConfigIfEmpty()
    await seedSystemTerminalTypesIfEmpty()
    await seedAdminUserIfMissing()
  } catch (e) {
    // eslint-disable-next-line no-console -- startup seed may fail if DB not ready
    console.warn('[seed]', e)
  }
  // eslint-disable-next-line no-console -- startup message
  console.log(`[Phase 17.7a] LLM API 服务已启动: http://localhost:${PORT}`)
})
