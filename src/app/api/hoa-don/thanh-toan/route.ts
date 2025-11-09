import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseClient';
import { getSessionFromCookies } from '@/lib/session';
import { logCRUD, logActivity } from '@/lib/auditLog';

// POST: Xử lý thanh toán hóa đơn
export async function POST(req: Request) {
	try {
		const session = await getSessionFromCookies();
		if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

		const body = await req.json();
		const { MaHD, PhuongThuc, SoTien, GhiChu } = body;

		if (!MaHD || !PhuongThuc || !SoTien) {
			return NextResponse.json({ error: 'Thiếu thông tin thanh toán' }, { status: 400 });
		}

		const supabase = getServerSupabase();

		// Lấy thông tin hóa đơn
		const { data: hoaDon, error: errHD } = await supabase
			.from('hoadon')
			.select('*')
			.eq('mahd', MaHD)
			.single();

		if (errHD || !hoaDon) {
			return NextResponse.json({ error: 'Hóa đơn không tồn tại' }, { status: 404 });
		}

		if (hoaDon.trangthai === 'Đã thanh toán') {
			return NextResponse.json({ error: 'Hóa đơn đã được thanh toán' }, { status: 400 });
		}

		// Kiểm tra thời hạn thanh toán (30 ngày từ ngày lập)
		const ngayLap = new Date(hoaDon.ngaylap);
		const hanThanhToan = new Date(ngayLap);
		hanThanhToan.setDate(hanThanhToan.getDate() + 30); // Thời hạn 30 ngày
		const now = new Date();
		
		if (now > hanThanhToan) {
			return NextResponse.json({ 
				error: 'Hết hạn thanh toán', 
				message: `Hóa đơn đã quá thời hạn thanh toán (${hanThanhToan.toLocaleDateString('vi-VN')})`,
				expired: true,
				deadline: hanThanhToan.toISOString()
			}, { status: 400 });
		}

		// Kiểm tra số tiền
		const tongTien = Number(hoaDon.tongtien || 0);
		const soTien = Number(SoTien);
		if (soTien < tongTien) {
			return NextResponse.json({ error: 'Số tiền thanh toán không đủ' }, { status: 400 });
		}

		// Map phương thức thanh toán từ form sang database
		const phuongThucMap: Record<string, string> = {
			'tien-mat': 'Tiền mặt',
			'chuyen-khoan': 'Chuyển khoản',
			'quet-qr': 'VNPay',
		};
		const phuongThucTT = phuongThucMap[PhuongThuc] || 'Tiền mặt';

		// Cập nhật trạng thái hóa đơn và phương thức thanh toán
		const { data: updatedHD, error: errUpdate } = await supabase
			.from('hoadon')
			.update({ 
				trangthai: 'Đã thanh toán',
				phuongthuctt: phuongThucTT,
			})
			.eq('mahd', MaHD)
			.select()
			.single();

		if (errUpdate) throw errUpdate;

		// Lưu thông tin thanh toán (có thể tạo bảng thanh_toan riêng)
		// Hiện tại chỉ log vào audit log
		await logActivity({
			action: 'CAP_NHAT_TRANG_THAI',
			table: 'hoadon',
			recordId: MaHD,
			status: 'THANH_CONG',
			detail: {
				phuongThuc: PhuongThuc,
				soTien: soTien,
				ghiChu: GhiChu || null,
				action: 'THANH_TOAN',
			},
		});

		// Ghi log CRUD
		await logCRUD('SUA', 'hoadon', MaHD, hoaDon, updatedHD);

		return NextResponse.json({
			ok: true,
			data: {
				MaHD,
				TrangThai: 'Đã thanh toán',
				PhuongThuc,
				SoTien: soTien,
				ThoiGian: new Date().toISOString(),
			},
		});
	} catch (e: any) {
		return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
	}
}

