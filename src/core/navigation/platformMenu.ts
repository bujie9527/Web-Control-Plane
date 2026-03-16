import { ROUTES } from '@/core/constants/routes'
import type { User } from '@/core/types/auth'
import type { MenuItem } from './types'
import { isSystemAdmin } from '@/core/permission/constants'

/** 平台后台基础菜单（与 System 彻底分离，不包含 Agent/流程工厂） */
const platformMenuBase: MenuItem[] = [
  { key: 'platform-home', path: ROUTES.PLATFORM.HOME, label: '平台工作台', icon: 'LayoutDashboard' },
  { key: 'tenants', path: ROUTES.PLATFORM.TENANTS, label: '租户管理', icon: 'Building2' },
  { key: 'users', path: ROUTES.PLATFORM.USERS, label: '平台用户', icon: 'Users' },
  { key: 'quota', path: ROUTES.PLATFORM.QUOTA, label: '资源与配额', icon: 'Package' },
  { key: 'templates', path: ROUTES.PLATFORM.TEMPLATES, label: '模板中心', icon: 'Library' },
  { key: 'audit', path: ROUTES.PLATFORM.AUDIT, label: '平台审计', icon: 'Shield' },
  { key: 'settings', path: ROUTES.PLATFORM.SETTINGS, label: '平台设置', icon: 'Settings' },
]

export const platformMenuConfig: MenuItem[] = platformMenuBase

/**
 * 平台菜单：系统管理员额外显示「系统控制台」入口，便于进入 Agent/流程/LLM 等管理
 */
export function getPlatformMenuConfig(user: User | null): MenuItem[] {
  if (!user || !isSystemAdmin(user)) return platformMenuBase
  return [
    ...platformMenuBase,
    { key: 'system-console', path: ROUTES.SYSTEM.BASE, label: '系统控制台', icon: 'Waypoints' },
  ]
}
