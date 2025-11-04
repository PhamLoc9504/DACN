import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function toCamel(row: any) {
	return {
		SoPN: row.sopn,
		NgayNhap: row.ngaynhap,
		MaNV: row.manv,
		MaNCC: row.mancc,
	};
}

export async function GET() {
	try {
		const supabase = getServerSupabase();
		const { data, error } = await supabase.from('phieunhap').select('*').order('ngaynhap', { ascending: false });
		if (error) throw error;
		return NextResponse.json({ data: (data || []).map(toCamel) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


