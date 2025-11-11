# Script push code lên GitHub
# Chạy: .\scripts\push-to-github.ps1

Write-Host "=== PUSH CODE TO GITHUB ===" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot\..

# Kiểm tra Git
try {
    git --version | Out-Null
} catch {
    Write-Host "❌ Git chưa được cài đặt. Chạy: .\scripts\setup-git.ps1" -ForegroundColor Red
    exit 1
}

# Kiểm tra đã có remote chưa
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Chưa có remote origin!" -ForegroundColor Yellow
    $repoUrl = Read-Host "Nhập URL GitHub repository (ví dụ: https://github.com/username/repo.git)"
    git remote add origin $repoUrl
    Write-Host "✅ Đã thêm remote origin!" -ForegroundColor Green
}

# Hiển thị thay đổi
Write-Host ""
Write-Host "📝 Files đã thay đổi:" -ForegroundColor Green
git status --short

# Xác nhận
Write-Host ""
$confirm = Read-Host "Bạn có muốn commit và push code? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Đã hủy!" -ForegroundColor Yellow
    exit 0
}

# Commit message
Write-Host ""
$commitMsg = Read-Host "Nhập commit message (hoặc Enter để dùng mặc định)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Update: Backup system with S3"
}

# Thêm file
Write-Host ""
Write-Host "1. Thêm files..." -ForegroundColor Green
git add .
Write-Host "✅ Đã thêm files!" -ForegroundColor Green

# Commit
Write-Host ""
Write-Host "2. Commit..." -ForegroundColor Green
git commit -m "$commitMsg"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Không có thay đổi để commit!" -ForegroundColor Yellow
    exit 0
}
Write-Host "✅ Đã commit!" -ForegroundColor Green

# Set branch main
Write-Host ""
Write-Host "3. Set branch main..." -ForegroundColor Green
git branch -M main 2>&1 | Out-Null
Write-Host "✅ Branch đã được set!" -ForegroundColor Green

# Push
Write-Host ""
Write-Host "4. Push code lên GitHub..." -ForegroundColor Green
Write-Host "   ⚠️  Nếu lần đầu, GitHub sẽ yêu cầu đăng nhập:" -ForegroundColor Yellow
Write-Host "      - Username: GitHub username của bạn" -ForegroundColor White
Write-Host "      - Password: Personal Access Token (không phải password GitHub)" -ForegroundColor White
Write-Host "      - Tạo token: https://github.com/settings/tokens" -ForegroundColor White
Write-Host ""
$confirmPush = Read-Host "Bạn đã sẵn sàng push? (y/n)"
if ($confirmPush -eq "y" -or $confirmPush -eq "Y") {
    git push -u origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Push code thành công!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Push code thất bại!" -ForegroundColor Red
        Write-Host "   Kiểm tra lại remote URL và credentials" -ForegroundColor Yellow
    }
} else {
    Write-Host "Đã hủy push!" -ForegroundColor Yellow
}


