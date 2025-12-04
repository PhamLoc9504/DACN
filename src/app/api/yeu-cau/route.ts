import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

type RawYeuCau = {
	MaYC: string;
	TenYC: string;
	MoTaYC: string | null;
	MaDKPL: string;
};

function normalize(row: RawYeuCau, extras: { TenLuat?: string | null } = {}) {
	return {
		MaYC: row.MaYC,
		TenYC: row.TenYC,
		MoTaYC: row.MoTaYC,
		MaDKPL: row.MaDKPL,
		TenLuat: extras.TenLuat ?? null,
	};
}

export async function GET(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { searchParams } = new URL(req.url);
		const q = searchParams.get('q')?.trim() || '';
		const maDKPL = searchParams.get('maDKPL')?.trim() || '';
		const page = parseInt(searchParams.get('page') || '1', 10);
		const limit = parseInt(searchParams.get('limit') || '10', 10);
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		const supabase = getServerSupabase();

		let query = supabase.from('YeuCau').select('*', { count: 'exact' });
		if (q) {
			query = query.or(`MaYC.ilike.%${q}%,TenYC.ilike.%${q}%`);
		}
		if (maDKPL) {
			query = query.eq('MaDKPL', maDKPL);
		}

		const { data, error, count } = await query.order('MaYC', { ascending: false }).range(from, to);
		if (error) throw error;

		const rows = (data || []) as RawYeuCau[];
		const clauseIds = Array.from(new Set(rows.map((r) => r.MaDKPL)));

		const { data: clauses } = clauseIds.length
			? await supabase.from('DieuKhoanPhapLy').select('MaDKPL, MaLuat').in('MaDKPL', clauseIds)
			: { data: [] as any[] };

		const luatIds = Array.from(new Set((clauses || []).map((c: any) => c.MaLuat).filter(Boolean)));
		const { data: luats } = luatIds.length
			? await supabase.from('LuatQuyDinh').select('MaLuat, TenLuat').in('MaLuat', luatIds)
			: { data: [] as any[] };

		const luatMap = new Map<string, string>();
		(luats || []).forEach((l: any) => luatMap.set(l.MaLuat, l.TenLuat));

		const clauseToLuat = new Map<string, string>();
		(clauses || []).forEach((c: any) => {
			if (c.MaDKPL) clauseToLuat.set(c.MaDKPL, c.MaLuat);
		});

		const payload = rows.map((row) => {
			const maLuat = clauseToLuat.get(row.MaDKPL);
			return normalize(row, { TenLuat: maLuat ? luatMap.get(maLuat) || null : null });
		});

		return NextResponse.json({ data: payload, total: count || 0, page, limit });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const body = await req.json();
		const { TenYC, MoTaYC, MaDKPL } = body || {};

		if (!TenYC || !MaDKPL) {
			return NextResponse.json({ error: 'Vui lòng nhập tên yêu cầu và chọn điều khoản liên quan' }, { status: 400 });
		}

		const supabase = getServerSupabase();

		const { data: last } = await supabase
			.from('YeuCau')
			.select('MaYC')
			.order('MaYC', { ascending: false })
			.limit(1)
			.maybeSingle();

		let next = 1;
		if (last?.MaYC) {
			const match = String(last.MaYC).match(/YC(\d+)/i);
			if (match) next = parseInt(match[1], 10) + 1;
		}
		const maYC = `YC${String(next).padStart(3, '0')}`;

		const { data, error } = await supabase
			.from('YeuCau')
			.insert([
				{
					MaYC: maYC,
					TenYC,
					MoTaYC: MoTaYC || null,
					MaDKPL,
				},
			])
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ data: normalize(data as RawYeuCau) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

