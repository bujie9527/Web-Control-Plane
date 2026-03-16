import type { ListResult } from '@/core/types/api'
import type { Skill, SkillListParams, SkillStatus } from '../schemas/skill'
import * as skillRepo from '../repositories/skillRepository'
import { checkSkillReferences } from './referenceCheckService'

export async function getSkillList(params: SkillListParams): Promise<ListResult<Skill>> {
  const res = await skillRepo.listSkills(params)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function getSkillById(id: string): Promise<Skill | null> {
  const res = await skillRepo.getSkillById(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function createSkill(payload: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'isSystemPreset'>): Promise<Skill> {
  const res = await skillRepo.createSkill(payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function updateSkill(id: string, payload: Partial<Skill>): Promise<Skill | null> {
  const res = await skillRepo.updateSkill(id, payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function changeSkillStatus(id: string, status: SkillStatus): Promise<Skill | null> {
  const res = await skillRepo.changeStatus(id, status)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function deleteSkill(
  id: string
): Promise<{ success: boolean; reason?: string; messageZh?: string }> {
  const refs = await checkSkillReferences(id)
  if (refs.inUse) {
    return {
      success: false,
      reason: 'REFERENCED',
      messageZh: `该 Skill 仍被 ${refs.referenceCount} 个 Agent 模板引用，无法删除`,
    }
  }
  const res = await skillRepo.deleteSkill(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

/** 根据一组 ID 批量获取 Skill，主要用于 AgentTemplate 详情中展示 supportedSkillIds 详情 */
export async function getSkillsByIds(ids: string[]): Promise<Skill[]> {
  if (!ids.length) return []
  const res = await skillRepo.listSkills({ page: 1, pageSize: ids.length * 2 })
  if (res.code !== 0) throw new Error(res.message)
  const all = res.data.items
  const idSet = new Set(ids)
  return all.filter((s) => idSet.has(s.id))
}

