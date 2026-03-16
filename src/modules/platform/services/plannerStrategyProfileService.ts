/**
 * 规划策略配置服务（从后端内置常量 API 获取）
 */
import type { PlannerStrategyProfile } from '../schemas/plannerStrategyProfile'
import * as repo from '../repositories/plannerStrategyProfileRepository'

export async function getStrategyProfileById(
  id: string
): Promise<PlannerStrategyProfile | null> {
  const res = await repo.fetchStrategyProfileById(id)
  if (res.code !== 0) return null
  return res.data ?? null
}
