/**
 * 骨架页占位数据，保证每页有明确占位、无大面积空白
 */

export const taskSkeleton = {
  summary: { running: 5, review: 3, failed: 1, done: 28 },
  runningTasks: [
    { id: '1', name: '社媒发布-0328', project: '春季 campaign', assignee: '张三', updatedAt: '2025-03-08 10:30', identityName: '品牌主账号' },
    { id: '2', name: '数据拉取-日更', project: '数据看板', assignee: '李四', updatedAt: '2025-03-08 09:00', identityName: '数据接口身份' },
  ],
  reviewTasks: [
    { id: 'r1', name: '内容审核-批次3', project: '内容运营', assignee: '张三', updatedAt: '2025-03-08 08:15', identityName: '品牌主账号' },
  ],
}

export const workflowSkeleton = {
  list: [
    { id: 'w1', name: '社媒发布流程', version: 'v1.2', status: '启用', updatedAt: '2025-03-01' },
    { id: 'w2', name: '内容审核流程', version: 'v1.0', status: '启用', updatedAt: '2025-02-20' },
  ],
  templates: [
    { id: 't1', name: '标准发布模板', nodeCount: 5 },
    { id: 't2', name: '审核流转模板', nodeCount: 4 },
  ],
  nodeTemplates: [
    { id: 'n1', name: '人工审核节点', type: 'review' },
    { id: 'n2', name: 'Agent 执行节点', type: 'agent' },
  ],
}

/** Agent 库已切换为 AgentTemplate 数据源，teams/roleTemplates 仍为占位 */
export const agentSkeleton = {
  teams: [
    { id: 'at1', name: '内容运营组', memberCount: 3, status: '启用' },
    { id: 'at2', name: '数据组', memberCount: 2, status: '启用' },
  ],
  roleTemplates: [
    { id: 'r1', name: '撰写角色', description: '负责文案与内容生成' },
    { id: 'r2', name: '审核角色', description: '负责内容合规审核' },
  ],
}

export const skillsSkeleton = {
  overview: { total: 12, categories: 4, enabled: 10 },
  list: [
    { id: 's1', name: '网页抓取', category: '数据', version: '1.0', status: '启用' },
    { id: 's2', name: '内容摘要', category: '内容', version: '1.1', status: '启用' },
  ],
  categories: [
    { id: 'c1', name: '数据', count: 4 },
    { id: 'c2', name: '内容', count: 3 },
  ],
}

export const terminalSkeleton = {
  overview: { total: 8, social: 4, web: 2, system: 1, api: 1 },
  social: [
    { id: 'sm1', name: 'FB 主账号', type: 'Facebook', status: '正常', primaryIdentityId: 'id1', identityName: '品牌主账号' },
    { id: 'sm2', name: 'X 主账号', type: 'X', status: '正常', primaryIdentityId: 'id2', identityName: 'KOC-小美' },
  ],
  web: [
    { id: 'wb1', name: 'Chrome 自动化-1', status: '运行中' },
  ],
  api: [
    { id: 'api1', name: '数据接口-日更', status: '正常' },
  ],
  recentLogs: [
    { id: 'l1', action: '执行任务', terminal: 'FB 主账号', result: '成功', time: '2025-03-08 10:30' },
  ],
}

