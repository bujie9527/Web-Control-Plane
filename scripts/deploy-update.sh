#!/usr/bin/env bash
# 一键更新部署脚本：拉取代码 → 安装依赖 → 构建 → 重启
# 在项目根目录执行，例如：./scripts/deploy-update.sh
# 使用 PM2 时：USE_PM2=1 ./scripts/deploy-update.sh

set -e
cd "$(dirname "$0")/.."
ROOT="$PWD"

echo "[deploy] 工作目录: $ROOT"
if [ -d .git ]; then
  git pull
else
  echo "[deploy] 非 git 仓库，跳过 git pull（代码已通过上传更新）"
fi

echo "[deploy] 安装依赖..."
npm ci
npx prisma generate

echo "[deploy] 构建前端..."
npm run build
# 后端由 PM2 通过 tsx 直接运行 server/index.ts，无需 build:server

if [ -n "$USE_PM2" ]; then
  echo "[deploy] 执行数据库迁移..."
  npx prisma migrate deploy 2>/dev/null || true
  if pm2 describe awcc >/dev/null 2>&1; then
    echo "[deploy] 重启 PM2 进程 awcc..."
    pm2 restart awcc || {
      echo "[deploy] PM2 进程状态异常，重新创建 awcc..."
      pm2 delete awcc >/dev/null 2>&1 || true
      pm2 start ecosystem.config.cjs
    }
  else
    echo "[deploy] 启动 PM2 进程 awcc（首次）..."
    pm2 start ecosystem.config.cjs
  fi
  echo "[deploy] 完成 (PM2)。查看日志: pm2 logs awcc"
else
  echo "[deploy] 重启 Docker 容器..."
  docker compose up -d --build
  echo "[deploy] 完成 (Docker)。查看日志: docker compose logs -f app"
fi
