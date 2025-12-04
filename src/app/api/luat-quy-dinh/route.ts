import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

// GET: danh sách luật/quy định (có thể filter q, page, limit)
export async function GET(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const url = new URL(req.url);
		const q = url.searchParams.get('q')?.trim() || '';
		const page = Number(url.searchParams.get('page') || '1');
		const limit = Number(url.searchParams.get('limit') || '20');
		const offset = (page - 1) * limit;

		const supabase = getServerSupabase();

		let query = supabase.from('LuatQuyDinh').select('*', { count: 'exact' });
		if (q) {
			query = query.ilike('TenLuat', `%${q}%`);
		}

		const { data, error, count } = await query
			.order('NgayCapNhat', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) throw error;

		return NextResponse.json({ data, total: count ?? 0 });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// POST: tạo mới luật/quy định, MaLuat tự sinh kiểu LU01, LU02, ...
export async function POST(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const body = await req.json();
		const { TenLuat, MoTaLuat, LinkNguon } = body || {};

		if (!TenLuat || typeof TenLuat !== 'string') {
			return NextResponse.json({ error: 'Tên luật/quy định là bắt buộc' }, { status: 400 });
		}

		const supabase = getServerSupabase();

		// Lấy MaLuat lớn nhất dạng LUxx hiện có
		const { data: last, error: errLast } = await supabase
			.from('LuatQuyDinh')
			.select('MaLuat')
			.ilike('MaLuat', 'LU%')
			.order('MaLuat', { ascending: false })
			.limit(1)
			.maybeSingle();

		if (errLast) throw errLast;

		let nextNum = 1;
		if (last?.MaLuat) {
			const match = String(last.MaLuat).match(/LU(\d+)/);
			if (match) {
				nextNum = parseInt(match[1], 10) + 1;
			}
		}

		const maLuat = 'LU' + String(nextNum).padStart(2, '0');

		const { data, error } = await supabase
			.from('LuatQuyDinh')
			.insert([
				{
					MaLuat: maLuat,
					TenLuat,
					MoTaLuat: MoTaLuat ?? null,
					LinkNguon: LinkNguon ?? null,
					NgayCapNhat: new Date().toISOString(),
				},
			])
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ data });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}
