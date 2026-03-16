import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { ROUTES } from '@/core/constants/routes'
import { getTemplateDetail, getTemplateNodes } from '../../services/workflowExecutionService'
import type {
  WorkflowTemplate,
  WorkflowTemplateNode,
  WorkflowTemplateStatus,
  WorkflowNodeType,
  WorkflowExecutorType,
} from '../../schemas/workflowExecution'
import { NodeAgentBindingConfig } from './NodeAgentBindingConfig'
import styles from './WorkflowTemplateDetail.module.css'

const templateStatusMap: Record<WorkflowTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  inactive: 'neutral',
  draft: 'warning',
  archived: 'neutral',
  deprecated: 'warning',
}
const templateStatusLabel: Record<WorkflowTemplateStatus, string> = {
  active: '启用',
  inactive: '停用',
  draft: '草稿',
  archived: '已归档',
  deprecated: '已废弃',
}

const nodeTypeLabel: Record<WorkflowNodeType, string> = {
  manual: '人工',
  agent: 'Agent',
  review: '审核',
  system: '系统',
  other: '其他',
}
const executorTypeLabel: Record<WorkflowExecutorType, string> = {
  human: '人工',
  agent: 'Agent',
  system: '系统',
  api: 'API',
}

export function WorkflowTemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const [template, setTemplate] = useState<WorkflowTemplate | null | undefined>(undefined)
  const [nodes, setNodes] = useState<WorkflowTemplateNode[]>([])
  const [configNode, setConfigNode] = useState<WorkflowTemplateNode | null>(null)
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false)

  const refreshNodes = () => {
    if (id && template) getTemplateNodes(template.id).then(setNodes)
  }

  useEffect(() => {
    if (!id) return
    getTemplateDetail(id).then((t) => {
      setTemplate(t ?? null)
      if (t) getTemplateNodes(t.id).then(setNodes)
      else setNodes([])
    })
  }, [id])

  if (!id) {
    return (
      <PageContainer title="流程模板详情" description="缺少模板 ID">
        <Link to={ROUTES.TENANT.WORKFLOWS} className={styles.backLink}>
          ← 返回流程模板列表
        </Link>
      </PageContainer>
    )
  }

  if (template === undefined) {
    return (
      <PageContainer title="流程模板详情" description="加载中...">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  if (template === null) {
    return (
      <PageContainer title="流程模板详情" description="未找到该模板">
        <Link to={ROUTES.TENANT.WORKFLOWS} className={styles.backLink}>
          ← 返回流程模板列表
        </Link>
        <EmptyState
          title="未找到该流程模板"
          description="模板可能已删除或 ID 不正确，请返回列表重试"
        />
      </PageContainer>
    )
  }

  const sortedNodes = [...nodes].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <PageContainer
      title={template.name}
      description={template.description ?? '流程模板详情，用于定义标准执行步骤'}
    >
      <div className={styles.backBar}>
        <Link to={ROUTES.TENANT.WORKFLOWS} className={styles.backLink}>
          ← 返回流程模板列表
        </Link>
      </div>

      <div className={styles.summary}>
        <StatusTag type={templateStatusMap[template.status]}>
          {templateStatusLabel[template.status]}
        </StatusTag>
        <span className={styles.summaryItem}>
          <span className={styles.summaryLabel}>类型</span>
          {template.type || '—'}
        </span>
        <span className={styles.summaryItem}>
          <span className={styles.summaryLabel}>版本</span>
          {template.version}
        </span>
        <span className={styles.summaryItem}>
          <span className={styles.summaryLabel}>更新时间</span>
          {template.updatedAt}
        </span>
      </div>

      <div className={styles.content}>
        <Card title="基础信息" description="流程名称、编码、类型与描述">
          <div className={styles.kvGrid}>
            <span className={styles.kvLabel}>流程名称</span>
            <span>{template.name}</span>
            <span className={styles.kvLabel}>编码</span>
            <span>{template.code}</span>
            <span className={styles.kvLabel}>类型</span>
            <span>{template.type || '—'}</span>
            <span className={styles.kvLabel}>描述</span>
            <span>{template.description || '—'}</span>
            <span className={styles.kvLabel}>状态</span>
            <span>
              <StatusTag type={templateStatusMap[template.status]}>
                {templateStatusLabel[template.status]}
              </StatusTag>
            </span>
            <span className={styles.kvLabel}>版本</span>
            <span>{template.version}</span>
            <span className={styles.kvLabel}>创建时间</span>
            <span>{template.createdAt}</span>
            <span className={styles.kvLabel}>更新时间</span>
            <span>{template.updatedAt}</span>
          </div>
        </Card>

        <Card title="适用范围" description="适用目标类型与交付类型">
          <div className={styles.kvGrid}>
            <span className={styles.kvLabel}>适用目标类型</span>
            <span>
              {template.applicableGoalTypes?.length
                ? template.applicableGoalTypes.join('、')
                : '—'}
            </span>
            <span className={styles.kvLabel}>适用交付类型</span>
            <span>
              {template.applicableDeliverableTypes?.length
                ? template.applicableDeliverableTypes.join('、')
                : '—'}
            </span>
          </div>
        </Card>

        <Card title="节点列表" description="流程节点按顺序执行，线性流程">
          {sortedNodes.length === 0 ? (
            <p className={styles.placeholderHint}>该模板暂无节点定义</p>
          ) : (
            <table className={styles.nodeTable}>
              <thead>
                <tr>
                  <th>序号</th>
                  <th>节点 Key</th>
                  <th>节点名称</th>
                  <th>节点类型</th>
                  <th>执行者类型</th>
                  <th>需审核</th>
                  <th>下一节点</th>
                  <th>说明</th>
                  {sortedNodes.some((n) => n.nodeType === 'agent') && <th>操作</th>}
                </tr>
              </thead>
              <tbody>
                {sortedNodes.map((node) => (
                  <tr key={node.id}>
                    <td>{node.orderIndex}</td>
                    <td>{node.nodeKey}</td>
                    <td>{node.nodeName}</td>
                    <td>{nodeTypeLabel[node.nodeType] ?? node.nodeType}</td>
                    <td>{executorTypeLabel[node.executorType] ?? node.executorType}</td>
                    <td>{node.needReview ? '是' : '否'}</td>
                    <td>{node.nextNodeKey ?? '—'}</td>
                    <td>{node.description ?? '—'}</td>
                    {sortedNodes.some((n) => n.nodeType === 'agent') && (
                      <td>
                        {node.nodeType === 'agent' ? (
                          <button
                            type="button"
                            className={styles.configBtn}
                            onClick={() => {
                              setConfigNode(node)
                              setConfigDrawerOpen(true)
                            }}
                          >
                            配置
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="节点说明与审核要求" description="需审核节点表示该步骤需人工或系统审核通过后进入下一节点">
          {sortedNodes.some((n) => n.needReview) ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {sortedNodes
                .filter((n) => n.needReview)
                .map((n) => (
                  <li key={n.id}>
                    <strong>{n.nodeName}</strong>（{n.nodeKey}）：{n.description ?? '需审核'}
                  </li>
                ))}
            </ul>
          ) : (
            <p className={styles.placeholderHint}>本流程无强制审核节点</p>
          )}
        </Card>
      </div>

      <NodeAgentBindingConfig
        open={configDrawerOpen}
        onClose={() => {
          setConfigDrawerOpen(false)
          setConfigNode(null)
        }}
        node={configNode}
        onSaved={refreshNodes}
      />
    </PageContainer>
  )
}
