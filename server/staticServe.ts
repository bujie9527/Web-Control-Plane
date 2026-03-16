/**
 * 生产模式下挂载前端静态资源（Vite 构建的 dist/）
 * 用于 Docker 单容器部署：同一进程既提供 API 又提供 SPA
 */
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import type { Express } from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function mountStaticFiles(app: Express): void {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}
