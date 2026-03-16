/**
 * Content Reviewer 输出解析器（Phase 17）
 * 校验 reviewResult 为 approved/revise，issues、suggestions、summary
 */
export interface ContentReviewerOutput {
  reviewResult: 'approved' | 'revise'
  issues: string[]
  suggestions: string[]
  summary: string
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

export function parseContentReviewerOutput(
  rawText: string
): { ok: true; data: ContentReviewerOutput } | { ok: false; error: ParserError } {
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

  const reviewResultRaw = typeof obj.reviewResult === 'string' ? obj.reviewResult.toLowerCase() : ''
  const reviewResult =
    reviewResultRaw === 'approved' || reviewResultRaw === 'revise' ? reviewResultRaw : null

  if (!reviewResult) {
    return {
      ok: false,
      error: {
        code: 'SCHEMA_INVALID',
        message: 'reviewResult must be "approved" or "revise"',
        messageZh: 'reviewResult 必须为 approved 或 revise',
      },
    }
  }

  const issues = Array.isArray(obj.issues)
    ? obj.issues.filter((i): i is string => typeof i === 'string')
    : []
  const suggestions = Array.isArray(obj.suggestions)
    ? obj.suggestions.filter((s): s is string => typeof s === 'string')
    : []
  const summary = typeof obj.summary === 'string' ? obj.summary.trim() : ''

  return {
    ok: true,
    data: { reviewResult, issues, suggestions, summary },
  }
}
