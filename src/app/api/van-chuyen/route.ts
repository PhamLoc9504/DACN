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

export async function GET() {
	try {
		const supabase = getServerSupabase();
		const { data, error } = await supabase.from('dovi_vanchuyen').select('*').order('ngaygiao', { ascending: false });
		if (error) throw error;
		return NextResponse.json({ data: (data || []).map(toCamel) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


