-- Thêm cột Barcode vào bảng HangHoa
ALTER TABLE HangHoa 
ADD COLUMN IF NOT EXISTS Barcode VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS Quantity VARCHAR(50);

-- Tạo index để tối ưu tìm kiếm theo mã vạch
CREATE INDEX IF NOT EXISTS idx_hanghoa_barcode ON HangHoa(Barcode);
