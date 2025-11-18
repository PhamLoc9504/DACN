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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { HoTen, NgaySinh, ChucVu, DienThoai } = body || {};

		if (!HoTen) {
			return NextResponse.json({ error: 'Họ tên là bắt buộc' }, { status: 400 });
		}

		const supabase = getServerSupabase();
		const { data, error } = await supabase
			.from('nhanvien')
			.update({
				hoten: HoTen.trim(),
				ngaysinh: NgaySinh || null,
				chucvu: ChucVu || null,
				dienthoai: DienThoai || null,
			})
			.eq('manv', id)
			.select()
			.single();

		if (error) throw error;
		if (!data) return NextResponse.json({ error: 'Nhân viên không tồn tại' }, { status: 404 });

		return NextResponse.json({ data: toCamel(data) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const supabase = getServerSupabase();
		const { error } = await supabase.from('nhanvien').delete().eq('manv', id);
		if (error) throw error;
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


