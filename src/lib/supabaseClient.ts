import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Prefer env; fallback to provided public credentials for local dev
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vvfyrmokhzekpxwqdixg.supabase.co') as string;
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZnlybW9raHpla3B4d3FkaXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MzYxODgsImV4cCI6MjA3NzQxMjE4OH0.wbIvlNrhKlRmTfM4_mmUJs08jkommFT5Olf_RQVNMIo') as string;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
	// Manage auth behavior explicitly via auth options
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

// Server-side helper using service role when available (never import in client components)
export function getServerSupabase(): SupabaseClient {
	const fallbackService = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZnlybW9raHpla3B4d3FkaXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgzNjE4OCwiZXhwIjoyMDc3NDEyMTg4fQ.u4i_PMRR3S_iDk2bRtSLLQhUmf-zQZtVePksUrx5btA';
	const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || fallbackService) as string;
	return createClient(supabaseUrl, serviceKey);
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


