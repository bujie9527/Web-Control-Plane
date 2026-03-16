import type { GoalType } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const seoGoalTypes: GoalType[] = [
  {
    id: 'gt-index-count',
    code: 'INDEX_COUNT',
    name: '提升收录量',
    description: '增加被搜索引擎收录的页面数量',
    relatedProjectType: 'WEBSITE_OPERATION',
    allowedMetricOptions: ['INDEX_PAGE_COUNT', 'ORGANIC_TRAFFIC'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-keyword-rank',
    code: 'KEYWORD_RANK',
    name: '关键词排名提升',
    description: '提升目标关键词在搜索引擎的排名位置',
    relatedProjectType: 'WEBSITE_OPERATION',
    allowedMetricOptions: ['KEYWORD_RANK_POSITION', 'ORGANIC_TRAFFIC', 'INDEX_PAGE_COUNT'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-organic-traffic',
    code: 'ORGANIC_TRAFFIC',
    name: '自然流量增长',
    description: '持续增长来自搜索引擎的自然访问量',
    relatedProjectType: 'WEBSITE_OPERATION',
    allowedMetricOptions: ['ORGANIC_TRAFFIC', 'INDEX_PAGE_COUNT', 'KEYWORD_RANK_POSITION'],
    createdAt: now,
    updatedAt: now,
  },
]
