/**
 * Content Creator 输出解析器（Phase 17）
 * 校验 content、summary、tags、notes
 */
export interface ContentCreatorOutput {
  content: string
  summary: string
  tags: string[]
  notes: string
}

export interface ParserError {
  code: 'JSON_EXTRACT_FAILED' | 'JSON_PARSE_FAILED' | 'SCHEMA_INVALID'
  message: string
  messageZh: string
}

function extractJsonBlock(rawText: string): string | null {
  const fenced = rawText.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) return rawText.slice(firstBrace, lastBrace + 1)
  return null
}

export function parseContentCreatorOutput(
  rawText: string
): { ok: true; data: ContentCreatorOutput } | { ok: false; error: ParserError } {
  const jsonText = extractJsonBlock(rawText)
  if (!jsonText) {
    return {
      ok: false,
      error: {
        code: 'JSON_EXTRACT_FAILED',
        message: 'Failed to extract JSON from model output',
        messageZh: '模型返回中未找到有效 JSON',
      },
    }
  }

  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(jsonText) as Record<string, unknown>
  } catch {
    return {
      ok: false,
      error: {
        code: 'JSON_PARSE_FAILED',
        message: 'Invalid JSON format',
        messageZh: 'JSON 格式异常',
      },
    }
  }

  const content = typeof obj.content === 'string' ? obj.content.trim() : ''
  if (!content) {
    return {
      ok: false,
      error: {
        code: 'SCHEMA_INVALID',
        message: 'content is required and must be non-empty',
        messageZh: 'content 字段必填且不能为空',
      },
    }
  }

  const summary = typeof obj.summary === 'string' ? obj.summary.trim() : content.slice(0, 200)
  const tags = Array.isArray(obj.tags)
    ? obj.tags.filter((t): t is string => typeof t === 'string')
    : []
  const notes = typeof obj.notes === 'string' ? obj.notes.trim() : ''

  return {
    ok: true,
    data: { content, summary, tags, notes },
  }
}
