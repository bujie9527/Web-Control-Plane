# Local dev -> cloud fast deploy (PowerShell-safe version)
# Usage:
#   .\scripts\deploy-to-cloud.ps1
#   .\scripts\deploy-to-cloud.ps1 -DryRun

[CmdletBinding()]
param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ServerUser = "ubuntu"
$ServerHost = "43.160.204.235"
$ServerDir = "/opt/awcc"
$SshKey = Join-Path $env:USERPROFILE ".ssh\awcc_deploy"
$SshTarget = "$ServerUser@$ServerHost"

function Assert-CommandExists([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing command: $Name"
  }
}

function Invoke-External([string]$FileName, [string[]]$ArgList) {
  if ($DryRun) {
    Write-Host "[dry-run] $FileName $($ArgList -join ' ')" -ForegroundColor Yellow
    return
  }
  & $FileName @ArgList
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $FileName $($ArgList -join ' ')"
  }
}

function Get-ChangedFiles {
  $statusLines = git status --porcelain
  $upload = New-Object System.Collections.Generic.List[string]
  $delete = New-Object System.Collections.Generic.List[string]

  foreach ($line in $statusLines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    $code = $line.Substring(0, 2)
    $pathPart = $line.Substring(3).Trim()

    # Ignore local deployment artifacts.
    if ($pathPart -like "awcc-deploy-*.tar") { continue }

    if ($code -eq "??") {
      $upload.Add($pathPart)
      continue
    }

    # Rename line format: old/path -> new/path
    if ($code.Trim().StartsWith("R") -and $pathPart.Contains(" -> ")) {
      $parts = $pathPart -split " -> ", 2
      $oldPath = $parts[0].Trim()
      $newPath = $parts[1].Trim()
      $delete.Add($oldPath)
      $upload.Add($newPath)
      continue
    }

    if ($code.Contains("D")) {
      $delete.Add($pathPart)
    } else {
      $upload.Add($pathPart)
    }
  }

  return @{
    Upload = $upload | Sort-Object -Unique
    Delete = $delete | Sort-Object -Unique
  }
}

function Match-AnyPrefix([string]$Path, [string[]]$Prefixes) {
  foreach ($prefix in $Prefixes) {
    if ($Path.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }
  return $false
}

function Get-DeployProfile([string[]]$UploadFiles, [string[]]$DeleteFiles) {
  $all = @($UploadFiles + $DeleteFiles) | Sort-Object -Unique
  if ($all.Count -eq 0) {
    return @{
      Name = "no-change"
      NeedInstallDeps = $false
      NeedPrismaGenerate = $false
      NeedBuildFrontend = $false
      NeedMigrate = $false
      NeedRestartPm2 = $false
    }
  }

  $docsPrefixes = @(
    "docs/",
    ".cursor/",
    "README",
    "CLAUDE.md"
  )

  $frontendPrefixes = @(
    "src/",
    "index.html",
    "vite.config.ts"
  )

  $serverPrefixes = @(
    "server/",
    "ecosystem.config.cjs"
  )

  $scriptPrefixes = @(
    "scripts/"
  )

  $packageChanged = $all -contains "package.json" -or $all -contains "package-lock.json"
  $schemaChanged = $all -contains "prisma/schema.prisma"
  $migrationChanged = $false
  $hasFrontend = $false
  $hasServer = $false
  $hasScript = $false
  $docsOnly = $true

  foreach ($f in $all) {
    if ($f.StartsWith("prisma/migrations/", [System.StringComparison]::OrdinalIgnoreCase)) {
      $migrationChanged = $true
    }
    if (Match-AnyPrefix $f $frontendPrefixes) { $hasFrontend = $true }
    if (Match-AnyPrefix $f $serverPrefixes) { $hasServer = $true }
    if (Match-AnyPrefix $f $scriptPrefixes) { $hasScript = $true }
    if (-not (Match-AnyPrefix $f $docsPrefixes)) {
      $docsOnly = $false
    }
  }

  $needInstallDeps = $packageChanged
  $needPrismaGenerate = $packageChanged -or $schemaChanged
  $needBuildFrontend = $hasFrontend -or $packageChanged
  $needMigrate = $migrationChanged -or $schemaChanged
  $needRestartPm2 = $hasServer -or $needInstallDeps -or $needMigrate

  if ($docsOnly) {
    return @{
      Name = "docs-only"
      NeedInstallDeps = $false
      NeedPrismaGenerate = $false
      NeedBuildFrontend = $false
      NeedMigrate = $false
      NeedRestartPm2 = $false
    }
  }

  if ($hasScript -and -not $hasFrontend -and -not $hasServer -and -not $packageChanged -and -not $schemaChanged -and -not $migrationChanged) {
    return @{
      Name = "script-only"
      NeedInstallDeps = $false
      NeedPrismaGenerate = $false
      NeedBuildFrontend = $false
      NeedMigrate = $false
      NeedRestartPm2 = $false
    }
  }

  return @{
    Name = "code-change"
    NeedInstallDeps = $needInstallDeps
    NeedPrismaGenerate = $needPrismaGenerate
    NeedBuildFrontend = $needBuildFrontend
    NeedMigrate = $needMigrate
    NeedRestartPm2 = $needRestartPm2
  }
}

function Expand-UploadFiles([string]$Root, [string[]]$Paths) {
  $expanded = New-Object System.Collections.Generic.List[string]
  foreach ($p in $Paths) {
    $full = Join-Path $Root $p
    if (Test-Path $full) {
      $item = Get-Item $full
      if ($item.PSIsContainer) {
        $children = Get-ChildItem -Path $full -File -Recurse
        foreach ($child in $children) {
          $rel = $child.FullName.Substring($Root.Length).TrimStart("\", "/").Replace("\", "/")
          $expanded.Add($rel)
        }
      } else {
        $expanded.Add($p)
      }
    } else {
      # Keep the original path if it does not exist locally.
      $expanded.Add($p)
    }
  }
  return @($expanded | Sort-Object -Unique)
}

if (-not (Test-Path $SshKey)) {
  throw "SSH key not found: $SshKey"
}

Assert-CommandExists "git"
Assert-CommandExists "ssh"
Assert-CommandExists "scp"

Write-Host "[deploy-to-cloud] project root: $ProjectRoot" -ForegroundColor Cyan
Write-Host "[deploy-to-cloud] target: ${SshTarget}:$ServerDir" -ForegroundColor Cyan
Write-Host "[deploy-to-cloud] dry-run: $DryRun" -ForegroundColor Cyan

Push-Location $ProjectRoot
try {
  $changes = Get-ChangedFiles
  $uploadFiles = Expand-UploadFiles $ProjectRoot @($changes.Upload)
  $deleteFiles = @($changes.Delete)
  $profile = Get-DeployProfile $uploadFiles $deleteFiles

  Write-Host "[deploy-to-cloud] files to upload: $($uploadFiles.Count)" -ForegroundColor Cyan
  Write-Host "[deploy-to-cloud] files to delete: $($deleteFiles.Count)" -ForegroundColor Cyan
  Write-Host "[deploy-to-cloud] profile: $($profile.Name)" -ForegroundColor Cyan

  if ($uploadFiles.Count -eq 0 -and $deleteFiles.Count -eq 0) {
    Write-Host "[deploy-to-cloud] no file changes detected, skip deploy." -ForegroundColor Yellow
    return
  }

  # Batch create parent directories to reduce SSH round trips.
  $remoteDirs = New-Object System.Collections.Generic.HashSet[string]
  foreach ($relPath in $uploadFiles) {
    $normalized = ($relPath -replace "\\", "/")
    $remoteDir = [System.IO.Path]::GetDirectoryName($normalized)
    if (-not [string]::IsNullOrWhiteSpace($remoteDir)) {
      $remoteDirs.Add($remoteDir.Replace("\", "/")) | Out-Null
    }
  }
  if ($remoteDirs.Count -gt 0) {
    $mkdirParts = @()
    foreach ($d in $remoteDirs) {
      $mkdirParts += "mkdir -p '$ServerDir/$d'"
    }
    Invoke-External "ssh" @(
      "-o", "ConnectTimeout=20",
      "-i", $SshKey,
      $SshTarget,
      ($mkdirParts -join " && ")
    )
  }

  foreach ($relPath in $uploadFiles) {
    $normalized = ($relPath -replace "\\", "/")
    $localPath = Join-Path $ProjectRoot $relPath
    if (-not (Test-Path $localPath)) {
      Write-Host "[deploy-to-cloud] skip missing local file: $relPath" -ForegroundColor Yellow
      continue
    }

    $remotePath = "$ServerDir/$normalized"
    Invoke-External "scp" @("-o", "ConnectTimeout=20", "-i", $SshKey, $localPath, "$SshTarget`:$remotePath")
    Write-Host "[deploy-to-cloud] uploaded: $relPath" -ForegroundColor Green
  }

  foreach ($relPath in $deleteFiles) {
    $normalized = ($relPath -replace "\\", "/")
    $remotePath = "$ServerDir/$normalized"
    Invoke-External "ssh" @("-o", "ConnectTimeout=20", "-i", $SshKey, $SshTarget, "rm -f '$remotePath'")
    Write-Host "[deploy-to-cloud] deleted remote: $relPath" -ForegroundColor DarkYellow
  }

  # Fast-path: docs/scripts-only updates do not need rebuild/restart.
  if ($profile.Name -eq "docs-only" -or $profile.Name -eq "script-only") {
    Write-Host "[deploy-to-cloud] skip build/restart for $($profile.Name)." -ForegroundColor Yellow
    Write-Host "[deploy-to-cloud] done. url: https://ai.667788.cool" -ForegroundColor Green
    return
  }

  $remoteSteps = @("cd '$ServerDir'")
  if ($profile.NeedInstallDeps) {
    $remoteSteps += "npm ci"
  } else {
    $remoteSteps += "echo '[deploy] skip npm ci (dependencies unchanged)'"
  }
  if ($profile.NeedPrismaGenerate) {
    $remoteSteps += "npx prisma generate"
  } else {
    $remoteSteps += "echo '[deploy] skip prisma generate (schema unchanged)'"
  }
  if ($profile.NeedBuildFrontend) {
    $remoteSteps += "npm run build"
  } else {
    $remoteSteps += "echo '[deploy] skip frontend build (src unchanged)'"
  }
  if ($profile.NeedMigrate) {
    $remoteSteps += "(npx prisma migrate deploy 2>/dev/null || true)"
  } else {
    $remoteSteps += "echo '[deploy] skip prisma migrate deploy (no migration changes)'"
  }
  if ($profile.NeedRestartPm2) {
    $remoteSteps += "pm2 restart awcc"
    $remoteSteps += "pm2 status awcc"
  } else {
    $remoteSteps += "echo '[deploy] skip pm2 restart (server/runtime unchanged)'"
  }

  Write-Host "[deploy-to-cloud] running optimized remote steps..." -ForegroundColor Cyan
  $remoteBuildCmd = ($remoteSteps -join " && ")
  Invoke-External "ssh" @(
    "-o", "ConnectTimeout=20",
    "-i", $SshKey,
    $SshTarget,
    $remoteBuildCmd
  )
}
finally {
  Pop-Location
}

Write-Host "[deploy-to-cloud] done. url: https://ai.667788.cool" -ForegroundColor Green
