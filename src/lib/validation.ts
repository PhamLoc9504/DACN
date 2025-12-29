import { z } from 'zod';

// Validation schema cho Hàng Hóa
export const hangHoaSchema = z.object({
  MaHH: z.string().min(1, 'Mã hàng hóa là bắt buộc').max(50, 'Mã hàng hóa tối đa 50 ký tự'),
  TenHH: z.string().min(1, 'Tên hàng hóa là bắt buộc').max(255, 'Tên hàng hóa tối đa 255 ký tự'),
  MaLoai: z.string().min(1, 'Loại hàng là bắt buộc'),
  DonGia: z.number().min(0, 'Đơn giá phải lớn hơn hoặc bằng 0'),
  SoLuongTon: z.number().int().min(0, 'Số lượng tồn phải lớn hơn hoặc bằng 0'),
  DVT: z.string().min(1, 'Đơn vị tính là bắt buộc'),
  MaNCC: z.string().min(1, 'Nhà cung cấp là bắt buộc'),
  Barcode: z.string().optional().nullable(),
  Quantity: z.string().optional().nullable(),
  NgaySanXuat: z.string().nullable().optional(),
  NgayHetHan: z.string().nullable().optional(),
});

export type HangHoaInput = z.infer<typeof hangHoaSchema>;

// Validation schema cho Phiếu Nhập
export const phieuNhapSchema = z.object({
  SoPN: z.string().min(1, 'Số phiếu nhập là bắt buộc'),
  NgayNhap: z.string().min(1, 'Ngày nhập là bắt buộc'),
  MaNV: z.string().min(1, 'Mã nhân viên là bắt buộc'),
  MaNCC: z.string().optional().nullable(),
});

export type PhieuNhapInput = z.infer<typeof phieuNhapSchema>;

// Validation schema cho Chi Tiết Phiếu Nhập
export const chiTietPhieuNhapSchema = z.object({
  MaHH: z.string().min(1, 'Mã hàng hóa là bắt buộc'),
  SLNhap: z.number().int().min(1, 'Số lượng nhập phải lớn hơn 0'),
  DGNhap: z.number().min(0, 'Đơn giá nhập phải lớn hơn hoặc bằng 0'),
});

export type ChiTietPhieuNhapInput = z.infer<typeof chiTietPhieuNhapSchema>;

// Validation schema cho Phiếu Xuất
export const phieuXuatSchema = z.object({
  SoPX: z.string().min(1, 'Số phiếu xuất là bắt buộc'),
  NgayXuat: z.string().min(1, 'Ngày xuất là bắt buộc'),
  MaNV: z.string().min(1, 'Mã nhân viên là bắt buộc'),
  MaKH: z.string().optional().nullable(),
});

export type PhieuXuatInput = z.infer<typeof phieuXuatSchema>;

// Validation schema cho Chi Tiết Phiếu Xuất
export const chiTietPhieuXuatSchema = z.object({
  MaHH: z.string().min(1, 'Mã hàng hóa là bắt buộc'),
  SLXuat: z.number().int().min(1, 'Số lượng xuất phải lớn hơn 0'),
  DonGia: z.number().min(0, 'Đơn giá phải lớn hơn hoặc bằng 0'),
});

export type ChiTietPhieuXuatInput = z.infer<typeof chiTietPhieuXuatSchema>;

// Validation schema cho Hóa Đơn
export const hoaDonSchema = z.object({
  SoHD: z.string().min(1, 'Số hóa đơn là bắt buộc'),
  NgayLap: z.string().min(1, 'Ngày lập là bắt buộc'),
  MaKH: z.string().optional().nullable(),
  MaNV: z.string().min(1, 'Mã nhân viên là bắt buộc'),
  TongTien: z.number().min(0, 'Tổng tiền phải lớn hơn hoặc bằng 0'),
  TrangThai: z.enum(['Chưa thanh toán', 'Đã thanh toán', 'Đã hủy'], {
    errorMap: () => ({ message: 'Trạng thái không hợp lệ' }),
  }),
  HinhThucGiao: z.string().optional().nullable(),
  PhuongThucTT: z.string().optional().nullable(),
  SoPX: z.string().optional().nullable(),
  SoPN: z.string().optional().nullable(),
});

export type HoaDonInput = z.infer<typeof hoaDonSchema>;

// Validation schema cho Khách Hàng
export const khachHangSchema = z.object({
  MaKH: z.string().min(1, 'Mã khách hàng là bắt buộc').max(50),
  TenKH: z.string().min(1, 'Tên khách hàng là bắt buộc').max(255),
  DiaChi: z.string().optional().nullable(),
  DienThoai: z.string().optional().nullable(),
  Email: z.string().email('Email không hợp lệ').optional().nullable().or(z.literal('')),
});

export type KhachHangInput = z.infer<typeof khachHangSchema>;

// Validation schema cho Nhà Cung Cấp
export const nhaCCSchema = z.object({
  MaNCC: z.string().min(1, 'Mã nhà cung cấp là bắt buộc').max(50),
  TenNCC: z.string().min(1, 'Tên nhà cung cấp là bắt buộc').max(255),
  DiaChi: z.string().optional().nullable(),
  DienThoai: z.string().optional().nullable(),
  Email: z.string().email('Email không hợp lệ').optional().nullable().or(z.literal('')),
});

export type NhaCCInput = z.infer<typeof nhaCCSchema>;

// Validation schema cho Nhân Viên
export const nhanVienSchema = z.object({
  MaNV: z.string().min(1, 'Mã nhân viên là bắt buộc').max(50),
  HoTen: z.string().min(1, 'Họ tên là bắt buộc').max(255),
  NgaySinh: z.string().optional().nullable(),
  ChucVu: z.string().optional().nullable(),
  DienThoai: z.string().optional().nullable(),
});

export type NhanVienInput = z.infer<typeof nhanVienSchema>;

// Validation schema cho Đăng Nhập
export const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Validation schema cho Đăng Ký
export const registerSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirm: z.string().min(6, 'Xác nhận mật khẩu là bắt buộc'),
  fullName: z.string().min(1, 'Họ tên là bắt buộc').max(255),
}).refine((data) => data.password === data.confirm, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirm'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Helper function để validate và trả về lỗi dạng user-friendly
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return { success: false, errors };
}

// Helper function để sanitize string input (chống XSS)
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Loại bỏ < và >
    .replace(/javascript:/gi, '') // Loại bỏ javascript:
    .replace(/on\w+=/gi, ''); // Loại bỏ event handlers
}

// Helper function để validate số điện thoại Việt Nam
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^(0|\+84)[3-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

