/**
 * Skill 类型，与 04-core-domain-model 一致
 */
export type SkillStatus = 'active' | 'inactive'

export interface Skill {
  id: string
  tenantId: string
  name: string
  type: string
  description?: string
  version?: string
  status: SkillStatus
  createdAt: string
  updatedAt: string
}
