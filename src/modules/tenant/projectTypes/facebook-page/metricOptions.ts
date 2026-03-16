import type { GoalMetricOption } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const facebookPageMetricOptions: GoalMetricOption[] = [
  {
    id: 'gmo-fb-followers',
    code: 'FOLLOWERS_COUNT',
    name: '粉丝量',
    unit: '人',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-fb-engagement',
    code: 'ENGAGEMENT_COUNT',
    name: '互动量',
    unit: '次',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-fb-content-views',
    code: 'CONTENT_VIEWS',
    name: '曝光量',
    unit: '次',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-fb-post-freq',
    code: 'POST_FREQUENCY',
    name: '发帖频率',
    unit: '次/周期',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
]
