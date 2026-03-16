import type { Identity, IdentityStatus, IdentityType } from '../schemas/identity'

function platformLabels(adaptations: Record<string, string>): string {
  const keys = Object.keys(adaptations).filter(Boolean)
  const labelMap: Record<string, string> = {
    wechat: '微信',
    x: 'X',
    tiktok: '抖音',
    douyin: '抖音',
    xiaohongshu: '小红书',
    weibo: '微博',
    facebook: 'Facebook',
  }
  return keys.map((k) => labelMap[k] ?? k).join('、') || '—'
}

const _list: Identity[] = [
  {
    id: 'id1',
    tenantId: 't1',
    name: '品牌官方号',
    type: 'brand_official',
    corePositioning: '品牌官方发声，专业、可信、有温度',
    toneStyle: '专业、稳重、略带亲和',
    contentDirections: '仅发布与品牌、产品、活动相关的内容；不参与争议话题；数据与表述需有据可查。',
    behaviorRules: '回复需在 24 小时内；不承诺未公布政策；涉及客诉转客服通道。',
    platformAdaptations: { wechat: '偏长文与深度解读', x: '简短、话题标签', douyin: '口语化、节奏快' },
    status: 'active',
    createdAt: '2025-01-10',
    updatedAt: '2025-03-08 10:00',
  },
  {
    id: 'id2',
    tenantId: 't1',
    name: '美妆 KOC 小美',
    type: 'koc',
    corePositioning: '真实用户分享，种草不硬广',
    toneStyle: '亲切、口语化、带一点幽默',
    contentDirections: '以个人使用体验为主；可接合作但需标注；不夸大功效。',
    behaviorRules: '评论区积极互动；不拉踩其他品牌；争议话题不站队。',
    platformAdaptations: { xiaohongshu: '图文为主，标签丰富', douyin: '短视频口播，节奏轻快' },
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2025-03-07 15:30',
  },
  {
    id: 'id3',
    tenantId: 't1',
    name: '行业专家顾问',
    type: 'expert',
    corePositioning: '领域专家视角，提供洞察与建议',
    toneStyle: '专业、严谨、有数据支撑',
    contentDirections: '聚焦行业趋势、方法论与案例；不涉及具体产品推销；引用需注明来源。',
    behaviorRules: '回答基于公开信息与经验；不提供法律/医疗等专业建议；保持中立。',
    platformAdaptations: { wechat: '长文与白皮书', x: '观点摘要与 thread' },
    status: 'active',
    createdAt: '2025-01-20',
    updatedAt: '2025-03-06 09:00',
  },
  {
    id: 'id4',
    tenantId: 't1',
    name: '客服助手',
    type: 'assistant',
    corePositioning: '高效、礼貌的客服话术与流程引导',
    toneStyle: '礼貌、简洁、解决问题导向',
    contentDirections: '仅处理咨询、下单、退换货等流程；不讨论与业务无关话题。',
    behaviorRules: '首句问候；复杂问题转人工；敏感信息不记录。',
    platformAdaptations: { wechat: '话术偏正式', douyin: '简短、emoji 适度' },
    status: 'active',
    createdAt: '2025-02-15',
    updatedAt: '2025-03-08 08:00',
  },
  {
    id: 'id5',
    tenantId: 't1',
    name: '活动临时人设',
    type: 'other',
    corePositioning: '限时活动专用，活泼吸睛',
    toneStyle: '活泼、有梗、年轻化',
    contentDirections: '仅用于活动期间；内容与活动主题强绑定。',
    behaviorRules: '活动结束后停用；不用于日常客服。',
    platformAdaptations: {},
    status: 'draft',
    createdAt: '2025-03-01',
    updatedAt: '2025-03-05 14:00',
  },
  {
    id: 'id6',
    tenantId: 't1',
    name: '海外华人职场成长顾问',
    type: 'expert',
    corePositioning: '围绕职场成长、情绪支持、个人提升等内容与受众沟通',
    toneStyle: '温和、可信、鼓励型',
    contentDirections: '职场成长、共鸣表达与实用建议；不涉及具体公司内政与敏感话题。',
    behaviorRules: '回复积极正面；不提供法律/医疗建议；争议话题保持中立。',
    platformAdaptations: { facebook: '更偏互动与生活化表达', wechat: '偏深度与长文' },
    status: 'active',
    createdAt: '2025-02-20',
    updatedAt: '2025-03-08 12:00',
  },
]

export const identityListMock: Identity[] = _list

export function getIdentityList(params: {
  tenantId: string
  page?: number
  pageSize?: number
  keyword?: string
  status?: IdentityStatus
  type?: IdentityType
}): { items: Identity[]; total: number } {
  const { tenantId, page = 1, pageSize = 10, keyword, status, type } = params
  let list = _list.filter((i) => i.tenantId === tenantId)
  if (keyword?.trim()) {
    const k = keyword.trim().toLowerCase()
    list = list.filter(
      (i) =>
        i.name.toLowerCase().includes(k) ||
        i.corePositioning.toLowerCase().includes(k)
    )
  }
  if (status) list = list.filter((i) => i.status === status)
  if (type) list = list.filter((i) => i.type === type)
  const total = list.length
  const start = (page - 1) * pageSize
  const items = list.slice(start, start + pageSize)
  return { items, total }
}

export function getIdentityById(id: string): Identity | undefined {
  return _list.find((i) => i.id === id)
}

/** 创建身份（占位：写入内存并返回新对象） */
export function createIdentity(
  payload: Partial<Identity> & { name: string; tenantId: string }
): Identity {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const id = `id${Date.now()}`
  const identity: Identity = {
    id,
    tenantId: payload.tenantId,
    name: payload.name,
    type: (payload.type as IdentityType) ?? 'other',
    corePositioning: payload.corePositioning ?? '',
    toneStyle: payload.toneStyle ?? '',
    contentDirections: payload.contentDirections ?? '',
    behaviorRules: payload.behaviorRules ?? '',
    platformAdaptations: payload.platformAdaptations ?? {},
    status: (payload.status as IdentityStatus) ?? 'draft',
    createdAt: now,
    updatedAt: now,
  }
  _list.push(identity)
  return identity
}

/** 更新身份（占位） */
export function updateIdentity(id: string, payload: Partial<Identity>): Identity | null {
  const i = _list.findIndex((item) => item.id === id)
  if (i < 0) return null
  const next = {
    ..._list[i],
    ...payload,
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  }
  _list[i] = next
  return next
}

/** 删除身份（占位：从内存移除） */
export function deleteIdentity(id: string): boolean {
  const idx = _list.findIndex((item) => item.id === id)
  if (idx < 0) return false
  _list.splice(idx, 1)
  return true
}

/** 修改身份状态（占位） */
export function patchIdentityStatus(id: string, status: IdentityStatus): Identity | null {
  return updateIdentity(id, { status })
}

export { platformLabels }
