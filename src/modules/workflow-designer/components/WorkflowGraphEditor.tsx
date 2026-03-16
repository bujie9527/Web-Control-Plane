/**
 * 共享可视化流程画布（规划草案 / 模板节点）
 * 基于 @xyflow/react，支持拖拽、连线、缩放、小地图
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { WorkflowNode } from './WorkflowNode'
import {
  draftNodesToFlow,
  flowToDraftNodes,
  type WorkflowNodeData,
} from '../utils/graphAdapter'
import type { Node } from '@xyflow/react'

const nodeTypes = { workflowNode: WorkflowNode }

export type WorkflowGraphMode = 'planning' | 'template'

export interface WorkflowGraphEditorProps {
  /** 领域节点列表（Draft 或 Template 节点） */
  nodes: Array<{
    id: string
    key: string
    name: string
    orderIndex: number
    dependsOnNodeIds: string[]
    executionType: string
    intentType?: string
    [k: string]: unknown
  }>
  /** planning：规划工作台（只读或与 AI 联动）；template：模板编辑（可编辑） */
  mode: WorkflowGraphMode
  /** 只读时不响应拖拽与连线 */
  readOnly?: boolean
  /** 画布变更时回写领域节点（仅 template 模式且非只读时生效） */
  onGraphChange?: (updatedNodes: Array<Record<string, unknown>>) => void
  /** 选中节点 id，用于与 Inspector 联动 */
  selectedNodeId?: string | null
  onSelectionChange?: (nodeId: string | null) => void
  /** 顶部插槽（如版本选择器） */
  topSlot?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function WorkflowGraphEditor({
  nodes,
  mode,
  readOnly = false,
  onGraphChange,
  onSelectionChange,
  topSlot,
  className,
  style,
}: WorkflowGraphEditorProps) {
  const { flowNodes: initialFlowNodes, flowEdges: initialFlowEdges } = useMemo(
    () => draftNodesToFlow(nodes),
    [nodes]
  )

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>(initialFlowNodes)
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialFlowEdges)
  const initialSynced = useRef(false)

  useEffect(() => {
    setFlowNodes(initialFlowNodes)
    setFlowEdges(initialFlowEdges)
    initialSynced.current = true
  }, [initialFlowNodes, initialFlowEdges, setFlowNodes, setFlowEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return
      setFlowEdges((eds) => addEdge(connection, eds))
    },
    [readOnly, setFlowEdges]
  )

  useEffect(() => {
    if (mode !== 'template' || readOnly || !onGraphChange || !initialSynced.current) return
    const updated = flowToDraftNodes(flowNodes, flowEdges)
    onGraphChange(updated)
  }, [flowNodes, flowEdges, mode, readOnly, onGraphChange])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<WorkflowNodeData>) => {
      onSelectionChange?.(node.data.nodeId)
    },
    [onSelectionChange]
  )

  const onPaneClick = useCallback(() => {
    onSelectionChange?.(null)
  }, [onSelectionChange])

  const containerStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 200,
    ...style,
  }
  if (typeof style?.height === 'number' && style.height > 0) {
    containerStyle.height = style.height
  } else if (typeof style?.height === 'string' && style.height.endsWith('px')) {
    containerStyle.height = style.height
  } else {
    containerStyle.height = 400
  }

  return (
    <div className={className} style={containerStyle}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        {topSlot && (
          <Panel position="top-left" style={{ margin: 8 }}>
            {topSlot}
          </Panel>
        )}
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
