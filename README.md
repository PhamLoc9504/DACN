# Hệ thống Quản lý Kho hàng

Dự án Next.js + Supabase quản lý nhập - xuất tồn kho, phiếu, hóa đơn, báo cáo và kiểm kê.

## 📋 Tính năng

### 🏢 **Quản lý Kho hàng**
- 🏠 **Hàng hóa**: Quản lý danh mục, tồn kho, mã vạch, loại hàng, nhà cung cấp
- 📥 **Phiếu nhập**: Tạo phiếu nhập hàng, chi tiết theo hàng hóa, in phiếu, quản lý nhân viên/NCC
- 📤 **Phiếu xuất**: Tạo phiếu xuất hàng, kiểm tra tồn kho tự động, in phiếu, gắn hóa đơn
- 🔍 **Kiểm kê**: Lập phiếu kiểm kê, tự động bù trừ chênh lệch, tạo phiếu điều chỉnh

### 💰 **Tài chính & Hóa đơn**
- 🧾 **Hóa đơn**: Tạo hóa đơn bán hàng, quản lý thanh toán, trạng thái, in ấn chỉ
- 📊 **Báo cáo**: Báo cáo tổng quan (tồn kho, doanh thu, công nợ), đồ thị xu hướng, hàng bán chạy, cảnh báo biến động
- � **Báo cáo chi tiết**: Báo cáo nhập hàng, báo cáo xuất hàng, phân tích theo thời gian

### 👥 **Quản lý Nhân sự & Khách hàng**
- 👤 **Nhân viên**: Quản lý thông tin nhân viên, phân quyền, theo dõi hiệu suất
- 🛒 **Khách hàng**: Quản lý danh sách khách hàng, lịch sử giao dịch, công nợ
- 🏭 **Nhà cung cấp**: Quản lý nhà cung cấp, lịch sử nhập hàng, công nợ

### � **Phân quyền & Bảo mật**
- 🔐 **Đăng nhập**: Session-based, cookie, phân quyền theo vai trò (Admin/NV)
- 👤 **Profile**: Quản lý thông tin cá nhân, đổi mật khẩu
- 📝 **Điều khoản pháp lý**: Quản lý điều khoản sử dụng, quy định nội bộ
- 🛡️ **Giám sát hệ thống**: Log hoạt động, theo dõi truy cập

### 💬 **Giao tiếp & Dịch vụ**
- 💬 **Kênh chat**: Chat nội bộ giữa nhân viên, quản lý tin nhắn
- 🎯 **Chăm sóc khách hàng**: Quản lý yêu cầu hỗ trợ, khiếu nại
- 📦 **Vận chuyển**: Quản lý đơn vị vận chuyển, theo dõi giao hàng

### 🔧 **Hệ thống & Công cụ**
- 📱 **Responsive**: Giao diện hiện đại trên desktop, tablet, mobile
- 🖨️ **In ấn**: In phiếu nhập/xuất, hóa đơn theo mẫu sẵn
- 📸 **Quét mã vạch**: Quét mã vạch để thêm hàng hóa nhanh
- 💾 **Backup/Restore**: Sao lưu và khôi phục dữ liệu
- ⚙️ **Cấu hình hệ thống**: Cài đặt thông số, quản lý luật quy định
- 📋 **Yêu cầu**: Quản lý yêu cầu nội bộ, phê duyệt
- 📝 **Nhật ký**: Theo dõi lịch sử hoạt động hệ thống

### 🧾 **Hóa đơn điện tử**
- 📄 **E-Invoice**: Tạo hóa đơn điện tử, ký số, in ấn
- 🔗 **Tích hợp**: Hỗ trợ chuẩn hóa hóa đơn điện tử
- 📊 **Quản lý**: Theo dõi trạng thái, lịch sử hóa đơn

### 📊 **Dashboard & Analytics**
- 📈 **Tổng quan**: Thống kê tồn kho, doanh thu, công nợ
- 📊 **Phân tích**: Đồ thị xu hướng, hàng bán chạy, biến động
- 👥 **Nhân sự**: Doanh thu theo nhân viên, hiệu suất
- 🏪 **Khách hàng**: Phân nhóm khách hàng, top khách hàng

## 🛠️ Công nghệ

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide icons
- **Backend**: Supabase (PostgreSQL), RESTful APIs, Row Level Security (RLS)
- **Auth**: Session-based, cookie, phân quyền theo vai trò
- **UI**: React hooks, server components, client components
- **Deployment**: Vercel (tối ưu cho Next.js)

## 📦 Cấu trúc dự án

```
khohang/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/           # Layout đăng nhập
│   │   │   ├── login/        # Trang đăng nhập
│   │   │   ├── register/     # Trang đăng ký
│   │   │   └── terms/        # Điều khoản đăng ký
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # API xác thực (login, logout, register)
│   │   │   ├── hang-hoa/     # Hàng hóa CRUD, quét mã vạch
│   │   │   ├── phieu-nhap/   # Phiếu nhập CRUD, tạo mới
│   │   │   ├── phieu-xuat/   # Phiếu xuất CRUD, tạo mới
│   │   │   ├── hoa-don/      # Hóa đơn CRUD, thanh toán, e-invoice
│   │   │   ├── dashboard/    # Báo cáo analytics
│   │   │   │   ├── top-selling/     # Hàng bán chạy
│   │   │   │   ├── item-anomalies/  # Cảnh báo biến động
│   │   │   │   ├── customers-summary/ # Thống kê KH
│   │   │   │   ├── revenue-by-employee/ # Doanh thu NV
│   │   │   │   └── top-customers/    # Top khách hàng
│   │   │   ├── kiem-ke/      # Kiểm kê CRUD
│   │   │   ├── nhan-vien/    # Nhân viên CRUD
│   │   │   ├── khach-hang/   # Khách hàng CRUD
│   │   │   ├── nha-cc/       # Nhà cung cấp CRUD
│   │   │   ├── loai-hang/    # Loại hàng CRUD
│   │   │   ├── chat/         # Chat nội bộ
│   │   │   ├── backup/       # Backup/Restore
│   │   │   ├── upload/       # Upload files (avatar, docs)
│   │   │   ├── audit-log/    # Log hoạt động
│   │   │   ├── dieu-khoan-phap-ly/ # Điều khoản pháp lý
│   │   │   ├── luat-quy-dinh/ # Luật quy định nội bộ
│   │   │   └── yeu-cau/      # Yêu cầu nội bộ
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Dashboard
│   │   ├── nhap-hang/        # Trang nhập hàng
│   │   ├── xuat-hang/        # Trang xuất hàng
│   │   ├── hoa-don/          # Trang hóa đơn
│   │   │   ├── e-invoice/    # Hóa đơn điện tử
│   │   │   └── print/        # In hóa đơn
│   │   ├── kiem-ke-kho/       # Trang kiểm kê
│   │   ├── hang-hoa/         # Trang hàng hóa
│   │   ├── nhan-vien/        # Trang nhân viên
│   │   ├── khach-hang/       # Trang khách hàng
│   │   ├── nha-cung-cap/     # Trang nhà cung cấp
│   │   ├── profile/          # Trang profile cá nhân
│   │   ├── quan-ly-tai-khoan/ # Quản lý tài khoản
│   │   ├── bao-cao/          # Báo cáo tổng quan
│   │   ├── bao-cao-nhap-hang/ # Báo cáo nhập hàng
│   │   ├── bao-cao-xuat-hang/ # Báo cáo xuất hàng
│   │   ├── kenh-chat/        # Kênh chat nội bộ
│   │   ├── cham-soc-khach-hang/ # Chăm sóc khách hàng
│   │   ├── van-chuyen/       # Quản lý vận chuyển
│   │   ├── backup/           # Backup/Restore
│   │   ├── cau-hinh-he-thong/ # Cấu hình hệ thống
│   │   ├── giam-sat-he-thong/ # Giám sát hệ thống
│   │   ├── dieu-khoan-phap-ly/ # Điều khoản pháp lý
│   │   ├── luat-quy-dinh/    # Luật quy định
│   │   ├── yeu-cau/          # Yêu cầu nội bộ
│   │   ├── nhat-ky/           # Nhật ký hệ thống
│   │   └── phieu-nhap/       # In phiếu nhập
│   └── phieu-xuat/           # In phiếu xuất
│   ├── components/             # UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Pagination.tsx
│   │   ├── BarcodeScanner.tsx
│   │   ├── ErrorDisplay.tsx
│   │   ├── AppShell.tsx       # Layout chính
│   │   ├── Sidebar.tsx        # Menu navigation
│   │   └── Chat/              # Chat components
│   ├── lib/                  # Utilities
│   │   ├── supabaseClient.ts  # Types & client
│   │   ├── dateUtils.ts      # Date/time helpers (VN timezone)
│   │   ├── errorHandler.ts    # API error handling
│   │   ├── validation.ts     # Zod schemas
│   │   ├── session.ts        # Auth session
│   │   ├── auditLog.ts       # Activity logging
│   │   └── middleware.ts     # Auth middleware
│   └── types/                 # TypeScript types
├── public/                   # Static assets
├── migrations/               # Database migrations
│   ├── complete_schema_with_shipping.sql
│   ├── create_login_security.sql
│   ├── revoke_public_access.sql
│   └── setup_storage_bucket.sql
├── .env.local               # Environment variables (không commit)
├── package.json
└── README.md
```

## 🚀 Bắt đầu

### 1. Clone dự án

```bash
git clone <repository-url>
cd khohang
```

### 2. Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

### 3. Cấu hình môi trường

Tạo file `.env.local` tại thư mục gốc:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Tùy chọn: Backup S3 (nếu cần)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=ap-southeast-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=your-backup-bucket
```

### 4. Chạy development server

```bash
npm run dev
# hoặc
yarn dev
# hoặc
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000)

### 5. Tài khoản mặc định

- **Admin**: `admin` / `admin` (toàn quyền)
- **Nhân viên**: `nhanvien` / `nhanvien` (quản lý phiếu, xem báo cáo)

## 📚 Database Schema

Sử dụng schema Supabase có sẵn, không cần seed data.

### Các bảng chính:

**🏢 Quản lý Kho hàng**
- `HangHoa`: Hàng hóa (tồn kho, mã vạch, đơn giá, loại hàng)
- `LoaiHang`: Loại hàng hóa
- `PhieuNhap`: Phiếu nhập kho
- `CT_PhieuNhap`: Chi tiết phiếu nhập
- `PhieuXuat`: Phiếu xuất kho  
- `CT_PhieuXuat`: Chi tiết phiếu xuất
- `inventory_checks`: Phiếu kiểm kê
- `inventory_check_details`: Chi tiết kiểm kê

**💰 Tài chính & Hóa đơn**
- `HoaDon`: Hóa đơn bán hàng
- `CT_HoaDon`: Chi tiết hóa đơn
- `thanh_toan`: Lịch sử thanh toán hóa đơn

**👥 Nhân sự & Khách hàng**
- `TaiKhoan`: Tài khoản đăng nhập (username, password, vai trò)
- `NhanVien`: Danh mục nhân viên
- `KhachHang`: Khách hàng
- `NhaCC`: Nhà cung cấp
- `DonVi_VanChuyen`: Đơn vị vận chuyển

**🔐 Phân quyền & Bảo mật**
- `login_security`: Cấu hình bảo mật đăng nhập
- `audit_logs`: Log hoạt động hệ thống

**💬 Giao tiếp & Dịch vụ**
- `chat_messages`: Tin nhắn chat nội bộ
- `chat_rooms`: Phòng chat
- `yeu_cau`: Yêu cầu nội bộ
- `cham_soc_khach_hang`: Yêu cầu hỗ trợ KH

**📝 Pháp lý & Cấu hình**
- `dieu_khoan_phap_ly`: Điều khoản sử dụng
- `luat_quy_dinh`: Quy định nội bộ
- `system_config`: Cấu hình hệ thống

**💾 Hệ thống**
- `backups`: Lịch sử backup
- `file_uploads`: Quản lý files upload
- `shipping`: Theo dõi vận chuyển

## 🔧 Development

### Scripts hữu ích

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

### Quy tắc code

- Sử dụng TypeScript cho type safety
- Component: PascalCase
- File: kebab-case
- Tailwind CSS cho styling
- API routes: async/await với error handling
- Supabase queries: có count cho pagination

## 🚀 Deployment

### Vercel (khuyến nghị)

```bash
npm install -g vercel
vercel
# Kết nối GitHub repo
# Cấu hình environment variables trong Vercel dashboard
```

### Environment variables cho production

Cùng như `.env.local` nhưng đặt trong Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- (Tùy chọn) S3 variables

### 📋 Deployment Checklist

- [ ] Cấu hình Supabase RLS policies
- [ ] Setup environment variables
- [ ] Run database migrations
- [ ] Test authentication flow
- [ ] Verify file upload permissions
- [ ] Configure backup schedule
- [ ] Test all API endpoints
- [ ] Verify responsive design

## ✨ Features Highlight

### 🎯 **Smart Inventory Management**
- Auto stock tracking on import/export
- Barcode scanning integration
- Low stock alerts
- Automated inventory adjustment

### 🔒 **Enterprise Security**
- Row Level Security (RLS)
- Session-based authentication
- Activity logging & audit trails
- Role-based access control

### 📊 **Real-time Analytics**
- Live dashboard updates
- Interactive charts & graphs
- Custom date range filtering
- Export to multiple formats

### 💬 **Internal Communication**
- Real-time chat system
- File sharing capabilities
- Notification system
- Message history

### 📱 **Modern UI/UX**
- Responsive design for all devices
- Neumorphism design system
- Smooth animations & transitions
- Accessibility compliant

### 🔧 **Developer Friendly**
- TypeScript throughout
- Comprehensive error handling
- RESTful API design
- Component-based architecture

## 🐛 Troubleshooting

### Lỗi 500 khi tải dữ liệu

- Giảm `limit` trong API calls (đã clamp ở 1000)
- Kiểm tra RLS policies trong Supabase
- Xem console log cho lỗi cụ thể

### Lỗi timezone

- Mọi date/time đều dùng `Asia/Ho_Chi_Minh`
- Sử dụng helpers `vietnamNowInput()` và `toInputValue()` cho `datetime-local`

### Lỗi quyền truy cập

- Kiểm tra session cookie
- Đảm bảo `getSessionFromCookies()` hoạt động
- Xem RLS policies trong Supabase

## 📞 Hỗ trợ

- Documentation trong code (comments, types)
- Component names rõ ràng
- API routes có error handling
- Logs chi tiết trong console

## 📄 License

Dự án nội bộ, không public repo.
