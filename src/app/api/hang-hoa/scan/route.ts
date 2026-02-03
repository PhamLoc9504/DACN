import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

/**
 * Tra cứu nhanh hàng hóa phục vụ tính năng quét mã vạch/QR.
 *
 * Ưu tiên tìm theo ?barcode=...; nếu không có sẽ thử ?mahh=...
 * Trả về một item duy nhất hoặc 404 nếu không thấy.
 */
export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const barcode = searchParams.get('barcode')?.trim();
		const mahh = searchParams.get('mahh')?.trim();

		if (!barcode && !mahh) {
			return NextResponse.json({ error: 'Thiếu barcode hoặc mahh' }, { status: 400 });
		}

		const supabase = getServerSupabase();
		const query = supabase
			.from('hanghoa')
			.select('mahh, tenhh, soluongton, dongia, dvt, mancc, barcode, quantity')
			.limit(1);

		const { data, error } = barcode
			? await query.eq('barcode', barcode).maybeSingle()
			: await query.eq('mahh', mahh!).maybeSingle();

		if (error) throw error;

		if (!data) {
			return NextResponse.json({ error: 'Không tìm thấy hàng hóa' }, { status: 404 });
		}

		return NextResponse.json({
			data: {
				MaHH: data.mahh,
				TenHH: data.tenhh,
				SoLuongTon: data.soluongton ?? 0,
				DonGia: data.dongia ?? 0,
				DVT: data.dvt ?? '',
				MaNCC: data.mancc ?? null,
				Barcode: data.barcode ?? null,
				Quantity: data.quantity ?? null,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
	}
}
