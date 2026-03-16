import type { ProjectType } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const leadGenProjectType: ProjectType = {
  id: 'pt-client-acquisition',
  code: 'CLIENT_ACQUISITION',
  name: '线索获客',
  description: '通过 WhatsApp / Line 等私域渠道主动触达，获取潜在客户线索',
  status: 'active',
  allowedGoalTypes: ['PRIVATE_CONTACTS', 'DM_INQUIRIES', 'FORM_LEADS'],
  createdAt: now,
  updatedAt: now,
}
