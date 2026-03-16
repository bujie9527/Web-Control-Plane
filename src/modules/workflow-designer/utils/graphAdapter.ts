/**
 * 将领域节点（Draft / Template）与 @xyflow 的 Node/Edge 互转
 * 用于规划工作台与模板编辑页共享画布
 */
import type { Node, Edge } from '@xyflow/react'

const NODE_HEIGHT = 72
const VERTICAL_GAP = 48
const NODE_WIDTH = 200
const HORIZONTAL_GAP = 32

/** 画布节点 data：携带领域节点原始数据（满足 Record<string, unknown> 供 @xyflow） */
export interface WorkflowNodeData extends Record<string, unknown> {
  /** 领域节点 id（DraftNode.id 或 TemplateNode.id） */
  nodeId: string
  /** 节点 key */
  key: string
  /** 显示名称 */
  label: string
  /** 执行类型，用于样式区分 */
  executionType: string
  /** 意图类型 */
  intentType?: string
  /** 原始领域节点（Draft 或 Template），供 Inspector 使用 */
  payload: Record<string, unknown>
}

/**
 * 按 orderIndex 分层，同层内多节点共享同一前置时横向并列布局
 */
function computeLayoutPositions(
  sorted: Array<{ id: string; orderIndex: number; dependsOnNodeIds?: string[] }>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  if (sorted.length === 0) return positions

  const byLevel = new Map<number, typeof sorted>()
  for (const n of sorted) {
    const level = n.orderIndex
    if (!byLevel.has(level)) byLevel.set(level, [])
    byLevel.get(level)!.push(n)
  }

  const levels = Array.from(byLevel.keys()).sort((a, b) => a - b)
  for (const level of levels) {
    const nodes = byLevel.get(level)!
    const groupKey = (n: { dependsOnNodeIds?: string[] }) =>
      (n.dependsOnNodeIds?.length ? n.dependsOnNodeIds[0] : 'start') ?? 'start'
    const groups = new Map<string, typeof nodes>()
    for (const n of nodes) {
      const k = groupKey(n)
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(n)
    }

    let x = 0
    const y = level * (NODE_HEIGHT + VERTICAL_GAP)
    for (const group of groups.values()) {
      for (const n of group) {
        positions.set(n.id, { x, y })
        x += NODE_WIDTH + HORIZONTAL_GAP
      }
      x += HORIZONTAL_GAP
    }
  }
  return positions
}

/**
 * 将草案节点列表转为 xyflow Node[] 和 Edge[]
 * 布局：多节点共享同一前置时横向并列
 */
export function draftNodesToFlow(
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
): { flowNodes: Node<WorkflowNodeData>[]; flowEdges: Edge[] } {
  const sorted = [...nodes].sort((a, b) => a.orderIndex - b.orderIndex)
  const layoutPositions = computeLayoutPositions(sorted)
  const flowNodes: Node<WorkflowNodeData>[] = sorted.map((n) => {
    const existing = (n as { position?: { x: number; y: number } }).position
    const computed = layoutPositions.get(n.id)
    const position = existing ?? computed ?? { x: 0, y: n.orderIndex * (NODE_HEIGHT + VERTICAL_GAP) }
    return {
      id: n.id,
      type: 'workflowNode',
      position,
      data: {
        nodeId: n.id,
        key: n.key,
        label: n.name,
        executionType: n.executionType,
        intentType: n.intentType,
        payload: n as Record<string, unknown>,
      },
    }
  })
  const flowEdges: Edge[] = []
  const idSet = new Set(sorted.map((n) => n.id))
  for (const n of sorted) {
    for (const depId of n.dependsOnNodeIds ?? []) {
      if (idSet.has(depId)) {
        flowEdges.push({
          id: `e-${depId}-${n.id}`,
          source: depId,
          target: n.id,
        })
      }
    }
  }
  return { flowNodes, flowEdges }
}

/**
 * 将模板节点列表转为 xyflow Node[] 和 Edge[]
 */
export function templateNodesToFlow(
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
): { flowNodes: Node<WorkflowNodeData>[]; flowEdges: Edge[] } {
  return draftNodesToFlow(nodes)
}

/**
 * 从 xyflow 的 nodes 和 edges 还原 dependsOnNodeIds 与 orderIndex（按 y 排序）
 * 并保留 position 到每个领域节点
 */
export function flowToDraftNodes(
  flowNodes: Node<WorkflowNodeData>[],
  flowEdges: Edge[]
): Array<Record<string, unknown> & { id: string; key: string; name: string; orderIndex: number; dependsOnNodeIds: string[]; position?: { x: number; y: number } }> {
  const byId = new Map(flowNodes.map((n) => [n.id, n]))
  const sorted = [...flowNodes].sort((a, b) => a.position.y - b.position.y)
  return sorted.map((fn, i) => {
    const payload = { ...(fn.data.payload as Record<string, unknown>) }
    const targetIds = flowEdges.filter((e) => e.target === fn.id).map((e) => e.source)
    return {
      ...payload,
      id: fn.data.nodeId,
      key: fn.data.key,
      name: fn.data.label,
      orderIndex: i + 1,
      dependsOnNodeIds: targetIds.filter((id) => byId.has(id)),
      position: { x: fn.position.x, y: fn.position.y },
    }
  })
}

export function flowToTemplateNodes(
  flowNodes: Node<WorkflowNodeData>[],
  flowEdges: Edge[]
): Array<Record<string, unknown> & { id: string; key: string; name: string; orderIndex: number; dependsOnNodeIds: string[]; position?: { x: number; y: number } }> {
  return flowToDraftNodes(flowNodes, flowEdges)
}
