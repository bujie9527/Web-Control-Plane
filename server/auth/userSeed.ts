/**
 * 用户种子：确保存在 admin / admin123 平台管理员，供登录与演示使用
 */
import { dbGetUserByAccount, dbCreateUser } from './authDb'

const ADMIN_ACCOUNT = 'admin'
const ADMIN_PASSWORD = 'admin123'
const ADMIN_NAME = '平台管理员'
const ADMIN_ROLE = 'platform_admin'

export async function seedAdminUserIfMissing(): Promise<void> {
  const existing = await dbGetUserByAccount(ADMIN_ACCOUNT)
  if (existing) return
  await dbCreateUser({
    account: ADMIN_ACCOUNT,
    password: ADMIN_PASSWORD,
    name: ADMIN_NAME,
    role: ADMIN_ROLE,
    tenantId: null,
  })
}
