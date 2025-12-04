import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

// PUT: cập nhật luật/quy định
export async function PUT(req: Request, { params }: { params: Promise<{ maLuat: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { maLuat } = await params;
		const body = await req.json();
		const { TenLuat, MoTaLuat, LinkNguon } = body || {};

		const supabase = getServerSupabase();

		const updateData: any = {};
		if (TenLuat !== undefined) updateData.TenLuat = TenLuat;
		if (MoTaLuat !== undefined) updateData.MoTaLuat = MoTaLuat;
		if (LinkNguon !== undefined) updateData.LinkNguon = LinkNguon;
		updateData.NgayCapNhat = new Date().toISOString();

		const { data, error } = await supabase
			.from('LuatQuyDinh')
			.update(updateData)
			.eq('MaLuat', maLuat)
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ data });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// DELETE: xoá luật/quy định
export async function DELETE(req: Request, { params }: { params: Promise<{ maLuat: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { maLuat } = await params;

		const supabase = getServerSupabase();

		const { error } = await supabase
			.from('LuatQuyDinh')
			.delete()
			.eq('MaLuat', maLuat);

		if (error) throw error;

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}
