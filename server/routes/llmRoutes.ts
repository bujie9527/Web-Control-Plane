import type { Express } from 'express'
import { executeLLMServer } from '../llm/llmExecutorServer'
import { testProviderConnection } from '../llm/testProviderServer'

export function registerLLMRoutes(app: Express): void {
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
        outputMode: (body.outputMode as 'json' | 'json_schema' | 'markdown_json' | 'json_object' | 'none') ??
          'json_schema',
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
      const body = req.body as { providerId?: string; testModelKey?: string }
      const providerId = body?.providerId
      const testModelKey = body?.testModelKey
      if (typeof providerId !== 'string' || !providerId.trim()) {
        res.status(400).json({ ok: false, messageZh: '缺少 providerId' })
        return
      }

      const result = await testProviderConnection(providerId.trim(), {
        testModelKey: typeof testModelKey === 'string' ? testModelKey.trim() : undefined,
      })
      res.json(result)
    } catch (e) {
      res.status(500).json({
        ok: false,
        messageZh: e instanceof Error ? e.message : '测试连接异常',
      })
    }
  })
}
