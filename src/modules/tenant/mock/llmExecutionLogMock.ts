import type { LLMExecutionLog } from '../schemas/llmExecutor'

const _logs: LLMExecutionLog[] = []

function now(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function nextId(): string {
  return `llm-log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function appendLLMExecutionLog(
  input: Omit<LLMExecutionLog, 'id' | 'createdAt'>
): LLMExecutionLog {
  const log: LLMExecutionLog = {
    ...input,
    id: nextId(),
    createdAt: now(),
  }
  _logs.push(log)
  return log
}

export function listLLMExecutionLogsBySession(sessionId: string): LLMExecutionLog[] {
  return _logs
    .filter((l) => l.sessionId === sessionId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}
