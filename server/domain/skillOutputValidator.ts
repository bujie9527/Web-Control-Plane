function parseSchema(schemaJson?: string): Record<string, unknown> | null {
  if (!schemaJson?.trim()) return null
  try {
    const schema = JSON.parse(schemaJson) as Record<string, unknown>
    return schema && typeof schema === 'object' ? schema : null
  } catch {
    return null
  }
}

export function validateSkillOutputBySchema(
  output: unknown,
  outputSchemaJson?: string
): { ok: boolean; messageZh?: string } {
  const schema = parseSchema(outputSchemaJson)
  if (!schema) return { ok: true }
  if (!output || typeof output !== 'object') {
    return { ok: false, messageZh: 'Skill 输出格式异常：应为对象' }
  }

  const required = Array.isArray(schema.required) ? (schema.required as string[]) : []
  if (required.length === 0) return { ok: true }

  const data = output as Record<string, unknown>
  const missing = required.filter((k) => data[k] === undefined || data[k] === null)
  if (missing.length > 0) {
    return { ok: false, messageZh: `Skill 输出缺少必填字段：${missing.join('、')}` }
  }
  return { ok: true }
}
