import type { LLMExecutionLog } from '../schemas/llmExecutor'
import * as runtimeLogRepo from '../repositories/workflowRuntimeLogRepository'

const LLM_EVENT_PREFIX = 'worker_llm_execution'

export async function listLLMLogsForSession(sessionId: string): Promise<LLMExecutionLog[]> {
  try {
    const res = await runtimeLogRepo.fetchRuntimeLogs(sessionId)
    if (res.code !== 0 || !res.data) return []
    const logs = res.data.filter(
      (log) =>
        log.eventType.startsWith(LLM_EVENT_PREFIX) ||
        log.eventType.includes(LLM_EVENT_PREFIX)
    )
    return logs.map((log) => {
      const meta = (log.meta ?? {}) as Record<string, unknown>
      return {
        id: log.id,
        agentTemplateId: (meta.agentTemplateId as string) ?? '',
        skillCode: (meta.skillCode as string) ?? '',
        sessionId,
        provider: (meta.provider as LLMExecutionLog['provider']) ?? 'openai_compatible',
        modelKey: (meta.modelKey as string) ?? '—',
        success: (meta.success as boolean) ?? !log.eventType.endsWith('_failed'),
        latencyMs: (meta.latencyMs as number) ?? 0,
        errorCode: meta.errorCode as string | undefined,
        errorMessage: meta.errorMessage as string | undefined,
        errorMessageZh: meta.errorMessageZh as string | undefined,
        createdAt: log.createdAt,
      }
    })
  } catch {
    return []
  }
}
