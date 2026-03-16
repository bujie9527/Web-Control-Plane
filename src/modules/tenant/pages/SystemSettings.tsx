import { useCallback, useEffect, useState } from 'react'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { useAuth } from '@/core/auth/AuthContext'
import {
  getTenantMembers,
  getTenantRoles,
  getTenantAuditLogs,
  type TenantMemberItem,
  type TenantRoleItem,
  type TenantAuditLogItem,
} from '../services/tenantSettingsService'
import styles from './SkeletonPages.module.css'

const memberColumns = [
  { key: 'name', title: '成员', width: '120px' },
  { key: 'role', title: '角色', width: '100px' },
  { key: 'status', title: '状态', width: '90px', render: (_: unknown, r: TenantMemberItem) => <StatusTag status={r.status}>{r.status}</StatusTag> },
]

const auditColumns = [
  { key: 'action', title: '操作', width: '120px' },
  { key: 'operator', title: '操作人', width: '100px' },
  { key: 'result', title: '结果', width: '80px', render: (_: unknown, r: TenantAuditLogItem) => <StatusTag status={r.result}>{r.result}</StatusTag> },
  { key: 'time', title: '时间', width: '140px' },
]

export function SystemSettings() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? 't1'
  const [members, setMembers] = useState<TenantMemberItem[]>([])
  const [roles, setRoles] = useState<TenantRoleItem[]>([])
  const [auditLogs, setAuditLogs] = useState<TenantAuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    Promise.all([
      getTenantMembers(tenantId),
      getTenantRoles(tenantId),
      getTenantAuditLogs(tenantId),
    ])
      .then(([m, r, a]) => {
        setMembers(m)
        setRoles(r)
        setAuditLogs(a)
      })
      .catch((e) => {
        setError(e?.message ?? '加载系统设置失败，请稍后重试')
      })
      .finally(() => setLoading(false))
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <PageContainer
      title="系统管理"
      description="成员管理、角色权限、菜单权限、工作区设置与审计日志"
    >
      <Card title="成员管理" description="工作区成员列表">
        {error ? (
          <p className={styles.placeholder} style={{ color: 'var(--color-error, #c5221f)' }}>
            {error}
            <button type="button" onClick={load} style={{ marginLeft: 12, cursor: 'pointer', textDecoration: 'underline' }}>重试</button>
          </p>
        ) : loading ? (
          <p className={styles.placeholder}>加载中...</p>
        ) : (
          <Table columns={memberColumns} dataSource={members} rowKey="id" emptyText="暂无成员" />
        )}
      </Card>
      <Card title="角色权限" description="角色与权限配置">
        {error ? (
          <p className={styles.placeholder} style={{ color: 'var(--color-error, #c5221f)' }}>{error} <button type="button" onClick={load} style={{ marginLeft: 12, cursor: 'pointer', textDecoration: 'underline' }}>重试</button></p>
        ) : loading ? (
          <p className={styles.placeholder}>加载中...</p>
        ) : (
          <div className={styles.simpleList}>
            {roles.map((r) => (
              <div key={r.id} className={styles.simpleRow}>
                <span>{r.name}</span>
                <span>权限数：{r.permissionCount}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title="菜单权限 / 工作区设置" description="后续扩展：菜单可见范围、工作区名称与 logo">
        <p className={styles.placeholder}>菜单权限与工作区设置将在后续迭代中开放。扩展点：core/types/role、core/types/permission。</p>
      </Card>
      <Card title="审计日志" description="操作与登录审计">
        {error ? (
          <p className={styles.placeholder} style={{ color: 'var(--color-error, #c5221f)' }}>{error} <button type="button" onClick={load} style={{ marginLeft: 12, cursor: 'pointer', textDecoration: 'underline' }}>重试</button></p>
        ) : loading ? (
          <p className={styles.placeholder}>加载中...</p>
        ) : (
          <Table columns={auditColumns} dataSource={auditLogs} rowKey="id" emptyText="暂无审计记录" />
        )}
      </Card>
    </PageContainer>
  )
}
