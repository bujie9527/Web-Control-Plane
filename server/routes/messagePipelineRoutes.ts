import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getMessagePipelineDb() {
  try {
    return await import('../domain/messagePipelineDb')
  } catch {
    return null
  }
}

async function getIdentityTerminalDb() {
  try {
    return await import('../domain/identityTerminalDb')
  } catch {
    return null
  }
}

export function registerMessagePipelineRoutes(app: Express): void {
  app.post('/api/integrations/telegram/webhook/:terminalId', async (req, res) => {
    const pipelineDb = await getMessagePipelineDb()
    const terminalDb = await getIdentityTerminalDb()
    if (!pipelineDb || !terminalDb) {
      res.status(503).json({ code: 503, message: '消息管线服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const terminal = await terminalDb.dbGetTerminalById(req.params.terminalId)
      if (!terminal) {
        res.status(404).json({ code: 404, message: '终端不存在', data: null, meta: apiMeta() })
        return
      }
      const update = req.body as Record<string, unknown>
      const msg = (update.message ?? update.edited_message) as Record<string, unknown> | undefined
      if (!msg) {
        res.json({ code: 0, message: 'success', data: { accepted: true, ignored: true }, meta: apiMeta() })
        return
      }
      const chat = (msg.chat as Record<string, unknown> | undefined) ?? {}
      const from = (msg.from as Record<string, unknown> | undefined) ?? {}
      const text = typeof msg.text === 'string' ? msg.text : ''
      const conversation = await pipelineDb.dbUpsertConversation({
        tenantId: terminal.tenantId,
        terminalId: terminal.id,
        channelType: 'telegram',
        externalChatId: String(chat.id ?? ''),
        title: String(chat.title ?? chat.username ?? ''),
      })
      const incoming = await pipelineDb.dbCreateIncomingMessage({
        tenantId: terminal.tenantId,
        terminalId: terminal.id,
        conversationId: conversation.id,
        channelType: 'telegram',
        externalMessageId: msg.message_id ? String(msg.message_id) : undefined,
        senderExternalId: from.id ? String(from.id) : undefined,
        senderName: String(from.username ?? from.first_name ?? ''),
        messageType: text ? 'text' : 'system',
        contentText: text,
        payloadJson: update,
      })
      res.json({
        code: 0,
        message: 'success',
        data: { accepted: true, conversationId: conversation.id, incomingMessageId: incoming.id },
        meta: apiMeta(),
      })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : 'Webhook 处理失败', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/messages/incoming', async (req, res) => {
    const pipelineDb = await getMessagePipelineDb()
    if (!pipelineDb) {
      res.status(503).json({ code: 503, message: '消息管线服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const tenantId = String(req.query.tenantId ?? '')
      if (!tenantId) {
        res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
        return
      }
      const data = await pipelineDb.dbListIncomingMessages(tenantId, req.query.limit ? Number(req.query.limit) : 50)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '查询失败', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/messages/conversations', async (req, res) => {
    const pipelineDb = await getMessagePipelineDb()
    if (!pipelineDb) {
      res.status(503).json({ code: 503, message: '消息管线服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const tenantId = String(req.query.tenantId ?? '')
      if (!tenantId) {
        res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
        return
      }
      const data = await pipelineDb.dbListConversations(tenantId, req.query.limit ? Number(req.query.limit) : 50)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '查询失败', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/messages/outgoing', async (req, res) => {
    const pipelineDb = await getMessagePipelineDb()
    if (!pipelineDb) {
      res.status(503).json({ code: 503, message: '消息管线服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const tenantId = String(req.query.tenantId ?? '')
      if (!tenantId) {
        res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
        return
      }
      const data = await pipelineDb.dbListOutgoingMessages(tenantId, req.query.limit ? Number(req.query.limit) : 50)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '查询失败', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/messages/process', async (req, res) => {
    const pipelineDb = await getMessagePipelineDb()
    if (!pipelineDb) {
      res.status(503).json({ code: 503, message: '消息管线服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as { tenantId?: string; limit?: number }
      const tenantId = String(body.tenantId ?? '')
      if (!tenantId) {
        res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
        return
      }
      const data = await pipelineDb.dbProcessPendingIncomingMessages(tenantId, body.limit ?? 20)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '处理失败', data: null, meta: apiMeta() })
    }
  })
}

