# Script cài Git và setup push code lên GitHub
# Chạy: .\scripts\setup-git.ps1

Write-Host "=== SETUP GIT & PUSH TO GITHUB ===" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Kiểm tra Git đã cài chưa
Write-Host "1. Kiểm tra Git..." -ForegroundColor Green
$gitInstalled = $false
try {
    $gitVersion = git --version 2>&1
    if ($gitVersion -match "git version") {
        Write-Host "✅ Git đã được cài đặt: $gitVersion" -ForegroundColor Green
        $gitInstalled = $true
    }
} catch {
    Write-Host "❌ Git chưa được cài đặt" -ForegroundColor Red
}

# Bước 2: Cài Git nếu chưa có
if (-not $gitInstalled) {
    Write-Host ""
    Write-Host "2. Cài Git..." -ForegroundColor Green
    Write-Host "   Đang cài Git bằng winget..." -ForegroundColor Yellow
    
    try {
        winget install Git.Git --accept-package-agreements --accept-source-agreements
        Write-Host "✅ Git đã được cài đặt!" -ForegroundColor Green
        Write-Host "   ⚠️  Vui lòng MỞ LẠI PowerShell để Git có hiệu lực!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Sau khi mở lại PowerShell, chạy lại script này hoặc tiếp tục với các bước sau:" -ForegroundColor Yellow
        exit 0
    } catch {
        Write-Host "❌ Không thể cài Git tự động. Vui lòng cài thủ công:" -ForegroundColor Red
        Write-Host "   1. Vào: https://git-scm.com/download/win" -ForegroundColor White
        Write-Host "   2. Tải và cài đặt Git for Windows" -ForegroundColor White
        Write-Host "   3. Mở lại PowerShell và chạy lại script này" -ForegroundColor White
        exit 1
    }
}

# Bước 3: Cấu hình Git
Write-Host ""
Write-Host "3. Cấu hình Git..." -ForegroundColor Green
$userName = Read-Host "   Nhập tên của bạn (Git username)"
$userEmail = Read-Host "   Nhập email của bạn (Git email)"

git config --global user.name "$userName"
git config --global user.email "$userEmail"

Write-Host "✅ Đã cấu hình Git!" -ForegroundColor Green

# Bước 4: Kiểm tra repo
Write-Host ""
Write-Host "4. Kiểm tra repository..." -ForegroundColor Green
Set-Location $PSScriptRoot\..
$isRepo = Test-Path .git

if (-not $isRepo) {
    Write-Host "   Khởi tạo Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Đã khởi tạo repository!" -ForegroundColor Green
} else {
    Write-Host "✅ Repository đã tồn tại!" -ForegroundColor Green
}

# Bước 5: Tạo .gitignore
Write-Host ""
Write-Host "5. Tạo file .gitignore..." -ForegroundColor Green
if (-not (Test-Path .gitignore)) {
    $gitignoreContent = @"
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/
/build

# Environment variables
.env.local
.env*.local
.env

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads
public/uploads/

# Logs
*.log
"@
    $gitignoreContent | Out-File -FilePath .gitignore -Encoding utf8
    Write-Host "✅ Đã tạo file .gitignore!" -ForegroundColor Green
} else {
    Write-Host "✅ File .gitignore đã tồn tại!" -ForegroundColor Green
}

# Bước 6: Hướng dẫn thêm remote và push
Write-Host ""
Write-Host "=== HƯỚNG DẪN PUSH CODE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Thêm remote GitHub:" -ForegroundColor Green
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor White
Write-Host ""
Write-Host "7. Push code:" -ForegroundColor Green
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'Initial commit'" -ForegroundColor White
Write-Host "   git branch -M main" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "📝 Xem chi tiết trong file: PUSH_TO_GITHUB.md" -ForegroundColor Yellow


