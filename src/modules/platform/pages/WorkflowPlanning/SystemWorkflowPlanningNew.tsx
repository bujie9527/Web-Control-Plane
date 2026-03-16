/**
 * 系统侧新建流程规划包装
 * 注入 system 路由与创建人，进入规划工作台时保持在 system 控制台
 */
import { WorkflowPlanningNew } from './WorkflowPlanningNew'
import { ROUTES } from '@/core/constants/routes'
import { useAuth } from '@/core/auth/AuthContext'

export function SystemWorkflowPlanningNew() {
  const { user } = useAuth()
  return (
    <WorkflowPlanningNew
      scopeType="system"
      createdBy={user?.id ?? 'system'}
      listRoute={ROUTES.SYSTEM.WORKFLOW_PLANNING}
      detailRoute={ROUTES.SYSTEM.WORKFLOW_PLANNING_DETAIL}
    />
  )
}
