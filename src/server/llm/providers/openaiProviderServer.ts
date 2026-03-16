/**
 * 服务端 OpenAI Provider（Phase 17.7）
 * 供服务端 LLM Executor 调用，使用从 Credential 读取的 API Key
 */
export interface OpenAICallServerParams {
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
}

export interface OpenAICallServerResult {
  success: boolean
  text: string
  errorCode?: string
  errorMessage?: string
}

const DEFAULT_OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * 调用 OpenAI Chat Completions
 * apiKey 从 LLMCredential 读取（服务端），不得从前端传入
 */
export async function callOpenAIServer(params: OpenAICallServerParams): Promise<OpenAICallServerResult> {
  const { baseUrl, apiKey, model, systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2048 } = params

  if (!apiKey?.trim()) {
    return {
      success: false,
      text: '',
      errorCode: 'API_KEY_MISSING',
      errorMessage: '缺少 API 密钥',
    }
  }

  const url = baseUrl?.trim() ? `${baseUrl.replace(/\/$/, '')}/chat/completions` : DEFAULT_OPENAI_URL

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
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
