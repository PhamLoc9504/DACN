import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

export async function PUT(req: Request, { params }: { params: Promise<{ maYC: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { maYC } = await params;
		const body = await req.json();

		const supabase = getServerSupabase();
		const updatePayload: Record<string, any> = {};

		['TenYC', 'MoTaYC', 'MaDKPL'].forEach((key) => {
			if (key in body) updatePayload[key] = body[key] ?? null;
		});

		const { data, error } = await supabase.from('YeuCau').update(updatePayload).eq('MaYC', maYC).select().single();
		if (error) throw error;

		return NextResponse.json({ data });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ maYC: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { maYC } = await params;
		const supabase = getServerSupabase();

		const { error } = await supabase.from('YeuCau').delete().eq('MaYC', maYC);
		if (error) throw error;

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

