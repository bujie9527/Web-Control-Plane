/**
 * 规划类 Skill Mock
 * Phase 11：Workflow Planner Agent 1.0
 * 与 28-workflow-planner-agent-rules 一致
 */

export interface PlanningSkill {
  id: string
  code: string
  name: string
  nameZh: string
  description: string
  descriptionZh: string
  type: string
  category: 'planning'
  status: 'active'
}

/** 规划技能列表 */
export const PLANNING_SKILLS: PlanningSkill[] = [
  {
    id: 'skill-parse-sop',
    code: 'ParseSOPToStructuredSteps',
    name: 'Parse SOP To Structured Steps',
    nameZh: 'SOP 结构化解析',
    description: 'Parse natural language SOP into structured step definitions',
    descriptionZh: '将自然语言 SOP 解析为结构化步骤定义',
    type: 'planning',
    category: 'planning',
    status: 'active',
  },
  {
    id: 'skill-generate-draft',
    code: 'GenerateWorkflowDraft',
    name: 'Generate Workflow Draft',
    nameZh: '生成流程草案',
    description: 'Generate WorkflowPlanningDraft from session and parsed SOP',
    descriptionZh: '根据会话与解析后的 SOP 生成流程草案',
    type: 'planning',
    category: 'planning',
    status: 'active',
  },
  {
    id: 'skill-revise-draft',
    code: 'ReviseWorkflowDraft',
    name: 'Revise Workflow Draft',
    nameZh: '修订流程草案',
    description: 'Revise existing draft based on user feedback',
    descriptionZh: '根据用户反馈修订既有草案',
    type: 'planning',
    category: 'planning',
    status: 'active',
  },
  {
    id: 'skill-summarize-changes',
    code: 'SummarizeWorkflowChanges',
    name: 'Summarize Workflow Changes',
    nameZh: '生成修改摘要',
    description: 'Generate human-readable change summary for draft revisions',
    descriptionZh: '为草案修订生成可读的修改摘要',
    type: 'planning',
    category: 'planning',
    status: 'active',
  },
  {
    id: 'skill-suggest-agent-bindings',
    code: 'SuggestNodeAgentBindings',
    name: 'Suggest Node Agent Bindings',
    nameZh: '推荐节点 Agent 绑定',
    description: 'Suggest AgentTemplate and Skill bindings for draft nodes',
    descriptionZh: '为草案节点推荐 Agent 模板与 Skill 绑定',
    type: 'planning',
    category: 'planning',
    status: 'active',
  },
]

/** 按 ID 获取规划技能 */
export function getPlanningSkillById(id: string): PlanningSkill | undefined {
  return PLANNING_SKILLS.find((s) => s.id === id)
}

/** 获取所有规划技能 */
export function listPlanningSkills(): PlanningSkill[] {
  return [...PLANNING_SKILLS]
}
