/**
 * 项目创建流程参考对象：ProjectType / GoalType / GoalMetricOption
 * 用于项目创建向导中约束选择与关联关系
 */

/** 项目类型状态 */
export type ProjectTypeStatus = 'active' | 'disabled'

/** 项目类型：定义项目大类，并约束允许的 GoalType */
export interface ProjectType {
  id: string
  code: string
  name: string
  description?: string
  status: ProjectTypeStatus
  /** 允许选择的目标类型 code 列表 */
  allowedGoalTypes: string[]
  /** 允许的终端类型（如 facebook），用于多主页运营等场景 */
  allowedTerminalTypes?: string[]
  /** 是否支持多终端/多主页同时绑定 */
  multiPageSupport?: boolean
  createdAt: string
  updatedAt: string
}

/** 目标类型：定义目标大类，并约束允许的指标选项 */
export interface GoalType {
  id: string
  code: string
  name: string
  description?: string
  /** 关联的项目类型 code */
  relatedProjectType: string
  /** 允许选择的指标选项 code 列表 */
  allowedMetricOptions: string[]
  createdAt: string
  updatedAt: string
}

/** 指标选项状态 */
export type GoalMetricOptionStatus = 'active' | 'disabled'

/** 指标选项：定义 Goal 可选的 KPI 指标 */
export interface GoalMetricOption {
  id: string
  code: string
  name: string
  description?: string
  unit?: string
  status: GoalMetricOptionStatus
  createdAt: string
  updatedAt: string
}
