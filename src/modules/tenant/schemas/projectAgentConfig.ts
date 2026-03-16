import type { ApiResponse } from '@/core/types/api'

export interface ProjectAgentConfig {
  id: string
  projectId: string
  agentTemplateId: string
  instructionOverride?: string
  channelStyleOverride?: Record<string, unknown>
  temperatureOverride?: number
  maxTokensOverride?: number
  modelConfigIdOverride?: string
  customParams?: Record<string, unknown>
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface UpsertProjectAgentConfigPayload {
  instructionOverride?: string
  channelStyleOverride?: Record<string, unknown>
  temperatureOverride?: number
  maxTokensOverride?: number
  modelConfigIdOverride?: string
  customParams?: Record<string, unknown>
  isEnabled?: boolean
}

export type ProjectAgentConfigApiResponse<T> = ApiResponse<T>
