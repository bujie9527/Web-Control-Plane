import type { User } from '@/core/types/auth'

/**
 * Mock 用户：平台管理员登录后进入平台后台，租户用户进入租户后台
 */
export const MOCK_USERS: User[] = [
  {
    id: 'platform-admin-1',
    name: '平台管理员',
    account: 'admin',
    role: 'platform_admin',
    tenant: undefined,
  },
  {
    id: 'tenant-user-1',
    name: '租户用户',
    account: 'user@tenant',
    role: 'tenant_admin',
    tenant: {
      tenantId: 'tenant-demo-001',
      tenantName: '演示租户',
    },
  },
  {
    id: 'u1',
    name: '张三',
    account: 'zhangsan@t1',
    role: 'tenant_admin',
    tenant: {
      tenantId: 't1',
      tenantName: '测试租户',
    },
  },
]
