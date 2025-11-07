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

		// Lấy dữ liệu cũ để log
		const { data: oldPhieu } = await supabase
			.from('phieunhap')
			.select('*')
			.eq('sopn', sopn)
			.single();

		if (!oldPhieu) {
			return NextResponse.json({ error: 'Phiếu nhập không tồn tại' }, { status: 404 });
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

