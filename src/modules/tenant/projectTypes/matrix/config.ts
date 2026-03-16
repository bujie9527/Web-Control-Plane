import type { ProjectType } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const matrixProjectType: ProjectType = {
  id: 'pt-matrix-operation',
  code: 'MATRIX_OPERATION',
  name: '账号矩阵管理',
  description: '同时运营多个账号组成矩阵，汇聚流量，扩大品牌影响力',
  status: 'active',
  allowedGoalTypes: ['MATRIX_SCALE', 'MATRIX_TRAFFIC', 'MATRIX_CONVERSION'],
  createdAt: now,
  updatedAt: now,
}
