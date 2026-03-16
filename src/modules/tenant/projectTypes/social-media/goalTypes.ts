import type { GoalType } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const socialMediaGoalTypes: GoalType[] = [
  {
    id: 'gt-account-followers',
    code: 'ACCOUNT_FOLLOWERS',
    name: '提升粉丝量',
    description: '通过持续发布内容，稳定增长账号粉丝数量',
    relatedProjectType: 'ACCOUNT_OPERATION',
    allowedMetricOptions: ['FOLLOWERS_COUNT', 'ENGAGEMENT_COUNT', 'POST_FREQUENCY'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-account-engagement',
    code: 'ACCOUNT_ENGAGEMENT',
    name: '提升互动量',
    description: '提升内容点赞、评论、转发等互动数据',
    relatedProjectType: 'ACCOUNT_OPERATION',
    allowedMetricOptions: ['ENGAGEMENT_COUNT', 'FOLLOWERS_COUNT', 'CONTENT_VIEWS'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-account-views',
    code: 'ACCOUNT_VIEWS',
    name: '提升播放量',
    description: '提升视频或图文内容的曝光与播放量',
    relatedProjectType: 'ACCOUNT_OPERATION',
    allowedMetricOptions: ['CONTENT_VIEWS', 'FOLLOWERS_COUNT', 'ENGAGEMENT_COUNT'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-account-post-stability',
    code: 'ACCOUNT_POST_STABILITY',
    name: '稳定发帖节奏',
    description: '保持账号活跃度，按计划频率持续产出内容',
    relatedProjectType: 'ACCOUNT_OPERATION',
    allowedMetricOptions: ['POST_FREQUENCY', 'CONTENT_VIEWS'],
    createdAt: now,
    updatedAt: now,
  },
]
