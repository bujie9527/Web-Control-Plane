import type { ProjectType } from '../../schemas/projectCreationReference'

const now = new Date().toISOString()

export const facebookPageProjectType: ProjectType = {
  id: 'pt-facebook-page-operation',
  code: 'FACEBOOK_PAGE_OPERATION',
  name: 'Facebook 公共主页运营',
  description: '同时管理多个 Facebook 公共主页，每个主页绑定一个身份形成内容运营差异化，面向相似用户画像',
  status: 'active',
  allowedGoalTypes: [
    'ACCOUNT_FOLLOWERS',
    'ACCOUNT_ENGAGEMENT',
    'ACCOUNT_VIEWS',
    'ACCOUNT_POST_STABILITY',
  ],
  allowedTerminalTypes: ['facebook'],
  multiPageSupport: true,
  createdAt: now,
  updatedAt: now,
}
