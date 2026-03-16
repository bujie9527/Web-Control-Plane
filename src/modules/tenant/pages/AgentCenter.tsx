import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Pagination } from '@/components/Pagination/Pagination'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { getTemplateList } from '@/modules/platform/services/agentTemplateService'
import type { AgentTemplate, AgentTemplateStatus } from '@/modules/platform/schemas/agentTemplate'
import {
  AGENT_ROLE_TYPE_LABELS,
  AGENT_CATEGORY_LABELS,
  AGENT_PLATFORM_TYPE_LABELS,
  EXECUTOR_TYPE_LABELS,
  AGENT_TEMPLATE_STATUS_LABELS,
} from '@/core/labels/agentTemplateLabels'
import type { AgentPlatformType } from '@/modules/platform/schemas/agentTemplate'
import { ROUTES } from '@/core/constants/routes'

const statusMap: Record<AgentTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  inactive: 'warning',
  archived: 'error',
}

const CATEGORY_OPTIONS = [
  { value: '', label: '全部分类' },
  { value: 'planning', label: '规划类' },
  { value: 'execution', label: '执行类' },
  { value: 'coordination', label: '协调类' },
]

const PLATFORM_OPTIONS: { value: '' | AgentPlatformType; label: string }[] = [
  { value: '', label: '全部平台' },
  { value: 'general', label: '通用' },
  { value: 'facebook', label: 'Facebook 专用' },
  { value: 'x', label: 'X (Twitter) 专用' },
  { value: 'tiktok', label: 'TikTok 专用' },
  { value: 'instagram', label: 'Instagram 专用' },
  { value: 'wechat', label: '微信专用' },
]

export function AgentCenter() {
  const navigate = useNavigate()
  const [list, setList] = useState<AgentTemplate[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState<'' | AgentPlatformType>('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTemplateList({
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
        status: 'active',
        category: categoryFilter || undefined,
        platformType: platformFilter || undefined,
      })
      setList(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, categoryFilter, platformFilter])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    {
      key: 'nameZh',
      title: 'Agent 名称',
      width: '150px',
      render: (_: unknown, r: AgentTemplate) => (
        <button
          type="button"
          className={listPageStyles.linkBtn}
          onClick={() => navigate(ROUTES.TENANT.AGENT_LIBRARY_DETAIL(r.id))}
        >
          {r.nameZh ?? r.name}
        </button>
      ),
    },
    { key: 'code', title: '编码', width: '130px' },
    {
      key: 'category',
      title: '分类',
      width: '80px',
      render: (_: unknown, r: AgentTemplate) =>
        AGENT_CATEGORY_LABELS[r.category ?? ''] ?? r.category ?? '—',
    },
    {
      key: 'platformType',
      title: '平台',
      width: '100px',
      render: (_: unknown, r: AgentTemplate) =>
        AGENT_PLATFORM_TYPE_LABELS[r.platformType ?? 'general'] ?? '—',
    },
    {
      key: 'roleType',
      title: '角色类型',
      width: '90px',
      render: (_: unknown, r: AgentTemplate) => AGENT_ROLE_TYPE_LABELS[r.roleType],
    },
    {
      key: 'defaultExecutorType',
      title: '默认执行器',
      width: '90px',
      render: (_: unknown, r: AgentTemplate) => EXECUTOR_TYPE_LABELS[r.defaultExecutorType],
    },
    {
      key: 'skillCount',
      title: '关联 Skill',
      width: '80px',
      render: (_: unknown, r: AgentTemplate) =>
        (r.supportedSkillIds?.length ?? 0).toString(),
    },
    {
      key: 'status',
      title: '状态',
      width: '80px',
      render: (_: unknown, r: AgentTemplate) => (
        <StatusTag type={statusMap[r.status]}>{AGENT_TEMPLATE_STATUS_LABELS[r.status]}</StatusTag>
      ),
    },
    {
      key: 'version',
      title: '版本',
      width: '60px',
      render: (_: unknown, r: AgentTemplate) => r.version ?? '—',
    },
    {
      key: 'action',
      title: '操作',
      width: '80px',
      render: (_: unknown, r: AgentTemplate) => (
        <button
          type="button"
          className={listPageStyles.linkBtn}
          onClick={() => navigate(ROUTES.TENANT.AGENT_LIBRARY_DETAIL(r.id))}
        >
          查看
        </button>
      ),
    },
  ]

  return (
    <PageContainer
      title="Agent 中心"
      description="查看平台 Agent 资产库，了解每个 Agent 的能力、Skill 配置与使用信息"
    >
      {/** 快捷入口：身份库 */}
      <Card title="身份库" description="管理可复用身份/人设，统一表达口径">
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={listPageStyles.primaryBtn}
            onClick={() => navigate(ROUTES.TENANT.IDENTITIES)}
          >
            进入身份库
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#5f6368' }}>
            身份/人设是项目内容创作的视角与立场，可绑定终端和任务。
          </span>
        </div>
      </Card>

      {/** Agent 库 */}
      <Card
        title="Agent 库"
        description="平台预置的 Agent 模板，供项目与流程节点选用（只读，管理在系统后台）"
      >
        <ListPageToolbar
          primaryAction={
            <span style={{ fontSize: 13, color: '#5f6368', padding: '6px 0' }}>
              共 {loading ? '...' : total} 个可用 Agent
            </span>
          }
        >
          <input
            type="text"
            className={listPageStyles.search}
            placeholder="搜索名称或编码"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            className={listPageStyles.select}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className={listPageStyles.select}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as '' | AgentPlatformType)}
          >
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="button"
            className={listPageStyles.queryBtn}
            onClick={() => setPage(1)}
          >
            查询
          </button>
        </ListPageToolbar>

        {!loading && total === 0 ? (
          keyword || categoryFilter || platformFilter ? (
            <EmptyState title="未找到匹配项" description="请调整搜索条件后重试" />
          ) : (
            <EmptyState
              title="暂无可用 Agent"
              description="平台尚未配置可用的 Agent 模板，请联系系统管理员"
            />
          )
        ) : (
          <Table
            columns={columns}
            dataSource={list}
            rowKey="id"
            loading={loading}
            emptyText="暂无可用 Agent"
          />
        )}

        {total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        )}
      </Card>
    </PageContainer>
  )
}
