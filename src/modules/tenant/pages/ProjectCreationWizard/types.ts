import type { ProjectDeliverableType } from '../../schemas/projectDomain'

// ─── 节点 Agent 绑定 ──────────────────────────────────────────────────────────

/**
 * NodeAgentBinding
 * 项目创建时为每个流程模板节点选择的 Agent
 * 在 Step4NodeAgentConfig 中填写，创建项目时写入 WorkflowInstance 初始绑定
 */
export interface NodeAgentBinding {
  /** 对应 WorkflowTemplateNode.id */
  templateNodeId: string
  /** 用户为该节点选择的 AgentTemplate ID */
  selectedAgentTemplateId: string
}

// ─── 表单状态 ─────────────────────────────────────────────────────────────────

/** 项目创建向导表单状态（5步向导） */
export interface ProjectCreationFormState {
  // ── Step 1：基础信息 ─────────────────────────────────────────────────────
  name: string
  projectTypeCode: string
  description: string
  ownerId: string
  ownerName?: string

  // ── Step 2：目标与交付 ───────────────────────────────────────────────────
  goalTypeCode: string
  goalName: string
  goalDescription: string
  successCriteria: string
  primaryMetricCode: string
  secondaryMetricCodes: string[]
  kpiDefinition: string
  deliverableType: ProjectDeliverableType
  deliverableName: string
  deliverableDescription: string
  frequency: string
  targetValue: string
  unit: string

  // ── Step 3：选择流程模板（可选）──────────────────────────────────────────
  /**
   * 已选中的流程模板 ID
   * undefined / '' 表示跳过（创建空项目，不绑定流程）
   */
  selectedWorkflowTemplateId?: string

  // ── Step 4：节点 Agent 配置（仅当 selectedWorkflowTemplateId 非空时有值）─
  /**
   * 各节点的 Agent 绑定配置
   * 由 Step4NodeAgentConfig 自动基于模板节点初始化
   * 用户可在此步骤修改每个节点的选用 Agent
   */
  nodeAgentBindings?: NodeAgentBinding[]

  // ── Step 5：资源绑定（可选）──────────────────────────────────────────────
  identityIds: string[]
  defaultIdentityId: string
  terminalIds: string[]

  /** Facebook 主页运营项目：已选主页及绑定的身份（仅当 projectTypeCode === FACEBOOK_PAGE_OPERATION 时使用） */
  facebookPageBindings?: Array<{ pageId: string; pageName: string; credentialId: string; identityId: string }>

  // ── 兼容旧步骤组件（Step4AgentScope / Step7Confirm / Step5SOP 已不在 5 步向导中使用）────────────────
  /** @deprecated 项目级 SOP 已移至项目详情工作台 OverviewTab */
  sopRaw?: string
  /** @deprecated 已移至项目设置页 */
  defaultPlannerAgentTemplateId?: string
}

export const defaultFormState: ProjectCreationFormState = {
  name: '',
  projectTypeCode: '',
  description: '',
  ownerId: '',
  goalTypeCode: '',
  goalName: '',
  goalDescription: '',
  successCriteria: '',
  primaryMetricCode: '',
  secondaryMetricCodes: [],
  kpiDefinition: '',
  deliverableType: 'content',
  deliverableName: '',
  deliverableDescription: '',
  frequency: 'daily',
  targetValue: '',
  unit: '',
  selectedWorkflowTemplateId: undefined,
  nodeAgentBindings: undefined,
  identityIds: [],
  defaultIdentityId: '',
  terminalIds: [],
  facebookPageBindings: [],
}

// ─── 步骤标签（5步） ──────────────────────────────────────────────────────────

/**
 * STEP_LABELS
 * 5步向导的步骤标签（原 7步已精简）
 *
 * 步骤跳转说明：
 * - Step1 → Step2 → Step3 → Step4（仅已选模板时）→ Step5
 * - Step3 跳过时：Step3 → Step5（直接）
 */
export const STEP_LABELS = [
  '基础信息',
  '目标与交付',
  '选择流程模板',
  '节点 Agent 配置',
  '资源与确认',
] as const

/**
 * TOTAL_STEPS
 * 向导总步骤数（逻辑上为 5，但 Step4 可能被跳过）
 */
export const TOTAL_STEPS = 5

/**
 * STEP_WITH_TEMPLATE_SELECTOR
 * 选择模板的步骤编号（1-based）
 */
export const STEP_TEMPLATE_SELECTOR = 3

/**
 * STEP_NODE_AGENT_CONFIG
 * 节点 Agent 配置的步骤编号（1-based）
 * 仅当 selectedWorkflowTemplateId 非空时展示
 */
export const STEP_NODE_AGENT_CONFIG = 4

/**
 * STEP_RESOURCES_CONFIRM
 * 资源绑定与确认的步骤编号（1-based）
 * 未选模板时，Step3 完成后直接跳到此步
 */
export const STEP_RESOURCES_CONFIRM = 5
