import { Outlet } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthContext'
import { ConsoleLayout } from '@/components/Layout/ConsoleLayout'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { tenantMenuConfig } from '@/core/navigation/tenantMenu'

/**
 * 租户后台根布局：独立 Layout + 租户菜单，与平台后台分离
 */
export function TenantShell() {
  const { user } = useAuth()
  const tenantName = user?.tenant?.tenantName

  return (
    <ConsoleLayout
      menuConfig={tenantMenuConfig}
      title="工作中控台"
      tenantName={tenantName}
    >
      <Outlet />
    </ConsoleLayout>
  )
}

/**
 * 租户后台占位子页
 */
export function TenantPlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <PageContainer title={title} description={description}>
      <EmptyState />
    </PageContainer>
  )
}
