/**
 * ProjectCreationWizard
 * 项目创建向导（5步，已从原 7步精简）
 *
 * 步骤逻辑：
 * 1. 基础信息（必填校验）
 * 2. 目标与交付（必填校验）
 * 3. 选择流程模板（可跳过）
 * 4. 节点 Agent 配置（仅已选模板时出现，未选模板时从 Step3 直接跳到 Step5）
 * 5. 资源与确认（无必填，含创建摘要 + 提交）
 *
 * 已移除步骤：
 * - 原 Step4 Agent 范围与协作偏好 → 由 Step4 节点 Agent 配置替代
 * - 原 Step6 预算与审核 → 移至项目设置页
 * - 原 Step7 确认 → 合并进新 Step5
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { useAuth } from '@/core/auth/AuthContext'
import { ROUTES } from '@/core/constants/routes'
import type { ProjectDeliverableType as SubdomainDeliverableType } from '../../schemas/projectSubdomain'
import { createProjectWithFullContext } from '../../services/projectCreationService'
import {
  defaultFormState,
  STEP_LABELS,
  STEP_TEMPLATE_SELECTOR,
  STEP_NODE_AGENT_CONFIG,
  STEP_RESOURCES_CONFIRM,
} from './types'

/** 将 projectDomain 的交付类型映射为 projectSubdomain/API 的交付类型 */
function mapDomainDeliverableTypeToSubdomain(
  t: import('../../schemas/projectDomain').ProjectDeliverableType
): SubdomainDeliverableType {
  if (t === 'leads') return 'lead'
  if (t === 'data') return 'other'
  return t as SubdomainDeliverableType
}
import { Step1BasicInfo } from './steps/Step1BasicInfo'
import { Step2GoalDeliverable } from './steps/Step2GoalDeliverable'
import { Step3TemplateSelector } from './steps/Step3TemplateSelector'
import { Step4NodeAgentConfig } from './steps/Step4NodeAgentConfig'
import { Step5ResourcesConfirm } from './steps/Step5ResourcesConfirm'
import styles from './ProjectCreationWizard.module.css'

export function ProjectCreationWizard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? 't1'
  const ownerId = user?.id ?? ''
  const ownerName = user?.name ?? ''

  /** 当前步骤（1-based，范围 1~5） */
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(() => ({
    ...defaultFormState,
    ownerId: user?.id ?? '',
    ownerName: user?.name ?? '',
  }))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      ownerId: user?.id ?? prev.ownerId,
      ownerName: user?.name ?? prev.ownerName,
    }))
  }, [user?.id, user?.name])

  const updateForm = useCallback((partial: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }, [])

  // ─── 步骤校验 ──────────────────────────────────────────────────────────────

  /**
   * canProceed
   * 判断当前步骤是否满足进入下一步的条件
   * - Step 1：name + projectTypeCode 必填
   * - Step 2：goalTypeCode + goalName + goalDescription + primaryMetricCode +
   *           deliverableType + deliverableName 必填
   * - Step 3~5：无强制必填（Step3 允许跳过）
   */
  const canProceed = (): boolean => {
    if (step === 1) return !!(form.name && form.projectTypeCode)
    if (step === 2)
      return !!(
        form.goalTypeCode &&
        form.goalName &&
        form.goalDescription &&
        form.primaryMetricCode &&
        form.deliverableType &&
        form.deliverableName
      )
    return true
  }

  // ─── 步骤导航 ──────────────────────────────────────────────────────────────

  /**
   * getNextStep
   * 计算下一步的步骤编号
   * 核心逻辑：
   * - 当 step === STEP_TEMPLATE_SELECTOR（3）且未选模板时，
   *   跳过 STEP_NODE_AGENT_CONFIG（4），直接进入 STEP_RESOURCES_CONFIRM（5）
   * - 其他情况正常 +1
   */
  const getNextStep = (): number => {
    if (step === STEP_TEMPLATE_SELECTOR && !form.selectedWorkflowTemplateId) {
      return STEP_RESOURCES_CONFIRM
    }
    return step + 1
  }

  /**
   * getPrevStep
   * 计算上一步的步骤编号
   * 核心逻辑：
   * - 当 step === STEP_RESOURCES_CONFIRM（5）且未选模板时，
   *   返回 STEP_TEMPLATE_SELECTOR（3），跳过 Step4
   * - 其他情况正常 -1
   */
  const getPrevStep = (): number => {
    if (step === STEP_RESOURCES_CONFIRM && !form.selectedWorkflowTemplateId) {
      return STEP_TEMPLATE_SELECTOR
    }
    return step - 1
  }

  const handleNext = () => {
    const next = getNextStep()
    if (next <= STEP_RESOURCES_CONFIRM) setStep(next)
  }

  const handlePrev = () => {
    const prev = getPrevStep()
    if (prev >= 1) setStep(prev)
  }

  /**
   * handleSkipTemplate
   * Step3 的"跳过"回调
   * 清空 selectedWorkflowTemplateId 和 nodeAgentBindings，直接跳至 Step5
   */
  const handleSkipTemplate = useCallback(() => {
    updateForm({ selectedWorkflowTemplateId: undefined, nodeAgentBindings: undefined })
    setStep(STEP_RESOURCES_CONFIRM)
  }, [updateForm])

  // ─── 提交 ──────────────────────────────────────────────────────────────────

  /**
   * handleSubmit
   * 收集 form 数据，调用 createProjectWithFullContext
   * 成功后跳转到项目详情页
   *
   * 新增字段：
   * - selectedWorkflowTemplateId → 写入 project.selectedWorkflowTemplateId
   * - nodeAgentBindings → 用于初始化 WorkflowInstance 节点绑定（由 service 处理）
   *
   * 移除字段：
   * - sopRaw（不再在创建时提交）
   * - allowedAgentTemplateIds / preferredAgentTemplateIds / defaultPlannerAgentTemplateId
   */
  const handleSubmit = async () => {
    if (submitting || !form.name) return
    setSubmitting(true)
    try {
      const project = await createProjectWithFullContext({
        tenantId,
        name: form.name,
        projectTypeCode: form.projectTypeCode,
        description: form.description || undefined,
        ownerId: form.ownerId || ownerId,
        ownerName: form.ownerName || ownerName,
        goal: {
          goalTypeCode: form.goalTypeCode,
          goalName: form.goalName,
          goalDescription: form.goalDescription,
          successCriteria: form.successCriteria || undefined,
          kpiDefinition: form.kpiDefinition || undefined,
          primaryMetricCode: form.primaryMetricCode,
          secondaryMetricCodes: form.secondaryMetricCodes,
        },
        deliverable: {
          deliverableType: mapDomainDeliverableTypeToSubdomain(form.deliverableType),
          description: form.deliverableDescription || form.deliverableName || '',
          frequency: form.frequency ? (form.frequency as 'daily' | 'weekly' | 'monthly' | 'one_time') : undefined,
          target: form.targetValue || undefined,
          notes: form.unit || undefined,
        },
        identityIds: form.identityIds,
        defaultIdentityId: form.defaultIdentityId || undefined,
        terminalIds: form.terminalIds,
        // 新增：流程模板绑定与节点 Agent 配置
        selectedWorkflowTemplateId: form.selectedWorkflowTemplateId || undefined,
        nodeAgentBindings: form.nodeAgentBindings,
        facebookPageBindings: form.facebookPageBindings,
        // 已移除：sopRaw 由项目详情工作台单独录入
      })
      navigate(`${ROUTES.TENANT.PROJECTS}/${project.id}`, { replace: true })
    } catch (e) {
      console.error('Create project failed', e)
      alert('创建失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── 步骤标签渲染 ──────────────────────────────────────────────────────────

  /**
   * visibleStepLabels
   * 渲染步骤导航时，若未选模板则 Step4 显示为灰色/跳过状态
   * 始终保持 5 个标签位，但 Step4 在未选模板时视觉上标记为"已跳过"
   */
  const stepLabels = STEP_LABELS as readonly string[]

  return (
    <PageContainer
      title="项目创建"
      description="通过多步骤向导创建具备业务约束的真实项目"
    >
      <div className={styles.wizard}>
        {/* 步骤导航 */}
        <div className={styles.steps}>
          {stepLabels.map((label, i) => {
            const stepNum = i + 1
            /** Step4 在未选模板时标记为跳过态 */
            const isSkipped =
              stepNum === STEP_NODE_AGENT_CONFIG && !form.selectedWorkflowTemplateId
            return (
              <span
                key={i}
                className={[
                  styles.stepItem,
                  step === stepNum ? styles.stepItemActive : '',
                  isSkipped ? styles.stepItemSkipped : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {stepNum}. {label}
                {isSkipped && ' (跳过)'}
              </span>
            )
          })}
        </div>

        {/* 步骤内容区 */}
        <div className={styles.stepContent}>
          {step === 1 && (
            <Step1BasicInfo form={form} onChange={updateForm} tenantId={tenantId} />
          )}
          {step === 2 && <Step2GoalDeliverable form={form} onChange={updateForm} />}
          {step === STEP_TEMPLATE_SELECTOR && (
            <Step3TemplateSelector
              form={form}
              onChange={updateForm}
              tenantId={tenantId}
              onSkip={handleSkipTemplate}
            />
          )}
          {step === STEP_NODE_AGENT_CONFIG && form.selectedWorkflowTemplateId && (
            <Step4NodeAgentConfig form={form} onChange={updateForm} tenantId={tenantId} />
          )}
          {step === STEP_RESOURCES_CONFIRM && (
            <Step5ResourcesConfirm
              form={form}
              onChange={updateForm}
              tenantId={tenantId}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </div>

        {/* 底部步骤操作按钮（Step5 的提交按钮在 Step5ResourcesConfirm 内部） */}
        {step < STEP_RESOURCES_CONFIRM && (
          <div className={styles.stepActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handlePrev}
              disabled={step <= 1}
            >
              上一步
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleNext}
              disabled={!canProceed()}
            >
              下一步
            </button>
          </div>
        )}
        {step === STEP_RESOURCES_CONFIRM && (
          <div className={styles.stepActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handlePrev}
            >
              上一步
            </button>
            {/* 提交按钮由 Step5ResourcesConfirm 内部渲染，此处仅保留上一步 */}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
