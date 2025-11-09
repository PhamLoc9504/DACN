-- ============================================
-- SETUP SUPABASE STORAGE BUCKET CHO BACKUP
-- Chạy file này trong Supabase SQL Editor
-- ============================================

-- Lưu ý: Supabase Storage bucket phải được tạo từ Dashboard
-- File này chỉ để tham khảo cấu hình RLS policies

-- 1. Tạo bucket "backups" từ Supabase Dashboard:
--    - Vào Storage > Create bucket
--    - Tên: backups
--    - Public: false (hoặc true tùy nhu cầu)
--    - File size limit: 50MB (hoặc lớn hơn)
--    - Allowed MIME types: application/json

-- 2. Cấu hình RLS Policies (nếu bucket là Private):

-- Xóa policy cũ nếu có và tạo lại
DO $$
BEGIN
    -- Xóa policy cũ nếu tồn tại
    DROP POLICY IF EXISTS "Allow authenticated upload backups" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated download backups" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated delete backups" ON storage.objects;
END $$;

-- Cho phép authenticated users upload
CREATE POLICY "Allow authenticated upload backups"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'backups'
);

-- Cho phép authenticated users download
CREATE POLICY "Allow authenticated download backups"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'backups'
);

-- Cho phép authenticated users xóa (nếu cần)
CREATE POLICY "Allow authenticated delete backups"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'backups'
);

-- 3. Nếu muốn public (không khuyến khích):
--    - Đặt bucket là Public trong Dashboard
--    - Không cần RLS policies

SELECT '✅ RLS Policies đã được tạo! Vui lòng tạo bucket "backups" từ Supabase Dashboard.' AS status;
SELECT '📝 Hướng dẫn: Vào Storage > Create bucket > Tên: backups' AS note;

