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

		const supabase = getServerSupabase();

		// Tự động tạo mã SoPN nếu không có (format: PN01, PN02, ...)
		let soPN = phieu?.SoPN;
		if (!soPN) {
			// Lấy mã PN lớn nhất hiện có
			const { data: lastPN } = await supabase
				.from('phieunhap')
				.select('sopn')
				.ilike('sopn', 'PN%')
				.order('sopn', { ascending: false })
				.limit(1)
				.maybeSingle();

			let nextNum = 1;
			if (lastPN?.sopn) {
				const match = lastPN.sopn.match(/PN(\d+)/);
				if (match) {
					nextNum = parseInt(match[1], 10) + 1;
				}
			}

			soPN = 'PN' + String(nextNum).padStart(2, '0');
		}

		// Kiểm tra dữ liệu nhập vào (Validation)
		if (!soPN) {
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

		// Kiểm tra số phiếu nhập đã tồn tại chưa
		const { data: existing } = await supabase
			.from('phieunhap')
			.select('sopn')
			.eq('sopn', soPN)
			.maybeSingle();

		if (existing) {
			return NextResponse.json({ error: 'Số phiếu nhập đã tồn tại' }, { status: 400 });
		}

		// Lưu thông tin phiếu nhập hàng (Save import slip information)
		const { data: newPhieu, error: errPN } = await supabase
			.from('phieunhap')
			.insert([
				{
					sopn: soPN,
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
				recordId: soPN,
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
				await supabase.from('phieunhap').delete().eq('sopn', soPN);
				return NextResponse.json({ error: `Hàng hóa ${row.MaHH} không tồn tại` }, { status: 400 });
			}

			// Lưu chi tiết
			const { error: errCT } = await supabase.from('ctphieunhap').insert([
				{
					sopn: soPN,
					mahh: row.MaHH,
					slnhap: row.SLNhap,
					dgnhap: row.DGNhap,
					tongtien: (row.SLNhap || 0) * (row.DGNhap || 0),
				},
			]);

			if (errCT) {
				// Rollback: Xóa phiếu nhập đã tạo
				await supabase.from('phieunhap').delete().eq('sopn', soPN);
				throw errCT;
			}

			// Cập nhật số lượng tồn kho (Update inventory quantity) += SLNhap
			const { data: cur } = await supabase.from('hanghoa').select('soluongton').eq('mahh', row.MaHH).maybeSingle();
			const current = (cur?.soluongton || 0) + (row.SLNhap || 0);
			const { error: errUpd } = await supabase.from('hanghoa').update({ soluongton: current }).eq('mahh', row.MaHH);

			if (errUpd) {
				// Rollback: Xóa phiếu nhập và chi tiết đã tạo
				await supabase.from('ctphieunhap').delete().eq('sopn', soPN);
				await supabase.from('phieunhap').delete().eq('sopn', soPN);
				throw errUpd;
			}
		}

		// Ghi log
		await logCRUD('TAO', 'phieunhap', soPN, null, newPhieu);

		return NextResponse.json({
			ok: true,
			data: {
				SoPN: soPN,
				NgayNhap: phieu.NgayNhap,
				MaNV: phieu.MaNV,
				MaNCC: phieu.MaNCC,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


