/**
 * 系统侧流程规划工作台包装
 * 注入 system 路由，允许发布为系统模板，发布后跳转对应模板详情
 */
import { WorkflowPlanningWorkbench } from './WorkflowPlanningWorkbench'
import { ROUTES } from '@/core/constants/routes'
import { useAuth } from '@/core/auth/AuthContext'

export function SystemWorkflowPlanningWorkbench() {
  const { user } = useAuth()
  return (
    <WorkflowPlanningWorkbench
      listRoute={ROUTES.SYSTEM.WORKFLOW_PLANNING}
      scopeLabel="系统"
      allowSystemPublish={true}
      publishedBy={user?.id ?? 'system'}
      getTemplateDetailRoute={(templateId, scopeType) =>
        scopeType === 'system'
          ? ROUTES.SYSTEM.WORKFLOW_TEMPLATES_DETAIL(templateId)
          : ROUTES.TENANT.WORKFLOW_TEMPLATES_DETAIL(templateId)
      }
    />
  )
}
