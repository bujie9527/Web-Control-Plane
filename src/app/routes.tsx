import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '@/core/constants/routes'
import { AuthRedirect, GuestGuard, PlatformOnlyGuard, TenantOnlyGuard, SystemAdminOnlyGuard } from '@/core/permission/Guards'
import { LoginPage } from '@/modules/auth/LoginPage'
import { PlatformShell } from '@/modules/platform/PlatformShell'
import { SystemShell } from '@/modules/platform/SystemShell'
import { PlatformDashboard } from '@/modules/platform/pages/PlatformDashboard'
import { TenantList } from '@/modules/platform/pages/TenantList'
import { TenantDetail } from '@/modules/platform/pages/TenantDetail'
import { PlatformUsers } from '@/modules/platform/pages/PlatformUsers'
import { ResourceQuota } from '@/modules/platform/pages/ResourceQuota'
import { TemplateCenter } from '@/modules/platform/pages/TemplateCenter'
import { PlatformAudit } from '@/modules/platform/pages/PlatformAudit'
import { PlatformSettings } from '@/modules/platform/pages/PlatformSettings'
import { AgentFactoryList } from '@/modules/platform/pages/AgentFactory/AgentFactoryList'
import { AgentFactoryNew } from '@/modules/platform/pages/AgentFactory/AgentFactoryNew'
import { AgentFactoryDetail } from '@/modules/platform/pages/AgentFactory/AgentFactoryDetail'
import { AgentFactoryEdit } from '@/modules/platform/pages/AgentFactory/AgentFactoryEdit'
import { SkillFactoryList } from '@/modules/platform/pages/SkillFactory/SkillFactoryList'
import { SkillFactoryNew } from '@/modules/platform/pages/SkillFactory/SkillFactoryNew'
import { SkillFactoryEdit } from '@/modules/platform/pages/SkillFactory/SkillFactoryEdit'
import { SkillFactoryDetail } from '@/modules/platform/pages/SkillFactory/SkillFactoryDetail/SkillFactoryDetail'
import { PlatformCapabilityList } from '@/modules/platform/pages/PlatformCapabilities/PlatformCapabilityList'
import { PlatformCapabilityDetail } from '@/modules/platform/pages/PlatformCapabilities/PlatformCapabilityDetail'
import { WorkflowTemplateFactoryList } from '@/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList'
import { WorkflowTemplateFactoryNew } from '@/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryNew'
import { WorkflowTemplateFactoryDetail } from '@/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryDetail'
import { WorkflowTemplateFactoryEdit } from '@/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryEdit'
import { SystemWorkflowPlanningList } from '@/modules/platform/pages/WorkflowPlanning/SystemWorkflowPlanningList'
import { SystemWorkflowPlanningNew } from '@/modules/platform/pages/WorkflowPlanning/SystemWorkflowPlanningNew'
import { SystemWorkflowPlanningWorkbench } from '@/modules/platform/pages/WorkflowPlanning/SystemWorkflowPlanningWorkbench'
import { TenantWorkflowPlanningList } from '@/modules/tenant/pages/WorkflowPlanning/TenantWorkflowPlanningList'
import { TenantWorkflowPlanningNew } from '@/modules/tenant/pages/WorkflowPlanning/TenantWorkflowPlanningNew'
import { TenantWorkflowPlanningWorkbench } from '@/modules/tenant/pages/WorkflowPlanning/TenantWorkflowPlanningWorkbench'
import { TenantWorkflowRuntimeList } from '@/modules/tenant/pages/WorkflowRuntime/TenantWorkflowRuntimeList'
import { TenantWorkflowRuntimeDetail } from '@/modules/tenant/pages/WorkflowRuntime/TenantWorkflowRuntimeDetail'
import { LLMConfigCenterPage } from '@/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage'
import { DataSourceConfigCenterPage } from '@/modules/platform/pages/DataSourceConfigCenter/DataSourceConfigCenterPage'
import { TenantShell } from '@/modules/tenant/TenantShell'
import { TenantDashboard } from '@/modules/tenant/pages/TenantDashboard'
import { ProjectList } from '@/modules/tenant/pages/ProjectList'
import { ProjectCreationWizard } from '@/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard'
import { ProjectDetailWorkbench } from '@/modules/tenant/pages/ProjectDetail/ProjectDetailWorkbench'
import { TaskExecutionPage } from '@/modules/tenant/pages/TaskExecutionPage'
import { TaskCenter } from '@/modules/tenant/pages/TaskCenter'
import { WorkflowCenter } from '@/modules/tenant/pages/WorkflowCenter'
import { WorkflowTemplateDetail } from '@/modules/tenant/pages/WorkflowCenter/WorkflowTemplateDetail'
import { TenantWorkflowTemplateList } from '@/modules/tenant/pages/WorkflowTemplates/TenantWorkflowTemplateList'
import { TenantWorkflowTemplateDetail } from '@/modules/tenant/pages/WorkflowTemplates/TenantWorkflowTemplateDetail'
import { TenantWorkflowTemplateEdit } from '@/modules/tenant/pages/WorkflowTemplates/TenantWorkflowTemplateEdit'
import { AgentCenter } from '@/modules/tenant/pages/AgentCenter'
import { AgentLibraryDetail } from '@/modules/tenant/pages/AgentCenter/AgentLibraryDetail'
import { IdentityList } from '@/modules/tenant/pages/IdentityList'
import { IdentityDetailWorkbench } from '@/modules/tenant/pages/IdentityDetail/IdentityDetailWorkbench'
import { SkillsCenter } from '@/modules/tenant/pages/SkillsCenter'
import { SkillsCenterDetail } from '@/modules/tenant/pages/SkillsCenter/SkillsCenterDetail'
import { TerminalCenter } from '@/modules/tenant/pages/TerminalCenter'
import { TerminalNewWizard } from '@/modules/tenant/pages/TerminalCenter/TerminalNewWizard'
import { TerminalDetailWorkbench } from '@/modules/tenant/pages/TerminalCenter/TerminalDetailWorkbench'
import { FacebookPageAuth } from '@/modules/tenant/pages/FacebookPageAuth'
import { AnalyticsPage } from '@/modules/tenant/pages/AnalyticsPage'
import { SystemSettings } from '@/modules/tenant/pages/SystemSettings'
import { RoutePlaceholderPage } from '@/modules/shared/pages/RoutePlaceholderPage'
import { TelegramTerminalPage } from '@/modules/tenant/pages/TelegramTerminal/TelegramTerminalPage'
import { MessageCenterPage } from '@/modules/tenant/pages/MessageCenterPage'
import { ScheduledTaskPage } from '@/modules/tenant/pages/ScheduledTaskPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.AUTH.LOGIN} element={<AuthRedirect><LoginPage /></AuthRedirect>} />

      <Route
        path={ROUTES.PLATFORM.BASE}
        element={
          <GuestGuard>
            <PlatformOnlyGuard>
              <PlatformShell />
            </PlatformOnlyGuard>
          </GuestGuard>
        }
      >
        <Route index element={<PlatformDashboard />} />
        <Route path="tenants" element={<TenantList />} />
        <Route path="tenants/:id" element={<TenantDetail />} />
        <Route path="users" element={<PlatformUsers />} />
        <Route path="quota" element={<ResourceQuota />} />
        <Route path="templates" element={<TemplateCenter />} />
        <Route path="audit" element={<PlatformAudit />} />
        <Route path="settings" element={<PlatformSettings />} />
      </Route>

      <Route
        path={ROUTES.SYSTEM.BASE}
        element={
          <GuestGuard>
            <PlatformOnlyGuard>
              <SystemAdminOnlyGuard>
                <SystemShell />
              </SystemAdminOnlyGuard>
            </PlatformOnlyGuard>
          </GuestGuard>
        }
      >
        <Route index element={<Navigate to={ROUTES.SYSTEM.AGENT_FACTORY} replace />} />
        <Route path="agent-factory" element={<AgentFactoryList />} />
        <Route path="agent-factory/new" element={<AgentFactoryNew />} />
        <Route path="agent-factory/:id" element={<AgentFactoryDetail />} />
        <Route path="agent-factory/:id/edit" element={<AgentFactoryEdit />} />
        <Route path="skill-factory" element={<SkillFactoryList />} />
        <Route path="skill-factory/new" element={<SkillFactoryNew />} />
        <Route path="skill-factory/:id/edit" element={<SkillFactoryEdit />} />
        <Route path="skill-factory/:id" element={<SkillFactoryDetail />} />
        <Route path="platform-capabilities" element={<PlatformCapabilityList />} />
        <Route path="platform-capabilities/:code" element={<PlatformCapabilityDetail />} />
        <Route
          path="datasource-configs"
          element={<DataSourceConfigCenterPage />}
        />
        <Route
          path="webhooks"
          element={<RoutePlaceholderPage title="Webhook 管理" description="查看并管理系统级 Webhook 注册、签名与回调状态。" />}
        />
        <Route
          path="message-pipeline"
          element={<RoutePlaceholderPage title="消息管线监控" description="监控消息接入、路由、处理与发送全链路状态。" />}
        />
        <Route
          path="scheduled-tasks"
          element={<RoutePlaceholderPage title="定时任务总览" description="跨项目查看调度任务执行情况与失败重试状态。" />}
        />
        <Route path="workflow-templates" element={<WorkflowTemplateFactoryList />} />
        <Route path="workflow-templates/new" element={<WorkflowTemplateFactoryNew />} />
        <Route path="workflow-templates/:id" element={<WorkflowTemplateFactoryDetail />} />
        <Route path="workflow-templates/:id/edit" element={<WorkflowTemplateFactoryEdit />} />
        <Route path="workflow-planning" element={<SystemWorkflowPlanningList />} />
        <Route path="workflow-planning/new" element={<SystemWorkflowPlanningNew />} />
        <Route path="workflow-planning/:id" element={<SystemWorkflowPlanningWorkbench />} />
        <Route path="workflow-runtime" element={<TenantWorkflowRuntimeList />} />
        <Route path="workflow-runtime/:id" element={<TenantWorkflowRuntimeDetail />} />
        <Route path="llm-configs" element={<LLMConfigCenterPage />} />
      </Route>

      <Route
        path={ROUTES.TENANT.BASE}
        element={
          <GuestGuard>
            <TenantOnlyGuard>
              <TenantShell />
            </TenantOnlyGuard>
          </GuestGuard>
        }
      >
        <Route index element={<TenantDashboard />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<ProjectCreationWizard />} />
        <Route path="projects/:id/tasks/:taskId" element={<TaskExecutionPage />} />
        <Route path="projects/:id" element={<ProjectDetailWorkbench />} />
        <Route path="tasks" element={<TaskCenter />} />
        <Route path="messages" element={<MessageCenterPage />} />
        <Route path="scheduled-tasks" element={<ScheduledTaskPage />} />
        <Route
          path="datasources"
          element={<RoutePlaceholderPage title="数据源" description="按项目与主题管理可用数据源与采集入口。" />}
        />
        <Route path="workflows" element={<WorkflowCenter />} />
        <Route path="workflows/templates/:id" element={<WorkflowTemplateDetail />} />
        <Route path="workflow-templates" element={<TenantWorkflowTemplateList />} />
        <Route path="workflow-templates/:id/edit" element={<TenantWorkflowTemplateEdit />} />
        <Route path="workflow-templates/:id" element={<TenantWorkflowTemplateDetail />} />
        <Route path="workflow-planning" element={<TenantWorkflowPlanningList />} />
        <Route path="workflow-planning/new" element={<TenantWorkflowPlanningNew />} />
        <Route path="workflow-planning/:id" element={<TenantWorkflowPlanningWorkbench />} />
        <Route path="workflow-runtime" element={<TenantWorkflowRuntimeList />} />
        <Route path="workflow-runtime/:id" element={<TenantWorkflowRuntimeDetail />} />
        <Route path="agents" element={<AgentCenter />} />
        <Route path="identities" element={<IdentityList />} />
        <Route path="identities/:id" element={<IdentityDetailWorkbench />} />
        <Route path="agents/:id" element={<AgentLibraryDetail />} />
        <Route path="skills" element={<SkillsCenter />} />
        <Route path="skills/:id" element={<SkillsCenterDetail />} />
        <Route path="terminals" element={<TerminalCenter />} />
        <Route
          path="terminals/telegram"
          element={<TelegramTerminalPage />}
        />
        <Route path="terminals/new" element={<TerminalNewWizard />} />
        <Route path="terminals/:id" element={<TerminalDetailWorkbench />} />
        <Route path="facebook-pages" element={<FacebookPageAuth />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
    </Routes>
  )
}
