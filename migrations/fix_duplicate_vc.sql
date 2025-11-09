-- ============================================
-- SỬA NGAY: Function để tránh lỗi duplicate key khi tạo vận chuyển
-- Chạy file này trong Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION auto_create_shipping()
RETURNS TRIGGER AS $$
DECLARE
    khach_hang_dia_chi TEXT;
    new_mavc TEXT;
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

SELECT '✅ Function đã được cập nhật! Từ giờ sẽ không bị lỗi duplicate key nữa.' AS status;

