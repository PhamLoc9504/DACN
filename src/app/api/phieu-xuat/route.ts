import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function toCamel(row: any) {
	return {
		SoPX: row.sopx,
		NgayXuat: row.ngayxuat,
		MaNV: row.manv,
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
		const manv = searchParams.get('manv')?.trim();

		const from = (page - 1) * limit;
		const to = from + limit - 1;
		const supabase = getServerSupabase();

		let query = supabase
			.from('phieuxuat')
			.select('*', { count: 'exact' })
			.order('ngayxuat', { ascending: false });

		if (q) {
			query = query.or(`sopx.ilike.%${q}%,manv.ilike.%${q}%`);
		}
		if (fromDate) {
			query = query.gte('ngayxuat', fromDate);
		}
		if (toDate) {
			query = query.lte('ngayxuat', toDate);
		}
		if (manv) {
			query = query.eq('manv', manv);
		}

		const { data, error, count } = await query.range(from, to);
		if (error) throw error;

		return NextResponse.json({
			data: (data || []).map(toCamel),
			total: count || 0,
			page,
			limit,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


