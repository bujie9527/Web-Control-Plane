# 部署脚本说明

## 快速更新上线（推荐：本地一键推云端）

本地开发完成后，在**本机**项目根目录执行，将当前代码打包上传到云端并自动构建、重启，无需登录服务器。

```powershell
.\scripts\deploy-to-cloud.ps1
```

- **作用**：打包源码（排除 node_modules、dist、server/data、.env）→ 上传到 `/opt/awcc` → 服务器执行 `npm ci`、`prisma generate`、`npm run build`、`pm2 restart awcc`。
- **前置**：本机已配置免密 SSH（见 [云端更新规则](../docs/deployment/cloud-update-rules.md) 中「让自动化/助手获得与服务器交互能力」），密钥默认 `~/.ssh/awcc_deploy`。
- **适用**：服务器当前**未使用 Git** 时，用此脚本即可跟随开发快速更新上线测试。

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

若服务器已配置 Git 远程，可改为在服务器上执行 `git pull` 后运行本脚本，实现「只拉取变更 + 全量构建」的更新方式。
