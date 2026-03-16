#!/usr/bin/env bash
# 服务器一站式引导脚本（方案二：Node + PM2 + Nginx + HTTPS）
# 在应用根目录执行：chmod +x scripts/server-bootstrap.sh && ./scripts/server-bootstrap.sh
# 前提：代码已在 /opt/awcc，.env 已配置（可从 .env.example 复制后修改）

set -e
cd "$(dirname "$0")/.."
ROOT="$PWD"

if [[ ! -f package.json ]]; then
  echo "[bootstrap] 错误：请在项目根目录执行本脚本。"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "[bootstrap] 未找到 .env，已从 .env.example 复制，请编辑 .env 后重新运行。"
  cp -n .env.example .env 2>/dev/null || true
  echo "[bootstrap] 编辑: nano .env  然后再次执行 ./scripts/server-bootstrap.sh"
  exit 1
fi

# 1. 安装 Node 20 + PM2（若未安装）
if ! command -v node &>/dev/null; then
  echo "[bootstrap] 安装 Node 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
if ! command -v pm2 &>/dev/null; then
  echo "[bootstrap] 安装 PM2..."
  sudo npm install -g pm2
fi
node -v
pm2 -v

# 2. 构建应用
echo "[bootstrap] 安装依赖并构建前端..."
npm ci
npx prisma generate
npm run build
# 后端由 PM2 通过 tsx 运行，无需 build:server

# 3. 数据目录（SQLite 等）
mkdir -p server/data

# 4. PM2 启动
if pm2 describe awcc &>/dev/null; then
  pm2 restart awcc
else
  pm2 start ecosystem.config.cjs
fi
pm2 save
pm2 startup 2>/dev/null || true

# 5. Nginx + 反代
if ! command -v nginx &>/dev/null; then
  echo "[bootstrap] 安装 Nginx 与 certbot..."
  sudo apt-get update -qq
  sudo apt-get install -y nginx certbot python3-certbot-nginx
fi
if [[ -f deploy/nginx-awcc.conf ]]; then
  sudo cp deploy/nginx-awcc.conf /etc/nginx/sites-available/awcc
  sudo ln -sf /etc/nginx/sites-available/awcc /etc/nginx/sites-enabled/awcc
  if [[ -e /etc/nginx/sites-enabled/default ]]; then
    sudo rm -f /etc/nginx/sites-enabled/default
  fi
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx
    echo "[bootstrap] Nginx 已配置并重载。"
  else
    echo "[bootstrap] Nginx 配置有误，请检查后执行: sudo nginx -t && sudo systemctl reload nginx"
  fi
fi

# 6. HTTPS（需域名已解析到本机）
echo "[bootstrap] 若需 HTTPS，请执行: sudo certbot --nginx -d ai.667788.cool"
echo "[bootstrap] 完成。访问 http://$(curl -s ifconfig.me 2>/dev/null || echo '本机IP'):80 或 https://ai.667788.cool"
