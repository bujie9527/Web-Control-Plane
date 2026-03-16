import { WorkflowPlanningWorkbench } from '@/modules/platform/pages/WorkflowPlanning/WorkflowPlanningWorkbench'
import { ROUTES } from '@/core/constants/routes'
import { useAuth } from '@/core/auth/AuthContext'

export function TenantWorkflowPlanningWorkbench() {
  const { user } = useAuth()
  return (
    <WorkflowPlanningWorkbench
      listRoute={ROUTES.TENANT.WORKFLOW_PLANNING}
      scopeLabel="租户"
      allowSystemPublish={false}
      tenantId={user?.tenant?.tenantId}
      publishedBy={user?.id ?? 'tenant'}
      getTemplateDetailRoute={(templateId) => ROUTES.TENANT.WORKFLOW_TEMPLATES_DETAIL(templateId)}
    />
  )
}
