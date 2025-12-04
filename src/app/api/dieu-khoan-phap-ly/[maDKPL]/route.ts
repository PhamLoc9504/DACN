import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

export async function GET(req: Request, { params }: { params: Promise<{ maDKPL: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { maDKPL } = await params;
		const supabase = getServerSupabase();

		const [{ data: clause, error }, ycRes] = await Promise.all([
			supabase.from('DieuKhoanPhapLy').select('*').eq('MaDKPL', maDKPL).maybeSingle(),
			supabase.from('YeuCau').select('*').eq('MaDKPL', maDKPL),
		]);

		if (error) throw error;
		if (!clause) return NextResponse.json({ error: 'Không tìm thấy điều khoản' }, { status: 404 });

		return NextResponse.json({
			data: clause,
			yeuCau: ycRes.data || [],
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function PUT(req: Request, { params }: { params: Promise<{ maDKPL: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { maDKPL } = await params;
		const body = await req.json();

		const supabase = getServerSupabase();
		const updatePayload: Record<string, any> = {};

		[
			'MaLuat',
			'NgayKy',
			'NgayHetHan',
			'LoaiHopDong',
			'TrangThai',
			'GhiChu',
		].forEach((key) => {
			if (key in body) updatePayload[key] = body[key] ?? null;
		});

		if ('MaKH' in body) {
			updatePayload.makh = body.MaKH || null;
		}
		if ('MaNCC' in body) {
			updatePayload.mancc = body.MaNCC || null;
		}

		const { data, error } = await supabase
			.from('DieuKhoanPhapLy')
			.update(updatePayload)
			.eq('MaDKPL', maDKPL)
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ data });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ maDKPL: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { maDKPL } = await params;
		const supabase = getServerSupabase();

		const { error } = await supabase.from('DieuKhoanPhapLy').delete().eq('MaDKPL', maDKPL);
		if (error) throw error;

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

