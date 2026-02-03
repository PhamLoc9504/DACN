import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD, logActivity } from '@/lib/auditLog';

function todayVietnamDate() {
	return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // yyyy-mm-dd
}

// Body: { phieu: { SoPX, NgayXuat, MaNV }, chitiet: [{ MaHH, SLXuat, DonGia }] }
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

		// Tự động tạo mã SoPX nếu không có (format: PX01, PX02, ...)
		let soPX = phieu?.SoPX;
		if (!soPX) {
			// Lấy mã PX lớn nhất hiện có
			const { data: lastPX } = await supabase
				.from('phieuxuat')
				.select('sopx')
				.ilike('sopx', 'PX%')
				.order('sopx', { ascending: false })
				.limit(1)
				.maybeSingle();

			let nextNum = 1;
			if (lastPX?.sopx) {
				const match = lastPX.sopx.match(/PX(\d+)/);
				if (match) {
					nextNum = parseInt(match[1], 10) + 1;
				}
			}

			soPX = 'PX' + String(nextNum).padStart(2, '0');
		}

		// Kiểm tra dữ liệu nhập vào (Validation)
		if (!soPX) {
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

		// Kiểm tra số phiếu xuất đã tồn tại chưa
		const { data: existing } = await supabase
			.from('phieuxuat')
			.select('sopx')
			.eq('sopx', soPX)
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

		// Lưu thông tin phiếu xuất hàng (Pending, chưa trừ kho). Không ép buộc cột trangthai nếu DB không có.
		// Chuẩn hóa ngày xuất: nếu không truyền hoặc truyền rỗng, dùng ngày VN hôm nay
		const ngayXuat = phieu?.NgayXuat ? String(phieu.NgayXuat) : todayVietnamDate();

		const insertPhieu: any = {
			sopx: soPX,
			// Default to Vietnam local date to avoid UTC-1 day shift
			ngayxuat: ngayXuat,
			manv: maNV,
		};
		const { data: newPhieu, error: errPX } = await supabase
			.from('phieuxuat')
			.insert([insertPhieu])
			.select('sopx, ngayxuat, manv') // Chỉ trả về cột chắc chắn tồn tại
			.single();

		if (errPX) {
			await logActivity({
				action: 'TAO',
				table: 'phieuxuat',
				recordId: soPX,
				status: 'LOI',
				error: errPX.message,
			});
			throw errPX;
		}

		// Chỉ lưu chi tiết, CHƯA trừ kho (tạm giữ)
		for (const row of chitiet) {
			const { error: errCT } = await supabase.from('ctphieuxuat').insert([
				{
					sopx: soPX,
					mahh: row.MaHH,
					slxuat: row.SLXuat,
					dongia: row.DonGia,
					tongtien: (row.SLXuat || 0) * (row.DonGia || 0),
				},
			]);

			if (errCT) {
				// Rollback: Xóa phiếu xuất đã tạo
				await supabase.from('phieuxuat').delete().eq('sopx', soPX);
				throw errCT;
			}
		}

		// Ghi log
		await logCRUD('TAO', 'phieuxuat', soPX, null, newPhieu);

		// Tính tổng tiền của phiếu xuất
		const tongTien = chitiet.reduce((sum: number, row: any) => {
			return sum + ((row.SLXuat || 0) * (row.DonGia || 0));
		}, 0);

		// Tự động tạo hóa đơn nếu có MaKH
		let maHD: string | null = null;
		if (phieu.MaKH) {
			try {
				// Lấy mã HD lớn nhất hiện có
				const { data: lastHD } = await supabase
					.from('hoadon')
					.select('mahd')
					.ilike('mahd', 'HD%')
					.order('mahd', { ascending: false })
					.limit(1)
					.maybeSingle();

				let nextNum = 1;
				if (lastHD?.mahd) {
					const match = (lastHD.mahd as string).match(/HD(\d+)/);
					if (match) {
						nextNum = parseInt(match[1], 10) + 1;
					}
				}

				maHD = 'HD' + String(nextNum).padStart(2, '0');

				// Sử dụng MaNV lấy từ session cho hóa đơn
				const resolvedMaNV: string | null = maNV;

				// Tạo hóa đơn
				const { data: newHD, error: errHD } = await supabase
					.from('hoadon')
					.insert({
						mahd: maHD,
						// Use Vietnam local date when absent to avoid off-by-1-day (UTC)
						ngaylap: ngayXuat,
						makh: phieu.MaKH,
						tongtien: tongTien,
						trangthai: 'Chưa thanh toán',
						sopx: soPX,
						manv: resolvedMaNV,
						hinhthucgiao: phieu.HinhThucGiao || 'Giao hàng',
						phuongthuctt: phieu.PhuongThucTT || 'Tiền mặt',
					})
					.select()
					.single();

				if (errHD) {
					// Log lỗi nhưng không rollback phiếu xuất
					await logActivity({
						action: 'TAO',
						table: 'hoadon',
						recordId: maHD,
						status: 'LOI',
						error: errHD.message,
					});
					// Tiếp tục trả về phiếu xuất dù không tạo được hóa đơn
				} else {
					// Tạo chi tiết hóa đơn từ chi tiết phiếu xuất
					const chiTietHD = chitiet.map((row: any) => ({
						mahd: maHD,
						mahh: row.MaHH,
						soluong: row.SLXuat,
						dongia: row.DonGia,
						tongtien: (row.SLXuat || 0) * (row.DonGia || 0),
					}));

					await supabase.from('ct_hoadon').insert(chiTietHD);

					// Ghi log tạo hóa đơn
					await logCRUD('TAO', 'hoadon', maHD!, null, newHD);
				}
			} catch (invoiceErr: any) {
				// Log lỗi nhưng không rollback phiếu xuất
				await logActivity({
					action: 'TAO',
					table: 'hoadon',
					recordId: maHD || 'UNKNOWN',
					status: 'LOI',
					error: invoiceErr.message,
				});
			}
		}

		return NextResponse.json({
			ok: true,
			data: {
				SoPX: soPX,
				NgayXuat: phieu.NgayXuat,
				MaNV: maNV,
				TongTien: tongTien,
				MaHD: maHD, // Trả về mã hóa đơn nếu đã tạo
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}


