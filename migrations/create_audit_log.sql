-- ============================================
-- TẠO BẢNG AUDIT_LOG
-- Nhật ký hoạt động của nhân viên
-- Tuân thủ Luật An ninh mạng 2018 (LU01)
-- ============================================

-- Tạo bảng audit_log
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    matk VARCHAR(10) REFERENCES taikhoan(matk) ON DELETE SET NULL,
    manv VARCHAR(10) REFERENCES nhanvien(manv) ON DELETE SET NULL,
    loai_hanh_dong VARCHAR(50) NOT NULL,
    bang VARCHAR(50),
    id_record VARCHAR(50),
    chi_tiet TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    thoi_gian TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    trang_thai VARCHAR(20) DEFAULT 'THANH_CONG',
    loi TEXT
);

-- Tạo các index để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_audit_log_matk ON audit_log(matk);
CREATE INDEX IF NOT EXISTS idx_audit_log_manv ON audit_log(manv);
CREATE INDEX IF NOT EXISTS idx_audit_log_loai ON audit_log(loai_hanh_dong);
CREATE INDEX IF NOT EXISTS idx_audit_log_bang ON audit_log(bang);
CREATE INDEX IF NOT EXISTS idx_audit_log_thoi_gian ON audit_log(thoi_gian DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_time ON audit_log(matk, thoi_gian DESC);

-- Thêm comment cho bảng và các cột quan trọng
COMMENT ON TABLE audit_log IS 'Nhật ký hoạt động của nhân viên - Tuân thủ Luật An ninh mạng 2018 (LU01)';
COMMENT ON COLUMN audit_log.loai_hanh_dong IS 'Loại hành động: DANG_NHAP, DANG_XUAT, TAO, SUA, XOA, XEM, XUAT_BAO_CAO, CAP_NHAT_TRANG_THAI, XUAT_CSV, XUAT_PDF';
COMMENT ON COLUMN audit_log.chi_tiet IS 'JSON hoặc mô tả chi tiết thay đổi (old_value, new_value, fields_changed)';
COMMENT ON COLUMN audit_log.ip_address IS 'Địa chỉ IP của người dùng khi thực hiện hành động';
COMMENT ON COLUMN audit_log.user_agent IS 'Thông tin trình duyệt/client của người dùng';
COMMENT ON COLUMN audit_log.trang_thai IS 'Trạng thái: THANH_CONG, THAT_BAI, LOI';

-- Thông báo hoàn thành
SELECT '✅ Bảng audit_log đã được tạo thành công!' AS status;

