import type { GoalMetricOption } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const seoMetricOptions: GoalMetricOption[] = [
  {
    id: 'gmo-index-pages',
    code: 'INDEX_PAGE_COUNT',
    name: '收录页面数',
    unit: '页',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-organic-traffic',
    code: 'ORGANIC_TRAFFIC',
    name: '自然流量',
    unit: '访问/月',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-keyword-rank',
    code: 'KEYWORD_RANK_POSITION',
    name: '关键词排名',
    description: '目标关键词在搜索结果中的平均排名位置（越小越好）',
    unit: '名',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
]
