import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

// GET: Lấy chi tiết hóa đơn từ bảng ct_hoadon
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const mahd = id;
		const supabase = getServerSupabase();

		// Kiểm tra hóa đơn tồn tại
		const { data: hoaDon, error: hdError } = await supabase
			.from('hoadon')
			.select('mahd')
			.eq('mahd', mahd)
			.maybeSingle();

		if (hdError) throw hdError;
		if (!hoaDon) {
			return NextResponse.json({ error: 'Không tìm thấy hóa đơn' }, { status: 404 });
		}

		// Lấy chi tiết từ bảng ct_hoadon (quan hệ N-N giữa HoaDon và HangHoa)
		const { data: ctHD, error: ctHDError } = await supabase
			.from('ct_hoadon')
			.select('*, hanghoa(*)')
			.eq('mahd', mahd);

		if (ctHDError) throw ctHDError;

		// Map dữ liệu về format chuẩn
		const chiTiet = (ctHD || []).map((ct: any) => ({
			MaHH: ct.mahh,
			TenHH: ct.hanghoa?.tenhh || null,
			SoLuong: ct.soluong,
			DonGia: ct.dongia,
			TongTien: ct.tongtien,
		}));

		return NextResponse.json({
			data: chiTiet,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

