# 云端更新规则（方案二）

本文档为线上环境的**唯一更新与运维入口**，采用 **方案二：Node + PM2**，不使用 Docker。

---

## 首次部署步骤（仅执行一次）

在**已 SSH 登录到 43.160.204.235** 的前提下，按顺序执行：

```bash
# 1. 创建目录并克隆代码（若无远程仓库，可从本机 rsync 上传到 /opt/awcc）
sudo mkdir -p /opt/awcc && sudo chown ubuntu:ubuntu /opt/awcc
git clone <你的仓库地址> /opt/awcc
# 或：从本机 rsync -avz --exclude node_modules . ubuntu@43.160.204.235:/opt/awcc/

# 2. 进入目录并配置环境变量
cd /opt/awcc
cp .env.example .env
nano .env   # 至少填写 NODE_ENV=production、PORT=3001、DATABASE_URL、OPENAI_API_KEY、JWT_SECRET

# 3. 执行一站式引导脚本（安装 Node/PM2/Nginx、构建、启动、配置反代）
chmod +x scripts/server-bootstrap.sh scripts/deploy-update.sh
./scripts/server-bootstrap.sh

# 4. 申请 HTTPS 证书（需域名 ai.667788.cool 已解析到本机）
sudo certbot --nginx -d ai.667788.cool
```

完成后可通过 **http://43.160.204.235** 或 **http://ai.667788.cool** 访问。  
建议：执行一次 `pm2 startup` 并按提示运行生成命令，使重启后应用自启；需 HTTPS 时执行 `sudo certbot --nginx -d ai.667788.cool`（需域名已解析到 43.160.204.235）。

---

## 部署概要

| 项 | 值 |
|----|-----|
| 服务器 | 43.160.204.235 |
| SSH 用户 | ubuntu（认证见 [服务器信息.txt](../服务器信息.txt)） |
| 域名 | https://ai.667788.cool |
| 应用目录 | /opt/awcc |
| 进程名 | awcc（PM2） |
| Nginx 站点配置 | /etc/nginx/sites-available/awcc |

### 服务器需开放的端口

| 端口 | 用途 |
|------|------|
| **22** | SSH，用于登录与远程执行命令（必须开放） |
| **80** | HTTP，Nginx 监听，用于访问站点及 certbot 校验 |
| **443** | HTTPS，Nginx 监听，配置 SSL 后使用 |

应用本身只监听 3001（仅本机），由 Nginx 反代，**无需对外开放 3001**。  
若使用 UFW：`sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable`。

### 让自动化/助手获得与服务器交互能力（免密 SSH）

当前 SSH 使用密码时，脚本或自动化无法在后台执行 `ssh ubuntu@43.160.204.235 "命令"`（会卡在输入密码）。  
若要让我或 CI 能**非交互执行**远程命令，请在本机配置 **SSH 公钥登录**，一次配置后即可免密执行。

**Linux / macOS（bash）：**

1. 生成密钥：`ssh-keygen -t ed25519 -N "" -f ~/.ssh/awcc_deploy`
2. 写入服务器：`ssh-copy-id -i ~/.ssh/awcc_deploy.pub ubuntu@43.160.204.235`
3. 验证：`ssh -i ~/.ssh/awcc_deploy ubuntu@43.160.204.235 "whoami"`

**Windows（PowerShell）：**

1. **生成密钥**（无密码，一路回车；若提示 “Too many arguments” 则去掉 `-N`，在提示 passphrase 时直接回车）  
   ```powershell
   ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\awcc_deploy
   ```
   出现 “Enter passphrase” 时直接按回车两次。

2. **把公钥写入服务器**（Windows 无 `ssh-copy-id`，用下面命令，会提示输入一次密码）  
   ```powershell
   Get-Content $env:USERPROFILE\.ssh\awcc_deploy.pub | ssh ubuntu@43.160.204.235 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
   ```

3. **验证免密**  
   ```powershell
   ssh -i $env:USERPROFILE\.ssh\awcc_deploy ubuntu@43.160.204.235 "whoami"
   ```
   应直接输出 `ubuntu` 且不提示密码。

配置完成后，在本机 Cursor 终端中执行远程命令时使用同一密钥（若使用默认 `id_ed25519` 则无需 `-i`），我即可通过终端对服务器执行安装、部署、更新等操作。

---

## 日常更新流程（标准）

当前服务器目录 `/opt/awcc` 已切换为 **Git 仓库**，固定走以下流程：

### Step 1：本地提交并推送

```bash
git add .
git commit -m "your change"
git push origin main
```

### Step 2：服务器拉取并部署

```bash
ssh ubuntu@43.160.204.235
cd /opt/awcc
USE_PM2=1 bash scripts/deploy-update.sh
```

脚本将执行：`git pull` → `npm ci` → `npx prisma generate` → `npm run build` → `npx prisma migrate deploy`（若有）→ `pm2 restart awcc`。

### 紧急兜底（Git 异常时）

若 Git 临时不可用，可用本机上传方式兜底（`deploy-to-cloud.ps1`），但常规不建议作为主流程。

---

## 常用运维命令

| 操作 | 命令 |
|------|------|
| 看实时日志 | `pm2 logs awcc` |
| 看进程状态 | `pm2 status` 或 `pm2 show awcc` |
| 重启应用 | `pm2 restart awcc` |
| 仅改后端后重启 | `cd /opt/awcc && pm2 restart awcc`（后端 tsx 直跑，改代码后重启即可） |
| 重载 Nginx | `sudo nginx -t && sudo systemctl reload nginx` |
| 快速回滚到上个目录快照 | `ls -dt /opt/awcc.backup.* | head -1`（确认后手动切回并重启 PM2） |

---

## Nginx 与域名

- 站点配置：`/etc/nginx/sites-available/awcc`，已启用 symlink 至 `sites-enabled`。
- 流量：80/443 → Nginx 反代 → `http://127.0.0.1:3001`（前后端一体）。
- HTTPS 证书由 certbot 管理，续期：`sudo certbot renew`（可配合 cron）。

### 安装 HTTPS（首次或证书过期后）

SSH 登录服务器后执行以下**任一**方式即可为 ai.667788.cool 申请并自动配置 Let's Encrypt 证书：

**方式一（交互，会提示输入邮箱）：**
```bash
sudo certbot --nginx -d ai.667788.cool
```
按提示同意条款并输入联系邮箱即可。

**方式二（非交互，需替换为你的邮箱）：**
```bash
sudo certbot --nginx -d ai.667788.cool --non-interactive --agree-tos -m 你的邮箱@example.com
```

完成后 Nginx 会自动启用 443 并写入证书路径，访问 https://ai.667788.cool 即可。证书到期前可执行 `sudo certbot renew` 续期（建议用 cron 定期执行）。

---

## 部署后验证

- **HTTP**：浏览器访问 http://ai.667788.cool 或 http://43.160.204.235，应能打开系统登录/前台。
- **HTTPS**：完成 `certbot --nginx -d ai.667788.cool` 后，访问 https://ai.667788.cool。
- **API**：如 `/api/auth/me` 或健康检查接口应返回正常（可通过浏览器开发者工具或 curl 查看）。

---

## 注意事项

- 敏感信息（如 SSH 密码）仅存放在 [服务器信息.txt](../服务器信息.txt)，不写入本仓库其他文档。
- 更新前建议在本地自测通过后再 push，再在服务器执行上述更新流程。
- 持久化数据目录 `server/data/` 与 `.env` 不纳入 Git，更新代码不会覆盖它们。
- 禁止在生产目录执行 `git clean -fdx`（会删除未跟踪的持久化文件）。
