import type { GoalType } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const leadGenGoalTypes: GoalType[] = [
  {
    id: 'gt-private-contacts',
    code: 'PRIVATE_CONTACTS',
    name: '获取私域联系人',
    description: '将目标用户引导添加到 WhatsApp / Line 私域，形成联系人资产',
    relatedProjectType: 'CLIENT_ACQUISITION',
    allowedMetricOptions: ['PRIVATE_CONTACT_COUNT', 'DM_INQUIRIES'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-dm-inquiries',
    code: 'DM_INQUIRIES',
    name: '私信咨询转化',
    description: '将公域曝光转化为主动私信咨询的潜在客户',
    relatedProjectType: 'CLIENT_ACQUISITION',
    allowedMetricOptions: ['DM_INQUIRIES', 'PRIVATE_CONTACT_COUNT'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gt-form-leads',
    code: 'FORM_LEADS',
    name: '表单留资',
    description: '通过落地页或广告表单收集潜在客户信息',
    relatedProjectType: 'CLIENT_ACQUISITION',
    allowedMetricOptions: ['FORM_SUBMISSION_COUNT', 'PRIVATE_CONTACT_COUNT'],
    createdAt: now,
    updatedAt: now,
  },
]
