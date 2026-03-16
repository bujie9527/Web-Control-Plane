import type { GoalMetricOption } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const socialMediaMetricOptions: GoalMetricOption[] = [
  {
    id: 'gmo-followers',
    code: 'FOLLOWERS_COUNT',
    name: '粉丝量',
    unit: '人',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-engagement',
    code: 'ENGAGEMENT_COUNT',
    name: '互动量',
    unit: '次',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-content-views',
    code: 'CONTENT_VIEWS',
    name: '播放量',
    unit: '次',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-post-freq',
    code: 'POST_FREQUENCY',
    name: '发帖频率',
    unit: '次/周期',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
]
