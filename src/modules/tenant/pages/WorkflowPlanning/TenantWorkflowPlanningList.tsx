import { WorkflowPlanningList } from '@/modules/platform/pages/WorkflowPlanning/WorkflowPlanningList'
import { ROUTES } from '@/core/constants/routes'
import { useAuth } from '@/core/auth/AuthContext'

export function TenantWorkflowPlanningList() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''

  return (
    <WorkflowPlanningList
      scopeType="tenant"
      tenantId={tenantId}
      listRoute={ROUTES.TENANT.WORKFLOW_PLANNING}
      newRoute={ROUTES.TENANT.WORKFLOW_PLANNING_NEW}
      detailRoute={ROUTES.TENANT.WORKFLOW_PLANNING_DETAIL}
    />
  )
}
