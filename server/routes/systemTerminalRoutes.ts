import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getSystemTerminalTypeDb() {
  try {
    return await import('../domain/systemTerminalTypeDb')
  } catch {
    return null
  }
}

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
        {
          key: 'pageId',
          label: '主页 ID',
          type: 'string',
          required: true,
          description: 'Facebook 公共主页 ID',
        },
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

export function registerSystemTerminalRoutes(app: Express): void {
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
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
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
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
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
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
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
        res.status(400).json({
          code: 400,
          message: '类别必须为 api / browser / mcp 之一',
          data: null,
          meta: apiMeta(),
        })
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
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
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
      if (body.description !== undefined)
        payload.description = body.description != null ? String(body.description) : undefined
      if (body.authSchema !== undefined)
        payload.authSchema = body.authSchema != null ? String(body.authSchema) : undefined
      if (body.configSchema !== undefined)
        payload.configSchema = body.configSchema != null ? String(body.configSchema) : undefined
      if (body.supportedProjectTypeIds !== undefined)
        payload.supportedProjectTypeIds = Array.isArray(body.supportedProjectTypeIds)
          ? (body.supportedProjectTypeIds as string[])
          : undefined
      if (body.capabilityTags !== undefined)
        payload.capabilityTags = Array.isArray(body.capabilityTags)
          ? (body.capabilityTags as string[])
          : undefined
      if (body.status !== undefined) payload.status = String(body.status)
      if (body.isSystemPreset !== undefined) payload.isSystemPreset = body.isSystemPreset === true
      if (body.version !== undefined) payload.version = String(body.version)
      const data = await db.dbUpdateSystemTerminalType(
        req.params.id,
        payload as Parameters<typeof db.dbUpdateSystemTerminalType>[1]
      )
      if (!data) {
        res.status(404).json({ code: 404, message: '终端类型不存在', data: null, meta: apiMeta() })
        return
      }
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
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
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

  app.get('/api/platform-capabilities', (req, res) => {
    try {
      let list = [...platformCapabilitiesStore.items]
      const status = req.query.status as string | undefined
      const protocolType = req.query.protocolType as string | undefined
      if (status) list = list.filter((c) => c.status === status)
      if (protocolType) list = list.filter((c) => c.protocolType === protocolType)
      res.json({ code: 0, message: 'success', data: { items: list, total: list.length }, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
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
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.patch('/api/platform-capabilities/:id/status', (req, res) => {
    try {
      const id = req.params.id
      const status = (req.body as { status?: string })?.status
      if (!status || !['active', 'beta', 'disabled', 'coming_soon'].includes(status)) {
        res.status(400).json({
          code: 400,
          message: 'status 必须为 active/beta/disabled/coming_soon 之一',
          data: null,
          meta: apiMeta(),
        })
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
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })
}
