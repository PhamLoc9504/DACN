import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function toCamel(row: any, tongTien?: number) {
	return {
		SoPN: row.sopn,
		NgayNhap: row.ngaynhap,
		MaNV: row.manv,
		MaNCC: row.mancc,
		TongTien: tongTien || 0,
	};
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1', 10);
		const limit = parseInt(searchParams.get('limit') || '10', 10);
		const q = searchParams.get('q')?.trim();
		const fromDate = searchParams.get('from')?.trim();
		const toDate = searchParams.get('to')?.trim();
		const mancc = searchParams.get('mancc')?.trim();
		const manv = searchParams.get('manv')?.trim();

		const from = (page - 1) * limit;
		const to = from + limit - 1;
		const supabase = getServerSupabase();

		let query = supabase
			.from('phieunhap')
			.select('*', { count: 'exact' })
			.order('ngaynhap', { ascending: false });

		if (q) {
			query = query.or(`sopn.ilike.%${q}%,manv.ilike.%${q}%,mancc.ilike.%${q}%`);
		}
		if (fromDate) {
			query = query.gte('ngaynhap', fromDate);
		}
		if (toDate) {
			query = query.lte('ngaynhap', toDate);
		}
		if (mancc) {
			query = query.eq('mancc', mancc);
		}
		if (manv) {
			query = query.eq('manv', manv);
		}

		const { data, error, count } = await query.range(from, to);
		if (error) throw error;

		// Tính tổng tiền cho từng phiếu nhập từ chi tiết
		const enrichedData = await Promise.all(
			(data || []).map(async (row: any) => {
				const { data: chiTiet } = await supabase
					.from('ctphieunhap')
					.select('tongtien')
					.eq('sopn', row.sopn);
				
				const tongTien = (chiTiet || []).reduce((sum: number, ct: any) => sum + Number(ct.tongtien || 0), 0);
				return toCamel(row, tongTien);
			})
		);

		return NextResponse.json({
			data: enrichedData,
			total: count || 0,
			page,
			limit,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


