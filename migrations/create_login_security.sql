-- ============================================
-- BẢNG BẢO MẬT ĐĂNG NHẬP (LOGIN SECURITY)
-- Lưu lịch sử đăng nhập sai theo IP + username
-- Dùng để khóa tạm thời khi đăng nhập sai nhiều lần
-- Thời gian lưu là TIMESTAMPTZ (giờ thực từ server/DB, có timezone)
-- Khi hiển thị có thể quy đổi sang giờ Việt Nam (UTC+7),
-- tương thích với time.is/vi/Vietnam
-- ============================================

CREATE TABLE IF NOT EXISTS login_security (
    id BIGSERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    username VARCHAR(255) NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    lock_until TIMESTAMPTZ,
    CONSTRAINT uq_login_security_ip_user UNIQUE (ip_address, username)
);

-- Index hỗ trợ tra cứu nhanh theo IP, username và trạng thái khóa
CREATE INDEX IF NOT EXISTS idx_login_security_ip ON login_security(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_security_username ON login_security(username);
CREATE INDEX IF NOT EXISTS idx_login_security_lock_until ON login_security(lock_until);

COMMENT ON TABLE login_security IS 'Theo dõi số lần đăng nhập sai theo IP + username để khóa tạm thời';
COMMENT ON COLUMN login_security.failed_attempts IS 'Số lần đăng nhập sai liên tiếp gần nhất';
COMMENT ON COLUMN login_security.lock_until IS 'Thời điểm IP + username này được mở khóa lại (TIMESTAMPTZ)';

SELECT '✅ Bảng login_security đã được tạo / cập nhật thành công' AS status;


