#!/bin/bash

# Script test backup từ Git Bash
# Chạy: bash scripts/test-backup.sh

echo "=== TEST BACKUP API ==="

# Đọc biến môi trường từ .env.local
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
else
    echo "⚠️  File .env.local không tồn tại!"
    echo "Tạo file .env.local từ .env.local.example và điền thông tin S3"
    exit 1
fi

# Test 1: Kiểm tra kết nối S3
echo ""
echo "1. Kiểm tra cấu hình S3..."
if [ -z "$S3_ENDPOINT" ] || [ -z "$S3_BUCKET" ]; then
    echo "❌ Thiếu S3_ENDPOINT hoặc S3_BUCKET trong .env.local"
    exit 1
fi
echo "✅ Endpoint: $S3_ENDPOINT"
echo "✅ Bucket: $S3_BUCKET"

# Test 2: Test API List Backups
echo ""
echo "2. Test API: GET /api/backup (List backups)..."
response=$(curl -s "http://localhost:3000/api/backup?limit=10")
if echo "$response" | grep -q '"ok":true'; then
    count=$(echo "$response" | grep -o '"MaBackup"' | wc -l)
    echo "✅ List backups thành công! Tìm thấy $count backup(s)"
    echo "$response" | grep -o '"MaBackup":"[^"]*"' | head -5
else
    error=$(echo "$response" | grep -o '"error":"[^"]*"' | head -1)
    echo "❌ Lỗi: $error"
    echo "   Đảm bảo server đang chạy: npm run dev"
fi

# Test 3: Test API Create Backup
echo ""
echo "3. Test API: POST /api/backup (Create backup)..."
echo "   ⚠️  Cần đăng nhập trước. Mở trình duyệt và test qua UI tại: http://localhost:3000/backup"

echo ""
echo "=== HƯỚNG DẪN TEST ==="
echo "1. Đảm bảo server đang chạy: npm run dev"
echo "2. Mở trình duyệt: http://localhost:3000/backup"
echo "3. Đăng nhập vào hệ thống"
echo "4. Nhấn nút 'Tạo Backup' và chờ kết quả"
echo "5. Kiểm tra file trên Supabase Storage: Storage → backups bucket"



