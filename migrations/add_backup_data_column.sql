-- ============================================
-- THÊM CỘT DuLieuBackup VÀO BẢNG BackupLog
-- Chạy file này trong Supabase SQL Editor
-- ============================================

-- Thêm cột DuLieuBackup để lưu trữ dữ liệu backup JSON
-- (Nếu không upload được lên Storage)
ALTER TABLE BackupLog 
ADD COLUMN IF NOT EXISTS DuLieuBackup TEXT;

-- Comment
COMMENT ON COLUMN BackupLog.DuLieuBackup IS 'Lưu trữ dữ liệu backup JSON (nếu không upload được lên Storage)';

SELECT '✅ Cột DuLieuBackup đã được thêm vào bảng BackupLog!' AS status;
SELECT '📝 Từ giờ backup sẽ lưu dữ liệu vào database nếu không upload được lên Storage.' AS note;

