import type { ProjectType } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const seoProjectType: ProjectType = {
  id: 'pt-website-operation',
  code: 'WEBSITE_OPERATION',
  name: '网站运营与SEO',
  description: '通过内容生产与SEO优化提升网站自然流量与搜索排名',
  status: 'active',
  allowedGoalTypes: ['INDEX_COUNT', 'KEYWORD_RANK', 'ORGANIC_TRAFFIC'],
  createdAt: now,
  updatedAt: now,
}
