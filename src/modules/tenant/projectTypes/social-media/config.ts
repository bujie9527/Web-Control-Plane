import type { ProjectType } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const socialMediaProjectType: ProjectType = {
  id: 'pt-account-operation',
  code: 'ACCOUNT_OPERATION',
  name: '自媒体内容运营',
  description: '持续运营社交媒体账号，通过优质内容提升粉丝量与互动量',
  status: 'active',
  allowedGoalTypes: [
    'ACCOUNT_FOLLOWERS',
    'ACCOUNT_ENGAGEMENT',
    'ACCOUNT_VIEWS',
    'ACCOUNT_POST_STABILITY',
  ],
  createdAt: now,
  updatedAt: now,
}
