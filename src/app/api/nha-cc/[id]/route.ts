import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function toCamel(row: any) {
	return {
		MaNCC: row.mancc,
		TenNCC: row.tenncc,
		DiaChi: row.diachi,
		SDT: row.sdt,
	};
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { TenNCC, DiaChi, SDT } = body || {};
		if (!TenNCC) {
			return NextResponse.json({ error: 'Tên nhà cung cấp là bắt buộc' }, { status: 400 });
		}

		const supabase = getServerSupabase();
		const { data, error } = await supabase
			.from('nhacc')
			.update({
				tenncc: TenNCC.trim(),
				diachi: DiaChi || null,
				sdt: SDT || null,
			})
			.eq('mancc', id)
			.select()
			.single();

		if (error) throw error;
		if (!data) return NextResponse.json({ error: 'Nhà cung cấp không tồn tại' }, { status: 404 });

		return NextResponse.json({ data: toCamel(data) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const supabase = getServerSupabase();
		const { error } = await supabase.from('nhacc').delete().eq('mancc', id);
		if (error) throw error;
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


