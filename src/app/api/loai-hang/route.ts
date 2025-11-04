import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function toCamel(row: any) {
	return { MaLoai: row.maloai, TenLoai: row.tenloai };
}

export async function GET() {
	try {
		const supabase = getServerSupabase();
		const { data, error } = await supabase.from('loaihang').select('*').order('tenloai', { ascending: true });
		if (error) throw error;
		return NextResponse.json({ data: (data || []).map(toCamel) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


