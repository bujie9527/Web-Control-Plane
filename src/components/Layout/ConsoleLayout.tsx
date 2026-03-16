import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { MenuItem } from '@/core/navigation/types'
import { getBreadcrumb } from '@/core/navigation/breadcrumb'
import { useAuth } from '@/core/auth/AuthContext'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { TopBar } from '@/components/TopBar/TopBar'
import styles from './ConsoleLayout.module.css'

interface ConsoleLayoutProps {
  children: React.ReactNode
  menuConfig: MenuItem[]
  title: string
  /** 租户后台时显示当前租户 */
  tenantName?: string
}

export function ConsoleLayout({ children, menuConfig, title, tenantName }: ConsoleLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const breadcrumb = useMemo(
    () => getBreadcrumb(location.pathname, menuConfig),
    [location.pathname, menuConfig]
  )

  return (
    <div className={styles.root}>
      <Sidebar
        menuConfig={menuConfig}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
        title={title}
      />
      <div className={styles.main}>
        <TopBar
          breadcrumb={breadcrumb}
          tenantName={tenantName}
          userName={user?.name}
          onLogout={handleLogout}
          onBreadcrumbNavigate={(path) => navigate(path)}
        />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
