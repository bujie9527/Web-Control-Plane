import { WorkflowPlanningNew } from '@/modules/platform/pages/WorkflowPlanning/WorkflowPlanningNew'
import { ROUTES } from '@/core/constants/routes'
import { useAuth } from '@/core/auth/AuthContext'

export function TenantWorkflowPlanningNew() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId

  return (
    <WorkflowPlanningNew
      scopeType="tenant"
      tenantId={tenantId}
      createdBy={user?.id ?? 'tenant'}
      listRoute={ROUTES.TENANT.WORKFLOW_PLANNING}
      detailRoute={ROUTES.TENANT.WORKFLOW_PLANNING_DETAIL}
    />
  )
}
