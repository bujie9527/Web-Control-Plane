import { parse as parseYaml } from 'yaml'
import type { CreateSkillPayload } from './skillDb'

interface ParsedOpenClaw {
  name?: string
  nameZh?: string
  code?: string
  category?: string
  description?: string
  executionType?: string
  execution_type?: string
  steps?: string[]
  inputSchema?: Record<string, unknown>
  input?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  output?: Record<string, unknown>
  executionConfig?: Record<string, unknown>
  promptTemplate?: string
}

function normalizeCode(nameOrCode: string): string {
  return nameOrCode
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function parseContent(rawContent: string, format: 'auto' | 'json' | 'yaml'): ParsedOpenClaw {
  const content = rawContent.trim()
  if (!content) throw new Error('OpenClaw 内容不能为空')

  if (format === 'json') return JSON.parse(content) as ParsedOpenClaw
  if (format === 'yaml') return parseYaml(content) as ParsedOpenClaw

  try {
    return JSON.parse(content) as ParsedOpenClaw
  } catch {
    return parseYaml(content) as ParsedOpenClaw
  }
}

export function mapOpenClawToCreateSkillPayload(input: {
  content: string
  format?: 'auto' | 'json' | 'yaml'
}): CreateSkillPayload {
  const parsed = parseContent(input.content, input.format ?? 'auto')

  const name = String(parsed.name ?? '').trim()
  if (!name) throw new Error('OpenClaw 缺少 name 字段')
  const code = normalizeCode(String(parsed.code ?? name))
  if (!code) throw new Error('OpenClaw code 无效')

  const executionTypeRaw = String(parsed.executionType ?? parsed.execution_type ?? 'llm')
  const executionType = ['llm', 'external_api', 'internal_api', 'hybrid'].includes(
    executionTypeRaw
  )
    ? executionTypeRaw
    : 'llm'

  const inputSchema = parsed.inputSchema ?? parsed.input
  const outputSchema = parsed.outputSchema ?? parsed.output

  return {
    name,
    nameZh: parsed.nameZh?.trim() || undefined,
    code,
    category: String(parsed.category ?? 'general').trim() || 'general',
    executionType,
    description: parsed.description?.trim() || '从 OpenClaw 导入',
    version: '1.0.0',
    status: 'inactive',
    openClawSpec: {
      steps: Array.isArray(parsed.steps) ? parsed.steps.map((s) => String(s)) : undefined,
      inputSchemaJson: inputSchema ? JSON.stringify(inputSchema, null, 2) : undefined,
      outputSchemaJson: outputSchema ? JSON.stringify(outputSchema, null, 2) : undefined,
    },
    inputSchemaJson: inputSchema ? JSON.stringify(inputSchema, null, 2) : undefined,
    outputSchemaJson: outputSchema ? JSON.stringify(outputSchema, null, 2) : undefined,
    executionConfigJson: parsed.executionConfig
      ? JSON.stringify(parsed.executionConfig, null, 2)
      : undefined,
    promptTemplate: parsed.promptTemplate?.trim() || undefined,
  }
}
