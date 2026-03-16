import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/core/constants/routes'
import { useAuth } from '@/core/auth/AuthContext'
import { isSystemAdmin } from './constants'

/** 未登录访问后台时跳转登录页 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (user) return <>{children}</>
  return <Navigate to={ROUTES.AUTH.LOGIN} state={{ from: location }} replace />
}

/** 已登录访问登录页时按身份跳转对应后台 */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, consoleType } = useAuth()
  if (!user) return <>{children}</>
  const to = consoleType === 'platform' ? ROUTES.PLATFORM.HOME : ROUTES.TENANT.HOME
  return <Navigate to={to} replace />
}

/** 仅平台用户可访问：租户用户误入 /platform 时重定向到租户首页 */
export function PlatformOnlyGuard({ children }: { children: React.ReactNode }) {
  const { user, consoleType } = useAuth()
  if (!user) return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  if (consoleType === 'tenant') return <Navigate to={ROUTES.TENANT.HOME} replace />
  return <>{children}</>
}

/** 仅租户用户可访问：平台用户误入 /tenant 时重定向到平台首页 */
export function TenantOnlyGuard({ children }: { children: React.ReactNode }) {
  const { user, consoleType } = useAuth()
  if (!user) return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  if (consoleType === 'platform') return <Navigate to={ROUTES.PLATFORM.HOME} replace />
  return <>{children}</>
}

/** 仅 system admin 可访问：非 system admin 重定向到平台首页 */
export function SystemAdminOnlyGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  if (!isSystemAdmin(user)) return <Navigate to={ROUTES.PLATFORM.HOME} replace />
  return <>{children}</>
}
