/**
 * 规划用 Skill 列表（Phase B 骨架）
 * 从真实 API 获取，按 category=planning 过滤，替代 planningSkillsMock
 */
import type { Skill } from '../schemas/skill'
import * as skillRepo from '../repositories/skillRepository'

/** 获取规划类 Skill 列表（供 Planner Validator、workflowPlanningValidator 等使用） */
export async function listPlanningSkills(): Promise<Skill[]> {
  // TODO: skillRepo.listSkills({ category: 'planning', pageSize: 100 })，返回 res.data.items
  const res = await skillRepo.listSkills({ page: 1, pageSize: 100, category: 'planning' })
  return res.data?.items ?? []
}
