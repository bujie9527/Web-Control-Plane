import type { GoalType } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const matrixGoalTypes: GoalType[] = [
  {
    id: 'gt-matrix-scale',
    code: 'MATRIX_SCALE',
    name: '矩阵规模扩张',
    description: '增加矩阵中账号数量，扩大内容覆盖面',
    relatedProjectType: 'MATRIX_OPERATION',
    allowedMetricOptions: ['MATRIX_ACCOUNT_COUNT', 'TOTAL_FOLLOWERS'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-matrix-traffic',
    code: 'MATRIX_TRAFFIC',
    name: '矩阵流量汇聚',
    description: '将矩阵各账号流量引导至主账号或私域',
    relatedProjectType: 'MATRIX_OPERATION',
    allowedMetricOptions: ['TOTAL_FOLLOWERS', 'MATRIX_TOTAL_VIEWS', 'PRIVATE_CONTACT_COUNT'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-matrix-conversion',
    code: 'MATRIX_CONVERSION',
    name: '矩阵转化获客',
    description: '通过矩阵协同触达，提升客户转化数量',
    relatedProjectType: 'MATRIX_OPERATION',
    allowedMetricOptions: ['PRIVATE_CONTACT_COUNT', 'DM_INQUIRIES'],
    createdAt: now,
    updatedAt: now,
  },
]
