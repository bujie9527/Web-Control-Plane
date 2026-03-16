import { Outlet } from 'react-router-dom'
import { ConsoleLayout } from '@/components/Layout/ConsoleLayout'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { getPlatformMenuConfig } from '@/core/navigation/platformMenu'
import { useAuth } from '@/core/auth/AuthContext'

/**
 * 平台后台根布局：独立 Layout + 平台菜单，与租户后台分离
 * 菜单根据用户角色动态展示（system admin 可见 Agent 模板工厂）
 */
export function PlatformShell() {
  const { user } = useAuth()
  const menuConfig = getPlatformMenuConfig(user ?? null)
  return (
    <ConsoleLayout
      menuConfig={menuConfig}
      title="平台控制台"
      tenantName={undefined}
    >
      <Outlet />
    </ConsoleLayout>
  )
}

/**
 * 平台后台占位子页：未单独实现的路由显示统一占位
 */
export function PlatformPlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <PageContainer title={title} description={description}>
      <EmptyState />
    </PageContainer>
  )
}
