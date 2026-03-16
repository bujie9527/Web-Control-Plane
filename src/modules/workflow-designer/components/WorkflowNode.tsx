/**
 * 流程节点卡片（用于 @xyflow 画布）
 */
import type { NodeProps, Node } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import type { WorkflowNodeData } from '../utils/graphAdapter'

const EXEC_TYPE_LABELS: Record<string, string> = {
  agent_task: 'Agent 任务',
  human_review: '人工审核',
  approval_gate: '审批关口',
  result_writer: '结果写入',
}

export function WorkflowNode({ data, selected }: NodeProps<Node<WorkflowNodeData>>) {
  const label = data.label ?? data.key ?? '节点'
  const execLabel = EXEC_TYPE_LABELS[data.executionType] ?? data.executionType
  const payload = (data.payload ?? {}) as { bindingStatus?: string }
  const isPlaceholder = payload.bindingStatus === 'placeholder' || payload.bindingStatus === 'missing'
  const borderColor = selected ? '#1890ff' : isPlaceholder ? '#fa8c16' : '#d9d9d9'
  const borderStyle = isPlaceholder ? 'dashed' : 'solid'
  const bg = selected ? '#e6f4ff' : isPlaceholder ? '#fff7e6' : '#fff'
  return (
    <div
      style={{
        position: 'relative',
        padding: '10px 14px',
        minWidth: 160,
        borderRadius: 8,
        background: bg,
        border: `2px ${borderStyle} ${borderColor}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        fontSize: 13,
      }}
    >
      {isPlaceholder && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: 10,
            color: '#fa8c16',
            background: '#fff7e6',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          占位
        </div>
      )}
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden', width: 8, height: 8 }} />
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#666', fontSize: 12 }}>{execLabel}</div>
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden', width: 8, height: 8 }} />
    </div>
  )
}
