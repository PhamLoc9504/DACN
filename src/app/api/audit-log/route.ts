import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { hasAnyRole, UserRole } from '@/lib/roles';

function toCamel(row: any) {
	return {
		id: row.id,
		maTk: row.matk,
		maNV: row.manv,
		loaiHanhDong: row.loai_hanh_dong,
		bang: row.bang,
		idRecord: row.id_record,
		chiTiet: row.chi_tiet,
		ipAddress: row.ip_address,
		userAgent: row.user_agent,
		thoiGian: row.thoi_gian,
		trangThai: row.trang_thai,
		loi: row.loi,
	};
}

export async function GET(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		
		// Chỉ Quản lý kho mới được xem log
		if (!hasAnyRole(session.vaiTro, [UserRole.ADMIN])) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1', 10);
		const limit = parseInt(searchParams.get('limit') || '50', 10);
		const maNV = searchParams.get('manv')?.trim();
		const loaiHanhDong = searchParams.get('loai')?.trim();
		const bang = searchParams.get('bang')?.trim();
		const fromDate = searchParams.get('from')?.trim();
		const toDate = searchParams.get('to')?.trim();

		const from = (page - 1) * limit;
		const to = from + limit - 1;
		const supabase = getServerSupabase();

		let query = supabase
			.from('audit_log')
			.select('*', { count: 'exact' })
			.order('thoi_gian', { ascending: false });

		if (maNV) query = query.eq('manv', maNV);
		if (loaiHanhDong) query = query.eq('loai_hanh_dong', loaiHanhDong);
		if (bang) query = query.eq('bang', bang);
		if (fromDate) query = query.gte('thoi_gian', fromDate);
		if (toDate) query = query.lte('thoi_gian', toDate);

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

