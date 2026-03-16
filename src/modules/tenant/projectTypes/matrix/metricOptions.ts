import type { GoalMetricOption } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const matrixMetricOptions: GoalMetricOption[] = [
  {
    id: 'gmo-matrix-account-count',
    code: 'MATRIX_ACCOUNT_COUNT',
    name: '矩阵账号数',
    unit: '个',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-total-followers',
    code: 'TOTAL_FOLLOWERS',
    name: '矩阵总粉丝量',
    unit: '人',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-matrix-total-views',
    code: 'MATRIX_TOTAL_VIEWS',
    name: '矩阵总播放量',
    unit: '次',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
]
