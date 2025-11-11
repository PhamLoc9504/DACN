#!/bin/bash

# Script test backup đơn giản - Chạy trong Git Bash
# Usage: bash scripts/test-backup-simple.sh

echo "🧪 TEST BACKUP - Git Bash"
echo "=========================="
echo ""

# Kiểm tra server đang chạy
echo "1. Kiểm tra server..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server đang chạy tại http://localhost:3000"
else
    echo "❌ Server không chạy. Khởi động server: npm run dev"
    exit 1
fi

# Test List Backups
echo ""
echo "2. Test List Backups..."
response=$(curl -s "http://localhost:3000/api/backup?limit=5")
if echo "$response" | grep -q '"ok":true'; then
    echo "✅ API hoạt động!"
    echo "$response" | python -m json.tool 2>/dev/null || echo "$response"
else
    echo "❌ Lỗi API:"
    echo "$response"
fi

echo ""
echo "📝 Để test đầy đủ:"
echo "   - Mở trình duyệt: http://localhost:3000/backup"
echo "   - Đăng nhập và nhấn 'Tạo Backup'"



