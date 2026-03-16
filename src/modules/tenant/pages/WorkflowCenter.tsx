import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/core/constants/routes'

/**
 * 流程中心入口：重定向到流程模板列表
 * 流程中心二级菜单为：流程模板、流程规划、运行监控
 */
export function WorkflowCenter() {
  return <Navigate to={ROUTES.TENANT.WORKFLOW_TEMPLATES} replace />
}
