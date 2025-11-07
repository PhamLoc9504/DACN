import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD } from '@/lib/auditLog';

function toCamel(row: any) {
	return {
		MaKH: row.makh,
		TenKH: row.tenkh,
		SDT: row.sdt,
		DiaChi: row.diachi,
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
		let query = supabase.from('khachhang').select('*', { count: 'exact' }).order('makh', { ascending: true });
		if (q) {
			query = query.or(`tenkh.ilike.%${q}%,sdt.ilike.%${q}%,makh.ilike.%${q}%`);
		}
		const { data, error, count } = await query.range(from, to);
		if (error) throw error;
		return NextResponse.json({ data: (data || []).map(toCamel), total: count || 0, page, limit });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// POST: Tạo khách hàng mới
export async function POST(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const body = await req.json();
		const { MaKH, TenKH, SDT, DiaChi } = body;

		if (!MaKH || !TenKH) {
			return NextResponse.json({ error: 'Mã KH và Tên KH là bắt buộc' }, { status: 400 });
		}

		const supabase = getServerSupabase();

		// Kiểm tra mã KH đã tồn tại chưa
		const { data: existing } = await supabase
			.from('khachhang')
			.select('makh')
			.eq('makh', MaKH)
			.maybeSingle();

		if (existing) {
			return NextResponse.json({ error: 'Mã khách hàng đã tồn tại' }, { status: 400 });
		}

		// Tạo mới
		const { data, error } = await supabase
			.from('khachhang')
			.insert([
				{
					makh: MaKH,
					tenkh: TenKH || null,
					sdt: SDT || null,
					diachi: DiaChi || null,
				},
			])
			.select()
			.single();

		if (error) throw error;

		// Ghi log
		await logCRUD('TAO', 'khachhang', MaKH, null, data);

		return NextResponse.json({ data: toCamel(data) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


