/**
 * 服务端 OpenAI Provider（Phase 17.7a）
 * 供服务端 LLM Executor 调用，使用从 Credential 读取的 API Key
 * 支持 response_format（json_object / json_schema）以强制结构化输出
 */
export interface OpenAICallServerParams {
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  /** 输出模式：json_object 使用 type: json_object；json_schema 使用完整 schema */
  outputMode?: 'json' | 'json_schema' | 'markdown_json' | 'json_object' | 'none'
  /** 当 outputMode === 'json_schema' 时传入，用于 response_format.json_schema.schema */
  structuredSchema?: Record<string, unknown>
}

export interface OpenAICallServerResult {
  success: boolean
  text: string
  errorCode?: string
  errorMessage?: string
}

const DEFAULT_OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

function buildResponseFormat(
  outputMode: OpenAICallServerParams['outputMode'],
  structuredSchema?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (outputMode === 'json_object') {
    return { type: 'json_object' }
  }
  if (outputMode === 'json_schema' && structuredSchema && Object.keys(structuredSchema).length > 0) {
    return {
      type: 'json_schema',
      json_schema: {
        name: 'output',
        strict: true,
        schema: structuredSchema,
      },
    }
  }
  return undefined
}

export async function callOpenAIServer(params: OpenAICallServerParams): Promise<OpenAICallServerResult> {
  const {
    baseUrl,
    apiKey,
    model,
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 2048,
    outputMode,
    structuredSchema,
  } = params

  if (!apiKey?.trim()) {
    return {
      success: false,
      text: '',
      errorCode: 'API_KEY_MISSING',
      errorMessage: '缺少 API 密钥',
    }
  }

  const url = baseUrl?.trim() ? `${baseUrl.replace(/\/$/, '')}/chat/completions` : DEFAULT_OPENAI_URL
  const responseFormat = buildResponseFormat(outputMode, structuredSchema)
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  }
  if (responseFormat) {
    body.response_format = responseFormat
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errBody = await res.text()
      let errMsg = `OpenAI API error ${res.status}`
      try {
        const parsed = JSON.parse(errBody)
        errMsg = parsed.error?.message ?? errMsg
      } catch {
        if (errBody) errMsg = errBody.slice(0, 200)
      }
      return {
        success: false,
        text: '',
        errorCode: `OPENAI_${res.status}`,
        errorMessage: errMsg,
      }
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const text = data.choices?.[0]?.message?.content?.trim() ?? ''
    return { success: true, text }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      success: false,
      text: '',
      errorCode: 'NETWORK_OR_RUNTIME_ERROR',
      errorMessage: msg,
    }
  }
}
