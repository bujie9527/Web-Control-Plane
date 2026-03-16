/**
 * 路由路径常量，与双后台结构一致
 */
export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    BASE: '/auth',
  },
  PLATFORM: {
    BASE: '/platform',
    HOME: '/platform',
    TENANTS: '/platform/tenants',
    USERS: '/platform/users',
    QUOTA: '/platform/quota',
    TEMPLATES: '/platform/templates',
    AUDIT: '/platform/audit',
    SETTINGS: '/platform/settings',
  },
  /** 系统管理员专属：Agent 模板工厂、Skill 工厂、模型配置中心等 */
  SYSTEM: {
    BASE: '/system',
    LLM_CONFIGS: '/system/llm-configs',
    AGENT_FACTORY: '/system/agent-factory',
    AGENT_FACTORY_NEW: '/system/agent-factory/new',
    AGENT_FACTORY_DETAIL: (id: string) => `/system/agent-factory/${id}`,
    AGENT_FACTORY_EDIT: (id: string) => `/system/agent-factory/${id}/edit`,
    SKILL_FACTORY: '/system/skill-factory',
    SKILL_FACTORY_NEW: '/system/skill-factory/new',
    SKILL_FACTORY_DETAIL: (id: string) => `/system/skill-factory/${id}`,
    SKILL_FACTORY_EDIT: (id: string) => `/system/skill-factory/${id}/edit`,
    WORKFLOW_TEMPLATES: '/system/workflow-templates',
    WORKFLOW_TEMPLATES_NEW: '/system/workflow-templates/new',
    WORKFLOW_TEMPLATES_DETAIL: (id: string) => `/system/workflow-templates/${id}`,
    WORKFLOW_TEMPLATES_EDIT: (id: string) => `/system/workflow-templates/${id}/edit`,
    WORKFLOW_PLANNING: '/system/workflow-planning',
    WORKFLOW_PLANNING_NEW: '/system/workflow-planning/new',
    WORKFLOW_PLANNING_DETAIL: (id: string) => `/system/workflow-planning/${id}`,
    WORKFLOW_RUNTIME: '/system/workflow-runtime',
    WORKFLOW_RUNTIME_DETAIL: (id: string) => `/system/workflow-runtime/${id}`,
    DATASOURCE_CONFIGS: '/system/datasource-configs',
    WEBHOOKS: '/system/webhooks',
    MESSAGE_PIPELINE: '/system/message-pipeline',
    SCHEDULED_TASKS: '/system/scheduled-tasks',
    /** 平台终端能力注册（替代终端类型工厂） */
    PLATFORM_CAPABILITIES: '/system/platform-capabilities',
    PLATFORM_CAPABILITIES_DETAIL: (code: string) => `/system/platform-capabilities/${code}`,
    /** @deprecated 由 PLATFORM_CAPABILITIES 替代，保留兼容 */
    TERMINAL_TYPES: '/system/terminal-types',
    TERMINAL_TYPES_NEW: '/system/terminal-types/new',
    TERMINAL_TYPES_DETAIL: (id: string) => `/system/terminal-types/${id}`,
    TERMINAL_TYPES_EDIT: (id: string) => `/system/terminal-types/${id}/edit`,
  },
  TENANT: {
    BASE: '/tenant',
    HOME: '/tenant',
    PROJECTS: '/tenant/projects',
    PROJECT_CREATE: '/tenant/projects/new',
    /** 任务执行详情，path 为 /tenant/projects/:projectId/tasks/:taskId */
    PROJECT_TASK_EXECUTION: (projectId: string, taskId: string) =>
      `/tenant/projects/${projectId}/tasks/${taskId}`,
    TASKS: '/tenant/tasks',
    MESSAGES: '/tenant/messages',
    SCHEDULED_TASKS: '/tenant/scheduled-tasks',
    DATASOURCES: '/tenant/datasources',
    WORKFLOWS: '/tenant/workflows',
    WORKFLOW_TEMPLATES: '/tenant/workflow-templates',
    WORKFLOW_TEMPLATES_DETAIL: (id: string) => `/tenant/workflow-templates/${id}`,
    WORKFLOW_TEMPLATES_EDIT: (id: string) => `/tenant/workflow-templates/${id}/edit`,
    WORKFLOW_PLANNING: '/tenant/workflow-planning',
    WORKFLOW_PLANNING_NEW: '/tenant/workflow-planning/new',
    WORKFLOW_PLANNING_DETAIL: (id: string) => `/tenant/workflow-planning/${id}`,
    WORKFLOW_RUNTIME: '/tenant/workflow-runtime',
    WORKFLOW_RUNTIME_DETAIL: (id: string) => `/tenant/workflow-runtime/${id}`,
    /** 流程模板详情，path 为 /tenant/workflows/templates/:id */
    WORKFLOW_TEMPLATES_BASE: '/tenant/workflows/templates',
    AGENTS: '/tenant/agents',
    /** 租户 Agent 库详情（只读，平台 AgentTemplate） */
    AGENT_LIBRARY_DETAIL: (id: string) => `/tenant/agents/${id}`,
    /** 身份库独立路由 */
    IDENTITIES: '/tenant/identities',
    SKILLS: '/tenant/skills',
    SKILL_DETAIL: (id: string) => `/tenant/skills/${id}`,
    TERMINALS: '/tenant/terminals',
    TERMINALS_TELEGRAM: '/tenant/terminals/telegram',
    TERMINAL_NEW: '/tenant/terminals/new',
    TERMINAL_DETAIL: (id: string) => `/tenant/terminals/${id}`,
    /** Facebook 公共主页授权管理（多主页运营） */
    FACEBOOK_PAGES: '/tenant/facebook-pages',
    ANALYTICS: '/tenant/analytics',
    SETTINGS: '/tenant/settings',
  },
} as const
