import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

// GET: Lấy chi tiết hóa đơn
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const mahd = id;
		const supabase = getServerSupabase();

		// Lấy chi tiết từ CT_HoaDon
		const { data: chiTiet, error } = await supabase
			.from('ct_hoadon')
			.select('*, hanghoa(*)')
			.eq('mahd', mahd);

		if (error) throw error;

		return NextResponse.json({
			data: (chiTiet || []).map((ct: any) => ({
				MaHH: ct.mahh,
				TenHH: ct.hanghoa?.tenhh || null,
				SoLuong: ct.soluong,
				DonGia: ct.dongia,
				TongTien: ct.tongtien,
			})),
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

