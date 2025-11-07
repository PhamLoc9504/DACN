# 🔄 Hướng dẫn Đồng bộ Nội dung Pháp lý từ Nguồn Chính thức

## 🎯 Mục đích

Thay vì phải **insert dữ liệu thủ công**, hệ thống sẽ **tự động lấy nội dung từ nguồn pháp luật chính thức** Việt Nam và cập nhật vào database.

---

## 📡 Nguồn Pháp luật Chính thức

### 1. Thư viện Pháp luật (thuvienphapluat.vn)
- **URL:** https://thuvienphapluat.vn
- **Mô tả:** Cơ sở dữ liệu pháp luật lớn nhất Việt Nam
- **Văn bản liên quan:**
  - Luật An ninh mạng 2018
  - Nghị định 15/2020/NĐ-CP
  - Bộ Luật Dân sự 2015

### 2. Cổng Pháp luật Quốc gia (vbpl.vn)
- **URL:** https://vbpl.vn
- **Mô tả:** Cổng thông tin điện tử chính thức của Chính phủ
- **Văn bản:** Tất cả văn bản quy phạm pháp luật

### 3. Cổng Thông tin điện tử Chính phủ
- **URL:** https://datafiles.chinhphu.vn
- **Mô tả:** Nguồn chính thức từ Chính phủ

---

## 🚀 Cách Sử dụng

### Cách 1: Đồng bộ qua API (Khuyến nghị)

```bash
# Gọi API để đồng bộ (chỉ Admin)
POST /api/legal/sync
Content-Type: application/json

{
  "type": "privacy"  // hoặc "terms", "cookie"
}
```

**Ví dụ với curl:**
```bash
curl -X POST http://localhost:3000/api/legal/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: app_session=..." \
  -d '{"type": "privacy"}'
```

### Cách 2: Chạy Script Tự động

```bash
# Cài đặt dependencies (nếu chưa có)
npm install

# Chạy script đồng bộ
npm run sync-legal

# Hoặc chạy trực tiếp với ts-node
npx ts-node scripts/sync-legal-from-official.ts
```

### Cách 3: Setup Cron Job (Tự động định kỳ)

```bash
# Thêm vào crontab (chạy mỗi ngày lúc 2h sáng)
0 2 * * * cd /path/to/khohang && npm run sync-legal
```

Hoặc sử dụng GitHub Actions, Vercel Cron, etc.

---

## 🔧 Tích hợp với API Thực tế

### Hiện tại:
Script sử dụng **tham chiếu** đến các văn bản pháp luật chính thức.

### Tương lai:
Khi có API từ nguồn chính thức, cập nhật function `fetchFromOfficialSource()`:

```typescript
// Ví dụ: Tích hợp với API của thuvienphapluat.vn
async function fetchFromOfficialSource(type: string) {
  const response = await fetch(
    `https://api.thuvienphapluat.vn/v1/legal-documents/${type}`,
    {
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
      },
    }
  );
  
  const data = await response.json();
  return {
    title: data.title,
    content: data.content,
    legalReferences: data.references,
  };
}
```

### Hoặc Scrape từ Trang Web:

```typescript
// Sử dụng Puppeteer hoặc Cheerio để scrape
import * as cheerio from 'cheerio';

async function scrapeFromOfficialSource(type: string) {
  const url = getLegalDocumentUrl(type);
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Parse HTML và extract nội dung
  const content = {
    sections: [],
    legalReferences: [],
  };
  
  // ... logic parse
  
  return content;
}
```

---

## 📋 Cấu trúc Dữ liệu

### Response từ Nguồn Chính thức:

```json
{
  "title": "Chính sách Bảo mật",
  "content": {
    "legalReferences": [
      {
        "name": "Luật An ninh mạng số 24/2018/QH14",
        "number": "24/2018/QH14",
        "url": "https://thuvienphapluat.vn/...",
        "officialUrl": "https://vbpl.vn/...",
        "articles": ["Điều 8", "Điều 16", "Điều 26"]
      }
    ],
    "sections": [
      {
        "id": "intro",
        "title": "1. Giới thiệu",
        "content": "...",
        "legalReference": "Luật An ninh mạng 2018 - Điều 8"
      }
    ]
  }
}
```

---

## ⚙️ Cấu hình

### Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# API Keys (nếu có)
THUVIENPHAPLUAT_API_KEY=...
VBPL_API_KEY=...
```

### Package.json Scripts:

```json
{
  "scripts": {
    "sync-legal": "ts-node scripts/sync-legal-from-official.ts",
    "sync-legal:privacy": "ts-node scripts/sync-legal-from-official.ts privacy",
    "sync-legal:all": "ts-node scripts/sync-legal-from-official.ts all"
  }
}
```

---

## 🔍 Kiểm tra Kết quả

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

## ⚠️ Lưu ý

1. **Quyền truy cập:**
   - API `/api/legal/sync` chỉ dành cho Admin
   - Script cần `SUPABASE_SERVICE_ROLE_KEY`

2. **Versioning:**
   - Mỗi lần đồng bộ tạo version mới
   - Version cũ được đánh dấu `is_active = false`
   - Có thể xem lịch sử các version

3. **Audit Log:**
   - Mọi lần đồng bộ đều được ghi trong audit log
   - Có thể xem trong `/nhat-ky`

4. **Nguồn dữ liệu:**
   - Hiện tại: Tham chiếu đến văn bản pháp luật
   - Tương lai: Tích hợp API thực tế hoặc scrape

---

## 🐛 Troubleshooting

### Lỗi: "Không thể lấy dữ liệu từ nguồn chính thức"
- Kiểm tra kết nối internet
- Kiểm tra API key (nếu có)
- Kiểm tra URL của nguồn pháp luật

### Lỗi: "Forbidden - Chỉ Admin mới được đồng bộ"
- Đảm bảo đã đăng nhập với tài khoản Admin
- Kiểm tra `vaiTro` trong session

### Lỗi: "Database error"
- Kiểm tra kết nối Supabase
- Kiểm tra `SUPABASE_SERVICE_ROLE_KEY`
- Kiểm tra bảng `legal_documents` đã được tạo chưa

---

## 📞 Hỗ trợ

Nếu cần tích hợp với API thực tế từ nguồn pháp luật chính thức:
1. Liên hệ với thuvienphapluat.vn hoặc vbpl.vn để xin API key
2. Hoặc sử dụng dịch vụ scraping hợp pháp
3. Hoặc tự xây dựng parser cho các trang web chính thức

---

**Cập nhật:** {new Date().toLocaleDateString('vi-VN')}

