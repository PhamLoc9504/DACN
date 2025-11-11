# 🚀 Hướng Dẫn Push Code Lên GitHub

## 📋 Bước 1: Cài Git

### Cách 1: Cài Git bằng winget (Khuyến nghị)

```powershell
winget install Git.Git
```

Sau khi cài xong, **mở lại PowerShell** để PATH có hiệu lực.

### Cách 2: Tải Git từ website

1. Vào: https://git-scm.com/download/win
2. Tải và cài đặt Git for Windows
3. **Quan trọng:** Chọn "Git from the command line and also from 3rd-party software" khi cài
4. Mở lại PowerShell sau khi cài

### Cách 3: Cài bằng Chocolatey (nếu có)

```powershell
choco install git
```

---

## ✅ Bước 2: Kiểm Tra Git Đã Cài

```powershell
git --version
```

Nếu hiện version (ví dụ: `git version 2.xx.x`) thì đã cài thành công!

---

## 🔧 Bước 3: Cấu Hình Git (Lần đầu)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 📦 Bước 4: Khởi Tạo Repository (Nếu chưa có)

```powershell
cd E:\Downloads\KHOHANG\khohang

# Kiểm tra đã có git repo chưa
git status

# Nếu chưa có, khởi tạo
git init
```

---

## 🔗 Bước 5: Kết Nối Với GitHub

### 5.1. Tạo Repository trên GitHub

1. Vào: https://github.com/new
2. Đặt tên repo (ví dụ: `khohang`)
3. Chọn **Private** hoặc **Public**
4. **KHÔNG** tích "Initialize with README" (vì đã có code)
5. Nhấn "Create repository"

### 5.2. Thêm Remote

```powershell
cd E:\Downloads\KHOHANG\khohang

# Thêm remote (thay YOUR_USERNAME và YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Hoặc dùng SSH (nếu đã setup SSH key)
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

### 5.3. Kiểm tra remote

```powershell
git remote -v
```

---

## 📝 Bước 6: Tạo .gitignore

Tạo file `.gitignore` để không push các file không cần thiết:

```powershell
# Tạo file .gitignore
@"
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
"@ | Out-File -FilePath .gitignore -Encoding utf8
```

---

## 🚀 Bước 7: Push Code Lên GitHub

```powershell
cd E:\Downloads\KHOHANG\khohang

# 1. Thêm tất cả file
git add .

# 2. Commit
git commit -m "Initial commit: Backup system with S3"

# 3. Push lên GitHub
git branch -M main
git push -u origin main
```

**Nếu lần đầu push, GitHub sẽ yêu cầu đăng nhập:**
- Username: GitHub username
- Password: **Personal Access Token** (không phải password GitHub)
  - Tạo token: https://github.com/settings/tokens
  - Chọn "Generate new token (classic)"
  - Quyền: `repo` (full control)
  - Copy token và dùng làm password

---

## 🔄 Bước 8: Push Code Mới (Lần sau)

```powershell
cd E:\Downloads\KHOHANG\khohang

# 1. Xem thay đổi
git status

# 2. Thêm file đã sửa
git add .

# 3. Commit
git commit -m "Mô tả thay đổi"

# 4. Push
git push
```

---

## 🛠️ Xử Lý Lỗi

### Lỗi: "git is not recognized"

- **Giải pháp:** Cài Git và mở lại PowerShell
- Kiểm tra: `git --version`

### Lỗi: "Permission denied" khi push

- **Giải pháp:** Dùng Personal Access Token thay vì password
- Tạo token: https://github.com/settings/tokens

### Lỗi: "fatal: remote origin already exists"

- **Giải pháp:** Xóa remote cũ và thêm lại
  ```powershell
  git remote remove origin
  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
  ```

### Lỗi: "Updates were rejected"

- **Giải pháp:** Pull code trước khi push
  ```powershell
  git pull origin main --rebase
  git push
  ```

---

## 📌 Tóm Tắt Nhanh

```powershell
# 1. Cài Git
winget install Git.Git

# 2. Cấu hình
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 3. Khởi tạo repo
cd E:\Downloads\KHOHANG\khohang
git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 4. Push code
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

---

## 🔐 Tạo Personal Access Token (Nếu cần)

1. Vào: https://github.com/settings/tokens
2. Nhấn "Generate new token (classic)"
3. Đặt tên token (ví dụ: "KHOHANG Project")
4. Chọn quyền: `repo` (full control)
5. Nhấn "Generate token"
6. **Copy token ngay** (chỉ hiện 1 lần)
7. Dùng token này làm password khi push

---

## ✅ Checklist

- [ ] Git đã được cài đặt
- [ ] Đã cấu hình user.name và user.email
- [ ] Đã tạo repository trên GitHub
- [ ] Đã thêm remote origin
- [ ] Đã tạo file .gitignore
- [ ] Đã push code lên GitHub thành công


