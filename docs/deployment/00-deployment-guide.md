# AI Work Control Center 线上部署指南

适用于新装 Ubuntu 服务器，支持「一键环境初始化」和「本地开发 → 云端快速更新」的迭代方式。

---

## 当前部署目标

以下为当前线上环境的固定记录，供团队引用。

| 项 | 值 |
|----|-----|
| **部署服务器** | 43.160.204.235 |
| **SSH 用户** | ubuntu（认证信息见 [docs/服务器信息.txt](../服务器信息.txt)） |
| **系统域名** | https://ai.667788.cool |
| **应用目录** | /opt/awcc |

当前线上环境按 **方案二（Node + PM2）** 部署，日常更新与运维规则见 [云端更新规则（方案二）](cloud-update-rules.md)。  
**首次部署**：SSH 登录 `ubuntu@43.160.204.235` 后，按 [cloud-update-rules.md](cloud-update-rules.md) 中「首次部署步骤」执行（含克隆/上传代码、配置 `.env`、运行 `scripts/server-bootstrap.sh`、按需执行 certbot）。部署后可通过 https://ai.667788.cool 访问。

---

## 一、部署方式建议

系统当前为 **前后端一体**：Vite 构建的静态资源由 Express 在生产态统一托管（单端口 3001），无需单独 Nginx 配前端。

### 推荐：Docker 单容器（首选）

- **优点**：环境一致、自带 Node 与依赖，不污染宿主机；迁移、回滚方便。
- **适用**：希望线上与本地构建结果一致、后续可能多机/多环境复制时。

### 备选：Node + PM2 直跑（开发期推荐）

- **优点**：不装 Docker，拉代码即跑；排查问题直接看日志、改代码重启即可；本机改完 `pm2 restart` 立刻生效。
- **适用**：**开发期**单机快速试跑、需要频繁看日志/改代码时；或对 Docker 不熟时。

**开发期用方案二是否方便？** 会。原因简要如下：
- **看日志**：`pm2 logs awcc` 实时看 stdout/stderr，无需进容器。
- **改代码**：在服务器上改完（或本机改完 rsync/git pull 后）执行 `npm run build && npm run build:server && pm2 restart awcc`，或直接跑一键脚本 `USE_PM2=1 ./scripts/deploy-update.sh`。
- **单机**：无需 Docker 和镜像构建，依赖在宿主机 `node_modules`，排错、加依赖都直观。

两种方式都支持**同一种快捷更新流程**：`git pull` → 构建 → 重启，下面会给出具体命令与脚本。

---

## 二、服务器环境准备（Ubuntu）

在**全新 Ubuntu 服务器**上执行以下步骤（建议 22.04 LTS）。

### 2.1 基础与安全

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git
# 可选：配置 UFW 只开放 22、80、443、3001
# sudo ufw allow 22 && sudo ufw allow 3001 && sudo ufw enable
```

### 2.2 方式 A：Docker 部署（推荐）

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 登出再登录后生效，或执行
newgrp docker

# 安装 Docker Compose 插件（可选，本项目提供 docker-compose.yml）
sudo apt install -y docker-compose-plugin
```

### 2.3 方式 B：Node + PM2 直跑

```bash
# 安装 Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # 应 >= 18

# 安装 PM2
sudo npm install -g pm2
```

---

## 三、项目部署

### 3.1 克隆与配置

```bash
# 假设部署目录
export APP_DIR=/opt/awcc
sudo mkdir -p $APP_DIR && sudo chown $USER:$USER $APP_DIR
cd $APP_DIR

# 克隆（替换为你的仓库地址）
git clone https://github.com/your-org/ai-work-control-center.git .
# 或已有密钥时：git clone git@github.com:your-org/ai-work-control-center.git .
```

### 3.2 环境变量（必配）

在项目根目录创建 `.env`（生产环境不要提交到 Git）：

```bash
cp .env.example .env
nano .env
```

**必须配置项**（至少）：

- `NODE_ENV=production`
- `PORT=3001`
- `DATABASE_URL`：生产建议 PostgreSQL，例如  
  `DATABASE_URL=postgresql://user:password@localhost:5432/awcc`
- `OPENAI_API_KEY`：LLM 调用（服务端使用，不会暴露到前端）
- 若用 JWT 登录：`JWT_SECRET`、`JWT_EXPIRES_IN`

可参考项目根目录 `.env.example` 中的注释。

---

## 四、运行方式

### 4.1 Docker 单容器

```bash
cd /opt/awcc
docker compose --env-file .env up -d --build
# 查看日志
docker compose logs -f app
```

访问：`http://服务器IP:3001`。若需对外 80 端口，可在前加 Nginx 反代 3001，或改 `ports: - "80:3001"`。

### 4.2 Node + PM2（开发期推荐）

```bash
cd /opt/awcc
npm ci
npx prisma generate
npm run build
npm run build:server
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

访问：`http://服务器IP:3001`。

**开发期常用命令速查（PM2）**：

| 操作       | 命令 |
|------------|------|
| 看实时日志 | `pm2 logs awcc` |
| 看状态     | `pm2 status` 或 `pm2 show awcc` |
| 重启一次   | `pm2 restart awcc` |
| 拉代码并更新 | `USE_PM2=1 ./scripts/deploy-update.sh` |
| 只改后端后重启 | `npm run build:server && pm2 restart awcc` |

---

## 五、本地开发 → 云端快速更新（快捷看效果）

目标：本地改完代码，在服务器上**拉代码 → 构建 → 重启**，尽快看到线上效果。

### 5.1 推荐流程（Git 推送 + 服务器拉取）

1. **本地**：开发、自测通过后提交并推送到 Git（如 `main`）。
2. **服务器**：SSH 登录后执行**一键更新脚本**（见下节），或手动执行：

```bash
cd /opt/awcc
git pull
# Docker 方式
docker compose up -d --build

# 或 PM2 方式
npm ci
npx prisma generate
npm run build
npm run build:server
pm2 restart awcc
```

3. 如需数据库迁移（新增了 Prisma migration）：

```bash
# Docker
docker compose exec app npx prisma migrate deploy

# PM2
npx prisma migrate deploy
```

### 5.2 一键更新脚本（推荐）

当前固定标准更新入口（Windows 本机）：

```powershell
.\scripts\deploy-to-cloud.ps1 -DryRun
.\scripts\deploy-to-cloud.ps1
```

该脚本采用“增量上传 + 按变更类型最小执行”策略，会自动跳过不必要的 `npm ci/build/restart`，显著快于每次全量流程。  
详细规则见 `docs/deployment/cloud-update-rules.md`。

### 5.3 可选：自动部署（CI/CD）

若希望「推送即部署」，可将 `docs/deployment/github-actions-deploy.example.yml` 复制到 `.github/workflows/deploy.yml`，在仓库中配置 Secrets（`DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_KEY`），则 push 到 main 后会自动 SSH 到服务器执行拉取与重启。本地 `git push` 后几分钟内即可在线上看到效果。

---

## 六、生产检查清单

- [ ] `.env` 已配置且不提交（含 `DATABASE_URL`、`OPENAI_API_KEY`、`JWT_SECRET` 等）
- [ ] 生产使用 PostgreSQL（或其它可靠数据库），不用 `file:./server/data/app.db` 仅作开发
- [ ] 如需 HTTPS：在 3001 前增加 Nginx/Caddy 反代并配置证书
- [ ] 防火墙仅开放必要端口（如 22、80、443、3001）
- [ ] 定期备份数据库与 `server/data` 下持久化文件（若用 SQLite 过渡）
- [ ] 日志与监控：Docker 用 `docker compose logs`，PM2 用 `pm2 logs`，可按需接入集中日志

---

## 七、常见问题

**Q：前端请求 /api 报错？**  
生产环境前端与 API 同源（同一 3001），无需单独配代理；若前面挂了 Nginx，需把 `/api` 反代到后端 3001。

**Q：Prisma 迁移在 Docker 里失败？**  
确保 `DATABASE_URL` 在容器内可访问（如用宿主机数据库时用 `host.docker.internal` 或宿主机内网 IP）。

**Q：想快速回滚？**  
Docker：`git checkout <旧版本> && docker compose up -d --build`。  
PM2：`git checkout <旧版本>` 后重新 build 并 `pm2 restart awcc`。

---

以上完成后，日常迭代只需：**本地 push → 服务器执行一键脚本（或 CI 自动执行）→ 刷新浏览器即可看到效果**。
