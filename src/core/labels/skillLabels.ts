/**
 * Skill 前台中文映射
 * 与 AgentTemplate 映射保持风格一致，集中管理状态与分类标签。
 */

import type { SkillExecutionType, SkillStatus } from '@/modules/platform/schemas/skill'

/** Skill 状态标签 */
export const SKILL_STATUS_LABELS: Record<SkillStatus, string> = {
  active: '已启用',
  inactive: '已停用',
}

/** Skill 业务分类标签 */
export const SKILL_CATEGORY_LABELS: Record<string, string> = {
  content: '内容',
  review: '审核',
  publish: '发布',
  analytics: '分析',
  research: '研究',
  planning: '规划',
}

/** Skill 执行类型标签 */
export const SKILL_EXECUTION_TYPE_LABELS: Record<SkillExecutionType, string> = {
  llm: 'LLM 执行',
  external_api: '外部 API',
  internal_api: '内部 API',
  hybrid: '混合',
}

