import { Outlet } from 'react-router-dom'
import { ConsoleLayout } from '@/components/Layout/ConsoleLayout'
import { systemMenuConfig } from '@/core/navigation/systemMenu'

/**
 * 系统管理员控制台布局：仅 system admin 可访问
 */
export function SystemShell() {
  return (
    <ConsoleLayout
      menuConfig={systemMenuConfig}
      title="系统控制台"
      tenantName={undefined}
    >
      <Outlet />
    </ConsoleLayout>
  )
}
