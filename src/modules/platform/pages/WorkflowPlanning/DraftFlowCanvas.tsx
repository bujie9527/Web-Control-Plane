/**
 * DraftFlowCanvas
 * 流程规划工作台右侧的流程图组件
 *
 * 当前实现：按 orderIndex 垂直排列节点卡片 + 依赖箭头（纯 CSS 布局）
 * 后续可升级为 @xyflow/react 实现拖拽、缩放、小地图
 */

import { useCallback, useMemo, useState } from 'react'
import type { WorkflowPlanningDraft, WorkflowPlanningDraftNode } from '@/modules/tenant/schemas/workflowPlanningSession'
import type { ValidationResult } from '@/modules/tenant/services/workflowPlanningValidator'

const EXEC_TYPE_LABELS: Record<string, string> = {
  agent_task: 'Agent 任务',
  human_review: '人工审核',
  approval_gate: '审批关卡',
  result_writer: '结果记录',
}
const INTENT_TYPE_LABELS: Record<string, string> = {
  create: '创建',
  review: '审核',
  publish: '发布',
  record: '记录',
}

/** 节点变更状态 */
export type NodeChangeState = 'unchanged' | 'added' | 'modified'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DraftFlowCanvasProps {
  /** 当前草案（null 时展示空状态） */
  draft: WorkflowPlanningDraft | null
  /** 上一个草案版本（用于 diff 计算变更高亮，可选） */
  prevDraft?: WorkflowPlanningDraft | null
  /** 校验结果（校验失败的节点展示红色边框） */
  validationResult?: ValidationResult | null
  /** 缺少能力提示列表（来自 draft.missingCapabilities） */
  missingCapabilities?: string[]
  /** 草案版本选择器（版本切换 UI，由父组件传入） */
  draftVersionSelector?: React.ReactNode
}

function computeNodeChanges(
  current: WorkflowPlanningDraftNode[],
  prev?: WorkflowPlanningDraftNode[],
): Map<string, NodeChangeState> {
  const map = new Map<string, NodeChangeState>()
  const prevByKey = new Map(prev?.map((n) => [n.key, n]) ?? [])
  for (const n of current) {
    const p = prevByKey.get(n.key)
    if (!p) map.set(n.key, 'added')
    else if (
      p.name !== n.name ||
      p.executionType !== n.executionType ||
      p.intentType !== n.intentType ||
      (p.recommendedAgentTemplateId ?? '') !== (n.recommendedAgentTemplateId ?? '')
    ) {
      map.set(n.key, 'modified')
    } else {
      map.set(n.key, 'unchanged')
    }
  }
  return map
}

function NodeCard({
  node,
  changeState,
  onDetail,
}: {
  node: WorkflowPlanningDraftNode
  changeState: NodeChangeState
  onDetail: (nodeId: string) => void
}) {
  const borderColor =
    changeState === 'added' ? '#52c41a' : changeState === 'modified' ? '#fa8c16' : '#e8e8e8'
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onDetail(node.id)}
      onKeyDown={(e) => e.key === 'Enter' && onDetail(node.id)}
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        cursor: 'pointer',
        background: '#fff',
      }}
    >
      <div style={{ fontWeight: 600 }}>{node.name}</div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
        {EXEC_TYPE_LABELS[node.executionType] ?? node.executionType}
        {node.executionType === 'agent_task' && (
          <> · {INTENT_TYPE_LABELS[node.intentType] ?? node.intentType}</>
        )}
      </div>
      {node.recommendedAgentTemplateId && (
        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          Agent：{node.recommendedAgentTemplateId}
        </div>
      )}
      {changeState !== 'unchanged' && (
        <span style={{ fontSize: 11, marginLeft: 8, color: borderColor }}>
          {changeState === 'added' ? 'New' : 'Changed'}
        </span>
      )}
    </div>
  )
}

function NodeDetailModal({
  node,
  onClose,
}: {
  node: WorkflowPlanningDraftNode | null
  onClose: () => void
}) {
  if (!node) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: 400, width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h4>{node.name}</h4>
        <p><strong>key</strong> {node.key}</p>
        <p><strong>执行类型</strong> {node.executionType}</p>
        <p><strong>意图类型</strong> {node.intentType}</p>
        <p><strong>推荐 Agent</strong> {node.recommendedAgentTemplateId ?? '—'}</p>
        <p><strong>依赖节点</strong> {(node.dependsOnNodeIds ?? []).join(', ') || '无'}</p>
        <button type="button" onClick={onClose}>关闭</button>
      </div>
    </div>
  )
}

function MissingCapabilitiesPanel({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <div style={{ marginTop: 12, padding: 12, background: '#fffbe6', borderRadius: 8, fontSize: 13 }}>
      <strong>当前流程缺少以下能力</strong>
      <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <p style={{ marginTop: 8, color: '#666', fontSize: 12 }}>可前往 Agent 工厂补充相关能力后重新规划。</p>
    </div>
  )
}

export function DraftFlowCanvas({
  draft,
  prevDraft,
  validationResult,
  missingCapabilities = [],
  draftVersionSelector,
}: DraftFlowCanvasProps) {
  const [detailNode, setDetailNode] = useState<WorkflowPlanningDraftNode | null>(null)

  const changeMap = useMemo(() => {
    if (!draft) return new Map<string, NodeChangeState>()
    return computeNodeChanges(draft.nodes, prevDraft?.nodes)
  }, [draft, prevDraft])

  const sortedNodes = useMemo(() => {
    if (!draft) return []
    return draft.nodes.slice().sort((a, b) => a.orderIndex - b.orderIndex)
  }, [draft])

  const handleNodeDetail = useCallback(
    (nodeId: string) => {
      const node = draft?.nodes.find((n) => n.id === nodeId) ?? null
      setDetailNode(node)
    },
    [draft],
  )

  if (!draft) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#999' }}>
        暂无草案。发送消息后，流程规划助手将生成流程图。
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {draftVersionSelector && (
        <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
          {draftVersionSelector}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 200, overflowY: 'auto', padding: '12px 0' }}>
        {sortedNodes.map((node, i) => (
          <div key={node.id}>
            <NodeCard
              node={node}
              changeState={changeMap.get(node.key) ?? 'unchanged'}
              onDetail={handleNodeDetail}
            />
            {i < sortedNodes.length - 1 && (
              <div style={{ textAlign: 'center', color: '#bbb', marginBottom: 4 }}>↓</div>
            )}
          </div>
        ))}
      </div>

      {(validationResult || draft.changeSummary || draft.riskNotes) && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          {validationResult && (
            <div
              style={{
                padding: 8,
                borderRadius: 4,
                background: validationResult.isValid ? '#e6f4ea' : '#fce8e6',
                marginBottom: 8,
              }}
            >
              {validationResult.normalizedSummary}
            </div>
          )}
          {draft.changeSummary && (
            <div style={{ marginBottom: 8 }}>
              <strong>修改摘要</strong>
              <p style={{ margin: '4px 0 0' }}>{draft.changeSummary}</p>
            </div>
          )}
          {draft.riskNotes && (
            <div style={{ marginBottom: 8 }}>
              <strong>风险提示</strong>
              <p style={{ margin: '4px 0 0' }}>{draft.riskNotes}</p>
            </div>
          )}
        </div>
      )}

      <MissingCapabilitiesPanel items={missingCapabilities} />
      <NodeDetailModal node={detailNode} onClose={() => setDetailNode(null)} />
    </div>
  )
}
