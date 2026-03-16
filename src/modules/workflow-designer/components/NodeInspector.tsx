/**
 * 节点检查器：展示/编辑当前选中节点的属性
 * 与 WorkflowGraphEditor 联动，用于规划工作台与模板编辑页
 * 支持指定 Agent：按节点 allowedAgentRoleTypes/intentType 过滤，含「暂无」选项
 */
import type { WorkflowNodeData } from '../utils/graphAdapter'
import { AgentTemplateSelector } from '@/components/AgentTemplateSelector/AgentTemplateSelector'
import type { AgentTemplateRoleType } from '@/modules/platform/schemas/agentTemplate'

const EXEC_TYPE_LABELS: Record<string, string> = {
  agent_task: 'Agent 任务',
  human_review: '人工审核',
  approval_gate: '审批关口',
  result_writer: '结果写入',
}

const INTENT_TO_ROLE: Record<string, AgentTemplateRoleType> = {
  create: 'creator',
  review: 'reviewer',
  publish: 'publisher',
  record: 'recorder',
}

function getRoleTypeFilter(payload: Record<string, unknown>, intentType?: string): AgentTemplateRoleType | undefined {
  const allowed = payload.allowedAgentRoleTypes as AgentTemplateRoleType[] | undefined
  if (Array.isArray(allowed) && allowed.length > 0) return allowed[0]
  if (intentType && INTENT_TO_ROLE[intentType]) return INTENT_TO_ROLE[intentType]
  return undefined
}

export interface NodeInspectorProps {
  /** 当前选中的画布节点 data，null 表示未选中 */
  nodeData: WorkflowNodeData | null
  /** 只读模式（规划工作台仅展示，不显示 Agent 选择器） */
  readOnly?: boolean
  className?: string
  /** 节点指定 Agent 变更时回调（规划工作台写回 recommendedAgentTemplateId） */
  onAgentChange?: (nodeId: string, agentTemplateId: string | null) => void
}

export function NodeInspector({ nodeData, readOnly = false, className, onAgentChange }: NodeInspectorProps) {
  if (!nodeData) {
    return (
      <div className={className} style={{ padding: 16, color: '#999', fontSize: 13 }}>
        点击画布节点查看详情
      </div>
    )
  }
  const p = nodeData.payload as Record<string, unknown>
  const showAgentSelector =
    !readOnly &&
    nodeData.executionType !== 'human_review' &&
    nodeData.executionType !== 'approval_gate' &&
    !!onAgentChange
  const roleTypeFilter = showAgentSelector ? getRoleTypeFilter(p, nodeData.intentType) : undefined

  return (
    <div className={className} style={{ padding: 16, fontSize: 13 }}>
      <div style={{ marginBottom: 12, fontWeight: 600 }}>节点详情</div>
      <dl style={{ margin: 0, display: 'grid', gap: 8 }}>
        <div>
          <dt style={{ color: '#666', marginBottom: 2 }}>名称</dt>
          <dd style={{ margin: 0 }}>{nodeData.label}</dd>
        </div>
        <div>
          <dt style={{ color: '#666', marginBottom: 2 }}>标识</dt>
          <dd style={{ margin: 0 }}>{nodeData.key}</dd>
        </div>
        <div>
          <dt style={{ color: '#666', marginBottom: 2 }}>执行类型</dt>
          <dd style={{ margin: 0 }}>{EXEC_TYPE_LABELS[nodeData.executionType] ?? nodeData.executionType}</dd>
        </div>
        {nodeData.intentType && (
          <div>
            <dt style={{ color: '#666', marginBottom: 2 }}>意图类型</dt>
            <dd style={{ margin: 0 }}>{nodeData.intentType}</dd>
          </div>
        )}
        <div>
          <dt style={{ color: '#666', marginBottom: 2 }}>依赖节点</dt>
          <dd style={{ margin: 0 }}>
            {Array.isArray(p.dependsOnNodeIds) && (p.dependsOnNodeIds as string[]).length > 0
              ? (p.dependsOnNodeIds as string[]).join(', ')
              : '无'}
          </dd>
        </div>
      </dl>
      {showAgentSelector && (
        <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
          <div style={{ color: '#666', marginBottom: 6, fontSize: 12 }}>指定 Agent</div>
          <AgentTemplateSelector
            value={(p.recommendedAgentTemplateId as string) ?? ''}
            onChange={(t) => onAgentChange?.(nodeData.nodeId, t?.id ?? null)}
            placeholder="暂无（占位）"
            roleTypeFilter={roleTypeFilter}
          />
        </div>
      )}
      {!showAgentSelector && (p.recommendedAgentTemplateId as string) && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: '#666', marginBottom: 2, fontSize: 12 }}>推荐 Agent</div>
          <div style={{ margin: 0 }}>{String(p.recommendedAgentTemplateId)}</div>
        </div>
      )}
      {!readOnly && !showAgentSelector && (
        <p style={{ marginTop: 12, color: '#666', fontSize: 12 }}>
          完整编辑请在模板编辑页使用节点构建器或后续 Inspector 表单。
        </p>
      )}
    </div>
  )
}
