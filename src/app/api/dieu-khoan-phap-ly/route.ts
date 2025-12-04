import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';

type RawClause = {
	MaDKPL: string;
	MaLuat: string;
	NgayKy: string | null;
	NgayHetHan: string | null;
	LoaiHopDong: string | null;
	TrangThai: string | null;
	makh: string | null;
	mancc: string | null;
	GhiChu: string | null;
};

function normalizeClause(row: RawClause, extras: {
	tenLuat?: string | null;
	tenKH?: string | null;
	tenNCC?: string | null;
	yeuCauCount?: number;
} = {}) {
	return {
		MaDKPL: row.MaDKPL,
		MaLuat: row.MaLuat,
		TenLuat: extras.tenLuat ?? null,
		NgayKy: row.NgayKy,
		NgayHetHan: row.NgayHetHan,
		LoaiHopDong: row.LoaiHopDong,
		TrangThai: row.TrangThai,
		MaKH: row.makh,
		TenKH: extras.tenKH ?? null,
		MaNCC: row.mancc,
		TenNCC: extras.tenNCC ?? null,
		GhiChu: row.GhiChu,
		YeuCauCount: extras.yeuCauCount ?? 0,
	};
}

export async function GET(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { searchParams } = new URL(req.url);
		const q = searchParams.get('q')?.trim() || '';
		const status = searchParams.get('status')?.trim() || '';
		const maLuatFilter = searchParams.get('maLuat')?.trim() || '';
		const page = parseInt(searchParams.get('page') || '1', 10);
		const limit = parseInt(searchParams.get('limit') || '10', 10);
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		const supabase = getServerSupabase();

		let query = supabase.from('DieuKhoanPhapLy').select('*', { count: 'exact' });
		if (q) {
			query = query.or(`MaDKPL.ilike.%${q}%,LoaiHopDong.ilike.%${q}%,TrangThai.ilike.%${q}%`);
		}
		if (status) {
			query = query.eq('TrangThai', status);
		}
		if (maLuatFilter) {
			query = query.eq('MaLuat', maLuatFilter);
		}

		const { data, error, count } = await query.order('NgayKy', { ascending: false }).range(from, to);
		if (error) throw error;

		const rows = (data || []) as RawClause[];

		const maLuats = Array.from(new Set(rows.map((r) => r.MaLuat).filter(Boolean)));
		const maKHs = Array.from(new Set(rows.map((r) => r.makh).filter(Boolean)));
		const maNCCs = Array.from(new Set(rows.map((r) => r.mancc).filter(Boolean)));
		const clauseIds = rows.map((r) => r.MaDKPL);

		const [luatRes, khRes, nccRes, ycCountRes] = await Promise.all([
			maLuats.length
				? supabase.from('LuatQuyDinh').select('MaLuat, TenLuat').in('MaLuat', maLuats)
				: Promise.resolve({ data: [] }),
			maKHs.length
				? supabase.from('khachhang').select('makh, tenkh').in('makh', maKHs)
				: Promise.resolve({ data: [] }),
			maNCCs.length
				? supabase.from('nhacc').select('mancc, tenncc').in('mancc', maNCCs)
				: Promise.resolve({ data: [] }),
			clauseIds.length
				? supabase
						.from('YeuCau')
						.select('MaDKPL')
						.in('MaDKPL', clauseIds)
				: Promise.resolve({ data: [] }),
		]);

		const luatMap = new Map<string, string>();
		(luatRes.data || []).forEach((row: any) => {
			luatMap.set(row.MaLuat, row.TenLuat);
		});

		const khMap = new Map<string, string>();
		(khRes.data || []).forEach((row: any) => {
			khMap.set(row.makh, row.tenkh);
		});

		const nccMap = new Map<string, string>();
		(nccRes.data || []).forEach((row: any) => {
			nccMap.set(row.mancc, row.tenncc);
		});

		const ycCountMap = new Map<string, number>();
		(ycCountRes.data || []).forEach((row: any) => {
			const current = ycCountMap.get(row.MaDKPL) || 0;
			ycCountMap.set(row.MaDKPL, current + 1);
		});

		const payload = rows.map((row) =>
			normalizeClause(row, {
				tenLuat: luatMap.get(row.MaLuat) || null,
				tenKH: row.makh ? khMap.get(row.makh) || null : null,
				tenNCC: row.mancc ? nccMap.get(row.mancc) || null : null,
				yeuCauCount: ycCountMap.get(row.MaDKPL) || 0,
			}),
		);

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
		const {
			MaLuat,
			NgayKy,
			NgayHetHan,
			LoaiHopDong,
			TrangThai,
			MaKH,
			MaNCC,
			GhiChu,
		} = body || {};

		if (!MaLuat) {
			return NextResponse.json({ error: 'Vui lòng chọn luật/quy định áp dụng' }, { status: 400 });
		}
		if (!TrangThai) {
			return NextResponse.json({ error: 'Vui lòng chọn trạng thái' }, { status: 400 });
		}

		const supabase = getServerSupabase();

		const { data: last } = await supabase
			.from('DieuKhoanPhapLy')
			.select('MaDKPL')
			.order('MaDKPL', { ascending: false })
			.limit(1)
			.maybeSingle();

		let next = 1;
		if (last?.MaDKPL) {
			const match = String(last.MaDKPL).match(/DKPL(\d+)/i);
			if (match) next = parseInt(match[1], 10) + 1;
		}
		const maDKPL = `DKPL${String(next).padStart(3, '0')}`;

		const insertPayload = {
			MaDKPL: maDKPL,
			MaLuat,
			NgayKy: NgayKy || null,
			NgayHetHan: NgayHetHan || null,
			LoaiHopDong: LoaiHopDong || null,
			TrangThai,
			makh: MaKH || null,
			mancc: MaNCC || null,
			GhiChu: GhiChu || null,
		};

		const { data, error } = await supabase
			.from('DieuKhoanPhapLy')
			.insert([insertPayload])
			.select()
			.single();

		if (error) throw error;

		return NextResponse.json({ data: normalizeClause(data as RawClause) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

