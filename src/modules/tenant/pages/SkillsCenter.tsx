import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Pagination } from '@/components/Pagination/Pagination'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { getSkillList } from '@/modules/platform/services/skillService'
import type { Skill } from '@/modules/platform/schemas/skill'
import {
  SKILL_STATUS_LABELS,
  SKILL_CATEGORY_LABELS,
  SKILL_EXECUTION_TYPE_LABELS,
} from '@/core/labels/skillLabels'
import { ROUTES } from '@/core/constants/routes'

export function SkillsCenter() {
  const navigate = useNavigate()
  const [list, setList] = useState<Skill[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSkillList({
        page,
        pageSize,
        status: 'active',
        keyword: keyword.trim() || undefined,
        category: categoryFilter || undefined,
      })
      setList(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, categoryFilter])

  useEffect(() => {
    load()
  }, [load])

  const categoryGroups = React.useMemo(() => {
    const map: Record<string, number> = {}
    list.forEach((s) => {
      map[s.category] = (map[s.category] ?? 0) + 1
    })
    return map
  }, [list])

  const columns = [
    {
      key: 'name',
      title: '技能名称',
      width: '140px',
      render: (_: unknown, r: Skill) => (
        <button
          type="button"
          className={listPageStyles.linkBtn}
          onClick={() => navigate(ROUTES.TENANT.SKILL_DETAIL(r.id))}
        >
          {r.nameZh ?? r.name}
        </button>
      ),
    },
    { key: 'code', title: '编码', width: '120px' },
    {
      key: 'category',
      title: '分类',
      width: '90px',
      render: (_: unknown, r: Skill) => SKILL_CATEGORY_LABELS[r.category] ?? r.category,
    },
    {
      key: 'executionType',
      title: '执行类型',
      width: '110px',
      render: (_: unknown, r: Skill) =>
        SKILL_EXECUTION_TYPE_LABELS[r.executionType] ?? r.executionType,
    },
    {
      key: 'status',
      title: '状态',
      width: '80px',
      render: (_: unknown, r: Skill) => (
        <StatusTag type="success">{SKILL_STATUS_LABELS[r.status]}</StatusTag>
      ),
    },
    {
      key: 'description',
      title: '说明',
      render: (_: unknown, r: Skill) => r.description ?? '—',
    },
    {
      key: 'action',
      title: '操作',
      width: '80px',
      render: (_: unknown, r: Skill) => (
        <button
          type="button"
          className={listPageStyles.linkBtn}
          onClick={() => navigate(ROUTES.TENANT.SKILL_DETAIL(r.id))}
        >
          查看
        </button>
      ),
    },
  ]

  return (
    <PageContainer
      title="Skills 能力库"
      description="查看平台提供的可复用 AI 技能，了解每项 Skill 的用途与所绑定的 Agent"
    >
      {/** 技能总览统计 */}
      <Card title="技能总览" description="系统已启用的 Skill 数量与分类分布">
        {loading ? (
          <p style={{ color: '#5f6368', fontSize: 14 }}>加载中...</p>
        ) : total === 0 ? (
          <EmptyState title="暂无已启用 Skill" description="系统尚未配置可用 Skill" />
        ) : (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', padding: '4px 0' }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#1a73e8' }}>{total}</div>
              <div style={{ fontSize: 13, color: '#5f6368', marginTop: 2 }}>技能总数</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#1a73e8' }}>
                {Object.keys(categoryGroups).length}
              </div>
              <div style={{ fontSize: 13, color: '#5f6368', marginTop: 2 }}>分类数</div>
            </div>
            {Object.entries(categoryGroups).map(([cat, count]) => (
              <div key={cat}>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#3c4043' }}>{count}</div>
                <div style={{ fontSize: 13, color: '#5f6368', marginTop: 2 }}>
                  {SKILL_CATEGORY_LABELS[cat] ?? cat}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/** 技能列表 */}
      <Card title="技能列表" description="所有已启用的系统 Skill，点击名称查看详情">
        <ListPageToolbar
          primaryAction={
            <button
              type="button"
              className={listPageStyles.primaryBtn}
              disabled
              title="Skill 由系统管理员在 Skill 工厂中创建"
            >
              新建（仅系统管理员）
            </button>
          }
        >
          <input
            type="text"
            className={listPageStyles.search}
            placeholder="搜索技能名称或编码"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            className={listPageStyles.select}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">全部分类</option>
            {Object.entries(SKILL_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
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
          keyword || categoryFilter ? (
            <EmptyState
              title="未找到匹配项"
              description="请调整搜索条件后重试"
            />
          ) : (
            <EmptyState
              title="暂无可用技能"
              description="系统技能由管理员在 Skill 工厂中维护，当前尚无已启用技能"
            />
          )
        ) : (
          <Table
            columns={columns}
            dataSource={list}
            rowKey="id"
            loading={loading}
            emptyText="暂无技能"
          />
        )}

        {total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        )}
      </Card>

      {/** 技能测试台占位说明 */}
      <Card
        title="技能测试台"
        description="选定 Agent、输入与环境，测试 Skill 执行效果"
      >
        <p style={{ margin: 0, fontSize: 14, color: '#5f6368', lineHeight: 1.6 }}>
          技能测试台用于在选定 Agent 模板、输入参数与执行环境下，直接调用 Skill 并查看输出结果。该功能将与 Skill 工厂、LLM 执行器联动，在后续迭代中开放。届时可在此验证 Skill 的输入输出结构、执行耗时与异常处理。
        </p>
      </Card>
    </PageContainer>
  )
}
