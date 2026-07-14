# 全局规则自动替换脚本
# 使用方法: 复制以下内容到 PowerShell 中运行

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  全局规则自动替换脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 定义路径
$sourceDir = "E:\星寰海"
$targetDir = "c:\Users\zhang\.trae-cn\user_rules"
$backupDir = "E:\星寰海\全局规则备份_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# 检查源文件是否存在
$sourceFiles = @(
    "rule-01-session-start.md",
    "rule-02-development.md",
    "rule-02a-frontend-spec.md",
    "rule-02b-backend-security.md"
)

Write-Host "步骤 1: 检查源文件..." -ForegroundColor Yellow
foreach ($file in $sourceFiles) {
    $fullPath = Join-Path $sourceDir $file
    if (Test-Path $fullPath) {
        Write-Host "  找到: $file" -ForegroundColor Green
    } else {
        Write-Host "  缺失: $file" -ForegroundColor Red
        Write-Host "脚本终止，请确保文件存在于 $sourceDir" -ForegroundColor Red
        exit 1
    }
}

# 备份原有规则
Write-Host ""
Write-Host "步骤 2: 备份原有规则到:" -ForegroundColor Yellow
Write-Host "  $backupDir" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Get-ChildItem "$targetDir\rule-*.md" | Copy-Item -Destination $backupDir
Write-Host "  备份完成" -ForegroundColor Green

# 复制新文件
Write-Host ""
Write-Host "步骤 3: 复制优化后的规则文件..." -ForegroundColor Yellow
foreach ($file in $sourceFiles) {
    $sourcePath = Join-Path $sourceDir $file
    $targetPath = Join-Path $targetDir $file
    Copy-Item $sourcePath -Destination $targetPath -Force
    Write-Host "  已复制: $file" -ForegroundColor Green
}

# 验证结果
Write-Host ""
Write-Host "步骤 4: 验证替换结果..." -ForegroundColor Yellow
Write-Host ""
Write-Host "当前全局规则文件列表:" -ForegroundColor Cyan
Get-ChildItem "$targetDir\rule-*.md" | Select-Object Name, @{N='SizeKB';E={[math]::Round($_.Length/1KB,1)}} | Format-Table -AutoSize

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  替换完成！请重启 Trae 使新规则生效" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "备份位置: $backupDir" -ForegroundColor Cyan
