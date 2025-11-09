# Hướng dẫn Setup Database

## File SQL chính

**`complete_schema_with_shipping.sql`** - File SQL hoàn chỉnh để chạy trực tiếp trong Supabase

### Mô tả
File này bao gồm:
- Tất cả các bảng cơ bản (NhanVien, KhachHang, HangHoa, PhieuNhap, PhieuXuat, HoaDon, ...)
- Bảng audit_log và legal_documents
- Thêm cột `HinhThucGiao` và `PhuongThucTT` vào HoaDon
- Sequence `seq_vanchuyen` để tạo mã vận chuyển tự động
- Function `auto_create_shipping()` để tự động tạo đơn vận chuyển
- Trigger `trigger_auto_shipping` tự động chạy khi tạo/cập nhật hóa đơn

### Cách chạy

1. Mở **Supabase Dashboard**
2. Vào **SQL Editor**
3. Copy toàn bộ nội dung file `complete_schema_with_shipping.sql`
4. Paste vào SQL Editor
5. Click **Run**

### Kết quả

Sau khi chạy:
- ✅ Tất cả bảng đã được tạo
- ✅ Trigger tự động tạo vận chuyển khi:
  - Hóa đơn COD (Giao hàng + COD + Chưa thanh toán) → Tạo ngay
  - Hóa đơn đã thanh toán online (Giao hàng + Chuyển khoản/VNPay/MoMo/ZaloPay + Đã thanh toán) → Tạo sau khi thanh toán
- ✅ Mã vận chuyển tự động: VC01, VC02, VC03, ...
- ✅ Mã phiếu nhập/xuất tự động: PN01, PN02, ... và PX01, PX02, ... (xử lý ở API)

### Lưu ý

- File này an toàn để chạy nhiều lần (dùng `IF NOT EXISTS`, `CREATE OR REPLACE`)
- Nếu bảng đã tồn tại, sẽ không bị lỗi
- Dữ liệu cũ sẽ được cập nhật với giá trị mặc định
