import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD } from '@/lib/auditLog';

function toCamel(row: any) {
	return {
		SoPX: row.sopx,
		NgayXuat: row.ngayxuat,
		MaNV: row.manv,
	};
}

// GET: Lấy chi tiết phiếu xuất
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const sopx = id;
		const supabase = getServerSupabase();

		// Lấy thông tin phiếu xuất
		const { data: phieu, error: errPhieu } = await supabase
			.from('phieuxuat')
			.select('*')
			.eq('sopx', sopx)
			.single();

		if (errPhieu || !phieu) {
			return NextResponse.json({ error: 'Phiếu xuất không tồn tại' }, { status: 404 });
		}

		// Lấy chi tiết phiếu xuất
		const { data: chiTiet, error: errCT } = await supabase
			.from('ctphieuxuat')
			.select('*, hanghoa(*)')
			.eq('sopx', sopx);

		if (errCT) throw errCT;

		return NextResponse.json({
			phieu: toCamel(phieu),
			chiTiet: (chiTiet || []).map((ct: any) => ({
				MaHH: ct.mahh,
				TenHH: ct.hanghoa?.tenhh || null,
				SLXuat: ct.slxuat,
				DonGia: ct.dongia,
				TongTien: ct.tongtien,
			})),
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// PUT: Cập nhật phiếu xuất
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const sopx = id;
		const body = await req.json();
		const { phieu, chitiet } = body;

		const supabase = getServerSupabase();

		// Lấy dữ liệu cũ để log
		const { data: oldPhieu } = await supabase
			.from('phieuxuat')
			.select('*')
			.eq('sopx', sopx)
			.single();

		if (!oldPhieu) {
			return NextResponse.json({ error: 'Phiếu xuất không tồn tại' }, { status: 404 });
		}

		// Lấy chi tiết cũ để hoàn trả tồn kho
		const { data: oldChiTiet } = await supabase
			.from('ctphieuxuat')
			.select('mahh, slxuat')
			.eq('sopx', sopx);

		// Hoàn trả tồn kho từ chi tiết cũ
		if (oldChiTiet) {
			for (const ct of oldChiTiet) {
				const { data: cur } = await supabase
					.from('hanghoa')
					.select('soluongton')
					.eq('mahh', ct.mahh)
					.maybeSingle();
				const current = (cur?.soluongton || 0) + (ct.slxuat || 0);
				await supabase.from('hanghoa').update({ soluongton: current }).eq('mahh', ct.mahh);
			}
		}

		// Cập nhật phiếu xuất
		const updateData: any = {};
		if (phieu?.NgayXuat !== undefined) updateData.ngayxuat = phieu.NgayXuat || null;
		if (phieu?.MaNV !== undefined) updateData.manv = phieu.MaNV || null;

		const { data: updatedPhieu, error: errUpdate } = await supabase
			.from('phieuxuat')
			.update(updateData)
			.eq('sopx', sopx)
			.select()
			.single();

		if (errUpdate) throw errUpdate;

		// Nếu có chi tiết mới, cập nhật
		if (chitiet && Array.isArray(chitiet)) {
			// Xóa chi tiết cũ
			await supabase.from('ctphieuxuat').delete().eq('sopx', sopx);

			// Thêm chi tiết mới và cập nhật tồn kho
			for (const row of chitiet) {
				// Kiểm tra tồn kho
				const { data: cur } = await supabase
					.from('hanghoa')
					.select('soluongton')
					.eq('mahh', row.MaHH)
					.maybeSingle();
				const current = cur?.soluongton || 0;
				if (current < (row.SLXuat || 0)) {
					// Hoàn trả lại tồn kho đã hoàn trả trước đó
					if (oldChiTiet) {
						for (const ct of oldChiTiet) {
							const { data: cur2 } = await supabase
								.from('hanghoa')
								.select('soluongton')
								.eq('mahh', ct.mahh)
								.maybeSingle();
							const current2 = (cur2?.soluongton || 0) - (ct.slxuat || 0);
							await supabase.from('hanghoa').update({ soluongton: current2 }).eq('mahh', ct.mahh);
						}
					}
					return NextResponse.json({ error: `Tồn kho không đủ cho ${row.MaHH}` }, { status: 400 });
				}

				await supabase.from('ctphieuxuat').insert([
					{
						sopx: sopx,
						mahh: row.MaHH,
						slxuat: row.SLXuat,
						dongia: row.DonGia,
						tongtien: (row.SLXuat || 0) * (row.DonGia || 0),
					},
				]);

				// Cập nhật tồn kho
				const newQty = current - (row.SLXuat || 0);
				await supabase.from('hanghoa').update({ soluongton: newQty }).eq('mahh', row.MaHH);
			}
		}

		// Ghi log
		await logCRUD('SUA', 'phieuxuat', sopx, oldPhieu, updatedPhieu);

		return NextResponse.json({ data: toCamel(updatedPhieu) });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

// DELETE: Xóa phiếu xuất
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const sopx = id;
		const supabase = getServerSupabase();

		// Lấy dữ liệu cũ để log
		const { data: oldPhieu } = await supabase
			.from('phieuxuat')
			.select('*')
			.eq('sopx', sopx)
			.single();

		if (!oldPhieu) {
			return NextResponse.json({ error: 'Phiếu xuất không tồn tại' }, { status: 404 });
		}

		// Lấy chi tiết để hoàn trả tồn kho
		const { data: chiTiet } = await supabase
			.from('ctphieuxuat')
			.select('mahh, slxuat')
			.eq('sopx', sopx);

		// Hoàn trả tồn kho
		if (chiTiet) {
			for (const ct of chiTiet) {
				const { data: cur } = await supabase
					.from('hanghoa')
					.select('soluongton')
					.eq('mahh', ct.mahh)
					.maybeSingle();
				const current = (cur?.soluongton || 0) + (ct.slxuat || 0);
				await supabase.from('hanghoa').update({ soluongton: current }).eq('mahh', ct.mahh);
			}
		}

		// Xóa chi tiết
		await supabase.from('ctphieuxuat').delete().eq('sopx', sopx);

		// Xóa phiếu xuất
		const { error } = await supabase.from('phieuxuat').delete().eq('sopx', sopx);

		if (error) throw error;

		// Ghi log
		await logCRUD('XOA', 'phieuxuat', sopx, oldPhieu, null);

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

