import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD } from '@/lib/auditLog';

function toCamel(row: any) {
	return {
		SoPN: row.sopn,
		NgayNhap: row.ngaynhap,
		MaNV: row.manv,
		MaNCC: row.mancc,
	};
}

// GET: Lấy chi tiết phiếu nhập
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const sopn = id;
		const supabase = getServerSupabase();

		// Lấy thông tin phiếu nhập
		const { data: phieu, error: errPhieu } = await supabase
			.from('phieunhap')
			.select('*')
			.eq('sopn', sopn)
			.single();

		if (errPhieu || !phieu) {
			return NextResponse.json({ error: 'Phiếu nhập không tồn tại' }, { status: 404 });
		}

		// Lấy chi tiết phiếu nhập
		const { data: chiTiet, error: errCT } = await supabase
			.from('ctphieunhap')
			.select('*, hanghoa(*)')
			.eq('sopn', sopn);

		if (errCT) throw errCT;

		return NextResponse.json({
			phieu: toCamel(phieu),
			chiTiet: (chiTiet || []).map((ct: any) => ({
				MaHH: ct.mahh,
				TenHH: ct.hanghoa?.tenhh || null,
				SLNhap: ct.slnhap,
				DGNhap: ct.dgnhap,
				TongTien: ct.tongtien,
			})),
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// PUT: Cập nhật phiếu nhập
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const sopn = id;
		const body = await req.json();
		const { phieu, chitiet } = body;

		const supabase = getServerSupabase();

		// Lấy dữ liệu cũ để log + chi tiết cũ để tính chênh lệch tồn
		const { data: oldPhieu } = await supabase
			.from('phieunhap')
			.select('*')
			.eq('sopn', sopn)
			.single();

		if (!oldPhieu) {
			return NextResponse.json({ error: 'Phiếu nhập không tồn tại' }, { status: 404 });
		}
		const { data: oldDetails } = await supabase
			.from('ctphieunhap')
			.select('mahh, slnhap')
			.eq('sopn', sopn);

		// Kiểm tra hóa đơn liên kết để chặn sửa nếu đã thanh toán
		const { data: invoiceStatus } = await supabase
			.from('hoadon')
			.select('mahd, trangthai')
			.eq('sopn', sopn)
			.maybeSingle();

		if (invoiceStatus?.trangthai === 'Đã thanh toán') {
			return NextResponse.json(
				{ error: 'Phiếu nhập này đã hoàn tất thanh toán. Vui lòng hủy/hoàn tác phiếu chi trước khi sửa nội dung.' },
				{ status: 400 }
			);
		}

		// Cập nhật phiếu nhập
		const updateData: any = {};
		if (phieu?.NgayNhap !== undefined) updateData.ngaynhap = phieu.NgayNhap || null;
		if (phieu?.MaNV !== undefined) updateData.manv = phieu.MaNV || null;
		if (phieu?.MaNCC !== undefined) updateData.mancc = phieu.MaNCC || null;

		const { data: updatedPhieu, error: errUpdate } = await supabase
			.from('phieunhap')
			.update(updateData)
			.eq('sopn', sopn)
			.select()
			.single();

		if (errUpdate) throw errUpdate;

		// Nếu có chi tiết mới, cập nhật
		if (chitiet && Array.isArray(chitiet)) {
			// Xóa chi tiết cũ
			await supabase.from('ctphieunhap').delete().eq('sopn', sopn);

			// Thêm chi tiết mới
			for (const row of chitiet) {
				await supabase.from('ctphieunhap').insert([
					{
						sopn: sopn,
						mahh: row.MaHH,
						slnhap: row.SLNhap,
						dgnhap: row.DGNhap,
						tongtien: (row.SLNhap || 0) * (row.DGNhap || 0),
					},
				]);
			}
		}

		// Tính chênh lệch tồn kho theo từng mã hàng
		const oldMap = new Map<string, number>();
		for (const ct of oldDetails || []) {
			oldMap.set(ct.mahh, (ct.slnhap || 0) + (oldMap.get(ct.mahh) || 0));
		}
		const newMap = new Map<string, number>();
		if (chitiet && Array.isArray(chitiet)) {
			for (const ct of chitiet) {
				newMap.set(ct.MaHH, (ct.SLNhap || 0) + (newMap.get(ct.MaHH) || 0));
			}
		}
		const allKeys = new Set<string>([...oldMap.keys(), ...newMap.keys()]);
		for (const key of allKeys) {
			const delta = (newMap.get(key) || 0) - (oldMap.get(key) || 0);
			if (!delta) continue;
			const { data: cur } = await supabase.from('hanghoa').select('soluongton').eq('mahh', key).maybeSingle();
			const current = (cur?.soluongton || 0) + delta;
			await supabase.from('hanghoa').update({ soluongton: current }).eq('mahh', key);
		}

		// Cập nhật hóa đơn liên kết (nếu có)
		const tongTienMoi = (chitiet || []).reduce((s: number, r: any) => s + Number(r.SLNhap || 0) * Number(r.DGNhap || 0), 0);
		const { data: invoice } = await supabase.from('hoadon').select('mahd').eq('sopn', sopn).maybeSingle();
		if (invoice?.mahd) {
			await supabase
				.from('hoadon')
				.update({
					tongtien: tongTienMoi,
					ngaylap: phieu?.NgayNhap ?? updatedPhieu?.ngaynhap ?? null,
					manv: phieu?.MaNV ?? updatedPhieu?.manv ?? null,
				})
				.eq('mahd', invoice.mahd);

			// Cập nhật chi tiết hóa đơn
			await supabase.from('ct_hoadon').delete().eq('mahd', invoice.mahd);
			const ctHoaDon = (chitiet || []).map((r: any) => ({
				mahd: invoice.mahd,
				mahh: r.MaHH,
				soluong: r.SLNhap,
				dongia: r.DGNhap,
				tongtien: Number(r.SLNhap || 0) * Number(r.DGNhap || 0),
			}));
			if (ctHoaDon.length > 0) {
				await supabase.from('ct_hoadon').insert(ctHoaDon);
			}
		}

		// Ghi log
		await logCRUD('SUA', 'phieunhap', sopn, oldPhieu, updatedPhieu);

		return NextResponse.json({ data: toCamel(updatedPhieu) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// DELETE: Xóa phiếu nhập
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const sopn = id;
		const supabase = getServerSupabase();

		// Lấy dữ liệu cũ để log
		const { data: oldPhieu } = await supabase
			.from('phieunhap')
			.select('*')
			.eq('sopn', sopn)
			.single();

		if (!oldPhieu) {
			return NextResponse.json({ error: 'Phiếu nhập không tồn tại' }, { status: 404 });
		}

		// Lấy chi tiết để hoàn trả tồn kho
		const { data: chiTiet } = await supabase
			.from('ctphieunhap')
			.select('mahh, slnhap')
			.eq('sopn', sopn);

		// Hoàn trả tồn kho
		if (chiTiet) {
			for (const ct of chiTiet) {
				const { data: cur } = await supabase
					.from('hanghoa')
					.select('soluongton')
					.eq('mahh', ct.mahh)
					.maybeSingle();
				const current = (cur?.soluongton || 0) - (ct.slnhap || 0);
				await supabase.from('hanghoa').update({ soluongton: current }).eq('mahh', ct.mahh);
			}
		}

		// Xóa chi tiết
		await supabase.from('ctphieunhap').delete().eq('sopn', sopn);

		// Xóa phiếu nhập
		const { error } = await supabase.from('phieunhap').delete().eq('sopn', sopn);

		if (error) throw error;

		// Ghi log
		await logCRUD('XOA', 'phieunhap', sopn, oldPhieu, null);

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

