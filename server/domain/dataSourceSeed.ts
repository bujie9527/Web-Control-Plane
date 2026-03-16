import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

export async function seedDataSourceProvidersIfEmpty(): Promise<void> {
  const count = await prisma.dataSourceProvider.count()
  if (count > 0) return

  const ts = now()
  await prisma.dataSourceProvider.createMany({
    data: [
      {
        id: 'ds-provider-tavily',
        name: 'Tavily',
        nameZh: 'Tavily 搜索',
        providerType: 'tavily',
        baseUrl: 'https://api.tavily.com',
        credentialId: null,
        status: 'active',
        isSystemPreset: true,
        notes: '通用 Web 搜索与新闻检索',
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: 'ds-provider-apify',
        name: 'Apify',
        nameZh: 'Apify 社媒采集',
        providerType: 'apify',
        baseUrl: 'https://api.apify.com',
        credentialId: null,
        status: 'active',
        isSystemPreset: true,
        notes: '用于社媒爬虫与 actor 执行',
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: 'ds-provider-jina',
        name: 'Jina Reader',
        nameZh: 'Jina 内容提取',
        providerType: 'jina_reader',
        baseUrl: 'https://r.jina.ai',
        credentialId: null,
        status: 'active',
        isSystemPreset: true,
        notes: '网页正文抽取与摘要前清洗',
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: 'ds-provider-rss',
        name: 'RSS',
        nameZh: 'RSS 订阅',
        providerType: 'rss',
        baseUrl: '',
        credentialId: null,
        status: 'active',
        isSystemPreset: true,
        notes: '免费订阅源聚合',
        createdAt: ts,
        updatedAt: ts,
      },
    ],
  })
}
