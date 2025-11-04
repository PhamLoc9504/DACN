import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function toCamel(row: any) {
	return {
		MaNV: row.manv,
		HoTen: row.hoten,
		NgaySinh: row.ngaysinh,
		ChucVu: row.chucvu,
		DienThoai: row.dienthoai,
	};
}

export async function GET() {
	try {
		const supabase = getServerSupabase();
		const { data, error } = await supabase.from('nhanvien').select('*').order('manv', { ascending: true });
		if (error) throw error;
		return NextResponse.json({ data: (data || []).map(toCamel) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


