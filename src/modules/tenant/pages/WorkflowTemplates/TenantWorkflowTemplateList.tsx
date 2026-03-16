import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { useAuth } from '@/core/auth/AuthContext'
import { ROUTES } from '@/core/constants/routes'
import {
  cloneWorkflowTemplateToTenant,
  listWorkflowTemplates,
} from '@/modules/tenant/services/workflowTemplateFactoryService'
import type { WorkflowTemplate, WorkflowTemplateStatus } from '@/modules/tenant/schemas/workflowExecution'

const statusMap: Record<WorkflowTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  deprecated: 'warning',
  archived: 'error',
  inactive: 'warning',
}
const statusLabel: Record<WorkflowTemplateStatus, string> = {
  draft: '草稿',
  active: '启用',
  deprecated: '已废弃',
  archived: '已归档',
  inactive: '停用',
}

export function TenantWorkflowTemplateList() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''
  const [list, setList] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'' | 'system' | 'tenant'>('')

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await listWorkflowTemplates({
        tenantId,
        page: 1,
        pageSize: 999,
        keyword: keyword.trim() || undefined,
        scopeType: scopeFilter || undefined,
      })
      setList(res.items)
    } finally {
      setLoading(false)
    }
  }, [tenantId, keyword, scopeFilter])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    { key: 'name', title: '模板名称', width: '160px' },
    {
      key: 'scopeType',
      title: '作用域',
      width: '90px',
      render: (_: unknown, r: WorkflowTemplate) => (r.scopeType === 'system' ? '平台模板' : '我的模板'),
    },
    {
      key: 'source',
      title: '来源模板',
      width: '140px',
      render: (_: unknown, r: WorkflowTemplate) =>
        r.sourceTemplateId ? `v${r.sourceVersion ?? 1}` : '—',
    },
    {
      key: 'projectType',
      title: '项目类型',
      width: '120px',
      render: (_: unknown, r: WorkflowTemplate) => r.supportedProjectTypeId || '—',
    },
    {
      key: 'deliverable',
      title: '交付模式',
      width: '140px',
      render: (_: unknown, r: WorkflowTemplate) =>
        r.supportedDeliverableModes?.slice(0, 2).join('、') || '—',
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (_: unknown, r: WorkflowTemplate) => (
        <StatusTag type={statusMap[r.status]}>{statusLabel[r.status]}</StatusTag>
      ),
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      width: '120px',
      render: (_: unknown, r: WorkflowTemplate) => r.updatedAt || '—',
    },
    {
      key: 'action',
      title: '操作',
      width: '220px',
      render: (_: unknown, r: WorkflowTemplate) => (
        <div className={listPageStyles.actions}>
          <Link className={listPageStyles.linkBtn} to={ROUTES.TENANT.WORKFLOW_TEMPLATES_DETAIL(r.id)}>
            查看
          </Link>
          {r.scopeType === 'system' && (
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={async () => {
                await cloneWorkflowTemplateToTenant(r.id, tenantId)
                load()
              }}
            >
              复制为租户模板
            </button>
          )}
          {r.scopeType === 'tenant' && (
            <Link
              className={listPageStyles.linkBtn}
              to={ROUTES.TENANT.WORKFLOW_TEMPLATES_EDIT(r.id)}
            >
              编辑
            </Link>
          )}
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="流程中心"
      description="查看可用模板、查看详情、复制平台模板为租户模板。新建与编辑模板请使用平台后台（系统管理员账号登录后进入「流程模板工厂」）"
    >
      <Card title="可用模板" description="租户可查看平台模板和自己的租户模板">
        <ListPageToolbar>
          <input
            type="text"
            className={listPageStyles.search}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索名称或编码"
          />
          <select
            className={listPageStyles.select}
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as '' | 'system' | 'tenant')}
          >
            <option value="">全部作用域</option>
            <option value="system">平台模板</option>
            <option value="tenant">租户模板</option>
          </select>
          <button type="button" className={listPageStyles.queryBtn} onClick={load}>
            查询
          </button>
        </ListPageToolbar>
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} emptyText="暂无模板" />
      </Card>
    </PageContainer>
  )
}
