-- ============================================
-- SCHEMA HOÀN CHỈNH - Chạy trực tiếp trong Supabase SQL Editor
-- Bao gồm: Tất cả bảng + Trigger tự động tạo vận chuyển
-- ============================================

-- ============================================
-- PHẦN 1: TẠO CÁC BẢNG CƠ BẢN
-- ============================================

-- Bảng Nhân viên
CREATE TABLE IF NOT EXISTS NhanVien (
    MaNV VARCHAR(10) PRIMARY KEY,
    HoTen VARCHAR(100),
    NgaySinh DATE,
    ChucVu VARCHAR(50),
    DienThoai VARCHAR(20)
);

-- Bảng Khách hàng
CREATE TABLE IF NOT EXISTS KhachHang (
    MaKH VARCHAR(10) PRIMARY KEY,
    TenKH VARCHAR(100),
    SDT VARCHAR(20),
    DiaChi VARCHAR(255)
);

-- Bảng Nhà cung cấp
CREATE TABLE IF NOT EXISTS NhaCC (
    MaNCC VARCHAR(10) PRIMARY KEY,
    TenNCC VARCHAR(100),
    DiaChi VARCHAR(255),
    SDT VARCHAR(20)
);

-- Bảng Loại hàng
CREATE TABLE IF NOT EXISTS LoaiHang (
    MaLoai VARCHAR(10) PRIMARY KEY,
    TenLoai VARCHAR(100)
);

-- Bảng Hàng hóa
CREATE TABLE IF NOT EXISTS HangHoa (
    MaHH VARCHAR(10) PRIMARY KEY,
    TenHH VARCHAR(100),
    MaLoai VARCHAR(10),
    DonGia FLOAT,
    SoLuongTon INT,
    DVT VARCHAR(10) NOT NULL,
    MaNCC VARCHAR(10),
    FOREIGN KEY (MaLoai) REFERENCES LoaiHang(MaLoai),
    FOREIGN KEY (MaNCC) REFERENCES NhaCC(MaNCC)
);

-- Bảng Phiếu nhập
CREATE TABLE IF NOT EXISTS PhieuNhap (
    SoPN VARCHAR(10) PRIMARY KEY,
    NgayNhap DATE,
    MaNV VARCHAR(10),
    MaNCC VARCHAR(10),
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV),
    FOREIGN KEY (MaNCC) REFERENCES NhaCC(MaNCC)
);

-- Bảng Chi tiết phiếu nhập
CREATE TABLE IF NOT EXISTS CTPHieuNhap (
    SoPN VARCHAR(10),
    MaHH VARCHAR(10),
    SLNhap INT,
    DGNhap FLOAT,
    TongTien DECIMAL(18, 2) NOT NULL CHECK (TongTien >= 0),
    PRIMARY KEY (SoPN, MaHH),
    FOREIGN KEY (SoPN) REFERENCES PhieuNhap(SoPN) ON DELETE CASCADE,
    FOREIGN KEY (MaHH) REFERENCES HangHoa(MaHH),
    CONSTRAINT CHK_CTPHIEUNHAP_THANHTIEN CHECK (TongTien = SLNhap * DGNhap)
);

-- Bảng Phiếu xuất
CREATE TABLE IF NOT EXISTS PhieuXuat (
    SoPX VARCHAR(10) PRIMARY KEY,
    NgayXuat DATE,
    MaNV VARCHAR(10),
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
);

-- Bảng Chi tiết phiếu xuất
CREATE TABLE IF NOT EXISTS CTPHieuXuat (
    SoPX VARCHAR(10),
    MaHH VARCHAR(10),
    SLXuat INT,
    DonGia FLOAT,
    TongTien DECIMAL(18, 2) NOT NULL CHECK (TongTien >= 0),
    PRIMARY KEY (SoPX, MaHH),
    FOREIGN KEY (SoPX) REFERENCES PhieuXuat(SoPX) ON DELETE CASCADE,
    FOREIGN KEY (MaHH) REFERENCES HangHoa(MaHH)
);

-- Bảng Hóa đơn
CREATE TABLE IF NOT EXISTS HoaDon (
    MaHD VARCHAR(10) PRIMARY KEY,
    NgayLap DATE,
    MaKH VARCHAR(10),
    TongTien FLOAT,
    TrangThai VARCHAR(50) NOT NULL DEFAULT 'Chưa thanh toán',
    SoPX VARCHAR(10),
    SoPN VARCHAR(10),
    MaNV VARCHAR(10),
    HinhThucGiao VARCHAR(50) DEFAULT 'Giao hàng',
    PhuongThucTT VARCHAR(50) DEFAULT 'Tiền mặt',
    FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    FOREIGN KEY (SoPX) REFERENCES PhieuXuat(SoPX),
    FOREIGN KEY (SoPN) REFERENCES PhieuNhap(SoPN),
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
);

-- Bảng Chi tiết hóa đơn
CREATE TABLE IF NOT EXISTS CT_HoaDon (
    MaHD VARCHAR(10),
    MaHH VARCHAR(10),
    SoLuong INT,
    DonGia FLOAT,
    TongTien DECIMAL(18, 2) NOT NULL CHECK (TongTien >= 0),
    PRIMARY KEY (MaHD, MaHH),
    FOREIGN KEY (MaHD) REFERENCES HoaDon(MaHD) ON DELETE CASCADE,
    FOREIGN KEY (MaHH) REFERENCES HangHoa(MaHH)
);

-- Bảng Đơn vị vận chuyển
CREATE TABLE IF NOT EXISTS Dovi_VanChuyen (
    MaVC VARCHAR(10) PRIMARY KEY,
    MaHD VARCHAR(10),
    NgayGiao DATE,
    DiaChiNhan VARCHAR(255),
    TrangThai VARCHAR(255) NOT NULL DEFAULT 'Chưa vận chuyển',
    FOREIGN KEY (MaHD) REFERENCES HoaDon(MaHD) ON DELETE CASCADE
);

-- Bảng Tài khoản
CREATE TABLE IF NOT EXISTS TaiKhoan (
    MaTK VARCHAR(10) PRIMARY KEY,
    TenDangNhap VARCHAR(50) UNIQUE NOT NULL,
    MatKhau VARCHAR(255) NOT NULL,
    MaNV VARCHAR(10) UNIQUE,
    VaiTro VARCHAR(50) NOT NULL DEFAULT 'Nhân viên',
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'Hoạt động',
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LanDangNhapCuoi TIMESTAMP,
    FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV) ON DELETE CASCADE,
    CONSTRAINT CHK_VAITRO CHECK (VaiTro IN ('Admin', 'Quản lý', 'Nhân viên kho', 'Nhân viên bán hàng', 'Kế toán')),
    CONSTRAINT CHK_TRANGTHAI CHECK (TrangThai IN ('Hoạt động', 'Khóa', 'Tạm ngưng'))
);

-- Bảng Hình ảnh hàng hóa
CREATE TABLE IF NOT EXISTS HinhAnh_HangHoa (
    MaHinh VARCHAR(10) PRIMARY KEY,
    MaHH VARCHAR(10),
    DuongDan VARCHAR(255) NOT NULL,
    MoTa VARCHAR(255),
    HinhChinh BOOLEAN DEFAULT FALSE,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaHH) REFERENCES HangHoa(MaHH) ON DELETE CASCADE
);

-- Bảng Audit Log
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

-- Index cho audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_matk ON audit_log(matk);
CREATE INDEX IF NOT EXISTS idx_audit_log_manv ON audit_log(manv);
CREATE INDEX IF NOT EXISTS idx_audit_log_loai ON audit_log(loai_hanh_dong);
CREATE INDEX IF NOT EXISTS idx_audit_log_bang ON audit_log(bang);
CREATE INDEX IF NOT EXISTS idx_audit_log_thoi_gian ON audit_log(thoi_gian DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_time ON audit_log(matk, thoi_gian DESC);

-- Comment cho audit_log
COMMENT ON TABLE audit_log IS 'Nhật ký hoạt động của nhân viên - Tuân thủ Luật An ninh mạng 2018';
COMMENT ON COLUMN audit_log.loai_hanh_dong IS 'Loại hành động: DANG_NHAP, DANG_XUAT, TAO, SUA, XOA, XEM, XUAT_BAO_CAO';
COMMENT ON COLUMN audit_log.chi_tiet IS 'JSON hoặc mô tả chi tiết thay đổi (old_value, new_value, fields_changed)';

-- Bảng Legal Documents
CREATE TABLE IF NOT EXISTS legal_documents (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_active ON legal_documents(is_active);

COMMENT ON COLUMN legal_documents.type IS 'Loại tài liệu: privacy, terms, cookie, warranty';

-- Insert dữ liệu mặc định cho legal_documents
INSERT INTO legal_documents (type, title, content, version) VALUES
('privacy', 'Chính sách Bảo mật', '{"sections": []}', 1),
('terms', 'Điều khoản Sử dụng', '{"sections": []}', 1),
('cookie', 'Chính sách Cookie', '{"sections": []}', 1),
('warranty', 'Chính sách Bảo hành', '{"sections": []}', 1)
ON CONFLICT (type) DO NOTHING;

-- ============================================
-- PHẦN 2: THÊM CÁC CỘT MỚI VÀO HoaDon
-- ============================================

-- Thêm cột vào HoaDon (nếu chưa có)
ALTER TABLE HoaDon 
ADD COLUMN IF NOT EXISTS HinhThucGiao VARCHAR(50) DEFAULT 'Giao hàng';

ALTER TABLE HoaDon 
ADD COLUMN IF NOT EXISTS PhuongThucTT VARCHAR(50) DEFAULT 'Tiền mặt';

-- Xóa constraint cũ nếu có và tạo lại
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CHK_HINHTHUCGIAO') THEN
        ALTER TABLE HoaDon DROP CONSTRAINT CHK_HINHTHUCGIAO;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CHK_PHUONGTHUCTT') THEN
        ALTER TABLE HoaDon DROP CONSTRAINT CHK_PHUONGTHUCTT;
    END IF;
END $$;

-- Tạo constraint mới
ALTER TABLE HoaDon 
ADD CONSTRAINT CHK_HINHTHUCGIAO 
CHECK (HinhThucGiao IN ('Giao hàng', 'Tại quầy'));

ALTER TABLE HoaDon 
ADD CONSTRAINT CHK_PHUONGTHUCTT 
CHECK (PhuongThucTT IN ('Tiền mặt', 'Chuyển khoản', 'VNPay', 'MoMo', 'ZaloPay', 'COD'));

-- ============================================
-- PHẦN 3: TẠO SEQUENCE CHO VẬN CHUYỂN
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'seq_vanchuyen') THEN
        CREATE SEQUENCE seq_vanchuyen START 1;
        RAISE NOTICE '✅ Sequence seq_vanchuyen đã được tạo';
    ELSE
        RAISE NOTICE 'ℹ️ Sequence seq_vanchuyen đã tồn tại';
    END IF;
END $$;

-- ============================================
-- PHẦN 4: TẠO FUNCTION TỰ ĐỘNG TẠO VẬN CHUYỂN
-- ============================================

CREATE OR REPLACE FUNCTION auto_create_shipping()
RETURNS TRIGGER AS $$
DECLARE
    khach_hang_dia_chi TEXT;
    new_mavc TEXT;
    seq_val BIGINT;
    max_num BIGINT;
    retry_count INT := 0;
    max_retries INT := 10;
BEGIN
    -- Kiểm tra điều kiện tạo vận chuyển
    IF NEW.HinhThucGiao = 'Giao hàng' AND (
        -- Trường hợp 1: COD
        (NEW.PhuongThucTT = 'COD' AND NEW.TrangThai = 'Chưa thanh toán')
        OR
        -- Trường hợp 2: Đã thanh toán online
        (NEW.PhuongThucTT IN ('Chuyển khoản', 'VNPay', 'MoMo', 'ZaloPay') AND NEW.TrangThai = 'Đã thanh toán')
    ) THEN
        -- Kiểm tra xem đã có vận chuyển chưa (tránh tạo trùng)
        IF NOT EXISTS (SELECT 1 FROM Dovi_VanChuyen WHERE MaHD = NEW.MaHD) THEN
            -- Lấy địa chỉ khách hàng
            IF NEW.MaKH IS NOT NULL THEN
                SELECT COALESCE(DiaChi, 'Chưa có địa chỉ') INTO khach_hang_dia_chi
                FROM KhachHang 
                WHERE MaKH = NEW.MaKH
                LIMIT 1;
            ELSE
                khach_hang_dia_chi := 'Chưa có địa chỉ';
            END IF;
            
            -- Tạo mã VC duy nhất (tránh trùng)
            LOOP
                -- Lấy mã VC lớn nhất hiện có (format VC01, VC02, ...)
                SELECT COALESCE(MAX(CAST(SUBSTRING(MaVC FROM 3) AS BIGINT)), 0) INTO max_num
                FROM Dovi_VanChuyen
                WHERE MaVC ~ '^VC[0-9]+$';
                
                -- Tăng lên 1
                max_num := max_num + 1;
                
                -- Tạo mã vận chuyển tự động (format: VC01, VC02, ...) - 2 chữ số
                new_mavc := 'VC' || LPAD(max_num::TEXT, 2, '0');
                
                -- Kiểm tra mã đã tồn tại chưa
                EXIT WHEN NOT EXISTS (SELECT 1 FROM Dovi_VanChuyen WHERE MaVC = new_mavc);
                
                -- Nếu trùng, tăng retry và thử lại
                retry_count := retry_count + 1;
                IF retry_count > max_retries THEN
                    -- Nếu quá nhiều lần thử, dùng timestamp
                    new_mavc := 'VC' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 2, '0');
                    EXIT;
                END IF;
            END LOOP;
            
            -- Cập nhật sequence để đồng bộ (nếu sequence đã được dùng)
            BEGIN
                PERFORM setval('seq_vanchuyen', GREATEST(max_num, COALESCE(currval('seq_vanchuyen'), 0)));
            EXCEPTION WHEN OTHERS THEN
                -- Nếu sequence chưa được dùng, setval trực tiếp
                PERFORM setval('seq_vanchuyen', max_num, false);
            END;
            
            -- Tạo đơn vận chuyển
            INSERT INTO Dovi_VanChuyen (
                MaVC,
                MaHD,
                NgayGiao,
                DiaChiNhan,
                TrangThai
            )
            VALUES (
                new_mavc,
                NEW.MaHD,
                CURRENT_DATE + INTERVAL '1 day', -- Giao sau 1 ngày
                COALESCE(khach_hang_dia_chi, 'Chưa có địa chỉ'),
                'Chờ lấy hàng'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PHẦN 5: TẠO TRIGGER
-- ============================================

-- Xóa trigger cũ nếu có
DROP TRIGGER IF EXISTS trigger_auto_shipping ON HoaDon;

-- Tạo trigger mới
CREATE TRIGGER trigger_auto_shipping
AFTER INSERT OR UPDATE OF TrangThai, PhuongThucTT, HinhThucGiao ON HoaDon
FOR EACH ROW
EXECUTE FUNCTION auto_create_shipping();

-- ============================================
-- PHẦN 6: CẬP NHẬT DỮ LIỆU CŨ
-- ============================================

-- Cập nhật dữ liệu cũ (nếu cần)
UPDATE HoaDon 
SET HinhThucGiao = 'Giao hàng', PhuongThucTT = 'Tiền mặt'
WHERE HinhThucGiao IS NULL OR PhuongThucTT IS NULL;

-- ============================================
-- PHẦN 7: KIỂM TRA KẾT QUẢ
-- ============================================

SELECT '✅ Hoàn thành! Tất cả bảng, constraints, function và trigger đã được tạo.' AS status;

-- Kiểm tra sequence
SELECT 
    sequencename,
    start_value,
    increment_by,
    last_value
FROM pg_sequences 
WHERE sequencename = 'seq_vanchuyen';

-- Kiểm tra trigger
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_shipping';

-- Kiểm tra function
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'auto_create_shipping';

-- Kiểm tra columns mới
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'hoadon' 
AND column_name IN ('hinhthucgiao', 'phuongthuctt');

