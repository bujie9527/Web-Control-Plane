import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getWorkflowTemplateDb() {
  try {
    return await import('../domain/workflowTemplateDb')
  } catch {
    return null
  }
}

async function getWorkflowInstanceDb() {
  try {
    return await import('../domain/workflowInstanceDb')
  } catch {
    return null
  }
}

export function registerWorkflowRoutes(app: Express): void {
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
        supportedProjectTypeId:
          body.supportedProjectTypeId != null ? String(body.supportedProjectTypeId) : undefined,
        supportedGoalTypeIds: Array.isArray(body.supportedGoalTypeIds)
          ? (body.supportedGoalTypeIds as string[])
          : undefined,
        supportedDeliverableModes: Array.isArray(body.supportedDeliverableModes)
          ? (body.supportedDeliverableModes as string[])
          : undefined,
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
        dependsOnNodeIds: Array.isArray(body.dependsOnNodeIds)
          ? (body.dependsOnNodeIds as string[])
          : undefined,
        recommendedAgentTemplateId:
          body.recommendedAgentTemplateId != null
            ? String(body.recommendedAgentTemplateId)
            : undefined,
        allowedSkillIds: Array.isArray(body.allowedSkillIds)
          ? (body.allowedSkillIds as string[])
          : undefined,
        allowedTerminalTypes: Array.isArray(body.allowedTerminalTypes)
          ? (body.allowedTerminalTypes as string[])
          : undefined,
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
      if (body.recommendedAgentTemplateId !== undefined)
        payload.recommendedAgentTemplateId = body.recommendedAgentTemplateId
      if (body.allowedSkillIds !== undefined) payload.allowedSkillIds = body.allowedSkillIds
      if (body.allowedTerminalTypes !== undefined)
        payload.allowedTerminalTypes = body.allowedTerminalTypes
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
      res.status(400).json({
        code: 400,
        message: '缺少 projectId、tenantId 或 workflowTemplateId',
        data: null,
        meta: apiMeta(),
      })
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
      if (body.workerExecutionDurationMs !== undefined)
        payload.workerExecutionDurationMs = body.workerExecutionDurationMs
      if (body.workerExecutionAgentId !== undefined)
        payload.workerExecutionAgentId = body.workerExecutionAgentId
      if (body.selectedAgentTemplateId !== undefined)
        payload.selectedAgentTemplateId = body.selectedAgentTemplateId
      if (body.selectedSkillIds !== undefined) payload.selectedSkillIds = body.selectedSkillIds
      if (body.skillExecutionLog !== undefined) payload.skillExecutionLog = body.skillExecutionLog
      if (body.channelType !== undefined) payload.channelType = body.channelType
      if (body.channelStyleApplied !== undefined) payload.channelStyleApplied = body.channelStyleApplied
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
      const { executeInstanceNode } = await import('../domain/workflowNodeExecutor')
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

  app.post('/api/workflow-instances/:instanceId/execute-all', async (req, res) => {
    try {
      const { executeInstanceSequential } = await import('../domain/workflowNodeExecutor')
      const data = await executeInstanceSequential(req.params.instanceId)
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
        workflowInstanceId:
          body.workflowInstanceId != null ? String(body.workflowInstanceId) : undefined,
        workflowInstanceNodeId:
          body.workflowInstanceNodeId != null ? String(body.workflowInstanceNodeId) : undefined,
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
}
