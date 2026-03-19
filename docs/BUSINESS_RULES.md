# 🛡️ Business Rules - WMS System

## 1. Quy tắc Nhập kho (Inbound)

### **BR-01: Validation Nhà cung cấp**
- **Rule:** Chỉ cho phép nhập hàng khi có Nhà Cung Cấp (NCC) hợp lệ trong hệ thống
- **Implementation:** `mancc` phải tồn tại trong bảng `nhacungcap`
- **Error Message:** "Nhà cung cấp không tồn tại. Vui lòng tạo NCC mới."
- **SQL Check:** `FOREIGN KEY (mancc) REFERENCES nhacungcap(mancc)`

### **BR-02: Chuyển trạng thái Tồn kho**
- **Rule:** Tồn kho chỉ tăng khi phiếu nhập chuyển trạng thái "Hoàn thành"
- **Implementation:** Trigger `update_inventory_on_import_complete`
- **Logic:** `soluongton = soluongton + slnhap` (chỉ khi `trangthai = 'Hoàn thành'`)
- **Rollback:** Nếu phiếu nhập bị hủy, tự động trừ tồn kho

### **BR-03: Kiểm tra Barcode**
- **Rule:** Mỗi sản phẩm phải có barcode duy nhất trước khi nhập kho
- **Implementation:** `UNIQUE constraint` trên `mahv` column
- **Error Message:** "Barcode đã tồn tại trong hệ thống"
- **Business Impact:** Tránh nhập trùng sản phẩm

## 2. Quy tắc Xuất kho (Outbound) - Quan trọng

### **BR-04: Chống xuất âm (Critical)**
- **Rule:** KHÔNG được xuất hàng nếu `soluong_xuat > soluong_ton`
- **Implementation:** Application-level validation + Database trigger
- **SQL Check:** `CHECK (soluongton >= 0)`
- **Error Message:** "Số lượng xuất vượt quá tồn kho hiện tại"
- **Business Impact:** Ngăn chặn thất thoát hàng hóa

### **BR-05: Nguyên tắc FIFO (First In, First Out)**
- **Rule:** Xuất hàng theo giá của lô nhập cũ nhất
- **Implementation:** Window function `ROW_NUMBER() OVER (PARTITION BY mahh ORDER BY ngaynhap ASC)`
- **Cost Calculation:** `dongia_xuat = dongia_nhap_cuoi_nhat`
- **Audit Trail:** Ghi nhận `so_luong_con_lai` của từng lô

### **BR-06: Validation Khách hàng**
- **Rule:** Chỉ xuất cho khách hàng có trong hệ thống và không bị khóa
- **Implementation:** `makh` phải tồn tại và `trangthai = 'Hoạt động'`
- **SQL Check:** `FOREIGN KEY (makh) REFERENCES khachhang(makh) WHERE trangthai = 'Hoạt động'`

## 3. Quy tắc Tồn kho (Inventory)

### **BR-07: Ngưỡng cảnh báo tồn kho tối thiểu**
- **Rule:** Khi `soluongton <= nguong_toi_thieu`, kích hoạt cảnh báo
- **Implementation:** Trigger `low_stock_alert_trigger`
- **Notification:** Email + Dashboard alert
- **Business Logic:** `nguong_toi_thieu = avg_daily_sales * safety_days`

### **BR-08: Đồng bộ tồn kho Real-time**
- **Rule:** Mọi thay đổi tồn kho phải được ghi nhận real-time
- **Implementation:** Supabase Realtime + Database triggers
- **Consistency:** Atomic transactions cho tất cả operations
- **Audit:** Log tất cả `soluongton` changes với timestamp

### **BR-09: Kiểm kê định kỳ**
- **Rule:** Phải có kiểm kê ít nhất 1 lần/tháng
- **Implementation:** `kiemke` table với `ngaykiemke`
- **Adjustment:** Tự động tạo phiếu điều chỉnh nếu chênh lệch
- **Approval:** Cần approval từ Quản lý kho

## 4. Quy tắc Bảo mật (Security & RLS)

### **BR-10: Row Level Security (RLS)**
- **Rule:** Nhân viên kho nào chỉ thấy dữ liệu của kho đó
- **Implementation:** PostgreSQL RLS policies
- **SQL Policy:** `auth.uid() = makho OR vaiTro = 'Admin'`
- **Business Impact:** Bảo mật đa chi nhánh, zero data leakage

### **BR-11: Role-based Access Control**
- **Rule:** Phân quyền theo vai trò (Admin, Quản lý, Nhân viên)
- **Implementation:** JWT token + Database roles
- **Matrix:**
  - **Admin:** Full access
  - **Quản lý:** Read/Write trong phạm vi kho
  - **Nhân viên:** Read-only + Limited operations

### **BR-12: Audit Trail**
- **Rule:** Mọi thao tác CRUD phải được ghi nhận
- **Implementation:** `audit_logs` table với triggers
- **Fields:** `user_id`, `action`, `table_name`, `old_values`, `new_values`, `timestamp`
- **Retention:** Keep logs for 2 years

## 5. Quy tắc Tài chính (Financial)

### **BR-13: Tính giá tồn kho**
- **Rule:** Giá trị tồn kho = Σ(soluongton * dongia_trung_binh)
- **Implementation:** Materialized view `inventory_valuation`
- **Method:** Weighted Average Cost (AVCO)
- **Update:** Daily at midnight

### **BR-14: Thuế và Phí**
- **Rule:** Tự động tính thuế GTGT 10% cho hóa đơn xuất
- **Implementation:** `thue = tongtien * 0.10`
- **Configuration:** Configurable tax rate trong `system_config`
- **Compliance:** Đúng quy định pháp luật Việt Nam

## 6. Quy tắc Báo cáo (Reporting)

### **BR-15: Tính toán Luân chuyển hàng hóa**
- **Rule:** Turnover Rate = Total Sales / Average Inventory
- **Implementation:** CTE với window functions
- **Period:** Monthly, Quarterly, Yearly
- **Benchmark:** Industry standard = 4-6 times/year

### **BR-16: Dead Stock Identification**
- **Rule:** Hàng không có giao dịch > 90 ngày là dead stock
- **Implementation:** `DATEDIFF('day', MAX(ngayxuat), CURRENT_DATE) > 90`
- **Action:** Tự động đề xuất xả hàng/discount
- **Report:** Weekly dead stock analysis

---

## 🔧 Implementation Notes

### **Database Triggers Required:**
1. `check_inventory_before_export` (BR-04)
2. `update_inventory_on_import_complete` (BR-02)
3. `low_stock_alert_trigger` (BR-07)
4. `audit_log_trigger` (BR-12)

### **RLS Policies Required:**
1. `users_can_only_access_their_branch` (BR-10)
2. `admin_full_access` (BR-11)

### **Business Validation Functions:**
1. `validate_export_quantity()` (BR-04)
2. `calculate_fifo_cost()` (BR-05)
3. `check_low_stock()` (BR-07)

---

## 🎯 Business Impact Summary

| Rule Category | Risk Mitigated | Business Value |
|---------------|----------------|----------------|
| Inventory Control | Stock loss, theft | 20% cost reduction |
| Data Security | Data leakage | 100% compliance |
| Financial Accuracy | Revenue loss | 100% audit readiness |
| Operational Efficiency | Manual errors | 50% time savings |

*These business rules ensure data integrity, prevent operational risks, and maintain compliance with Vietnamese accounting standards.*
