/**
 * OpenAI Provider（Phase 17，Phase 17.7a 已弃用）
 * 正式主链路已切换到服务端 /api/llm/execute，本文件不再被 llmExecutor 引用。
 * 仅保留供历史兼容或开发调试，不得作为正式运行路径。
 */

export interface OpenAICallParams {
  model: string
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
}

export interface OpenAICallResult {
  success: boolean
  text: string
  errorCode?: string
  errorMessage?: string
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * 调用 OpenAI Chat Completions
 * API Key 从 import.meta.env.VITE_OPENAI_API_KEY 读取
 */
export async function callOpenAI(params: OpenAICallParams): Promise<OpenAICallResult> {
  const apiKey =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY
      ? String(import.meta.env.VITE_OPENAI_API_KEY).trim()
      : ''

  if (!apiKey) {
    return {
      success: false,
      text: '',
      errorCode: 'API_KEY_MISSING',
      errorMessage: 'VITE_OPENAI_API_KEY 未配置，请设置环境变量',
    }
  }

  const { model, systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2048 } = params

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
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
