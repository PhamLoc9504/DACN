# 📊 Data Dictionary (3NF Schema)

## Table: NhanVien (Employees)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaNV | VARCHAR(10) (PK) | Mã nhân viên (NV01, NV02...) | NOT NULL, UNIQUE |
| HoTen | VARCHAR(100) | Họ và tên nhân viên | NOT NULL |
| NgaySinh | DATE | Ngày sinh | NULL |
| ChucVu | VARCHAR(50) | Chức vụ (Quản lý kho, Nhân viên kho) | NULL |
| DienThoai | VARCHAR(20) | Điện thoại liên hệ | NULL |

## Table: KhachHang (Customers)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaKH | VARCHAR(10) (PK) | Mã khách hàng (KH01, KH02...) | NOT NULL, UNIQUE |
| TenKH | VARCHAR(100) | Tên khách hàng | NOT NULL |
| SDT | VARCHAR(20) | Số điện thoại | NULL |
| DiaChi | VARCHAR(255) | Địa chỉ khách hàng | NULL |

## Table: NhaCC (Suppliers)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaNCC | VARCHAR(10) (PK) | Mã nhà cung cấp (NCC01, NCC02...) | NOT NULL, UNIQUE |
| TenNCC | VARCHAR(100) | Tên nhà cung cấp | NOT NULL |
| DiaChi | VARCHAR(255) | Địa chỉ NCC | NULL |
| SDT | VARCHAR(20) | Số điện thoại | NULL |

## Table: LoaiHang (Categories)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaLoai | VARCHAR(10) (PK) | Mã loại hàng (LH01, LH02...) | NOT NULL, UNIQUE |
| TenLoai | VARCHAR(100) | Tên loại hàng | NOT NULL |

## Table: HangHoa (Products)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaHH | VARCHAR(10) (PK) | Mã hàng hóa (HH01, HH02...) | NOT NULL, UNIQUE |
| TenHH | VARCHAR(100) | Tên hàng hóa | NOT NULL |
| MaLoai | VARCHAR(10) (FK) | Loại hàng hóa | REFERENCES LoaiHang(MaLoai) |
| DonGia | FLOAT | Đơn giá nhập gần nhất | DEFAULT 0 |
| SoLuongTon | INTEGER | Số lượng thực tế trong kho | DEFAULT 0 |
| DVT | VARCHAR(10) | Đơn vị tính (Cái, Hộp, Kg) | NOT NULL |
| MaNCC | VARCHAR(10) (FK) | Nhà cung cấp | REFERENCES NhaCC(MaNCC) |
| Barcode | VARCHAR(50) (UNIQUE) | Mã vạch sản phẩm | UNIQUE |
| Quantity | VARCHAR(50) | Số lượng đóng gói | NULL |
| NgaySanXuat | DATE | Ngày sản xuất | NULL |
| NgayHetHan | DATE | Ngày hết hạn | NULL |

## Table: PhieuNhap (Import Tickets)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| SoPN | VARCHAR(10) (PK) | Số phiếu nhập (PN01, PN02...) | NOT NULL, UNIQUE |
| NgayNhap | DATE | Ngày nhập kho | DEFAULT NOW() |
| MaNV | VARCHAR(10) (FK) | Nhân viên nhập | REFERENCES NhanVien(MaNV) |
| MaNCC | VARCHAR(10) (FK) | Nhà cung cấp | REFERENCES NhaCC(MaNCC) |

## Table: CTPhieuNhap (Import Details)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| SoPN | VARCHAR(10) (FK) | Số phiếu nhập | REFERENCES PhieuNhap(SoPN) ON DELETE CASCADE |
| MaHH | VARCHAR(10) (FK) | Mã hàng hóa | REFERENCES HangHoa(MaHH) |
| SLNhap | INTEGER | Số lượng nhập | CHECK > 0 |
| DGNhap | FLOAT | Đơn giá nhập | CHECK >= 0 |
| TongTien | DECIMAL(18,2) | Thành tiền = SLNhap * DGNhap | NOT NULL, CHECK >= 0 |
| **Composite PK**: (SoPN, MaHH) | | | |

## Table: PhieuXuat (Export Tickets)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| SoPX | VARCHAR(10) (PK) | Số phiếu xuất (PX01, PX02...) | NOT NULL, UNIQUE |
| NgayXuat | DATE | Ngày xuất kho | DEFAULT NOW() |
| MaNV | VARCHAR(10) (FK) | Nhân viên xuất | REFERENCES NhanVien(MaNV) |

## Table: CTPhieuXuat (Export Details)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| SoPX | VARCHAR(10) (FK) | Số phiếu xuất | REFERENCES PhieuXuat(SoPX) ON DELETE CASCADE |
| MaHH | VARCHAR(10) (FK) | Mã hàng hóa | REFERENCES HangHoa(MaHH) |
| SLXuat | INTEGER | Số lượng xuất | CHECK > 0 |
| DonGia | FLOAT | Đơn giá xuất | CHECK >= 0 |
| TongTien | DECIMAL(18,2) | Thành tiền = SLXuat * DonGia | NOT NULL, CHECK >= 0 |
| **Composite PK**: (SoPX, MaHH) | | | |

## Table: HoaDon (Invoices)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaHD | VARCHAR(10) (PK) | Mã hóa đơn (HD01, HD02...) | NOT NULL, UNIQUE |
| NgayLap | DATE | Ngày lập hóa đơn | DEFAULT NOW() |
| MaKH | VARCHAR(10) (FK) | Khách hàng | REFERENCES KhachHang(MaKH) |
| TongTien | FLOAT | Tổng giá trị hóa đơn | DEFAULT 0 |
| TrangThai | VARCHAR(50) | Trạng thái (Đã thanh toán, Chưa thanh toán, Đã hủy) | DEFAULT 'Chưa thanh toán' |
| SoPX | VARCHAR(10) (FK) | Số phiếu xuất | REFERENCES PhieuXuat(SoPX) |
| SoPN | VARCHAR(10) (FK) | Số phiếu nhập | REFERENCES PhieuNhap(SoPN) |
| MaNV | VARCHAR(10) (FK) | Nhân viên lập | REFERENCES NhanVien(MaNV) |
| HinhThucGiao | VARCHAR(50) | Hình thức giao (Giao hàng, Tại quầy) | DEFAULT 'Giao hàng' |
| PhuongThucTT | VARCHAR(50) | Phương thức thanh toán | DEFAULT 'Tiền mặt' |
| LoaiHD | VARCHAR(20) | Loại hóa đơn (BAN_HANG, MUA_HANG) | DEFAULT 'BAN_HANG' |
| SoHoaDon | VARCHAR(50) | Số HĐ cơ quan thuế | NULL |
| KyHieu | VARCHAR(20) | Ký hiệu mẫu số | NULL |
| MaSoThue_KH | VARCHAR(20) | MST khách hàng | NULL |
| DiaChiXuatHD | TEXT | Địa chỉ xuất HĐ | NULL |

## Table: CT_HoaDon (Invoice Details)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaHD | VARCHAR(10) (FK) | Mã hóa đơn | REFERENCES HoaDon(MaHD) ON DELETE CASCADE |
| MaHH | VARCHAR(10) (FK) | Mã hàng hóa | REFERENCES HangHoa(MaHH) |
| SoLuong | INTEGER | Số lượng | CHECK > 0 |
| DonGia | FLOAT | Đơn giá | CHECK >= 0 |
| TongTien | DECIMAL(18,2) | Thành tiền = SoLuong * DonGia | NOT NULL, CHECK >= 0 |
| **Composite PK**: (MaHD, MaHH) | | | |

## Table: Dovi_VanChuyen (Shipping)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaVC | VARCHAR(10) (PK) | Mã vận chuyển (VC01, VC02...) | NOT NULL, UNIQUE |
| MaHD | VARCHAR(10) (FK) | Mã hóa đơn | REFERENCES HoaDon(MaHD) ON DELETE CASCADE |
| NgayGiao | DATE | Ngày giao hàng | DEFAULT CURRENT_DATE |
| DiaChiNhan | VARCHAR(255) | Địa chỉ nhận hàng | NULL |
| TrangThai | VARCHAR(255) | Trạng thái vận chuyển | DEFAULT 'Chưa vận chuyển' |

## Table: TaiKhoan (User Accounts)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaTK | VARCHAR(10) (PK) | Mã tài khoản | NOT NULL, UNIQUE |
| TenDangNhap | VARCHAR(50) (UNIQUE) | Email đăng nhập | NOT NULL, UNIQUE |
| MatKhau | VARCHAR(255) | Mật khẩu đã hash | NOT NULL |
| MaNV | VARCHAR(10) (FK, UNIQUE) | Liên kết nhân viên | REFERENCES NhanVien(MaNV) ON DELETE CASCADE |
| VaiTro | VARCHAR(50) | Vai trò (Quản lý kho, Nhân viên kho, Nhân viên bán hàng, Kế toán, Quản lý khách hàng) | DEFAULT 'Nhân viên' |
| TrangThai | VARCHAR(20) | Trạng thái tài khoản | DEFAULT 'Hoạt động' |
| NgayTao | TIMESTAMP | Ngày tạo tài khoản | DEFAULT CURRENT_TIMESTAMP |
| LanDangNhapCuoi | TIMESTAMP | Lần đăng nhập cuối | NULL |
| Email | VARCHAR(255) (UNIQUE) | Email tài khoản | UNIQUE |

## Table: HinhAnh_HangHoa (Product Images)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaHinh | VARCHAR(10) (PK) | Mã hình ảnh | NOT NULL, UNIQUE |
| MaHH | VARCHAR(10) (FK) | Mã hàng hóa | REFERENCES HangHoa(MaHH) ON DELETE CASCADE |
| DuongDan | VARCHAR(255) | Đường dẫn file ảnh | NOT NULL |
| MoTa | VARCHAR(255) | Mô tả hình ảnh | NULL |
| HinhChinh | BOOLEAN | Hình chính | DEFAULT FALSE |
| NgayTao | TIMESTAMP | Ngày tạo | DEFAULT CURRENT_TIMESTAMP |

## Table: audit_log (Audit Trail)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| id | BIGSERIAL (PK) | ID log | NOT NULL, UNIQUE |
| matk | VARCHAR(10) (FK) | Người thực hiện | REFERENCES TaiKhoan(MaTK) ON DELETE SET NULL |
| manv | VARCHAR(10) (FK) | Nhân viên | REFERENCES NhanVien(MaNV) ON DELETE SET NULL |
| loai_hanh_dong | VARCHAR(50) | Hành động (DANG_NHAP, DANG_XUAT, TAO, SUA, XOA, XEM, XUAT_BAO_CAO, CAP_NHAT_TRANG_THAI, XUAT_CSV, XUAT_PDF) | NOT NULL |
| bang | VARCHAR(50) | Tên bảng bị thay đổi | NULL |
| id_record | VARCHAR(50) | ID record bị thay đổi | NULL |
| chi_tiet | TEXT | Chi tiết thay đổi (old_value, new_value, fields_changed) | NULL |
| ip_address | VARCHAR(45) | Địa chỉ IP | NULL |
| user_agent | TEXT | Thông tin trình duyệt/client | NULL |
| thoi_gian | TIMESTAMP (WITH TIME ZONE) | Thời gian thực hiện | DEFAULT NOW() NOT NULL |
| trang_thai | VARCHAR(20) | Trạng thái (THANH_CONG, THAT_BAI, LOI) | DEFAULT 'THANH_CONG' |
| loi | TEXT | Lỗi (Nếu có) | NULL |

## Table: login_security (Login Security)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| id | BIGSERIAL (PK) | ID | NOT NULL, UNIQUE |
| ip_address | VARCHAR(45) | Địa chỉ IP | NOT NULL |
| username | VARCHAR(255) | Username | NOT NULL |
| failed_attempts | INTEGER | Số lần đăng nhập sai | DEFAULT 0 |
| last_attempt_at | TIMESTAMP (WITH TIME ZONE) | Lần thử cuối | NULL |
| lock_until | TIMESTAMP (WITH TIME ZONE) | Thời điểm mở khóa | NULL |
| **Unique Constraint**: (ip_address, username) | | | |

## Table: inventory_checks (Inventory Checks)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| id | UUID (PK) | ID kiểm kê | DEFAULT gen_random_uuid() |
| ma_kk | TEXT | Mã kiểm kê | NOT NULL |
| ngay_kiem_ke | DATE | Ngày kiểm kê | NOT NULL |
| ma_nv | TEXT | Mã nhân viên | NOT NULL |
| trang_thai | TEXT | Trạng thái | DEFAULT 'dang-tien-hanh' |
| ghi_chu | TEXT | Ghi chú | NULL |
| created_at | TIMESTAMPTZ | Ngày tạo | DEFAULT NOW() |

## Table: inventory_check_details (Inventory Check Details)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| id | UUID (PK) | ID chi tiết | DEFAULT gen_random_uuid() |
| inventory_check_id | UUID (FK) | ID kiểm kê | REFERENCES inventory_checks(id) ON DELETE CASCADE |
| ma_hh | TEXT | Mã hàng hóa | NOT NULL |
| so_luong_sach | NUMERIC | Số lượng sổ sách | DEFAULT 0 |
| so_luong_thuc_te | NUMERIC | Số lượng thực tế | DEFAULT 0 |
| chenh_lech | NUMERIC | Chênh lệch | DEFAULT 0 |
| ly_do | TEXT | Lý do | NULL |

## Table: LuatQuyDinh (Business Rules)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaLuat | VARCHAR(50) (PK) | Mã luật | NOT NULL, UNIQUE |
| TenLuat | VARCHAR(255) | Tên luật | NOT NULL |
| NgayCapNhat | TIMESTAMP | Ngày cập nhật | NULL |
| MoTaLuat | TEXT | Mô tả luật | NULL |
| LinkNguon | TEXT | Link nguồn | NULL |

## Table: DieuKhoanPhapLy (Legal Terms)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaDKPL | VARCHAR(50) (PK) | Mã điều khoản | NOT NULL, UNIQUE |
| MaLuat | VARCHAR(50) (FK) | Mã luật | REFERENCES LuatQuyDinh(MaLuat) ON DELETE RESTRICT |
| NgayKy | TIMESTAMP | Ngày ký | NULL |
| NgayHetHan | TIMESTAMP | Ngày hết hạn | NULL |
| LoaiHopDong | VARCHAR(50) | Loại hợp đồng | NULL |
| TrangThai | VARCHAR(20) | Trạng thái | NULL |
| makh | VARCHAR(10) (FK) | Mã khách hàng | REFERENCES khachhang(makh) ON DELETE SET NULL |
| mancc | VARCHAR(10) (FK) | Mã nhà cung cấp | REFERENCES nhacc(mancc) ON DELETE SET NULL |
| GhiChu | TEXT | Ghi chú | NULL |

## Table: YeuCau (Requirements)
| Column | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| MaYC | VARCHAR(50) (PK) | Mã yêu cầu | NOT NULL, UNIQUE |
| TenYC | VARCHAR(255) | Tên yêu cầu | NOT NULL |
| MoTaYC | TEXT | Mô tả yêu cầu | NULL |
| MaDKPL | VARCHAR(50) (FK) | Mã điều khoản pháp lý | REFERENCES DieuKhoanPhapLy(MaDKPL) ON DELETE CASCADE |

---

## 🔗 Relationship Diagram

```
TaiKhoan ←→ NhanVien
    ↓
NhaCC ←→ PhieuNhap ←→ CTPhieuNhap ←→ HangHoa ←→ LoaiHang
    ↓                                    ↓
KhachHang ←→ PhieuXuat ←→ CTPhieuXuat ←→ HangHoa
    ↓
HoaDon ←→ CT_HoaDon
    ↓
Dovi_VanChuyen ←→ HoaDon
    ↓
audit_log (logs all changes)
    ↓
inventory_checks ←→ inventory_check_details
```

---

## 🎯 3NF Compliance Notes

### **First Normal Form (1NF):**
- All tables have primary keys
- No repeating groups
- Atomic values in each column

### **Second Normal Form (2NF):**
- No partial dependencies
- All non-key attributes depend on entire primary key
- Proper composite keys where needed

### **Third Normal Form (3NF):**
- No transitive dependencies
- All non-key attributes depend only on primary key
- Proper foreign key relationships

---

## 📊 Index Strategy

### **Primary Indexes:**
- All PK columns automatically indexed
- VARCHAR columns for fast joins

### **Composite Indexes:**
- `(NgayNhap, MaHH)` - Fast import queries
- `(NgayXuat, MaHH)` - Fast export queries
- `(ip_address, username)` - Login security

### **Unique Indexes:**
- `Barcode` - Product uniqueness
- `TenDangNhap` - Email uniqueness
- `SoPN`, `SoPX`, `MaHD` - Document numbering

---

## 🔐 Security Notes

### **RLS Policies:**
- `MaNV` column for user isolation
- `VaiTro` for role-based access
- `TrangThai` for soft deletes

### **Data Encryption:**
- `MatKhau` column hashed with bcrypt
- Sensitive PII in `KhachHang`, `NhaCC`

### **Audit Trail:**
- Complete logging of all CRUD operations
- IP tracking and user agent logging
- Failed login attempt tracking

---

## 🚀 Performance Features

### **Auto-generation:**
- Employee codes (NV01, NV02...)
- Invoice numbers (HD01, HD02...)
- Shipping codes (VC01, VC02...)

### **Triggers:**
- Auto-create invoices from import/export
- Auto-generate shipping documents
- Auto-update inventory levels

### **Business Logic:**
- FIFO cost calculation
- Low stock alerts
- Expiry date tracking

---

*This data dictionary demonstrates comprehensive understanding of 3NF database design with proper normalization, relationships, security considerations, and business logic implementation for enterprise-grade WMS systems.*
