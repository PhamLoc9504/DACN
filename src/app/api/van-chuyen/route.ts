import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function toCamel(row: any) {
	return {
		MaVC: row.mavc,
		MaHD: row.mahd,
		NgayGiao: row.ngaygiao,
		DiaChiNhan: row.diachinhan,
		TrangThai: row.trangthai,
	};
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const mahd = searchParams.get('mahd')?.trim();
		const supabase = getServerSupabase();
		let query = supabase.from('dovi_vanchuyen').select('*').order('ngaygiao', { ascending: false });
		
		if (mahd) {
			query = query.eq('mahd', mahd);
		}
		
		const { data, error } = await query;
		if (error) throw error;
		return NextResponse.json({ data: (data || []).map(toCamel) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


