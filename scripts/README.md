# 🧪 Scripts Test Backup

## 📋 Chuẩn Bị

### 1. Tạo file `.env.local`

Tạo file `.env.local` trong thư mục `khohang`:

```bash
S3_ENDPOINT=https://vvfyrmokhzekpxwqdixg.storage.supabase.co/storage/v1/s3
S3_REGION=ap-southeast-1
S3_ACCESS_KEY_ID=your_access_key_id_here
S3_SECRET_ACCESS_KEY=your_secret_access_key_here
S3_BUCKET=backups
```

### 2. Tạo Storage Bucket

- Vào Supabase Dashboard → Storage
- Tạo bucket `backups` (Private)

---

## 🚀 Cách Test

### **Cách 1: Git Bash (Linux/Mac style)**

1. **Mở Git Bash:**
   - Click chuột phải trong thư mục `khohang` → "Git Bash Here"
   - Hoặc mở Git Bash và `cd` vào thư mục

2. **Khởi động server:**
   ```bash
   npm run dev
   ```

3. **Test (terminal mới):**
   ```bash
   # Test đơn giản
   bash scripts/test-backup-simple.sh
   
   # Hoặc test đầy đủ
   bash scripts/test-backup.sh
   ```

### **Cách 2: PowerShell (Windows)**

```powershell
cd E:\Downloads\KHOHANG\khohang
npm run dev

# Terminal khác
curl http://localhost:3000/api/backup?limit=5
```

### **Cách 3: Test qua UI (Dễ nhất)**

1. **Khởi động server:**
   ```bash
   npm run dev
   ```

2. **Mở trình duyệt:**
   - `http://localhost:3000/backup`
   - Đăng nhập

3. **Nhấn "Tạo Backup"**

4. **Kiểm tra:**
   - Supabase Dashboard → Storage → `backups` bucket
   - Tìm file `backups/BKYYYYMMDDHHmmss.json`

---

## 🔍 Test Thủ Công

### Test List Backups:

```bash
# Git Bash
curl http://localhost:3000/api/backup?limit=10

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/backup?limit=10"
```

### Test Create Backup (cần đăng nhập):

```bash
# Git Bash
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"moTa":"Test backup"}'
```

---

## ✅ Checklist

- [ ] File `.env.local` đã tạo
- [ ] Bucket `backups` đã tạo
- [ ] Server đang chạy (`npm run dev`)
- [ ] Đã test tạo backup
- [ ] File backup xuất hiện trong Supabase Storage



