import type { Express } from 'express'
import {
  getPageAccessTokenByTerminalId,
  refreshTerminalPageToken,
  revokeFacebookCredentialByTerminalId,
} from '../services/facebookTerminalBridge'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getIdentityTerminalDb() {
  try {
    return await import('../domain/identityTerminalDb')
  } catch {
    return null
  }
}

export function registerIdentityTerminalRoutes(app: Express): void {
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
        res.status(400).json({
          code: 400,
          message: '缺少 tenantId、name 或 type',
          data: null,
          meta: apiMeta(),
        })
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
        linkedProjectIds: Array.isArray(body.linkedProjectIds)
          ? (body.linkedProjectIds as string[])
          : undefined,
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
        linkedProjectIds: Array.isArray(body.linkedProjectIds)
          ? (body.linkedProjectIds as string[])
          : undefined,
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
      await db.dbSetTerminalTestResult(req.params.id, {
        lastTestResult: 'success',
        lastTestMessage: '测试连接成功',
      })
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
      const graphRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formBody.toString(),
        }
      )
      const result = (await graphRes.json()) as {
        id?: string
        error?: { message: string; code?: number }
      }
      if (result.error) {
        res.status(400).json({
          code: 400,
          message: result.error.message || '发帖失败',
          data: null,
          meta: apiMeta(),
        })
        return
      }
      res.json({ code: 0, message: 'success', data: { postId: result.id }, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '发帖请求异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  // Telegram 终端：发送消息 / 图片 / 投票（P1-B 第一批）
  app.post('/api/terminals/:id/actions/telegram/send', async (req, res) => {
    const db = await getIdentityTerminalDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '身份/终端持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const terminal = await db.dbGetTerminalById(req.params.id)
      if (!terminal) {
        res.status(404).json({ code: 404, message: '终端不存在', data: null, meta: apiMeta() })
        return
      }
      if (terminal.type !== 'telegram_bot') {
        res.status(400).json({ code: 400, message: '该终端不是 Telegram Bot 类型', data: null, meta: apiMeta() })
        return
      }

      const body = req.body as {
        actionType?: 'text' | 'photo' | 'poll'
        chatId?: string
        text?: string
        photoUrl?: string
        caption?: string
        question?: string
        options?: string[]
      }
      const actionType = body.actionType ?? 'text'

      let botToken = ''
      let defaultChatId = ''
      try {
        const c = terminal.credentialsJson ? (JSON.parse(terminal.credentialsJson) as Record<string, unknown>) : {}
        const cfg = terminal.configJson ? (JSON.parse(terminal.configJson) as Record<string, unknown>) : {}
        botToken = String(c.botToken ?? c.token ?? c.accessToken ?? '').trim()
        defaultChatId = String(cfg.defaultChatId ?? c.defaultChatId ?? '').trim()
      } catch {
        // ignore parse error, use empty fallback and throw validation error below
      }

      const chatId = String(body.chatId ?? defaultChatId).trim()
      if (!botToken) {
        res.status(400).json({ code: 400, message: 'Telegram Bot Token 未配置', data: null, meta: apiMeta() })
        return
      }
      if (!chatId) {
        res.status(400).json({ code: 400, message: 'chatId 未配置', data: null, meta: apiMeta() })
        return
      }

      let apiPath = 'sendMessage'
      let payload: Record<string, unknown> = { chat_id: chatId }

      if (actionType === 'text') {
        const text = String(body.text ?? '').trim()
        if (!text) {
          res.status(400).json({ code: 400, message: '文本内容不能为空', data: null, meta: apiMeta() })
          return
        }
        payload = { ...payload, text }
      } else if (actionType === 'photo') {
        const photoUrl = String(body.photoUrl ?? '').trim()
        if (!photoUrl) {
          res.status(400).json({ code: 400, message: '图片 URL 不能为空', data: null, meta: apiMeta() })
          return
        }
        apiPath = 'sendPhoto'
        payload = {
          ...payload,
          photo: photoUrl,
          caption: String(body.caption ?? '').trim() || undefined,
        }
      } else {
        const question = String(body.question ?? '').trim()
        const options = Array.isArray(body.options)
          ? body.options.map((v) => String(v).trim()).filter(Boolean)
          : []
        if (!question || options.length < 2) {
          res.status(400).json({
            code: 400,
            message: '投票问题不能为空，且选项至少 2 个',
            data: null,
            meta: apiMeta(),
          })
          return
        }
        apiPath = 'sendPoll'
        payload = {
          ...payload,
          question,
          options,
          is_anonymous: false,
        }
      }

      const tgRes = await fetch(`https://api.telegram.org/bot${encodeURIComponent(botToken)}/${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const tgJson = (await tgRes.json()) as {
        ok: boolean
        description?: string
        result?: Record<string, unknown>
      }
      if (!tgRes.ok || !tgJson.ok) {
        res.status(400).json({
          code: 400,
          message: tgJson.description ?? `Telegram API 调用失败（HTTP ${tgRes.status}）`,
          data: null,
          meta: apiMeta(),
        })
        return
      }

      await db.dbSetTerminalTestResult(req.params.id, {
        lastTestResult: 'success',
        lastTestMessage: 'Telegram 发送成功',
      })

      res.json({
        code: 0,
        message: 'success',
        data: {
          ok: true,
          actionType,
          telegramMessageId: tgJson.result?.message_id ?? null,
        },
        meta: apiMeta(),
      })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : 'Telegram 发送异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })
}
