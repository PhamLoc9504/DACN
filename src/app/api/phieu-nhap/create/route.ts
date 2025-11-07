import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD, logActivity } from '@/lib/auditLog';

// Body: { phieu: { SoPN, NgayNhap, MaNV, MaNCC }, chitiet: [{ MaHH, SLNhap, DGNhap }] }
export async function POST(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { phieu, chitiet } = await req.json();

		// Kiểm tra dữ liệu nhập vào (Validation)
		if (!phieu?.SoPN) {
			return NextResponse.json({ error: 'Số phiếu nhập là bắt buộc' }, { status: 400 });
		}
		if (!Array.isArray(chitiet) || chitiet.length === 0) {
			return NextResponse.json({ error: 'Vui lòng thêm ít nhất một dòng hàng hóa' }, { status: 400 });
		}

		// Kiểm tra từng chi tiết
		for (const row of chitiet) {
			if (!row.MaHH) {
				return NextResponse.json({ error: 'Mã hàng hóa là bắt buộc' }, { status: 400 });
			}
			if (!row.SLNhap || row.SLNhap <= 0) {
				return NextResponse.json({ error: `Số lượng nhập phải lớn hơn 0 cho ${row.MaHH}` }, { status: 400 });
			}
			if (!row.DGNhap || row.DGNhap < 0) {
				return NextResponse.json({ error: `Đơn giá nhập phải lớn hơn hoặc bằng 0 cho ${row.MaHH}` }, { status: 400 });
			}
		}

		const supabase = getServerSupabase();

		// Kiểm tra số phiếu nhập đã tồn tại chưa
		const { data: existing } = await supabase
			.from('phieunhap')
			.select('sopn')
			.eq('sopn', phieu.SoPN)
			.maybeSingle();

		if (existing) {
			return NextResponse.json({ error: 'Số phiếu nhập đã tồn tại' }, { status: 400 });
		}

		// Lưu thông tin phiếu nhập hàng (Save import slip information)
		const { data: newPhieu, error: errPN } = await supabase
			.from('phieunhap')
			.insert([
				{
					sopn: phieu.SoPN,
					ngaynhap: phieu.NgayNhap ?? null,
					manv: phieu.MaNV ?? null,
					mancc: phieu.MaNCC ?? null,
				},
			])
			.select()
			.single();

		if (errPN) {
			await logActivity({
				action: 'TAO',
				table: 'phieunhap',
				recordId: phieu.SoPN,
				status: 'LOI',
				error: errPN.message,
			});
			throw errPN;
		}

		// Lưu chi tiết và cập nhật tồn kho
		for (const row of chitiet) {
			// Kiểm tra hàng hóa tồn tại
			const { data: product } = await supabase
				.from('hanghoa')
				.select('soluongton, tenhh')
				.eq('mahh', row.MaHH)
				.maybeSingle();

			if (!product) {
				// Rollback: Xóa phiếu nhập đã tạo
				await supabase.from('phieunhap').delete().eq('sopn', phieu.SoPN);
				return NextResponse.json({ error: `Hàng hóa ${row.MaHH} không tồn tại` }, { status: 400 });
			}

			// Lưu chi tiết
			const { error: errCT } = await supabase.from('ctphieunhap').insert([
				{
					sopn: phieu.SoPN,
					mahh: row.MaHH,
					slnhap: row.SLNhap,
					dgnhap: row.DGNhap,
					tongtien: (row.SLNhap || 0) * (row.DGNhap || 0),
				},
			]);

			if (errCT) {
				// Rollback: Xóa phiếu nhập đã tạo
				await supabase.from('phieunhap').delete().eq('sopn', phieu.SoPN);
				throw errCT;
			}

			// Cập nhật số lượng tồn kho (Update inventory quantity) += SLNhap
			const { data: cur } = await supabase.from('hanghoa').select('soluongton').eq('mahh', row.MaHH).maybeSingle();
			const current = (cur?.soluongton || 0) + (row.SLNhap || 0);
			const { error: errUpd } = await supabase.from('hanghoa').update({ soluongton: current }).eq('mahh', row.MaHH);

			if (errUpd) {
				// Rollback: Xóa phiếu nhập và chi tiết đã tạo
				await supabase.from('ctphieunhap').delete().eq('sopn', phieu.SoPN);
				await supabase.from('phieunhap').delete().eq('sopn', phieu.SoPN);
				throw errUpd;
			}
		}

		// Ghi log
		await logCRUD('TAO', 'phieunhap', phieu.SoPN, null, newPhieu);

		return NextResponse.json({
			ok: true,
			data: {
				SoPN: phieu.SoPN,
				NgayNhap: phieu.NgayNhap,
				MaNV: phieu.MaNV,
				MaNCC: phieu.MaNCC,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


