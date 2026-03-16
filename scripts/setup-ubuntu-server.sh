#!/usr/bin/env bash
# Ubuntu 服务器环境初始化（建议 22.04 LTS）
# 用法：curl -sSL <url> | bash  或  chmod +x scripts/setup-ubuntu-server.sh && sudo ./scripts/setup-ubuntu-server.sh
# 可选：INSTALL_PM2=1 仅安装 Node+PM2，不装 Docker

set -e
export DEBIAN_FRONTEND=noninteractive

echo "[setup] 更新系统..."
apt-get update -qq && apt-get upgrade -y -qq

echo "[setup] 安装基础工具..."
apt-get install -y -qq curl git

if [ -n "$INSTALL_PM2" ]; then
  echo "[setup] 安装 Node 20 + PM2（不安装 Docker）..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
  npm install -g pm2
  node -v
  pm2 -v
  echo "[setup] 完成。请克隆项目后执行 npm ci && 构建 && pm2 start ecosystem.config.cjs"
else
  echo "[setup] 安装 Docker + Docker Compose 插件..."
  curl -fsSL https://get.docker.com | sh
  apt-get install -y -qq docker-compose-plugin
  usermod -aG docker "$SUDO_USER" 2>/dev/null || true
  docker --version
  echo "[setup] 完成。请以普通用户重新登录后使用 docker compose。"
fi
