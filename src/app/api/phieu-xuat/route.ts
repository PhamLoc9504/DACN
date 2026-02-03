import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';

function toCamel(row: any, tongTien?: number, hoadonStatus?: string | null) {
	// Ưu tiên trạng thái từ hóa đơn (nếu đã thanh toán) để phản ánh đúng luồng nghiệp vụ
	const statusFromInvoice = hoadonStatus === 'Đã thanh toán' ? 'Hoàn tất' : undefined;
	return {
		SoPX: row.sopx,
		NgayXuat: row.ngayxuat,
		MaNV: row.manv,
		TrangThai: statusFromInvoice || row.trangthai || 'Đang xử lý',
		TongTien: tongTien || 0,
	};
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1', 10);
		const limit = parseInt(searchParams.get('limit') || '10', 10);
		const q = searchParams.get('q')?.trim();
		const fromDate = searchParams.get('from')?.trim();
		const toDate = searchParams.get('to')?.trim();
		const manv = searchParams.get('manv')?.trim();

		const from = (page - 1) * limit;
		const to = from + limit - 1;
		const supabase = getServerSupabase();

		let query = supabase
			.from('phieuxuat')
			.select('*', { count: 'exact' })
			.order('ngayxuat', { ascending: false });

		if (q) {
			query = query.or(`sopx.ilike.%${q}%,manv.ilike.%${q}%`);
		}
		if (fromDate) {
			query = query.gte('ngayxuat', fromDate);
		}
		if (toDate) {
			query = query.lte('ngayxuat', toDate);
		}
		if (manv) {
			query = query.eq('manv', manv);
		}

		const { data, error, count } = await query.range(from, to);
		if (error) throw error;

		// Lấy danh sách SoPX để tra hóa đơn liên quan
		const sopxList = (data || []).map((row: any) => row.sopx);
		let invoiceByPX: Record<string, string | null> = {};
		if (sopxList.length > 0) {
			const { data: invoices } = await supabase
				.from('hoadon')
				.select('sopx, trangthai')
				.in('sopx', sopxList);
			invoiceByPX = (invoices || []).reduce((acc: any, inv: any) => {
				acc[inv.sopx] = inv.trangthai || null;
				return acc;
			}, {});
		}

		// Tính tổng tiền cho từng phiếu xuất từ chi tiết
		const enrichedData = await Promise.all(
			(data || []).map(async (row: any) => {
				const { data: chiTiet } = await supabase
					.from('ctphieuxuat')
					.select('tongtien')
					.eq('sopx', row.sopx);
				
				const tongTien = (chiTiet || []).reduce((sum: number, ct: any) => sum + Number(ct.tongtien || 0), 0);
				const invStatus = invoiceByPX[row.sopx] ?? null;
				return toCamel(row, tongTien, invStatus);
			})
		);

		return NextResponse.json({
			data: enrichedData,
			total: count || 0,
			page,
			limit,
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


