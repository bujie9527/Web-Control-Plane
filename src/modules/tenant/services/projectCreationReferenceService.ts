/**
 * 项目创建参考数据服务：ProjectType / GoalType / GoalMetricOption
 * 用于项目创建向导中的选择约束与联动
 */
import type {
  ProjectType,
  GoalType,
  GoalMetricOption,
} from '../schemas/projectCreationReference'
import * as projectTypeRepo from '../repositories/projectTypeRepository'
import * as goalTypeRepo from '../repositories/goalTypeRepository'
import * as goalMetricRepo from '../repositories/goalMetricOptionRepository'

export async function getProjectTypes(): Promise<ProjectType[]> {
  const res = await projectTypeRepo.fetchProjectTypes()
  return res.data
}

export async function getProjectTypeByCode(code: string): Promise<ProjectType | null> {
  const res = await projectTypeRepo.fetchProjectTypeByCode(code)
  return res.data
}

export async function getGoalTypes(): Promise<GoalType[]> {
  const res = await goalTypeRepo.fetchGoalTypes()
  return res.data
}

/** 根据项目类型 code 获取允许的 GoalType 列表 */
export async function getGoalTypesByProjectTypeCode(
  projectTypeCode: string
): Promise<GoalType[]> {
  const res = await goalTypeRepo.fetchGoalTypesByProjectTypeCode(projectTypeCode)
  return res.data
}

export async function getGoalTypeByCode(code: string): Promise<GoalType | null> {
  const res = await goalTypeRepo.fetchGoalTypeByCode(code)
  return res.data
}

export async function getGoalMetricOptions(): Promise<GoalMetricOption[]> {
  const res = await goalMetricRepo.fetchGoalMetricOptions()
  return res.data
}

/** 根据 GoalType 的 allowedMetricOptions 获取可用指标选项 */
export async function getGoalMetricOptionsByGoalType(
  goalTypeCode: string
): Promise<GoalMetricOption[]> {
  const goalType = await getGoalTypeByCode(goalTypeCode)
  if (!goalType?.allowedMetricOptions?.length) return []
  const res = await goalMetricRepo.fetchGoalMetricOptionsByCodes(goalType.allowedMetricOptions)
  return res.data
}
