# ⚡ Setup Nhanh - Đồng bộ Pháp lý từ Nguồn Chính thức

## 🎯 Vấn đề

**Trước đây:** Phải insert dữ liệu thủ công vào database ❌

**Bây giờ:** Tự động lấy từ nguồn pháp luật chính thức ✅

---

## 🚀 Cài đặt

### Bước 1: Cài đặt Dependencies

```bash
npm install --save-dev tsx
```

### Bước 2: Tạo bảng (nếu chưa có)

Chạy SQL trong Supabase Dashboard:

```sql
CREATE TABLE IF NOT EXISTS legal_documents (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) UNIQUE NOT NULL, -- 'privacy', 'terms', 'cookie', 'warranty'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- Lưu dưới dạng JSON hoặc HTML
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50), -- MaTK của người cập nhật
    is_active BOOLEAN DEFAULT true
);

-- Tạo index cho type
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_active ON legal_documents(is_active);

-- Insert dữ liệu mặc định
INSERT INTO legal_documents (type, title, content, version) VALUES
('privacy', 'Chính sách Bảo mật', '{"sections": []}', 1),
('terms', 'Điều khoản Sử dụng', '{"sections": []}', 1),
('cookie', 'Chính sách Cookie', '{"sections": []}', 1),
('warranty', 'Chính sách Bảo hành', '{"sections": []}', 1)
ON CONFLICT (type) DO NOTHING;
```

### Bước 3: Chạy Đồng bộ

```bash
# Đồng bộ tất cả
npm run sync-legal

# Hoặc qua API (chỉ Admin)
curl -X POST http://localhost:3000/api/legal/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: app_session=..." \
  -d '{"type": "privacy"}'
```

---

## 📡 Nguồn Pháp luật Chính thức

### 1. Thư viện Pháp luật (thuvienphapluat.vn)
- **URL:** https://thuvienphapluat.vn
- **Văn bản:**
  - Luật An ninh mạng 2018
  - Nghị định 15/2020/NĐ-CP
  - Bộ Luật Dân sự 2015

### 2. Cổng Pháp luật Quốc gia (vbpl.vn)
- **URL:** https://vbpl.vn
- **Mô tả:** Cổng chính thức của Chính phủ

---

## 🔧 Tích hợp API Thực tế

### Hiện tại:
Script sử dụng **tham chiếu** đến các văn bản pháp luật.

### Tương lai:
Khi có API từ nguồn chính thức, cập nhật `scripts/sync-legal-from-official.ts`:

```typescript
// Ví dụ: Gọi API từ thuvienphapluat.vn
async function fetchFromOfficialSource(type: string) {
  const response = await fetch(
    `https://api.thuvienphapluat.vn/v1/legal/${type}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.THUVIENPHAPLUAT_API_KEY}`,
      },
    }
  );
  
  return await response.json();
}
```

---

## ⚙️ Setup Cron Job (Tự động định kỳ)

### Linux/Mac:

```bash
# Thêm vào crontab (chạy mỗi ngày lúc 2h sáng)
crontab -e

# Thêm dòng:
0 2 * * * cd /path/to/khohang && npm run sync-legal
```

### Windows (Task Scheduler):

1. Mở Task Scheduler
2. Tạo task mới
3. Trigger: Daily at 2:00 AM
4. Action: Run `npm run sync-legal` in project directory

### Vercel Cron:

Thêm vào `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/legal/sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## ✅ Kiểm tra

### 1. Kiểm tra trong Database:

```sql
SELECT * FROM legal_documents 
WHERE type = 'privacy' 
ORDER BY version DESC 
LIMIT 1;
```

### 2. Kiểm tra qua API:

```bash
GET /api/legal/privacy
```

### 3. Kiểm tra trên Frontend:

Truy cập: `http://localhost:3000/chinh-sach-bao-mat`

---

## 📝 Lưu ý

1. **Quyền:** Chỉ Admin mới được gọi API sync
2. **Versioning:** Mỗi lần đồng bộ tạo version mới
3. **Audit Log:** Mọi hoạt động đều được ghi lại
4. **Nguồn:** Hiện tại dùng tham chiếu, tương lai sẽ tích hợp API thực tế

---

## 🔗 Xem thêm

- `HUONG_DAN_DONG_BO_PHAP_LY.md` - Hướng dẫn chi tiết
- `scripts/sync-legal-from-official.ts` - Script đồng bộ
- `/api/legal/sync` - API endpoint

---

**Cập nhật:** {new Date().toLocaleDateString('vi-VN')}

