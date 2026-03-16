/**
 * Step3TemplateSelector
 * 项目创建向导第三步：选择流程模板
 *
 * 功能：
 * - 从流程中心已有 active 模板中选择，作为本项目的执行流程
 * - 支持按项目类型 / 目标类型自动推荐（靠前展示）
 * - 支持关键词搜索 + 状态筛选
 * - 选中后展示节点预览（节点数、名称列表）
 * - 允许不选模板，点击"跳过"直接进入 Step5
 * - 提供"前往流程规划工作台"外链，让用户先去规划并发布模板，再回来选
 */

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import type { ProjectCreationFormState } from '../types'
import type { WorkflowTemplate } from '@/modules/tenant/schemas/workflowExecution'
import { listWorkflowTemplates } from '@/modules/tenant/services/workflowTemplateFactoryService'
import { getTemplateNodes } from '@/modules/tenant/services/workflowExecutionService'
import { ROUTES } from '@/core/constants/routes'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Step3TemplateSelectorProps {
  /** 当前向导表单状态 */
  form: ProjectCreationFormState
  /** 更新表单字段 */
  onChange: (partial: Partial<ProjectCreationFormState>) => void
  /** 当前租户 ID，用于加载租户侧模板 */
  tenantId: string
  /**
   * 点击"跳过"时的回调
   * 由 ProjectCreationWizard 决定跳至 Step5
   */
  onSkip: () => void
}

// ─── 内部类型 ─────────────────────────────────────────────────────────────────

/** 模板列表展示项（精简字段，仅列表用） */
interface TemplateListItem {
  id: string
  name: string
  description?: string
  /** 节点数量，来自 WorkflowTemplate.nodeCount */
  nodeCount: number
  /** 是否为推荐模板（匹配当前 projectTypeCode + goalTypeCode） */
  isRecommended: boolean
  /** 节点名称列表，用于选中后预览 */
  nodeNames: string[]
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/**
 * 判断模板是否推荐
 * 条件：template.supportedProjectTypeId === projectTypeCode
 *       && template.supportedGoalTypeIds?.includes(goalTypeCode)
 */
function isRecommendedTemplate(
  template: WorkflowTemplate,
  projectTypeCode: string,
  goalTypeCode: string,
): boolean {
  if (template.supportedProjectTypeId !== projectTypeCode) return false
  return (template.supportedGoalTypeIds ?? []).includes(goalTypeCode)
}

/**
 * 将 WorkflowTemplate[] 转换为 TemplateListItem[]
 * 并按 isRecommended 降序排列
 */
function filterByKeyword(items: TemplateListItem[], kw: string): TemplateListItem[] {
  if (!kw.trim()) return items
  const k = kw.trim().toLowerCase()
  return items.filter(
    (i) =>
      i.name.toLowerCase().includes(k) || (i.description ?? '').toLowerCase().includes(k),
  )
}

// ─── 子组件 ───────────────────────────────────────────────────────────────────

/**
 * TemplateCard
 * 单个模板的选择卡片
 * - 选中时显示高亮边框 + 勾选标记
 * - 展示：模板名称、描述、节点数、是否推荐标签
 */
function TemplateCard({
  item,
  selected,
  onSelect,
}: {
  item: TemplateListItem
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(item.id)}
      style={{
        border: `2px solid ${selected ? '#1677ff' : '#e8e8e8'}`,
        borderRadius: 8,
        padding: 16,
        cursor: 'pointer',
        background: selected ? '#e6f4ff' : '#fff',
        minWidth: 200,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <strong>{item.name}</strong>
          {item.isRecommended && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#1677ff' }}>推荐</span>
          )}
        </div>
        {selected && <span style={{ color: '#1677ff' }}>✓</span>}
      </div>
      {item.description && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666' }}>{item.description}</p>
      )}
      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#999' }}>
        {item.nodeCount} 个节点 · 已发布
      </p>
      <button
        type="button"
        style={{ marginTop: 12, fontSize: 12 }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(item.id)
        }}
      >
        {selected ? '取消选择' : '选择此模板'}
      </button>
    </div>
  )
}

/**
 * TemplateNodePreview
 * 选中模板后底部展示的节点名称预览条
 * 格式：「已选：{模板名} ✓」+ 节点链: 节点1 → 节点2 → ...
 */
function TemplateNodePreview({ item }: { item: TemplateListItem }) {
  const chain = item.nodeNames.length > 0 ? item.nodeNames.join(' -> ') : `共 ${item.nodeCount} 个节点`
  return (
    <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
      <strong>已选：{item.name} ✓</strong>
      <p style={{ margin: '8px 0 0', fontSize: 13, color: '#666' }}>节点预览：{chain}</p>
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function Step3TemplateSelector({
  form,
  onChange,
  tenantId,
  onSkip,
}: Step3TemplateSelectorProps) {
  /** 完整列表项（含 nodeNames），用于搜索过滤 */
  const [fullListItems, setFullListItems] = useState<TemplateListItem[]>([])
  /** 展示用的模板项（已按关键词过滤） */
  const [displayItems, setDisplayItems] = useState<TemplateListItem[]>([])
  /** 关键词搜索 */
  const [keyword, setKeyword] = useState('')
  /** 加载态 */
  const [loading, setLoading] = useState(true)
  /** 错误信息 */
  const [error, setError] = useState<string | null>(null)
  /** 当前选中的模板 ID（同步自 form.selectedWorkflowTemplateId） */
  const selectedId = form.selectedWorkflowTemplateId

  /**
   * loadTemplates
   * 加载当前租户下 status=active 的流程模板
   * 成功后为每个模板拉取节点列表以填充 nodeNames，再转换并设置 displayItems
   */
  const loadTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { items } = await listWorkflowTemplates({
        tenantId,
        status: 'active',
        page: 1,
        pageSize: 999,
      })
      const withNodes = await Promise.all(
        items.map(async (t) => {
          const nodes = await getTemplateNodes(t.id)
          const nodeNames = nodes
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((n) => n.name)
          return {
            id: t.id,
            name: t.name,
            description: t.description,
            nodeCount: t.nodeCount ?? nodes.length,
            isRecommended: isRecommendedTemplate(t, form.projectTypeCode, form.goalTypeCode),
            nodeNames,
          }
        }),
      )
      const sorted = withNodes.sort((a, b) =>
        a.isRecommended === b.isRecommended ? 0 : a.isRecommended ? -1 : 1,
      )
      setFullListItems(sorted)
      setDisplayItems(keyword.trim() ? filterByKeyword(sorted, keyword) : sorted)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载模板失败')
    } finally {
      setLoading(false)
    }
    // keyword 由单独的 useEffect 处理过滤，此处不需要作为依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, form.projectTypeCode, form.goalTypeCode])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  /** 关键词变化时同步过滤展示列表 */
  useEffect(() => {
    if (fullListItems.length === 0) return
    setDisplayItems(filterByKeyword(fullListItems, keyword))
  }, [keyword, fullListItems])

  /** 对 fullListItems 按 keyword 做前端过滤 */
  const handleSearch = useCallback((kw: string) => {
    setKeyword(kw)
  }, [])

  /**
   * handleSelect
   * 选中某个模板：更新 form.selectedWorkflowTemplateId
   * 若再次点击同一模板，取消选中（设为 undefined）
   */
  const handleSelect = useCallback(
    (templateId: string) => {
      onChange({
        selectedWorkflowTemplateId:
          selectedId === templateId ? undefined : templateId,
      })
    },
    [selectedId, onChange],
  )

  const recommendedItems = displayItems.filter((i) => i.isRecommended)
  const otherItems = displayItems.filter((i) => !i.isRecommended)
  const selectedItem = displayItems.find((i) => i.id === selectedId)

  return (
    <div>
      {/* 搜索与筛选工具栏 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="搜索模板名称或描述"
          value={keyword}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ padding: '6px 12px', width: 240, borderRadius: 4, border: '1px solid #d9d9d9' }}
        />
      </div>

      {/* 错误态 */}
      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', borderRadius: 8, color: '#cf1322' }}>
          {error}
          <button type="button" onClick={() => loadTemplates()} style={{ marginLeft: 8 }}>
            重试
          </button>
        </div>
      )}

      {/* 加载态 */}
      {loading && (
        <p style={{ color: '#999', marginBottom: 16 }}>加载模板列表中…</p>
      )}

      {/* 推荐模板区 */}
      {!loading && recommendedItems.length > 0 && (
        <Card title="✨ 推荐模板" description="与当前项目类型和目标类型匹配">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {recommendedItems.map((item) => (
              <TemplateCard
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </Card>
      )}

      {/* 其他可用模板区 */}
      {!loading && otherItems.length > 0 && (
        <Card title="其他可用模板" description="可用但不完全匹配当前目标">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {otherItems.map((item) => (
              <TemplateCard
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </Card>
      )}

      {/* 全部模板为空时 */}
      {!loading && displayItems.length === 0 && (
        <EmptyState
          title="暂无可用流程模板"
          description="系统中尚无活跃流程模板，请先在流程规划工作台创建并发布模板"
        />
      )}

      {/* 选中预览条 */}
      {selectedItem && <TemplateNodePreview item={selectedItem} />}

      {/* 底部操作区 */}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, color: '#666' }}>没有合适的模板？</p>
        <a
          href={ROUTES.TENANT.WORKFLOW_PLANNING_NEW}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginRight: 16 }}
        >
          前往流程规划工作台，用 SOP 生成并发布新模板 ↗
        </a>
        <button type="button" onClick={onSkip} style={{ alignSelf: 'flex-start' }}>
          跳过，先创建项目，稍后再绑定流程
        </button>
      </div>
    </div>
  )
}
