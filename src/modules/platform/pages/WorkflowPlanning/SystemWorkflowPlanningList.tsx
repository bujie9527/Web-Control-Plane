/**
 * 系统侧流程规划会话列表包装
 * 注入 system 路由，避免与租户侧串线
 */
import { WorkflowPlanningList } from './WorkflowPlanningList'
import { ROUTES } from '@/core/constants/routes'

export function SystemWorkflowPlanningList() {
  return (
    <WorkflowPlanningList
      scopeType="system"
      listRoute={ROUTES.SYSTEM.WORKFLOW_PLANNING}
      newRoute={ROUTES.SYSTEM.WORKFLOW_PLANNING_NEW}
      detailRoute={ROUTES.SYSTEM.WORKFLOW_PLANNING_DETAIL}
    />
  )
}
