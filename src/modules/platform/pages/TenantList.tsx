import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { Table } from '@/components/Table/Table'
import { Pagination } from '@/components/Pagination/Pagination'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { getTenantList } from '../services/tenantService'
import type { Tenant, TenantStatus } from '../schemas/tenant'
import { ROUTES } from '@/core/constants/routes'

const statusMap: Record<TenantStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  suspended: 'warning',
  expired: 'error',
}

export function TenantList() {
  const navigate = useNavigate()
  const [list, setList] = useState<Tenant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<TenantStatus | ''>('')
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTenantList({
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
        status: statusFilter || undefined,
        plan: planFilter || undefined,
      })
      setList(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, statusFilter, planFilter])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    { key: 'name', title: '租户名称', width: '140px' },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (_: unknown, r: Tenant) => (
        <StatusTag type={statusMap[r.status]}>{r.status === 'active' ? '正常' : r.status === 'suspended' ? '已暂停' : '已过期'}</StatusTag>
      ),
    },
    { key: 'plan', title: '套餐', width: '90px' },
    { key: 'memberCount', title: '成员数', width: '80px' },
    { key: 'projectCount', title: '项目数', width: '80px' },
    { key: 'quotaUsage', title: '资源使用', width: '100px' },
    { key: 'createdAt', title: '创建时间', width: '110px', render: (_: unknown, r: Tenant) => r.createdAt.slice(0, 10) },
    {
      key: 'action',
      title: '操作',
      width: '120px',
      render: (_: unknown, r: Tenant) => (
        <div className={listPageStyles.actions}>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => navigate(`${ROUTES.PLATFORM.TENANTS}/${r.id}`)}>
            查看
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="租户管理"
      description="管理平台内所有租户，查看套餐与配额、成员与项目概览"
    >
      <ListPageToolbar
        primaryAction={
          <button type="button" className={listPageStyles.primaryBtn} onClick={() => { /* 新建租户：后续对接表单或抽屉 */ }}>
            新建租户
          </button>
        }
      >
        <input
          type="text"
          className={listPageStyles.search}
          placeholder="搜索租户名称或编码"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select className={listPageStyles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TenantStatus | '')}>
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="suspended">已暂停</option>
          <option value="expired">已过期</option>
        </select>
        <select className={listPageStyles.select} value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
          <option value="">全部套餐</option>
          <option value="基础版">基础版</option>
          <option value="专业版">专业版</option>
          <option value="企业版">企业版</option>
          <option value="试用版">试用版</option>
        </select>
        <button type="button" className={listPageStyles.queryBtn} onClick={() => setPage(1)}>
          查询
        </button>
      </ListPageToolbar>
      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        emptyText="暂无租户数据"
      />
      {total > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        />
      )}
    </PageContainer>
  )
}
