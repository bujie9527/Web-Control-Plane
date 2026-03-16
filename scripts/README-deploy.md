# 部署脚本说明

## 快速更新上线（推荐：Git 模式）

服务器已切换为 Git 仓库模式，日常更新建议走：

1. 本地提交并推送：
   ```bash
   git add .
   git commit -m "your change"
   git push origin main
   ```
2. 服务器执行：
   ```bash
   cd /opt/awcc
   USE_PM2=1 bash scripts/deploy-update.sh
   ```

- **作用**：`git pull` 拉取变更 → `npm ci` → `npx prisma generate` → `npm run build` → `npx prisma migrate deploy`（如有）→ `pm2 restart awcc`。
- **特点**：上传量小、可追踪、可回滚，适合高频开发测试。

---

## deploy-update.sh（服务器上一键更新）

在**服务器上**、项目根目录执行，用于拉取最新代码并重新构建、重启服务。

- **PM2 部署**（当前方案）：
  ```bash
  USE_PM2=1 bash scripts/deploy-update.sh
  ```
- **Docker 部署**：
  ```bash
  ./scripts/deploy-update.sh
  ```

脚本会依次执行：有 `.git` 时 `git pull`，否则跳过 → `npm ci` → `npx prisma generate` → `npm run build` → 数据库迁移（若有）→ 重启（PM2 或 Docker）。后端由 tsx 直接运行，无需 `build:server`。

当前线上目录 `/opt/awcc` 已是 Git 仓库，推荐固定使用本脚本作为标准更新入口。
