import type { Express } from 'express'
import {
  createServerCredential,
  deleteServerCredential,
  getServerCredentialByIdForClient,
  listServerCredentialsForClient,
  updateServerCredential,
} from '../data/credentialStore'

function buildMeta() {
  return {
    requestId: '',
    timestamp: new Date().toISOString(),
  }
}

export function registerCredentialRoutes(app: Express): void {
  app.get('/api/credentials', (_req, res) => {
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
    const providerType = body.providerType as
      | 'openai'
      | 'azure_openai'
      | 'openai_compatible'
      | 'custom'
      | undefined
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
}
