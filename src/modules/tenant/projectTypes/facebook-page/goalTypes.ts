import type { GoalType } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const facebookPageGoalTypes: GoalType[] = [
  {
    id: 'gt-fb-account-followers',
    code: 'ACCOUNT_FOLLOWERS',
    name: '提升粉丝量',
    description: '通过持续发布内容，稳定增长主页粉丝数量',
    relatedProjectType: 'FACEBOOK_PAGE_OPERATION',
    allowedMetricOptions: ['FOLLOWERS_COUNT', 'ENGAGEMENT_COUNT', 'POST_FREQUENCY'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-fb-account-engagement',
    code: 'ACCOUNT_ENGAGEMENT',
    name: '提升互动量',
    description: '提升内容点赞、评论、分享等互动数据',
    relatedProjectType: 'FACEBOOK_PAGE_OPERATION',
    allowedMetricOptions: ['ENGAGEMENT_COUNT', 'FOLLOWERS_COUNT', 'CONTENT_VIEWS'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-fb-account-views',
    code: 'ACCOUNT_VIEWS',
    name: '提升曝光量',
    description: '提升帖子与主页的曝光与触达',
    relatedProjectType: 'FACEBOOK_PAGE_OPERATION',
    allowedMetricOptions: ['CONTENT_VIEWS', 'FOLLOWERS_COUNT', 'ENGAGEMENT_COUNT'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-fb-account-post-stability',
    code: 'ACCOUNT_POST_STABILITY',
    name: '稳定发帖节奏',
    description: '保持主页活跃度，按计划频率持续产出内容',
    relatedProjectType: 'FACEBOOK_PAGE_OPERATION',
    allowedMetricOptions: ['POST_FREQUENCY', 'CONTENT_VIEWS'],
    createdAt: now,
    updatedAt: now,
  },
]
