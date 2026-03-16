/**
 * 统一事件命名，与 06-api-contract-spec 一致，供埋点、审计、消息等引用
 */
export const EVENTS = {
  tenant: {
    created: 'tenant.created',
    updated: 'tenant.updated',
    statusChanged: 'tenant.status.changed',
  },
  user: {
    created: 'user.created',
    updated: 'user.updated',
    roleUpdated: 'user.role.updated',
  },
  project: {
    created: 'project.created',
    updated: 'project.updated',
    memberAssigned: 'project.member.assigned',
  },
  workflow: {
    created: 'workflow.created',
    versionUpdated: 'workflow.version.updated',
  },
  task: {
    created: 'task.created',
    started: 'task.started',
    failed: 'task.failed',
    reviewApproved: 'task.review.approved',
  },
  agent: {
    created: 'agent.created',
    teamAssigned: 'agent.team.assigned',
  },
  skill: {
    updated: 'skill.updated',
  },
  terminal: {
    connected: 'terminal.connected',
    disconnected: 'terminal.disconnected',
    statusChanged: 'terminal.status.changed',
  },
} as const
