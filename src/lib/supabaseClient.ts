import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
	// Manage auth behavior explicitly via auth options
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

// Server-side helper using service role when available (never import in client components)
export function getServerSupabase(): SupabaseClient {
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
	if (!serviceKey) {
		throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
	}
	return createClient(supabaseUrl!, serviceKey);
}

export type Tables = {
	TaiKhoan: {
		MaTK: string;
		TenDangNhap: string;
		MatKhau: string;
		MaNV: string | null;
		VaiTro: string;
		TrangThai: string;
		NgayTao: string | null;
		LanDangNhapCuoi: string | null;
	};
	NhanVien: {
		MaNV: string;
		HoTen: string | null;
		NgaySinh: string | null;
		ChucVu: string | null;
		DienThoai: string | null;
	};
	KhachHang: {
		MaKH: string;
		TenKH: string | null;
		SDT: string | null;
		DiaChi: string | null;
	};
	NhaCC: {
		MaNCC: string;
		TenNCC: string | null;
		DiaChi: string | null;
		SDT: string | null;
	};
	LoaiHang: {
		MaLoai: string;
		TenLoai: string | null;
	};
	HangHoa: {
		MaHH: string;
		TenHH: string | null;
		MaLoai: string | null;
		DonGia: number | null;
		SoLuongTon: number | null;
		DVT: string;
		MaNCC: string | null;
	};
	PhieuNhap: {
		SoPN: string;
		NgayNhap: string | null;
		MaNV: string | null;
		MaNCC: string | null;
	};
	CTPHieuNhap: {
		SoPN: string;
		MaHH: string;
		SLNhap: number | null;
		DGNhap: number | null;
		TongTien: string; // DECIMAL
	};
	PhieuXuat: {
		SoPX: string;
		NgayXuat: string | null;
		MaNV: string | null;
	};
	CTPHieuXuat: {
		SoPX: string;
		MaHH: string;
		SLXuat: number | null;
		DonGia: number | null;
		TongTien: string;
	};
	HoaDon: {
		MaHD: string;
		NgayLap: string | null;
		MaKH: string | null;
		TongTien: number | null;
		TrangThai: string;
		SoPX: string | null;
		SoPN: string | null;
		MaNV: string | null;
		HinhThucGiao: string | null;
		PhuongThucTT: string | null;
	};
	CT_HoaDon: {
		MaHD: string;
		MaHH: string;
		SoLuong: number | null;
		DonGia: number | null;
		TongTien: string;
	};
	Dovi_VanChuyen: {
		MaVC: string;
		MaHD: string | null;
		NgayGiao: string | null;
		DiaChiNhan: string | null;
		TrangThai: string;
	};
};


