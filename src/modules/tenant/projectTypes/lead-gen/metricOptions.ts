import type { GoalMetricOption } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const leadGenMetricOptions: GoalMetricOption[] = [
  {
    id: 'gmo-private-contact',
    code: 'PRIVATE_CONTACT_COUNT',
    name: '私域联系人数',
    unit: '人',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-dm-inquiries',
    code: 'DM_INQUIRIES',
    name: '私信咨询数',
    unit: '次',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gmo-form-submission',
    code: 'FORM_SUBMISSION_COUNT',
    name: '表单提交数',
    unit: '份',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
]
