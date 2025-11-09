-- ============================================
-- THÊM BẢNG BACKUP LOG
-- Chạy file này trong Supabase SQL Editor
-- ============================================

-- Bảng Backup Log
CREATE TABLE IF NOT EXISTS BackupLog (
    MaBackup VARCHAR(20) PRIMARY KEY,
    NgayBackup TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DungLuong BIGINT, -- bytes
    TrangThai VARCHAR(50) DEFAULT 'Hoàn thành',
    DuongDan VARCHAR(500),
    MoTa TEXT,
    SoLuongBang INT DEFAULT 0,
    NguoiTao VARCHAR(10),
    DuLieuBackup TEXT, -- Lưu trữ dữ liệu backup JSON (nếu không upload được lên Storage)
    FOREIGN KEY (NguoiTao) REFERENCES TaiKhoan(MaTK) ON DELETE SET NULL
);

-- Index cho truy vấn nhanh
CREATE INDEX IF NOT EXISTS idx_backup_log_ngay ON BackupLog(NgayBackup DESC);
CREATE INDEX IF NOT EXISTS idx_backup_log_trangthai ON BackupLog(TrangThai);

-- Comment
COMMENT ON TABLE BackupLog IS 'Nhật ký backup dữ liệu - Lưu trữ 30 ngày gần nhất';
COMMENT ON COLUMN BackupLog.MaBackup IS 'Mã backup tự động: BK20250101120000';
COMMENT ON COLUMN BackupLog.DungLuong IS 'Dung lượng file backup (bytes)';
COMMENT ON COLUMN BackupLog.TrangThai IS 'Trạng thái: Hoàn thành, Đang xử lý, Lỗi';
COMMENT ON COLUMN BackupLog.DuongDan IS 'Đường dẫn file backup trong Supabase Storage';

-- Function tự động tạo mã backup
CREATE OR REPLACE FUNCTION generate_backup_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'BK' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
END;
$$ LANGUAGE plpgsql;

-- Trigger tự động tạo mã backup nếu không có
CREATE OR REPLACE FUNCTION auto_backup_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.MaBackup IS NULL OR NEW.MaBackup = '' THEN
        NEW.MaBackup := generate_backup_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_backup_id ON BackupLog;
CREATE TRIGGER trigger_auto_backup_id
BEFORE INSERT ON BackupLog
FOR EACH ROW
EXECUTE FUNCTION auto_backup_id();

SELECT '✅ Bảng BackupLog đã được tạo!' AS status;

