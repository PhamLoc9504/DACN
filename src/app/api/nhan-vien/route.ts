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

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1', 10);
		const limit = parseInt(searchParams.get('limit') || '10', 10);
		const q = searchParams.get('q')?.trim().toLowerCase() || '';
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		const supabase = getServerSupabase();
		let query = supabase.from('nhanvien').select('*', { count: 'exact' }).order('manv', { ascending: true });
		if (q) {
			query = query.or(`hoten.ilike.%${q}%,dienthoai.ilike.%${q}%`);
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

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { MaNV, HoTen, NgaySinh, ChucVu, DienThoai } = body || {};

		if (!MaNV || !HoTen) {
			return NextResponse.json({ error: 'Mã nhân viên và Họ tên là bắt buộc' }, { status: 400 });
		}

		const supabase = getServerSupabase();
		const { data, error } = await supabase
			.from('nhanvien')
			.insert([
				{
					manv: MaNV.trim(),
					hoten: HoTen.trim(),
					ngaysinh: NgaySinh || null,
					chucvu: ChucVu || null,
					dienthoai: DienThoai || null,
				},
			])
			.select()
			.single();

		if (error) {
			if (error.code === '23505') {
				return NextResponse.json({ error: 'Mã nhân viên đã tồn tại' }, { status: 409 });
			}
			throw error;
		}

		return NextResponse.json({ data: toCamel(data) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

