import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD, logActivity } from '@/lib/auditLog';

// Body: { phieu: { SoPX, NgayXuat, MaNV }, chitiet: [{ MaHH, SLXuat, DonGia }] }
export async function POST(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { phieu, chitiet } = await req.json();

		// Kiểm tra dữ liệu nhập vào (Validation)
		if (!phieu?.SoPX) {
			return NextResponse.json({ error: 'Số phiếu xuất là bắt buộc' }, { status: 400 });
		}
		if (!Array.isArray(chitiet) || chitiet.length === 0) {
			return NextResponse.json({ error: 'Vui lòng thêm ít nhất một dòng hàng hóa' }, { status: 400 });
		}

		// Kiểm tra từng chi tiết
		for (const row of chitiet) {
			if (!row.MaHH) {
				return NextResponse.json({ error: 'Mã hàng hóa là bắt buộc' }, { status: 400 });
			}
			if (!row.SLXuat || row.SLXuat <= 0) {
				return NextResponse.json({ error: `Số lượng xuất phải lớn hơn 0 cho ${row.MaHH}` }, { status: 400 });
			}
			if (!row.DonGia || row.DonGia < 0) {
				return NextResponse.json({ error: `Đơn giá phải lớn hơn hoặc bằng 0 cho ${row.MaHH}` }, { status: 400 });
			}
		}

		const supabase = getServerSupabase();

		// Kiểm tra số phiếu xuất đã tồn tại chưa
		const { data: existing } = await supabase
			.from('phieuxuat')
			.select('sopx')
			.eq('sopx', phieu.SoPX)
			.maybeSingle();

		if (existing) {
			return NextResponse.json({ error: 'Số phiếu xuất đã tồn tại' }, { status: 400 });
		}

		// Kiểm tra số lượng tồn kho (Check inventory quantity)
		const inventoryErrors: Array<{ MaHH: string; SoLuongTon: number; SLXuat: number }> = [];
		for (const row of chitiet) {
			const { data: cur } = await supabase
				.from('hanghoa')
				.select('soluongton, tenhh')
				.eq('mahh', row.MaHH)
				.maybeSingle();

			if (!cur) {
				return NextResponse.json({ error: `Hàng hóa ${row.MaHH} không tồn tại` }, { status: 400 });
			}

			const current = cur.soluongton || 0;
			if (current < (row.SLXuat || 0)) {
				inventoryErrors.push({
					MaHH: row.MaHH,
					SoLuongTon: current,
					SLXuat: row.SLXuat || 0,
				});
			}
		}

		// Nếu có lỗi tồn kho, trả về thông báo
		if (inventoryErrors.length > 0) {
			const errorMsg = inventoryErrors
				.map((e) => `Hàng hóa ${e.MaHH}: Tồn kho (${e.SoLuongTon}) < Số lượng xuất (${e.SLXuat})`)
				.join('; ');
			return NextResponse.json(
				{
					error: 'Tồn kho không đủ',
					message: errorMsg,
					inventoryErrors,
					insufficientStock: true,
				},
				{ status: 400 }
			);
		}

		// Lưu thông tin phiếu xuất hàng (Save export slip information)
		const { data: newPhieu, error: errPX } = await supabase
			.from('phieuxuat')
			.insert([{ sopx: phieu.SoPX, ngayxuat: phieu.NgayXuat ?? null, manv: phieu.MaNV ?? null }])
			.select()
			.single();

		if (errPX) {
			await logActivity({
				action: 'TAO',
				table: 'phieuxuat',
				recordId: phieu.SoPX,
				status: 'LOI',
				error: errPX.message,
			});
			throw errPX;
		}

		// Lưu chi tiết và cập nhật tồn kho
		for (const row of chitiet) {
			// Lấy lại tồn kho hiện tại
			const { data: cur } = await supabase
				.from('hanghoa')
				.select('soluongton')
				.eq('mahh', row.MaHH)
				.maybeSingle();
			const current = cur?.soluongton || 0;

			// Lưu chi tiết
			const { error: errCT } = await supabase.from('ctphieuxuat').insert([
				{
					sopx: phieu.SoPX,
					mahh: row.MaHH,
					slxuat: row.SLXuat,
					dongia: row.DonGia,
					tongtien: (row.SLXuat || 0) * (row.DonGia || 0),
				},
			]);

			if (errCT) {
				// Rollback: Xóa phiếu xuất đã tạo
				await supabase.from('phieuxuat').delete().eq('sopx', phieu.SoPX);
				throw errCT;
			}

			// Cập nhật số lượng tồn kho (Update inventory quantity)
			const newQty = current - (row.SLXuat || 0);
			const { error: errUpd } = await supabase.from('hanghoa').update({ soluongton: newQty }).eq('mahh', row.MaHH);

			if (errUpd) {
				// Rollback: Xóa phiếu xuất và chi tiết đã tạo
				await supabase.from('ctphieuxuat').delete().eq('sopx', phieu.SoPX);
				await supabase.from('phieuxuat').delete().eq('sopx', phieu.SoPX);
				throw errUpd;
			}
		}

		// Ghi log
		await logCRUD('TAO', 'phieuxuat', phieu.SoPX, null, newPhieu);

		return NextResponse.json({
			ok: true,
			data: {
				SoPX: phieu.SoPX,
				NgayXuat: phieu.NgayXuat,
				MaNV: phieu.MaNV,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


