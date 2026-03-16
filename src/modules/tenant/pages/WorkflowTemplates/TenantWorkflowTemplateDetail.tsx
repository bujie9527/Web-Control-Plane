import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { ROUTES } from '@/core/constants/routes'
import { useAuth } from '@/core/auth/AuthContext'
import { getTemplateNodes } from '@/modules/tenant/services/workflowExecutionService'
import { getWorkflowTemplateById } from '@/modules/tenant/services/workflowTemplateFactoryService'
import type { WorkflowTemplate, WorkflowTemplateNode, WorkflowTemplateStatus } from '@/modules/tenant/schemas/workflowExecution'
import {
  EXECUTION_TYPE_LABELS,
  INTENT_TYPE_LABELS,
  WORKFLOW_STATUS_LABELS,
} from '@/modules/platform/pages/WorkflowTemplates/workflowTemplateLabels'
import { TEMPLATE_VERSION_FIELD_LABELS } from '@/core/labels/planningDisplayLabels'
import styles from '@/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactory.module.css'

const statusMap: Record<WorkflowTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  deprecated: 'warning',
  archived: 'error',
  inactive: 'warning',
}

export function TenantWorkflowTemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''
  const [detail, setDetail] = useState<WorkflowTemplate | null | undefined>(undefined)
  const [nodes, setNodes] = useState<WorkflowTemplateNode[]>([])
  const [sourceTemplateName, setSourceTemplateName] = useState<string>('')

  useEffect(() => {
    if (!id) return
    getWorkflowTemplateById(id).then((d) => {
      setDetail(d)
      if (d) {
        getTemplateNodes(d.id).then(setNodes)
        if (d.sourceTemplateId) {
          getWorkflowTemplateById(d.sourceTemplateId).then((src) =>
            setSourceTemplateName(src?.name ?? d.sourceTemplateId ?? '')
          )
        }
      }
    })
  }, [id])

  if (!id) {
    return null
  }
  if (detail === undefined) {
    return (
      <PageContainer title="模板详情" description="加载中...">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }
  if (detail === null) {
    return (
      <PageContainer title="模板详情" description="未找到模板">
        <EmptyState title="未找到模板" />
      </PageContainer>
    )
  }

  const canEdit = detail.scopeType === 'tenant' && detail.tenantId === tenantId

  return (
    <PageContainer
      title={detail.name}
      description={detail.scopeType === 'system' ? '平台模板只读' : '租户模板可编辑'}
    >
      <div className={styles.headerBar}>
        <Link to={ROUTES.TENANT.WORKFLOW_TEMPLATES} className={styles.backLink}>← 返回模板列表</Link>
        {canEdit && (
          <Link to={ROUTES.TENANT.WORKFLOW_TEMPLATES_EDIT(id!)} className={listPageStyles.primaryBtn}>
            编辑模板
          </Link>
        )}
      </div>
      {!detail.isLatest && (
        <Card title="版本提示" description="">
          <p className={styles.versionHint}>当前模板不是最新版本，建议查看或切换到最新版本以获取最新功能与修复。</p>
        </Card>
      )}

      <Card title="版本信息" description="模板版本治理与规划来源">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.version}</span>
          <span>v{detail.version}</span>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.isLatest}</span>
          <span>{detail.isLatest ? '是' : '否'}</span>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.previousVersion}</span>
          <span>{detail.previousVersionTemplateId || '—'}</span>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.versionGroup}</span>
          <span>{detail.versionGroupId || '—'}</span>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.sourceDraft}</span>
          <span>{detail.sourcePlanningDraftId || '—'}</span>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.sourceSession}</span>
          <span>{detail.sourcePlanningSessionId || '—'}</span>
        </div>
      </Card>

      <Card title="来源信息" description="用于版本升级提示">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>来源模板名称</span>
          <span>{detail.sourceTemplateId ? sourceTemplateName || '加载中...' : '—'}</span>
          <span className={styles.kvLabel}>来源版本</span>
          <span>{detail.sourceTemplateId ? `v${detail.sourceVersion ?? 1}` : '—'}</span>
          <span className={styles.kvLabel}>当前模板版本</span>
          <span>v{detail.version}</span>
        </div>
      </Card>
      <Card title="基础信息" description="流程模板">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>名称</span>
          <span>{detail.name}</span>
          <span className={styles.kvLabel}>编码</span>
          <span>{detail.code}</span>
          <span className={styles.kvLabel}>状态</span>
          <span><StatusTag type={statusMap[detail.status]}>{WORKFLOW_STATUS_LABELS[detail.status]}</StatusTag></span>
          <span className={styles.kvLabel}>作用域</span>
          <span>{detail.scopeType === 'system' ? '平台模板' : '我的模板'}</span>
        </div>
      </Card>

      <Card title="语义边界" description="模板强绑定项目语义边界">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>项目类型</span>
          <span>{detail.supportedProjectTypeId}</span>
          <span className={styles.kvLabel}>目标类型</span>
          <span>{detail.supportedGoalTypeIds.join('、')}</span>
          <span className={styles.kvLabel}>交付模式</span>
          <span>{detail.supportedDeliverableModes.join('、')}</span>
          <span className={styles.kvLabel}>渠道</span>
          <span>{detail.supportedChannels?.join('、') || '—'}</span>
        </div>
      </Card>

      <Card title="节点摘要" description="节点构建器前置结构（只读）">
        {nodes.length === 0 ? (
          <p className={styles.sectionHint}>暂无节点</p>
        ) : (
          <ul className={styles.nodeList}>
            {nodes
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((n) => (
                <li key={n.id}>
                  {n.orderIndex}. {n.name}（{EXECUTION_TYPE_LABELS[n.executionType] ?? n.executionType}/{INTENT_TYPE_LABELS[n.intentType] ?? n.intentType}）
                </li>
              ))}
          </ul>
        )}
      </Card>
    </PageContainer>
  )
}
