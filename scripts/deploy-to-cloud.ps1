# 本地开发 → 云端快速更新上线
# 在项目根目录执行：.\scripts\deploy-to-cloud.ps1
# 作用：打包当前代码上传到服务器，在服务器上安装依赖、构建、重启 PM2（不依赖服务器端 Git）
# 前置：本机已配置免密 SSH（见 docs/deployment/cloud-update-rules.md）

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot + "\.."
$ServerUser = "ubuntu"
$ServerHost = "43.160.204.235"
$ServerDir = "/opt/awcc"
$SshKey = Join-Path $env:USERPROFILE ".ssh\awcc_deploy"

if (-not (Test-Path $SshKey)) {
  Write-Host "[deploy-to-cloud] 未找到密钥 $SshKey，请先配置免密 SSH（见 docs/deployment/cloud-update-rules.md）" -ForegroundColor Yellow
  exit 1
}

Write-Host "[deploy-to-cloud] 工作目录: $ProjectRoot" -ForegroundColor Cyan
Write-Host "[deploy-to-cloud] 目标: ${ServerUser}@${ServerHost}:${ServerDir}" -ForegroundColor Cyan

# 打包并流式上传（排除 node_modules、dist、server/data、.env、.git）
Write-Host "[deploy-to-cloud] 打包并上传到服务器（排除 node_modules、dist、server/data、.env）..." -ForegroundColor Cyan
Push-Location $ProjectRoot
try {
  $tarExclude = @("node_modules", "dist", "server/data", ".env", ".git")
  $tarArgs = @("-c", "-f", "-")
  foreach ($e in $tarExclude) { $tarArgs += "--exclude=$e" }
  $tarArgs += "."
  & tar @tarArgs 2>$null | & ssh -o ConnectTimeout=15 -i $SshKey "${ServerUser}@${ServerHost}" "cd $ServerDir && tar -x -f - && mkdir -p server/data"
  if ($LASTEXITCODE -ne 0) { throw "上传/解压失败" }
} finally {
  Pop-Location
}

Write-Host "[deploy-to-cloud] 在服务器上构建并重启..." -ForegroundColor Cyan
$remoteCmd = @"
cd $ServerDir && npm ci && npx prisma generate && npm run build && (npx prisma migrate deploy 2>/dev/null || true) && pm2 restart awcc && echo DEPLOY_OK
"@
& ssh -o ConnectTimeout=15 -i $SshKey "${ServerUser}@${ServerHost}" $remoteCmd
if ($LASTEXITCODE -ne 0) { throw "服务器构建或重启失败" }

Write-Host "[deploy-to-cloud] 完成。线上: https://ai.667788.cool" -ForegroundColor Green
