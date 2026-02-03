import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD, logActivity } from '@/lib/auditLog';

function todayVietnamDate() {
	return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // yyyy-mm-dd
}

// Body: { phieu: { SoPN, NgayNhap, MaNCC }, chitiet: [{ MaHH, SLNhap, DGNhap }] }
export async function POST(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const { phieu, chitiet } = await req.json();

		const supabase = getServerSupabase();

		// Tự động lấy MaNV từ tài khoản đăng nhập hiện tại
		const { data: taiKhoan, error: tkError } = await supabase
			.from('taikhoan')
			.select('manv')
			.eq('matk', session.maTk)
			.maybeSingle();

		if (tkError) {
			throw tkError;
		}

		if (!taiKhoan?.manv) {
			return NextResponse.json({ error: 'Tài khoản hiện tại chưa được gán cho nhân viên (MaNV)' }, { status: 400 });
		}

		const maNV = taiKhoan.manv as string;

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
					// Default to Vietnam local date to avoid UTC-1 day shift
					ngaynhap: phieu.NgayNhap ?? todayVietnamDate(),
					manv: maNV,
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

		// ==============================
		// TẠO HÓA ĐƠN MUA HÀNG TƯƠNG ỨNG
		// ==============================
		// Tính tổng tiền phiếu nhập từ danh sách chi tiết đã nhận
		const tongTienPhieu = (chitiet || []).reduce((sum: number, row: any) => {
			const qty = Number(row.SLNhap || 0);
			const price = Number(row.DGNhap || 0);
			return sum + qty * price;
		}, 0);

		// Tự sinh mã hóa đơn nếu cần (HD0001, HD0002, ...)
		let maHD: string | undefined = (phieu as any)?.MaHD;
		if (!maHD) {
			const { data: lastHD } = await supabase
				.from('hoadon')
				.select('mahd')
				.ilike('mahd', 'HD%')
				.order('mahd', { ascending: false })
				.limit(1)
				.maybeSingle();

			let nextNum = 1;
			if (lastHD?.mahd) {
				const match = (lastHD.mahd as string).match(/HD(\d+)/i);
				if (match) {
					nextNum = parseInt(match[1], 10) + 1;
				}
			}

			maHD = 'HD' + String(nextNum).padStart(4, '0');
		}

		// Chèn bản ghi hóa đơn mua hàng
		const { data: newHoaDon, error: errHD } = await supabase
			.from('hoadon')
			.insert([
				{
					mahd: maHD,
					// Use Vietnam local date when absent to avoid off-by-1-day (UTC)
					ngaylap: phieu.NgayNhap ?? todayVietnamDate(),
					makh: null, // Phiếu nhập thường không gắn KH
					tongtien: tongTienPhieu,
					trangthai: 'Chưa thanh toán',
					sopn: soPN,
					manv: maNV,
					hinhthucgiao: 'Tại quầy',
					phuongthuctt: 'Tiền mặt',
					loaihd: 'MUA_HANG',
				},
			])
			.select()
			.single();

		if (errHD) {
			// Rollback tất cả nếu tạo hóa đơn lỗi
			await supabase.from('ctphieunhap').delete().eq('sopn', soPN);
			await supabase.from('phieunhap').delete().eq('sopn', soPN);
			throw errHD;
		}

		// Tạo chi tiết hóa đơn từ chi tiết phiếu nhập
		const ctHoaDonRows = (chitiet || []).map((row: any) => ({
			mahd: maHD,
			mahh: row.MaHH,
			soluong: row.SLNhap,
			dongia: row.DGNhap,
			tongtien: (row.SLNhap || 0) * (row.DGNhap || 0),
		}));

		const { error: errCTHD } = await supabase.from('ct_hoadon').insert(ctHoaDonRows);
		if (errCTHD) {
			// Rollback phiếu nhập + hóa đơn nếu lưu chi tiết hóa đơn lỗi
			await supabase.from('ct_hoadon').delete().eq('mahd', maHD);
			await supabase.from('ctphieunhap').delete().eq('sopn', soPN);
			await supabase.from('phieunhap').delete().eq('sopn', soPN);
			await supabase.from('hoadon').delete().eq('mahd', maHD);
			throw errCTHD;
		}

		// Ghi log
		await logCRUD('TAO', 'phieunhap', soPN, null, newPhieu);

		return NextResponse.json({
			ok: true,
			data: {
				SoPN: soPN,
				NgayNhap: phieu.NgayNhap,
				MaNV: newPhieu?.manv ?? maNV,
				MaNCC: phieu.MaNCC,
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


